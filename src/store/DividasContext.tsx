import React, { createContext, useContext, useEffect, useState } from 'react';
import { Divida, ItemHistoricoDivida } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useOperations } from './OperationsContext';

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
  excluirLancamentoHistorico: (dividaId: string, itemId: string) => void;
  desfazer: () => void;
  podeDesfazer: boolean;
  importarDividas: (dados: Divida[], substituir: boolean) => void;
}

const DividasContext = createContext<DividasContextType | undefined>(undefined);

const STORAGE_KEY = 'opcoes-control-dividas-data';

export function DividasProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useOperations();

  const [dividas, setDividas] = useState<Divida[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as Divida[];
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

    updateDividasWithUndo(prev => [nova, ...prev]);
    showToast(`Dívida "${nova.nome}" criada a partir do prejuízo!`);
    return id;
  };

  const somarPrejuizoDivida = (params: SomarPrejuizoDividaParams) => {
    const valorAbs = Math.abs(params.valor);
    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== params.dividaId) return d;
      const novoSaldo = Math.round((d.saldoAtual + valorAbs) * 100) / 100;
      const novoItem: ItemHistoricoDivida = {
        id: uuidv4(),
        data: params.data,
        tipo: 'incremento',
        valor: valorAbs,
        saldoResultante: novoSaldo,
        operacaoVinculadaId: params.operacaoId,
        observacao: params.observacao?.trim() || 'Prejuízo de operação somado à dívida'
      };
      return {
        ...d,
        saldoAtual: novoSaldo,
        status: (d.status === 'quitada' && novoSaldo > 0) ? 'aberta' : d.status,
        historico: [...d.historico, novoItem]
      };
    }));
    showToast('Prejuízo somado à dívida existente com sucesso!');
  };

  const editarDivida = (id: string, params: Partial<Omit<Divida, 'id' | 'historico'>>) => {
    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== id) return d;
      return {
        ...d,
        ...params,
        nome: params.nome !== undefined ? params.nome.trim() : d.nome,
        descricao: params.descricao !== undefined ? params.descricao.trim() : d.descricao,
      };
    }));
    showToast('Dívida atualizada!');
  };

  const excluirDivida = (id: string) => {
    const dividaAlvo = dividas.find(d => d.id === id);
    updateDividasWithUndo(prev => prev.filter(d => d.id !== id));
    showToast(`Dívida "${dividaAlvo?.nome || ''}" excluída.`);
  };

  const lancarJuro = (params: LançarJuroParams) => {
    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== params.dividaId) return d;
      const novoSaldo = Math.round((d.saldoAtual + params.valor) * 100) / 100;
      const novoItem: ItemHistoricoDivida = {
        id: uuidv4(),
        data: params.data,
        tipo: 'juro',
        valor: params.valor,
        saldoResultante: novoSaldo,
        observacao: params.observacao?.trim() || 'Juro do mês'
      };
      return {
        ...d,
        saldoAtual: novoSaldo,
        historico: [...d.historico, novoItem]
      };
    }));
    showToast('Juro lançado com sucesso!');
  };

  const lancarAmortizacao = (params: LançarAmortizacaoParams) => {
    let dividaQuitada = false;
    let saldoRestante = 0;

    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== params.dividaId) return d;
      const novoSaldo = Math.round((d.saldoAtual - params.valor) * 100) / 100;
      saldoRestante = novoSaldo;
      if (novoSaldo <= 0) {
        dividaQuitada = true;
      }
      const novoItem: ItemHistoricoDivida = {
        id: uuidv4(),
        data: params.data,
        tipo: 'amortizacao',
        valor: params.valor,
        saldoResultante: novoSaldo,
        operacaoVinculadaId: params.operacaoVinculadaId || null,
        observacao: params.observacao?.trim() || 'Amortização'
      };
      return {
        ...d,
        saldoAtual: novoSaldo,
        historico: [...d.historico, novoItem]
      };
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

  const excluirLancamentoHistorico = (dividaId: string, itemId: string) => {
    updateDividasWithUndo(prev => prev.map(d => {
      if (d.id !== dividaId) return d;
      const filtered = d.historico.filter(h => h.id !== itemId);
      
      // Recalcula saldos cronologicamente
      let corrente = d.saldoInicial;
      const recalibrado = filtered.map(item => {
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

      return {
        ...d,
        saldoAtual: corrente,
        status: (d.status === 'quitada' && corrente > 0) ? 'aberta' : d.status,
        historico: recalibrado
      };
    }));
    showToast('Lançamento removido do histórico!');
  };

  const importarDividas = (dados: Divida[], substituir: boolean) => {
    updateDividasWithUndo(prev => {
      if (substituir) return dados;
      const existingIds = new Set(prev.map(p => p.id));
      const novas = dados.filter(d => !existingIds.has(d.id));
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
      excluirLancamentoHistorico,
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
