import React, { createContext, useContext, useEffect, useState } from 'react';
import { Operacao, EventoOperacao, Rolagem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface OperationsContextType {
  operacoes: Operacao[];
  addOperacao: (op: Omit<Operacao, 'id' | 'status' | 'premioLiquidoAcumulado' | 'quantidadeAtual' | 'strikeAtual' | 'precoMedioAtual' | 'historicoRolagens' | 'dataEncerramento' | 'precoEncerramento' | 'resultadoFinal' | 'historicoEventos'> & { dataAbertura: string }) => void;
  rolarOperacao: (id: string, rolagem: Omit<Rolagem, 'premioLiquidoDaRolagem' | 'precoMedioNovoCalculado'>) => void;
  encerrarOperacao: (id: string, precoEncerramento: number, dataEncerramento: string) => void;
  aumentarPosicao: (id: string, quantidade: number, preco: number, data: string) => void;
  editarOperacao: (id: string, campos: Partial<Operacao>) => void;
  excluirOperacao: (id: string) => void;
  editarEvento: (opId: string, eventId: string, novosCampos: Partial<EventoOperacao>) => void;
  excluirEvento: (opId: string, eventId: string) => void;
  importarDados: (dados: Operacao[], substituir: boolean) => void;
  limparDados: () => void;
  desfazer: () => void;
  podeDesfazer: boolean;
  toast: {
    id: string;
    mensagem: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  } | null;
  showToast: (mensagem: string, action?: { label: string; onClick: () => void }) => void;
  hideToast: () => void;
  dismissedBannerKey: string | null;
  setDismissedBannerKey: (key: string | null) => void;
}

const OperationsContext = createContext<OperationsContextType | undefined>(undefined);

export function garantirHistoricoEventos(op: Operacao): Operacao {
  if (op.historicoEventos && op.historicoEventos.length > 0) {
    return op;
  }
  
  const eventos: EventoOperacao[] = [];
  
  // 1. Abertura
  eventos.push({
    id: `abertura-${op.id}`,
    tipo: 'abertura',
    data: op.dataAbertura,
    detalhes: `Abertura de posição: ${op.quantidadeInicial}x @ R$ ${op.precoMedioOriginal.toFixed(2)} (Strike R$ ${op.strikeInicial.toFixed(2)})`,
    quantidade: op.quantidadeInicial,
    preco: op.precoMedioOriginal,
    strike: op.strikeInicial,
  });
  
  // 2. Rolagens
  if (op.historicoRolagens && op.historicoRolagens.length > 0) {
    op.historicoRolagens.forEach((r, idx) => {
      eventos.push({
        id: `rolagem-${op.id}-${idx}-${Date.now()}`,
        tipo: 'rolagem',
        data: r.data,
        detalhes: `Rolagem: Strike R$ ${r.strikeAnterior.toFixed(2)} → R$ ${r.strikeNovo.toFixed(2)}, Qtd ${r.quantidadeAnterior} → ${r.quantidadeNova}`,
        quantidadeAnterior: r.quantidadeAnterior,
        quantidadeNova: r.quantidadeNova,
        precoRecompra: r.precoRecompra,
        precoVendaNova: r.precoVendaNova,
        strikeAnterior: r.strikeAnterior,
        strikeNovo: r.strikeNovo,
        novoVencimento: r.novoVencimento,
      });
    });
  }
  
  // 3. Encerramento
  if (op.status === 'encerrada' && op.dataEncerramento) {
    eventos.push({
      id: `encerramento-${op.id}`,
      tipo: 'encerramento',
      data: op.dataEncerramento,
      detalhes: `Encerramento de posição: Preço R$ ${(op.precoEncerramento ?? 0).toFixed(2)}`,
      preco: op.precoEncerramento ?? 0,
    });
  }
  
  return {
    ...op,
    historicoEventos: eventos
  };
}

export function recalcularOperacao(op: Operacao): Operacao {
  const isVenda = op.direcaoInicial === 'V';
  
  // Base starting state
  let quantidadeAtual = op.quantidadeInicial;
  let strikeAtual = op.strikeInicial;
  let vencimentoAtual = op.vencimentoAtual;
  
  let premioLiquidoAcumulado = isVenda
    ? op.quantidadeInicial * op.precoMedioOriginal
    : -(op.quantidadeInicial * op.precoMedioOriginal);

  const eventos = op.historicoEventos || [];
  const rolagens: Rolagem[] = [];

  eventos.forEach(evt => {
    if (evt.tipo === 'aumento') {
      const qty = evt.quantidade || 0;
      const price = evt.preco || 0;
      const valorFin = qty * price;
      
      if (isVenda) {
        premioLiquidoAcumulado += valorFin;
      } else {
        premioLiquidoAcumulado -= valorFin;
      }
      quantidadeAtual += qty;
      
    } else if (evt.tipo === 'rolagem') {
      const qtyAnt = evt.quantidadeAnterior ?? quantidadeAtual;
      const qtyNovo = evt.quantidadeNova ?? qtyAnt;
      const precoRec = evt.precoRecompra ?? 0;
      const precoVend = evt.precoVendaNova ?? 0;
      const strikeAnt = evt.strikeAnterior ?? strikeAtual;
      const strikeNvo = evt.strikeNovo ?? strikeAnt;
      const novoVenc = evt.novoVencimento ?? vencimentoAtual;
      
      let premioRolagem = 0;
      if (isVenda) {
        premioRolagem = (qtyNovo * precoVend) - (qtyAnt * precoRec);
      } else {
        premioRolagem = (qtyAnt * precoRec) - (qtyNovo * precoVend);
      }
      
      premioLiquidoAcumulado += premioRolagem;
      quantidadeAtual = qtyNovo;
      strikeAtual = strikeNvo;
      vencimentoAtual = novoVenc;
      
      const precoMedioNovoCalculado = quantidadeAtual > 0 ? Math.abs(premioLiquidoAcumulado) / quantidadeAtual : 0;
      
      rolagens.push({
        data: evt.data,
        strikeAnterior: strikeAnt,
        strikeNovo: strikeNvo,
        quantidadeAnterior: qtyAnt,
        quantidadeNova: qtyNovo,
        precoRecompra: precoRec,
        precoVendaNova: precoVend,
        novoVencimento: novoVenc,
        premioLiquidoDaRolagem: premioRolagem,
        precoMedioNovoCalculado
      });
    }
  });

  const precoMedioAtual = quantidadeAtual > 0 ? Math.abs(premioLiquidoAcumulado) / quantidadeAtual : 0;
  
  let resultadoFinal = op.resultadoFinal;
  if (op.status === 'encerrada') {
    const precoEncerramento = op.precoEncerramento ?? 0;
    if (isVenda) {
      resultadoFinal = premioLiquidoAcumulado - (quantidadeAtual * precoEncerramento);
    } else {
      resultadoFinal = premioLiquidoAcumulado + (quantidadeAtual * precoEncerramento);
    }
  }

  return {
    ...op,
    quantidadeAtual,
    strikeAtual,
    vencimentoAtual,
    premioLiquidoAcumulado,
    precoMedioAtual,
    historicoRolagens: rolagens,
    resultadoFinal
  };
}

export function OperationsProvider({ children }: { children: React.ReactNode }) {
  const [operacoes, setOperacoes] = useState<Operacao[]>(() => {
    const saved = localStorage.getItem('opcoes-control-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Operacao[];
        return parsed.map(op => garantirHistoricoEventos(op));
      } catch (e) {
        console.error("Failed to parse operations from local storage", e);
        return [];
      }
    }
    return [];
  });

  const [undoStack, setUndoStack] = useState<Operacao[][]>([]);
  const [toast, setToast] = useState<{ id: string; mensagem: string; action?: { label: string; onClick: () => void } } | null>(null);
  const [dismissedBannerKey, setDismissedBannerKey] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('opcoes-control-data', JSON.stringify(operacoes));
  }, [operacoes]);

  const showToast = (mensagem: string, action?: { label: string; onClick: () => void }) => {
    const id = uuidv4();
    setToast({ id, mensagem, action });
  };

  const hideToast = () => setToast(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const updateOperacoesWithUndo = (updater: (prev: Operacao[]) => Operacao[]) => {
    setOperacoes(prev => {
      setUndoStack(uPrev => {
        const nextStack = [...uPrev, JSON.parse(JSON.stringify(prev))];
        if (nextStack.length > 10) {
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
    setOperacoes(previousState);
    showToast("Última ação desfeita!");
  };

  const addOperacao = (opData: any) => {
    const isVenda = opData.direcaoInicial === 'V';
    const premioLiquidoAcumulado = isVenda
      ? opData.quantidadeInicial * opData.precoMedioOriginal
      : -(opData.quantidadeInicial * opData.precoMedioOriginal);

    const opId = uuidv4();
    const aberturaEvento: EventoOperacao = {
      id: uuidv4(),
      tipo: 'abertura',
      data: opData.dataAbertura,
      detalhes: `Abertura de posição: ${opData.quantidadeInicial}x @ R$ ${Number(opData.precoMedioOriginal).toFixed(2)} (Strike R$ ${Number(opData.strikeInicial).toFixed(2)})`,
      quantidade: opData.quantidadeInicial,
      preco: opData.precoMedioOriginal,
      strike: opData.strikeInicial,
    };

    const novaOperacao: Operacao = {
      id: opId,
      ...opData,
      status: 'aberta',
      premioLiquidoAcumulado,
      quantidadeAtual: opData.quantidadeInicial,
      strikeAtual: opData.strikeInicial,
      precoMedioAtual: opData.precoMedioOriginal,
      historicoRolagens: [],
      dataEncerramento: null,
      precoEncerramento: null,
      resultadoFinal: null,
      historicoEventos: [aberturaEvento]
    };
    
    updateOperacoesWithUndo(prev => [novaOperacao, ...prev]);
    showToast("Operação adicionada com sucesso!", {
      label: "Desfazer",
      onClick: desfazer
    });
  };

  const rolarOperacao = (id: string, rData: Omit<Rolagem, 'premioLiquidoDaRolagem' | 'precoMedioNovoCalculado'>) => {
    updateOperacoesWithUndo(prev => prev.map(op => {
      if (op.id !== id || op.status !== 'aberta') return op;

      const novoEvento: EventoOperacao = {
        id: uuidv4(),
        tipo: 'rolagem',
        data: rData.data,
        detalhes: `Rolagem: Strike R$ ${rData.strikeAnterior.toFixed(2)} → R$ ${rData.strikeNovo.toFixed(2)}, Qtd ${rData.quantidadeAnterior} → ${rData.quantidadeNova}`,
        quantidadeAnterior: rData.quantidadeAnterior,
        quantidadeNova: rData.quantidadeNova,
        precoRecompra: rData.precoRecompra,
        precoVendaNova: rData.precoVendaNova,
        strikeAnterior: rData.strikeAnterior,
        strikeNovo: rData.strikeNovo,
        novoVencimento: rData.novoVencimento,
      };

      const opAtualizada = {
        ...op,
        historicoEventos: [...(op.historicoEventos || []), novoEvento]
      };

      return recalcularOperacao(opAtualizada);
    }));

    showToast("Operação rolada com sucesso!", {
      label: "Desfazer",
      onClick: desfazer
    });
  };

  const encerrarOperacao = (id: string, precoEncerramento: number, dataEncerramento: string) => {
    updateOperacoesWithUndo(prev => prev.map(op => {
      if (op.id !== id || op.status !== 'aberta') return op;

      const novoEvento: EventoOperacao = {
        id: uuidv4(),
        tipo: 'encerramento',
        data: dataEncerramento,
        detalhes: `Encerramento de posição: Preço R$ ${precoEncerramento.toFixed(2)}`,
        preco: precoEncerramento,
      };

      const opComEvento = {
        ...op,
        status: 'encerrada' as const,
        precoEncerramento,
        dataEncerramento,
        historicoEventos: [...(op.historicoEventos || []), novoEvento]
      };

      return recalcularOperacao(opComEvento);
    }));

    showToast("Operação encerrada com sucesso!", {
      label: "Desfazer",
      onClick: desfazer
    });
  };

  const aumentarPosicao = (id: string, quantidade: number, preco: number, data: string) => {
    updateOperacoesWithUndo(prev => prev.map(op => {
      if (op.id !== id || op.status !== 'aberta') return op;

      const novoEvento: EventoOperacao = {
        id: uuidv4(),
        tipo: 'aumento',
        data,
        detalhes: `Aumento de posição: +${quantidade} unidades @ R$ ${preco.toFixed(2)}`,
        quantidade,
        preco,
      };

      const opAtualizada = {
        ...op,
        historicoEventos: [...(op.historicoEventos || []), novoEvento]
      };

      return recalcularOperacao(opAtualizada);
    }));

    showToast("Posição aumentada com sucesso!", {
      label: "Desfazer",
      onClick: desfazer
    });
  };

  const editarOperacao = (id: string, campos: Partial<Operacao>) => {
    updateOperacoesWithUndo(prev => prev.map(op => {
      if (op.id !== id) return op;

      const opMesclada = {
        ...op,
        ...campos
      };

      let novosEventos = [...(opMesclada.historicoEventos || [])];
      
      // Update abertura event details
      const aberturaIdx = novosEventos.findIndex(e => e.tipo === 'abertura');
      if (aberturaIdx !== -1) {
        novosEventos[aberturaIdx] = {
          ...novosEventos[aberturaIdx],
          data: opMesclada.dataAbertura,
          quantidade: opMesclada.quantidadeInicial,
          preco: opMesclada.precoMedioOriginal,
          strike: opMesclada.strikeInicial,
          detalhes: `Abertura de posição: ${opMesclada.quantidadeInicial}x @ R$ ${Number(opMesclada.precoMedioOriginal).toFixed(2)} (Strike R$ ${Number(opMesclada.strikeInicial).toFixed(2)})`
        };
      }

      // Update/add/remove encerramento event
      const encerramentoIdx = novosEventos.findIndex(e => e.tipo === 'encerramento');
      if (opMesclada.status === 'encerrada') {
        if (encerramentoIdx !== -1) {
          novosEventos[encerramentoIdx] = {
            ...novosEventos[encerramentoIdx],
            data: opMesclada.dataEncerramento || novosEventos[encerramentoIdx].data,
            preco: opMesclada.precoEncerramento !== undefined ? opMesclada.precoEncerramento! : novosEventos[encerramentoIdx].preco,
            detalhes: `Encerramento de posição: Preço R$ ${Number(opMesclada.precoEncerramento).toFixed(2)}`
          };
        } else {
          novosEventos.push({
            id: uuidv4(),
            tipo: 'encerramento',
            data: opMesclada.dataEncerramento || new Date().toISOString().split('T')[0],
            preco: opMesclada.precoEncerramento || 0,
            detalhes: `Encerramento de posição: Preço R$ ${Number(opMesclada.precoEncerramento).toFixed(2)}`
          });
        }
      } else {
        if (encerramentoIdx !== -1) {
          novosEventos.splice(encerramentoIdx, 1);
        }
        opMesclada.dataEncerramento = null;
        opMesclada.precoEncerramento = null;
        opMesclada.resultadoFinal = null;
      }

      // Add edition tag
      novosEventos.push({
        id: uuidv4(),
        tipo: 'edicao',
        data: new Date().toISOString().split('T')[0],
        detalhes: `Campos da operação corrigidos manualmente`
      });

      const opPronta = {
        ...opMesclada,
        historicoEventos: novosEventos
      };

      return recalcularOperacao(opPronta);
    }));

    showToast("Operação editada com sucesso!", {
      label: "Desfazer",
      onClick: desfazer
    });
  };

  const excluirOperacao = (id: string) => {
    updateOperacoesWithUndo(prev => prev.filter(op => op.id !== id));
    showToast("Operação excluída definitivamente!", {
      label: "Desfazer",
      onClick: desfazer
    });
  };

  const editarEvento = (opId: string, eventId: string, novosCampos: Partial<EventoOperacao>) => {
    updateOperacoesWithUndo(prev => prev.map(op => {
      if (op.id !== opId) return op;

      const novosEventos = (op.historicoEventos || []).map(evt => {
        if (evt.id !== eventId) return evt;

        const mesclado = { ...evt, ...novosCampos };
        
        if (mesclado.tipo === 'aumento') {
          const qty = mesclado.quantidade || 0;
          const prc = mesclado.preco || 0;
          mesclado.detalhes = `Aumento de posição: +${qty} unidades @ R$ ${prc.toFixed(2)}`;
        } else if (mesclado.tipo === 'rolagem') {
          const qtyAnt = mesclado.quantidadeAnterior ?? 0;
          const qtyNov = mesclado.quantidadeNova ?? 0;
          const strAnt = mesclado.strikeAnterior ?? 0;
          const strNov = mesclado.strikeNovo ?? 0;
          mesclado.detalhes = `Rolagem: Strike R$ ${strAnt.toFixed(2)} → R$ ${strNov.toFixed(2)}, Qtd ${qtyAnt} → ${qtyNov}`;
        } else if (mesclado.tipo === 'abertura') {
          const qty = mesclado.quantidade || 0;
          const prc = mesclado.preco || 0;
          const str = mesclado.strike || 0;
          mesclado.detalhes = `Abertura de posição: ${qty}x @ R$ ${prc.toFixed(2)} (Strike R$ ${str.toFixed(2)})`;
        }

        return mesclado;
      });

      const opAtualizada = {
        ...op,
        historicoEventos: novosEventos
      };

      // Since an event was edited, we need to sync operation base if opening was changed
      const openingEvt = novosEventos.find(e => e.tipo === 'abertura');
      if (openingEvt) {
        opAtualizada.dataAbertura = openingEvt.data;
        opAtualizada.quantidadeInicial = openingEvt.quantidade ?? op.quantidadeInicial;
        opAtualizada.precoMedioOriginal = openingEvt.preco ?? op.precoMedioOriginal;
        opAtualizada.strikeInicial = openingEvt.strike ?? op.strikeInicial;
      }

      return recalcularOperacao(opAtualizada);
    }));

    showToast("Evento editado com sucesso!", {
      label: "Desfazer",
      onClick: desfazer
    });
  };

  const excluirEvento = (opId: string, eventId: string) => {
    updateOperacoesWithUndo(prev => prev.map(op => {
      if (op.id !== opId) return op;

      const novosEventos = (op.historicoEventos || []).filter(evt => evt.id !== eventId);
      
      const opAtualizada = {
        ...op,
        historicoEventos: novosEventos
      };

      return recalcularOperacao(opAtualizada);
    }));

    showToast("Evento excluído!", {
      label: "Desfazer",
      onClick: desfazer
    });
  };

  const importarDados = (dados: Operacao[], substituir: boolean) => {
    updateOperacoesWithUndo(prev => {
      const carregados = dados.map(op => garantirHistoricoEventos(op));
      if (substituir) {
        return carregados;
      } else {
        const ids = new Set(prev.map(p => p.id));
        const novos = carregados.filter(d => !ids.has(d.id));
        return [...novos, ...prev];
      }
    });
    showToast("Dados importados com sucesso!");
  };

  const limparDados = () => {
    updateOperacoesWithUndo(() => []);
    showToast("Todos os dados foram limpos!", {
      label: "Desfazer",
      onClick: desfazer
    });
  };

  return (
    <OperationsContext.Provider value={{ 
      operacoes, 
      addOperacao, 
      rolarOperacao, 
      encerrarOperacao, 
      aumentarPosicao,
      editarOperacao,
      excluirOperacao,
      editarEvento,
      excluirEvento,
      importarDados, 
      limparDados,
      desfazer,
      podeDesfazer: undoStack.length > 0,
      toast,
      showToast,
      hideToast,
      dismissedBannerKey,
      setDismissedBannerKey
    }}>
      {children}
    </OperationsContext.Provider>
  );
}

export function useOperations() {
  const context = useContext(OperationsContext);
  if (context === undefined) {
    throw new Error('useOperations must be used within a OperationsProvider');
  }
  return context;
}
