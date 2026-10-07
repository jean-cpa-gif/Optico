import React, { createContext, useContext, useEffect, useState } from 'react';
import { Divida, ItemHistoricoDivida, Operacao } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useOperations } from './OperationsContext';
import { formatCurrency } from '@/lib/utils';

export function recalcularDivida(divida: Divida): Divida {
  let corrente = divida.saldoInicial;
  
  const historicoRecalibrado = (divida.historico || []).map((item, index) => {
    // Identifica se este lançamento é a criação de origem da dívida (vindo de prejuízo)
    const isOrigemCriacao = 
      item.ehCriacaoOrigem === true || 
      (index === 0 && 
       item.tipo === 'incremento' && 
       (item.observacao?.toLowerCase().includes('criada') || 
        item.observacao?.toLowerCase().includes('origem') || 
        Math.abs(item.valor - divida.saldoInicial) < 0.001));

    if (isOrigemCriacao) {
      // Este lançamento representa a criação da dívida com o saldo inicial.
      // Ele NÃO deve somar novamente a divida.saldoInicial, pois corrente já começa em saldoInicial!
      return {
        ...item,
        ehCriacaoOrigem: true,
        saldoResultante: corrente
      };
    }

    if (item.tipo === 'juro' || item.tipo === 'incremento') {
      corrente += item.valor;
    } else if (item.tipo === 'amortizacao') {
      corrente -= item.valor;
    }
    corrente = Math.round(corrente * 100) / 100;

    return {
      ...item,
      saldoResultante: corrente
    };
  });

  corrente = Math.round(corrente * 100) / 100;
  const status: Divida['status'] = (divida.status === 'quitada' && corrente > 0) ? 'aberta' : (corrente <= 0 ? 'quitada' : divida.status);

  return {
    ...divida,
    saldoAtual: corrente,
    status,
    historico: historicoRecalibrado
  };
}

interface NovaDividaParams {
  nome: string;
  descricao?: string;
  saldoInicial: number;
  dataInicio: string;
  taxaJurosMensalPercent: number;
}

interface CriarDividaPrejuizoParams {
  nome: string;
  saldoInicial: number;
  dataInicio: string;
  taxaJurosMensalPercent: number;
  operacaoId: string;
  observacao?: string;
}

interface SomarPrejuizoDividaParams {
  dividaId: string;
  data: string;
  valor: number;
  operacaoId: string;
  observacao?: string;
}

interface LançarJuroParams {
  dividaId: string;
  data: string;
  valor: number;
  observacao?: string;
}

interface LançarAmortizacaoParams {
  dividaId: string;
  data: string;
  valor: number;
  observacao?: string;
  operacaoVinculadaId?: string | null;
}

interface EncerrarOperacaoComVinculoParams {
  opId: string;
  precoEncerramento: number;
  dataEncerramento: string;
  tipoVinculo: 'amortizar_existente' | 'somar_existente' | 'criar_nova';
  dividaId?: string;
  valorVinculado: number;
  novaDivida?: {
    nome: string;
    taxaJurosMensalPercent: number;
  };
  resultadoProjetado: number;
  ativo: string;
}

interface DividasContextType {
  dividas: Divida[];
  addDivida: (params: NovaDividaParams) => string;
  criarDividaDePrejuizo: (params: CriarDividaPrejuizoParams) => string;
  somarPrejuizoDivida: (params: SomarPrejuizoDividaParams) => void;
  editarDivida: (id: string, params: Partial<Omit<Divida, 'id' | 'historico'>>) => void;
  excluirDivida: (id: string) => void;
  lancarJuro: (params: LançarJuroParams) => void;
  lancarAmortizacao: (params: LançarAmortizacaoParams) => { dividaQuitada: boolean; saldoRestante: number };
  alterarStatusDivida: (id: string, status: 'aberta' | 'quitada') => void;
  editarLancamentoHistorico: (dividaId: string, itemId: string, params: {
    data?: string;
    valor?: number;
    tipo?: ItemHistoricoDivida['tipo'];
    observacao?: string;
  }) => void;
  excluirLancamentoHistorico: (dividaId: string, itemId: string) => void;
  encerrarOperacaoComVinculo: (params: EncerrarOperacaoComVinculoParams) => void;
  ajustarVinculoOperacao: (params: {
    operacaoId: string;
    dividaId: string;
    acao: 'ajustar_valor' | 'desvincular';
    novoValorVinculado?: number;
  }) => void;
  desfazer: () => void;
  podeDesfazer: boolean;
  importarDividas: (dados: Divida[], substituir: boolean) => void;
}

const DividasContext = createContext<DividasContextType | undefined>(undefined);

const STORAGE_KEY = 'opcoes-control-dividas-data';

