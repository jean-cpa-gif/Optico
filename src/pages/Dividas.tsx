import React, { useState } from 'react';
import { useDividas } from '@/store/DividasContext';
import { useOperations } from '@/store/OperationsContext';
import { 
  Plus, 
  Wallet, 
  TrendingDown, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ModalNovaDivida } from '@/components/ModalNovaDivida';
import { ModalLancarJuro } from '@/components/ModalLancarJuro';
import { ModalLancarAmortizacao } from '@/components/ModalLancarAmortizacao';
import { CardDivida } from '@/components/CardDivida';
import { Divida } from '@/types';

export default function Dividas() {
  const { 
    dividas, 
    addDivida, 
    lancarJuro, 
    lancarAmortizacao, 
    alterarStatusDivida, 
    editarDivida,
    excluirDivida, 
    editarLancamentoHistorico,
    excluirLancamentoHistorico 
  } = useDividas();

  const { operacoes } = useOperations();
  const operacoesEncerradas = operacoes.filter(op => op.status === 'encerrada');

  // Modals state
  const [modalNovaDividaOpen, setModalNovaDividaOpen] = useState(false);
  const [modalJuroDivida, setModalJuroDivida] = useState<Divida | null>(null);
  const [modalAmortDivida, setModalAmortDivida] = useState<Divida | null>(null);

  // Modal de quitação interativa
  const [quitacaoSugerida, setQuitacaoSugerida] = useState<{
    dividaId: string;
    dividaNome: string;
    isOpen: boolean;
  } | null>(null);

  const dividasAbertas = dividas.filter(d => d.status === 'aberta');
  const dividasQuitadas = dividas.filter(d => d.status === 'quitada');

  // Resumo do topo
  const totalSaldoAtivo = dividasAbertas.reduce((acc, d) => acc + d.saldoAtual, 0);

  // Soma total já amortizada (histórico completo de todas as dívidas)
  const totalGeralAmortizado = dividas.reduce((accDivida, d) => {
    const amortizadoNesta = d.historico
      .filter(h => h.tipo === 'amortizacao')
      .reduce((accH, h) => accH + h.valor, 0);
    return accDivida + amortizadoNesta;
  }, 0);

  const totalQuitadas = dividasQuitadas.length;

  const handleConfirmAmortizacao = (dados: {
    dividaId: string;
    data: string;
    valor: number;
    observacao?: string;
    operacaoVinculadaId?: string | null;
  }) => {
    const targetDivida = dividas.find(d => d.id === dados.dividaId);
    const res = lancarAmortizacao(dados);
    if (res.dividaQuitada && targetDivida) {
      setQuitacaoSugerida({
        dividaId: targetDivida.id,
        dividaNome: targetDivida.nome,
        isOpen: true
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Botão de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Controle de Dívidas & Estruturas Travadas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Abata dívidas e estruturas aos poucos utilizando prêmios obtidos nas suas operações de opções, sem misturar com as estatísticas de trades.
          </p>
        </div>

        <button
          onClick={() => setModalNovaDividaOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Dívida
        </button>
      </div>

      {/* 6. Resumo no topo da tela "Dívidas" */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Saldo Ativo */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 card-shadow flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Saldo Devedor Ativo
            </span>
            <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tracking-tight block mt-0.5">
              {formatCurrency(totalSaldoAtivo)}
            </span>
            <span className="text-[11px] text-slate-400">
              {dividasAbertas.length} {dividasAbertas.length === 1 ? 'dívida ativa' : 'dívidas ativas'}
            </span>
          </div>
        </div>

        {/* Total Amortizado Acumulado */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 card-shadow flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Já Amortizado
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight block mt-0.5">
              {formatCurrency(totalGeralAmortizado)}
            </span>
            <span className="text-[11px] text-slate-400">
              Histórico acumulado de abatimentos
            </span>
          </div>
        </div>

        {/* Dívidas Quitadas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 card-shadow flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Dívidas Quitadas
            </span>
            <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 tracking-tight block mt-0.5">
              {totalQuitadas}
            </span>
            <span className="text-[11px] text-slate-400">
              {totalQuitadas === 1 ? 'estrutura 100% quitada 🎉' : 'estruturas 100% quitadas 🎉'}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Dívidas Ativas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            Dívidas em Andamento ({dividasAbertas.length})
          </h3>
        </div>

        {dividasAbertas.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Nenhuma dívida ativa no momento
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Cadastre estruturas travadas, empréstimos ou posições para acompanhar o pagamento gradual através de prêmios de opções.
              </p>
            </div>
            <button
              onClick={() => setModalNovaDividaOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Cadastrar Primeira Dívida
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {dividasAbertas.map(divida => (
              <CardDivida
                key={divida.id}
                divida={divida}
                operacoesEncerradas={operacoesEncerradas}
                onLancarJuro={(d) => setModalJuroDivida(d)}
                onLancarAmortizacao={(d) => setModalAmortDivida(d)}
                onMarcarQuitada={(id, quitada) => alterarStatusDivida(id, quitada ? 'quitada' : 'aberta')}
                onEditarDivida={editarDivida}
                onExcluirDivida={excluirDivida}
                onEditarItemHistorico={editarLancamentoHistorico}
                onExcluirItemHistorico={excluirLancamentoHistorico}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lista de Dívidas Quitadas (Seção Separada no Fim da Lista) */}
      {dividasQuitadas.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Dívidas Quitadas ({dividasQuitadas.length})
            </h3>
          </div>

          <div className="space-y-4">
            {dividasQuitadas.map(divida => (
              <CardDivida
                key={divida.id}
                divida={divida}
                operacoesEncerradas={operacoesEncerradas}
                onLancarJuro={(d) => setModalJuroDivida(d)}
                onLancarAmortizacao={(d) => setModalAmortDivida(d)}
                onMarcarQuitada={(id, quitada) => alterarStatusDivida(id, quitada ? 'quitada' : 'aberta')}
                onEditarDivida={editarDivida}
                onExcluirDivida={excluirDivida}
                onEditarItemHistorico={editarLancamentoHistorico}
                onExcluirItemHistorico={excluirLancamentoHistorico}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modais */}
      <ModalNovaDivida
        isOpen={modalNovaDividaOpen}
        onClose={() => setModalNovaDividaOpen(false)}
        onConfirm={addDivida}
      />

      <ModalLancarJuro
        isOpen={!!modalJuroDivida}
        divida={modalJuroDivida}
        onClose={() => setModalJuroDivida(null)}
        onConfirm={lancarJuro}
      />

      <ModalLancarAmortizacao
        isOpen={!!modalAmortDivida}
        divida={modalAmortDivida}
        operacoesEncerradas={operacoesEncerradas}
        onClose={() => setModalAmortDivida(null)}
        onConfirm={handleConfirmAmortizacao}
      />

      {/* Modal de confirmação quando saldo chega a zero ou menos */}
      {quitacaoSugerida && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 shadow-2xl border border-emerald-300 dark:border-emerald-800 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Dívida Paga! 🎉
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                O saldo da dívida <strong>"{quitacaoSugerida.dividaNome}"</strong> chegou a zero (ou menos). Deseja marcar esta dívida como <strong>Quitada</strong> e movê-la para a seção de quitadas?
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuitacaoSugerida(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Manter Aberta
              </button>
              <button
                type="button"
                onClick={() => {
                  alterarStatusDivida(quitacaoSugerida.dividaId, 'quitada');
                  setQuitacaoSugerida(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Sim, Marcar como Quitada!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
