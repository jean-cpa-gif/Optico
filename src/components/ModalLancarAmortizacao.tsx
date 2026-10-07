import React, { useState } from 'react';
import { X, TrendingDown, Link2, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Divida, Operacao } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ModalLancarAmortizacaoProps {
  isOpen: boolean;
  divida: Divida | null;
  operacoesEncerradas: Operacao[];
  onClose: () => void;
  onConfirm: (dados: {
    dividaId: string;
    data: string;
    valor: number;
    observacao?: string;
    operacaoVinculadaId?: string | null;
  }) => void;
}

export function ModalLancarAmortizacao({
  isOpen,
  divida,
  operacoesEncerradas,
  onClose,
  onConfirm
}: ModalLancarAmortizacaoProps) {
  if (!isOpen || !divida) return null;

  const [modo, setModo] = useState<'manual' | 'vinculada'>('manual');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [selectedOpId, setSelectedOpId] = useState<string>('');
  const [termoBuscaOp, setTermoBuscaOp] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  // Filtra operações encerradas para o dropdown/busca
  const opsFiltradas = operacoesEncerradas.filter(op => {
    if (!termoBuscaOp.trim()) return true;
    const term = termoBuscaOp.toUpperCase();
    return op.ativo.toUpperCase().includes(term) || (op.dataEncerramento && op.dataEncerramento.includes(term));
  });

  const handleSelectOperacao = (opId: string) => {
    setSelectedOpId(opId);
    const op = operacoesEncerradas.find(o => o.id === opId);
    if (op) {
      // Puxa o resultado final da operação
      const resVal = Math.max(0, op.resultadoFinal ?? 0);
      setValor(resVal > 0 ? resVal.toFixed(2) : (op.resultadoFinal ?? 0).toFixed(2));
      setObservacao(`Prêmio líquido da operação ${op.ativo} (${op.tipoOpcao})`);
      if (op.dataEncerramento) {
        setData(op.dataEncerramento);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const valorNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      setErro('Informe um valor de amortização válido maior que zero.');
      return;
    }

    onConfirm({
      dividaId: divida.id,
      data,
      valor: valorNum,
      observacao: observacao.trim() || (modo === 'vinculada' ? 'Amortização vinculada a opções' : 'Amortização avulsa'),
      operacaoVinculadaId: modo === 'vinculada' && selectedOpId ? selectedOpId : null
    });

    onClose();
  };

  const valorDigitadoNum = parseFloat(valor.replace(',', '.')) || 0;
  const saldoAposAmortizacao = Math.max(0, divida.saldoAtual - valorDigitadoNum);
  const vaiQuitar = (divida.saldoAtual - valorDigitadoNum) <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Lançar Amortização
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {divida.nome} • Saldo atual: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(divida.saldoAtual)}</strong>
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

        {/* Abas: Manual vs Vinculada a Operação */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-3 bg-slate-50/40 dark:bg-slate-850">
          <button
            type="button"
            onClick={() => setModo('manual')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              modo === 'manual'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Amortização Manual
          </button>
          <button
            type="button"
            onClick={() => setModo('vinculada')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              modo === 'vinculada'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Vincular a Operação Encerrada
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
              {operacoesEncerradas.length}
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {erro && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {modo === 'vinculada' && (
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Selecione a Operação Encerrada:
              </label>
              
              {operacoesEncerradas.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 py-2">
                  Nenhuma operação de opção encerrada cadastrada ainda no app. Você pode lançar de forma manual.
                </p>
              ) : (
                <>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Buscar por ativo ou data..."
                      value={termoBuscaOp}
                      onChange={(e) => setTermoBuscaOp(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {opsFiltradas.map((op) => {
                      const isSelected = selectedOpId === op.id;
                      const resVal = op.resultadoFinal ?? 0;
                      return (
                        <div
                          key={op.id}
                          onClick={() => handleSelectOperacao(op.id)}
                          className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-500/40'
                              : 'hover:bg-slate-200/50 dark:hover:bg-slate-750'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white uppercase">{op.ativo}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                                {op.tipoOpcao}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Encerrada em {formatDate(op.dataEncerramento || '')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {op.quantidadeAtual} contratos • Strike R$ {op.strikeAtual.toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className={`font-mono font-bold text-xs ${
                              resVal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {formatCurrency(resVal)}
                            </span>
                            <div className="text-[10px] text-slate-400">Resultado Líquido</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor a Amortizar (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {modo === 'vinculada' ? 'Valor puxado da operação (ajustável livremente se abater só parte).' : 'Digite o valor livremente.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Pagamento / Amortização *
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observação <span className="font-normal text-slate-400">(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Prêmio líquido da venda de BEEF3, Aporte extra..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Prévia do Resultado */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>Saldo restante após este abatimento:</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {formatCurrency(saldoAposAmortizacao)}
              </span>
            </div>
            {vaiQuitar && (
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-bold pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Esta amortização quita totalmente a dívida! 🎉</span>
              </div>
            )}
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
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Amortização (-{formatCurrency(valorDigitadoNum)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
