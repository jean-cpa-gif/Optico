import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, AlertCircle, Edit2, Info } from 'lucide-react';
import { ItemHistoricoDivida } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ModalEditarLancamentoProps {
  isOpen: boolean;
  dividaNome: string;
  item: ItemHistoricoDivida | null;
  onClose: () => void;
  onConfirm: (itemId: string, dados: {
    data: string;
    valor: number;
    tipo: ItemHistoricoDivida['tipo'];
    observacao?: string;
  }) => void;
}

export function ModalEditarLancamento({
  isOpen,
  dividaNome,
  item,
  onClose,
  onConfirm
}: ModalEditarLancamentoProps) {
  const [data, setData] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<ItemHistoricoDivida['tipo']>('amortizacao');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setData(item.data);
      setValor(item.valor.toString());
      setTipo(item.tipo);
      setObservacao(item.observacao || '');
      setErro(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const valorNum = parseFloat(valor.replace(',', '.'));

    if (isNaN(valorNum) || valorNum <= 0) {
      setErro('O valor do lançamento deve ser maior que zero.');
      return;
    }

    if (!data) {
      setErro('Informe uma data válida.');
      return;
    }

    onConfirm(item.id, {
      data,
      valor: valorNum,
      tipo,
      observacao: observacao.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Editar Lançamento
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dívida: {dividaNome}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {erro && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tipo do Lançamento *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as ItemHistoricoDivida['tipo'])}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="amortizacao">Amortização (abate do saldo)</option>
              <option value="juro">Juro Mensal (soma ao saldo)</option>
              <option value="incremento">Incremento / Prejuízo (soma ao saldo)</option>
              <option value="ajusteManual">Ajuste Manual</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Lançamento *
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observação / Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Prêmio líquido de opção, Selic do mês..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-blue-500" />
            <span>
              Ao salvar, todos os saldos posteriores da dívida serão recalculados automaticamente em cadeia.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
