import React, { createContext, useContext, useEffect, useState } from 'react';
import { Operacao } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface OperationsContextType {
  operacoes: Operacao[];
  addOperacao: (op: Omit<Operacao, 'id' | 'status' | 'premioLiquidoAcumulado' | 'quantidadeAtual' | 'strikeAtual' | 'precoMedioAtual' | 'historicoRolagens' | 'dataEncerramento' | 'precoEncerramento' | 'resultadoFinal'>) => void;
  rolarOperacao: (id: string, rolagem: Omit<import('@/types').Rolagem, 'premioLiquidoDaRolagem' | 'precoMedioNovoCalculado'>) => void;
  encerrarOperacao: (id: string, precoEncerramento: number, dataEncerramento: string) => void;
  importarDados: (dados: Operacao[], substituir: boolean) => void;
  limparDados: () => void;
}

const OperationsContext = createContext<OperationsContextType | undefined>(undefined);

export function OperationsProvider({ children }: { children: React.ReactNode }) {
  const [operacoes, setOperacoes] = useState<Operacao[]>(() => {
    const saved = localStorage.getItem('opcoes-control-data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse operations from local storage", e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('opcoes-control-data', JSON.stringify(operacoes));
  }, [operacoes]);

  const addOperacao = (opData: any) => {
    const isVenda = opData.direcaoInicial === 'V';
    // If venda, cash received (positive). If compra, cash paid (negative)
    const premioLiquidoAcumulado = isVenda
      ? opData.quantidadeInicial * opData.precoMedioOriginal
      : -(opData.quantidadeInicial * opData.precoMedioOriginal);

    const novaOperacao: Operacao = {
      id: uuidv4(),
      ...opData,
      status: 'aberta',
      premioLiquidoAcumulado,
      quantidadeAtual: opData.quantidadeInicial,
      strikeAtual: opData.strikeInicial,
      precoMedioAtual: opData.precoMedioOriginal, // initially same
      historicoRolagens: [],
      dataEncerramento: null,
      precoEncerramento: null,
      resultadoFinal: null,
    };
    
    setOperacoes(prev => [novaOperacao, ...prev]);
  };

  const rolarOperacao = (id: string, rData: Omit<import('@/types').Rolagem, 'premioLiquidoDaRolagem' | 'precoMedioNovoCalculado'>) => {
    setOperacoes(prev => prev.map(op => {
      if (op.id !== id || op.status !== 'aberta') return op;
      
      const isVenda = op.direcaoInicial === 'V';
      let premioLiquidoDaRolagem = 0;
      
      if (isVenda) {
        // Venda: buy to close old (cost), sell to open new (credit)
        premioLiquidoDaRolagem = (rData.quantidadeNova * rData.precoVendaNova) - (rData.quantidadeAnterior * rData.precoRecompra);
      } else {
        // Compra: sell to close old (credit), buy to open new (cost)
        premioLiquidoDaRolagem = (rData.quantidadeAnterior * rData.precoRecompra) - (rData.quantidadeNova * rData.precoVendaNova);
      }
      
      const novoPremioLiquidoAcumulado = op.premioLiquidoAcumulado + premioLiquidoDaRolagem;
      const precoMedioNovoCalculado = Math.abs(novoPremioLiquidoAcumulado) / rData.quantidadeNova;

      const rolagemCompleta: import('@/types').Rolagem = {
        ...rData,
        premioLiquidoDaRolagem,
        precoMedioNovoCalculado
      };

      return {
        ...op,
        quantidadeAtual: rData.quantidadeNova,
        strikeAtual: rData.strikeNovo,
        vencimentoAtual: rData.novoVencimento,
        premioLiquidoAcumulado: novoPremioLiquidoAcumulado,
        precoMedioAtual: precoMedioNovoCalculado,
        historicoRolagens: [...op.historicoRolagens, rolagemCompleta]
      };
    }));
  };

  const encerrarOperacao = (id: string, precoEncerramento: number, dataEncerramento: string) => {
    setOperacoes(prev => prev.map(op => {
      if (op.id !== id || op.status !== 'aberta') return op;

      const isVenda = op.direcaoInicial === 'V';
      let resultadoFinal = 0;

      if (isVenda) {
        // Closed by buying (cost)
        resultadoFinal = op.premioLiquidoAcumulado - (op.quantidadeAtual * precoEncerramento);
      } else {
        // Closed by selling (credit)
        // Note: premioLiquidoAcumulado is negative for compras, so adding credit to it gives net result.
        // The prompt says: "Se direcaoInicial == 'C': resultadoFinal = (quantidadeAtual * precoEncerramento) - premioLiquidoAcumulado (nesse caso trate o valor pago na abertura como custo negativo desde o início: premioLiquidoAcumulado deveria começar negativo para compras... mas o princípio é sempre: resultado = tudo que entrou de caixa − tudo que saiu de caixa)"
        // If it starts negative, let's just add the credit to it.
        // Wait, if formula is: (qtd * preco) - premioLiquidoAcumulado, and premio is negative, it will be (qtd * preco) - (-15) = +15, which is wrong.
        // Since we store it negative (cash flow), we just ADD the cash IN from the sale.
        // Cash Flow approach: resultadoFinal = premioLiquidoAcumulado + (quantidadeAtual * precoEncerramento)
        resultadoFinal = op.premioLiquidoAcumulado + (op.quantidadeAtual * precoEncerramento);
      }

      return {
        ...op,
        status: 'encerrada',
        precoEncerramento,
        dataEncerramento,
        resultadoFinal
      };
    }));
  };

  const importarDados = (dados: Operacao[], substituir: boolean) => {
    if (substituir) {
      setOperacoes(dados);
    } else {
      setOperacoes(prev => {
        const ids = new Set(prev.map(p => p.id));
        const novos = dados.filter(d => !ids.has(d.id));
        return [...novos, ...prev];
      });
    }
  };

  const limparDados = () => {
    setOperacoes([]);
  };

  return (
    <OperationsContext.Provider value={{ operacoes, addOperacao, rolarOperacao, encerrarOperacao, importarDados, limparDados }}>
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
