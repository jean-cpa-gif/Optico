import React, { useState } from 'react';
import { AlertTriangle, Link2, Unlink, Check, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Divida } from '@/types';

interface ModalAjustarVinculoAoEditarProps {
  isOpen: boolean;
  ativo: string;
  dividaNome: string;
  resultadoAnterior: number;
  novoResultado: number;
  valorVinculadoAtual: number; // com sinal
  onClose: () => void;
  onConfirmAjuste: (acao: 'ajustar_valor' | 'desvincular', novoValor?: number) => void;
}

export function ModalAjustarVinculoAoEditar({
  isOpen,
  ativo,
  dividaNome,
  resultadoAnterior,
  novoResultado,
  valorVinculadoAtual,
  onClose,
  onConfirmAjuste
}: ModalAjustarVinculoAoEditarProps) {
  if (!isOpen) return null;

  const isLucroNovo = novoResultado > 0;
  const isPrejuizoNovo = novoResultado < 0;
  const isLucroVinculado = valorVinculadoAtual > 0;

  // Pode ajustar o valor se o sinal do novo resultado for compatível com o tipo de vínculo
  const mesmoSinal = (isLucroVinculado && isLucroNovo) || (!isLucroVinculado && isPrejuizoNovo);
  const valorMaximoAjustavel = Math.abs(novoResultado);

  const [valorAjustado, setValorAjustado] = useState(valorMaximoAjustavel.toFixed(2));
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<'ajustar' | 'desvincular'>(
    mesmoSinal ? 'ajustar' : 'desvincular'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (opcaoSelecionada === 'desvincular' || !mesmoSinal) {
      onConfirmAjuste('desvincular');
    } else {
      const parsedVal = parseFloat(valorAjustado.replace(',', '.')) || 0;
      const valorFinal = Math.min(valorMaximoAjustavel, Math.max(0.01, parsedVal));
      onConfirmAjuste('ajustar_valor', valorFinal);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl border border-amber-300 dark:border-amber-800/60 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-sm font-bold">
              Ajustar Vínculo com a Dívida
            </h3>
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
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
            <p>
              A edição da operação <strong>{ativo}</strong> alterou seu resultado final de{' '}
              <strong className={resultadoAnterior >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {formatCurrency(resultadoAnterior)}
              </strong>{' '}
              para{' '}
              <strong className={novoResultado >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {formatCurrency(novoResultado)}
              </strong>.
            </p>
            <p className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
              Dívida vinculada: <strong>{dividaNome}</strong> (valor original vinculado:{' '}
              <strong>{formatCurrency(Math.abs(valorVinculadoAtual))}</strong>)
            </p>
            <p>
              O novo resultado não é suficiente para cobrir o valor anteriormente vinculado. Selecione como deseja atualizar o vínculo:
            </p>
          </div>

          <div className="space-y-2.5">
            {mesmoSinal && (
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  opcaoSelecionada === 'ajustar'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="opcao_ajuste"
                  value="ajustar"
                  checked={opcaoSelecionada === 'ajustar'}
                  onChange={() => setOpcaoSelecionada('ajustar')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 text-xs space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">
                    Ajustar o valor vinculado na dívida
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                    Reduz o lançamento na dívida para o novo resultado disponível.
                  </span>
                  {opcaoSelecionada === 'ajustar' && (
                    <div className="pt-1.5 flex items-center gap-2">
                      <span className="text-slate-500 text-[11px]">Novo valor: R$</span>
                      <input
                        type="number"
                        step="0.01"
                        max={valorMaximoAjustavel}
                        min="0.01"
                        value={valorAjustado}
                        onChange={(e) => setValorAjustado(e.target.value)}
                        className="w-28 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-400">(máx: {formatCurrency(valorMaximoAjustavel)})</span>
                    </div>
                  )}
                </div>
              </label>
            )}

            <label 
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                opcaoSelecionada === 'desvincular'
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <input
                type="radio"
                name="opcao_ajuste"
                value="desvincular"
                checked={opcaoSelecionada === 'desvincular'}
                onChange={() => setOpcaoSelecionada('desvincular')}
                className="mt-0.5 text-rose-600 focus:ring-rose-500"
              />
              <div className="flex-1 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-100 block">
                  Desvincular totalmente da dívida
                </span>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-0.5">
                  Remove o lançamento da dívida e recalcula seu saldo. O resultado desta operação ({formatCurrency(novoResultado)}) será contado normalmente no Dashboard de opções.
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Cancelar Edição
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Confirmar e Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
