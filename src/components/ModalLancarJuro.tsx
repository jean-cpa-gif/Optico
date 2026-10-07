import React, { useState } from 'react';
import { X, Percent, Calendar, AlertCircle } from 'lucide-react';
import { Divida } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ModalLancarJuroProps {
  isOpen: boolean;
  divida: Divida | null;
  onClose: () => void;
  onConfirm: (dados: {
    dividaId: string;
    data: string;
    valor: number;
    observacao?: string;
  }) => void;
}

export function ModalLancarJuro({ isOpen, divida, onClose, onConfirm }: ModalLancarJuroProps) {
  if (!isOpen || !divida) return null;

  const juroCalculado = Math.round((divida.saldoAtual * (divida.taxaJurosMensalPercent / 100)) * 100) / 100;

  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [valor, setValor] = useState(juroCalculado.toFixed(2));
  const [observacao, setObservacao] = useState(`Juro do mês (${divida.taxaJurosMensalPercent}% a.m.)`);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const valorNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      setErro('Informe um valor de juro válido maior que zero.');
      return;
    }

    onConfirm({
      dividaId: divida.id,
      data,
      valor: valorNum,
      observacao: observacao.trim()
    });

    onClose();
  };

  const valorDigitadoNum = parseFloat(valor.replace(',', '.')) || 0;
  const novoSaldoEstimado = divida.saldoAtual + valorDigitadoNum;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Lançar Juro do Mês
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {divida.nome}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {erro && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Saldo atual da dívida:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatCurrency(divida.saldoAtual)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Taxa cadastrada:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {divida.taxaJurosMensalPercent}% a.m.
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Juro calculado automaticamente:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrency(juroCalculado)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Valor do Juro a Lançar (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Você pode ajustar o valor se o custo real do mês tiver sido diferente.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data do Lançamento *
            </label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observação
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Ex: Juro do mês (Selic / CDI)"
            />
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex justify-between items-center">
            <span>Saldo resultante após este juro:</span>
            <span className="font-bold font-mono text-xs">{formatCurrency(novoSaldoEstimado)}</span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Confirmar Juro (+{formatCurrency(valorDigitadoNum)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