export function DividasProvider({ children }: { children: React.ReactNode }) {
  const { 
    operacoes, 
    encerrarOperacao, 
    restaurarOperacoesSnapshot, 
    setUndoIntegradoFn, 
    showToast 
  } = useOperations();

  const [dividas, setDividas] = useState<Divida[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Divida[];
        // Sanitiza dados ao carregar para corrigir qualquer saldo duplicado existente
        return parsed.map(d => recalcularDivida(d));
      } catch (e) {
        console.error('Falha ao carregar dívidas do LocalStorage:', e);
        return [];
      }
    }
    return [];
  });

  const [undoStack, setUndoStack] = useState<Divida[][]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dividas));
  }, [dividas]);

  const updateDividasWithUndo = (updater: (prev: Divida[]) => Divida[]) => {
    setDividas(prev => {
      setUndoStack(uPrev => {
        const nextStack = [...uPrev, JSON.parse(JSON.stringify(prev))];
        if (nextStack.length > 15) {
          nextStack.shift();
        }
        return nextStack;
      });
      return updater(prev);
    });
  };

  const desfazer = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setDividas(previousState);
    showToast('Última ação em Dívidas desfeita!');
  };

  const addDivida = (params: NovaDividaParams): string => {
    const id = uuidv4();
    const nova: Divida = {
      id,
      nome: params.nome.trim(),
      descricao: params.descricao?.trim() || undefined,
      saldoInicial: params.saldoInicial,
      saldoAtual: params.saldoInicial,
      dataInicio: params.dataInicio,
      taxaJurosMensalPercent: params.taxaJurosMensalPercent,
      status: 'aberta',
      historico: []
    };

    updateDividasWithUndo(prev => [nova, ...prev]);
    showToast(`Dívida "${nova.nome}" cadastrada com sucesso!`);
    return id;
  };

  const criarDividaDePrejuizo = (params: CriarDividaPrejuizoParams): string => {
    const id = uuidv4();
    const valorAbs = Math.abs(params.saldoInicial);
    const primeiroItem: ItemHistoricoDivida = {
      id: uuidv4(),
      data: params.dataInicio,
      tipo: 'incremento',
      valor: valorAbs,
      saldoResultante: valorAbs,
      operacaoVinculadaId: params.operacaoId,
      ehCriacaoOrigem: true,
      observacao: params.observacao?.trim() || 'Dívida criada a partir de operação encerrada com prejuízo'
    };

    const nova: Divida = {
      id,
      nome: params.nome.trim(),
      saldoInicial: valorAbs,
      saldoAtual: valorAbs,
      dataInicio: params.dataInicio,
      taxaJurosMensalPercent: params.taxaJurosMensalPercent,
      status: 'aberta',
      historico: [primeiroItem]
    };

    updateDividasWithUndo(prev => [recalcularDivida(nova), ...prev]);
    showToast(`Dívida "${nova.nome}" criada a partir do prejuízo!`);
    return id;
  };

  const somarPrejuizoDivida = (params: SomarPrejuizoDividaParams) => {
    const valorAbs = Math.abs(params.valor);
    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== params.dividaId) return d;
      const novoItem: ItemHistoricoDivida = {
        id: uuidv4(),
        data: params.data,
        tipo: 'incremento',
        valor: valorAbs,
        saldoResultante: d.saldoAtual + valorAbs,
        operacaoVinculadaId: params.operacaoId,
        observacao: params.observacao?.trim() || 'Prejuízo de operação somado à dívida'
      };
      return recalcularDivida({
        ...d,
        historico: [...d.historico, novoItem]
      });
    }));
    showToast('Prejuízo somado à dívida existente com sucesso!');
  };

  const editarDivida = (id: string, params: Partial<Omit<Divida, 'id' | 'historico'>>) => {
    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== id) return d;
      const novoSaldoInicial = params.saldoInicial !== undefined ? Math.max(0, params.saldoInicial) : d.saldoInicial;
      
      const atualizada: Divida = {
        ...d,
        ...params,
        nome: params.nome !== undefined ? params.nome.trim() : d.nome,
        descricao: params.descricao !== undefined ? (params.descricao.trim() || undefined) : d.descricao,
        saldoInicial: novoSaldoInicial,
      };

      return recalcularDivida(atualizada);
    }));
    showToast('Dívida atualizada com sucesso!');
  };

  const excluirDivida = (id: string) => {
    const dividaAlvo = dividas.find(d => d.id === id);
    updateDividasWithUndo(prev => prev.filter(d => d.id !== id));
    showToast(`Dívida "${dividaAlvo?.nome || ''}" excluída.`);
  };

  const lancarJuro = (params: LançarJuroParams) => {
    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== params.dividaId) return d;
      const novoItem: ItemHistoricoDivida = {
        id: uuidv4(),
        data: params.data,
        tipo: 'juro',
        valor: params.valor,
        saldoResultante: d.saldoAtual + params.valor,
        observacao: params.observacao?.trim() || 'Juro do mês'
      };
      return recalcularDivida({
        ...d,
        historico: [...d.historico, novoItem]
      });
    }));
    showToast('Juro lançado com sucesso!');
  };

  const lancarAmortizacao = (params: LançarAmortizacaoParams) => {
    let dividaQuitada = false;
    let saldoRestante = 0;

    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== params.dividaId) return d;
      const novoItem: ItemHistoricoDivida = {
        id: uuidv4(),
        data: params.data,
        tipo: 'amortizacao',
        valor: params.valor,
        saldoResultante: d.saldoAtual - params.valor,
        operacaoVinculadaId: params.operacaoVinculadaId || null,
        observacao: params.observacao?.trim() || 'Amortização'
      };
      const recalculada = recalcularDivida({
        ...d,
        historico: [...d.historico, novoItem]
      });
      saldoRestante = recalculada.saldoAtual;
      if (recalculada.saldoAtual <= 0) {
        dividaQuitada = true;
      }
      return recalculada;
    }));

    showToast('Amortização lançada com sucesso!');
    return { dividaQuitada, saldoRestante };
  };

  const alterarStatusDivida = (id: string, status: 'aberta' | 'quitada') => {
    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== id) return d;
      return {
        ...d,
        status
      };
    }));
    showToast(status === 'quitada' ? 'Dívida marcada como quitada! 🎉' : 'Dívida reaberta.');
  };

  const editarLancamentoHistorico = (dividaId: string, itemId: string, params: {
    data?: string;
    valor?: number;
    tipo?: ItemHistoricoDivida['tipo'];
    observacao?: string;
  }) => {
    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== dividaId) return d;
      const historicoAtualizado = d.historico.map(item => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          data: params.data !== undefined ? params.data : item.data,
          valor: params.valor !== undefined ? Math.abs(params.valor) : item.valor,
          tipo: params.tipo !== undefined ? params.tipo : item.tipo,
          observacao: params.observacao !== undefined ? params.observacao.trim() : item.observacao,
        };
      });

      return recalcularDivida({
        ...d,
        historico: historicoAtualizado
      });
    }));
    showToast('Lançamento atualizado e saldo recalculado!');
  };

  const excluirLancamentoHistorico = (dividaId: string, itemId: string) => {
    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== dividaId) return d;
      const filtered = d.historico.filter(h => h.id !== itemId);
      return recalcularDivida({
        ...d,
        historico: filtered
      });
    }));
    showToast('Lançamento removido do histórico!');
  };

  // Encerramento de operação com vínculo e DESFAZER INTEGRADO EM UM ÚNICO PASSO
  const encerrarOperacaoComVinculo = (params: EncerrarOperacaoComVinculoParams) => {
    // 1. Snapshot dos dois estados antes de qualquer alteração
    const snapshotOperacoes: Operacao[] = JSON.parse(JSON.stringify(operacoes));
    const snapshotDividas: Divida[] = JSON.parse(JSON.stringify(dividas));

    let targetDividaId = params.dividaId;
    let novoDividasState = [...dividas];
    const valorAbs = Math.abs(params.valorVinculado);

    if (params.tipoVinculo === 'amortizar_existente' && params.dividaId) {
      novoDividasState = novoDividasState.map(d => {
        if (d.id !== params.dividaId) return d;
        const novoItem: ItemHistoricoDivida = {
          id: uuidv4(),
          data: params.dataEncerramento,
          tipo: 'amortizacao',
          valor: valorAbs,
          saldoResultante: d.saldoAtual - valorAbs,
          operacaoVinculadaId: params.opId,
          observacao: `Amortização com lucro da operação ${params.ativo}`
        };
        return recalcularDivida({
          ...d,
          historico: [...d.historico, novoItem]
        });
      });
    } else if (params.tipoVinculo === 'somar_existente' && params.dividaId) {
      novoDividasState = novoDividasState.map(d => {
        if (d.id !== params.dividaId) return d;
        const novoItem: ItemHistoricoDivida = {
          id: uuidv4(),
          data: params.dataEncerramento,
          tipo: 'incremento',
          valor: valorAbs,
          saldoResultante: d.saldoAtual + valorAbs,
          operacaoVinculadaId: params.opId,
          observacao: `Prejuízo da operação ${params.ativo}`
        };
        return recalcularDivida({
          ...d,
          historico: [...d.historico, novoItem]
        });
      });
    } else if (params.tipoVinculo === 'criar_nova' && params.novaDivida) {
      const novaId = uuidv4();
      targetDividaId = novaId;
      const primeiroItem: ItemHistoricoDivida = {
        id: uuidv4(),
        data: params.dataEncerramento,
        tipo: 'incremento',
        valor: valorAbs,
        saldoResultante: valorAbs,
        operacaoVinculadaId: params.opId,
        ehCriacaoOrigem: true,
        observacao: `Dívida criada a partir de operação ${params.ativo} encerrada com prejuízo`
      };
      const recemCriada: Divida = {
        id: novaId,
        nome: params.novaDivida.nome.trim(),
        saldoInicial: valorAbs,
        saldoAtual: valorAbs,
        dataInicio: params.dataEncerramento,
        taxaJurosMensalPercent: params.novaDivida.taxaJurosMensalPercent,
        status: 'aberta',
        historico: [primeiroItem]
      };
      novoDividasState = [recalcularDivida(recemCriada), ...novoDividasState];
    }

    // 2. Atualiza estado de dívidas
    setDividas(novoDividasState);

    // 3. Determina valor vinculado com o sinal adequado
    const isLucro = params.resultadoProjetado >= 0;
    const valorVinculadoDivida = isLucro ? valorAbs : -valorAbs;
    const sobra = params.resultadoProjetado - valorVinculadoDivida;

    // 4. Encerra a operação
    encerrarOperacao(params.opId, params.precoEncerramento, params.dataEncerramento, {
      valorVinculadoDivida,
      dividaVinculadaId: targetDividaId!,
      valorContadoComoResultadoOpcoes: sobra
    });

    // 5. Função de Desfazer Integrado em um único passo
    const desfazerIntegrado = () => {
      restaurarOperacoesSnapshot(snapshotOperacoes);
      setDividas(snapshotDividas);
      setUndoIntegradoFn(null);
      showToast('Encerramento e vínculo com dívida desfeitos!');
    };

    setUndoIntegradoFn(() => desfazerIntegrado);

    showToast(
      isLucro 
        ? `Operação encerrada e ${formatCurrency(valorAbs)} amortizado na dívida!`
        : `Operação encerrada e ${formatCurrency(valorAbs)} registrado como dívida!`,
      {
        label: 'Desfazer',
        onClick: desfazerIntegrado
      }
    );
  };

  const ajustarVinculoOperacao = (params: {
    operacaoId: string;
    dividaId: string;
    acao: 'ajustar_valor' | 'desvincular';
    novoValorVinculado?: number;
  }) => {
    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== params.dividaId) return d;

      if (params.acao === 'desvincular') {
        const novoHistorico = d.historico.filter(h => h.operacaoVinculadaId !== params.operacaoId);
        return recalcularDivida({
          ...d,
          historico: novoHistorico
        });
      }

      if (params.acao === 'ajustar_valor' && params.novoValorVinculado !== undefined) {
        const valorAbs = Math.abs(params.novoValorVinculado);
        let novoSaldoInicial = d.saldoInicial;

        const novoHistorico = d.historico.map(h => {
          if (h.operacaoVinculadaId !== params.operacaoId) return h;
          if (h.ehCriacaoOrigem) {
            novoSaldoInicial = valorAbs;
          }
          return {
            ...h,
            valor: valorAbs
          };
        });

        return recalcularDivida({
          ...d,
          saldoInicial: novoSaldoInicial,
          historico: novoHistorico
        });
      }

      return d;
    }));
  };

  const importarDividas = (dados: Divida[], substituir: boolean) => {
    updateDividasWithUndo(prev => {
      const sanitized = (dados || []).map(d => recalcularDivida(d));
      if (substituir) return sanitized;
      const existingIds = new Set(prev.map(p => p.id));
      const novas = sanitized.filter(d => !existingIds.has(d.id));
      return [...novas, ...prev];
    });
    showToast('Dívidas importadas com sucesso!');
  };

  return (
    <DividasContext.Provider value={{
      dividas,
      addDivida,
      criarDividaDePrejuizo,
      somarPrejuizoDivida,
      editarDivida,
      excluirDivida,
      lancarJuro,
      lancarAmortizacao,
      alterarStatusDivida,
      editarLancamentoHistorico,
      excluirLancamentoHistorico,
      encerrarOperacaoComVinculo,
      ajustarVinculoOperacao,
      desfazer,
      podeDesfazer: undoStack.length > 0,
      importarDividas
    }}>
      {children}
    </DividasContext.Provider>
  );
}

export function useDividas() {
  const context = useContext(DividasContext);
  if (!context) {
    throw new Error('useDividas deve ser usado dentro de DividasProvider');
  }
  return context;
}
