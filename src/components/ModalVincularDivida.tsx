import React, { useState } from 'react';
import { X, TrendingDown, TrendingUp, AlertTriangle, Link2, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Operacao, Divida } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ModalVincularDividaProps {
  isOpen: boolean;
  op: Operacao;
  dataEncerramento: string;
  precoEncerramento: number;
  resultadoProjetado: number;
  dividasAtivas: Divida[];
  onClose: () => void;
  onConfirm: (params: {
    precoEncerramento: number;
    dataEncerramento: string;
    // se vinculou lucro a dívida existente
    tipoVinculo: 'amortizar_existente' | 'somar_existente' | 'criar_nova';
    dividaId?: string;
    valorVinculado: number; // valor positivo
    // para criação de nova dívida
    novaDivida?: {
      nome: string;
      taxaJurosMensalPercent: number;
    };
  }) => void;
}

export function ModalVincularDivida({
  isOpen,
  op,
  dataEncerramento,
  precoEncerramento,
  resultadoProjetado,
  dividasAtivas,
  onClose,
  onConfirm
}: ModalVincularDividaProps) {
  if (!isOpen) return null;

  const isLucro = resultadoProjetado >= 0;
  const valorTotalAbs = Math.abs(resultadoProjetado);

  // Estado do valor vinculado (pré-preenchido com o total)
  const [valorVinculadoStr, setValorVinculadoStr] = useState<string>(valorTotalAbs.toFixed(2));
  
  // Caso A (Lucro): dívida selecionada
  const [selectedDividaId, setSelectedDividaId] = useState<string>(
    dividasAtivas.length > 0 ? dividasAtivas[0].id : ''
  );

  // Caso B (Prejuízo): toggle entre somar a existente ou criar nova
  const [abaPrejuizo, setAbaPrejuizo] = useState<'somar' | 'criar'>(
    dividasAtivas.length > 0 ? 'somar' : 'criar'
  );

  // Caso B - Criar nova dívida
  const [novoNome, setNovoNome] = useState(`Prejuízo ${op.ativo}`);
  const [novaTaxa, setNovaTaxa] = useState('0');

  const [erro, setErro] = useState<string | null>(null);

  const valorDigitado = parseFloat(valorVinculadoStr.replace(',', '.')) || 0;
  const sobraResultado = Math.max(0, valorTotalAbs - valorDigitado);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (valorDigitado <= 0) {
      setErro('O valor a vincular deve ser maior que zero.');
      return;
    }

    if (valorDigitado > valorTotalAbs) {
      setErro(`O valor a vincular não pode ser maior que o resultado da operação (${formatCurrency(valorTotalAbs)}).`);
      return;
    }

    if (isLucro) {
      if (!selectedDividaId) {
        setErro('Por favor, selecione uma dívida ativa para amortizar.');
        return;
      }

      onConfirm({
        precoEncerramento,
        dataEncerramento,
        tipoVinculo: 'amortizar_existente',
        dividaId: selectedDividaId,
        valorVinculado: valorDigitado
      });
    } else {
      // Prejuízo
      if (abaPrejuizo === 'somar') {
        if (!selectedDividaId) {
          setErro('Por favor, selecione uma dívida ativa para somar o prejuízo.');
          return;
        }

        onConfirm({
          precoEncerramento,
          dataEncerramento,
          tipoVinculo: 'somar_existente',
          dividaId: selectedDividaId,
          valorVinculado: valorDigitado
        });
      } else {
        // Criar nova
        if (!novoNome.trim()) {
          setErro('Informe um nome para a nova dívida.');
          return;
        }

        const taxaNum = parseFloat(novaTaxa.replace(',', '.')) || 0;
        if (taxaNum < 0) {
          setErro('A taxa de juros deve ser 0 ou positiva.');
          return;
        }

        onConfirm({
          precoEncerramento,
          dataEncerramento,
          tipoVinculo: 'criar_nova',
          valorVinculado: valorDigitado,
          novaDivida: {
            nome: novoNome.trim(),
            taxaJurosMensalPercent: taxaNum
          }
        });
      }
    }
  };

  const dividaSelecionadaObj = dividasAtivas.find(d => d.id === selectedDividaId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com estilo adaptado */}
        <div className={`p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${
          isLucro ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'bg-rose-50/60 dark:bg-rose-950/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm ${
              isLucro ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              {isLucro ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {isLucro ? 'Amortizar uma dívida existente' : 'Registrar este prejuízo como dívida'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Operação: <strong className="text-slate-700 dark:text-slate-300 font-mono">{op.ativo}</strong> ({op.tipoOpcao})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Card com resultado da operação */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            isLucro
              ? 'bg-emerald-50/40 border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-900/50'
              : 'bg-rose-50/40 border-rose-200/80 dark:bg-rose-950/30 dark:border-rose-900/50'
          }`}>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Resultado desta operação:
            </span>
            <span className={`text-base font-bold font-mono ${
              isLucro ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(resultadoProjetado)} ({isLucro ? 'lucro' : 'prejuízo'})
            </span>
          </div>

          {erro && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* CASO A: Lucro */}
          {isLucro && (
            <div className="space-y-3">
              {dividasAtivas.length === 0 ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-bold mb-1">Nenhuma dívida ativa cadastrada no momento.</p>
                  <p>Lucro de opções só pode ser usado para abater dívidas já existentes. Cadastre primeiro a dívida no menu lateral <strong>"Dívidas"</strong>, ou encerre a operação normalmente.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Selecione a Dívida a Amortizar *
                    </label>
                    <select
                      value={selectedDividaId}
                      onChange={(e) => setSelectedDividaId(e.target.value)}
                      className="w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {dividasAtivas.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.nome} (Saldo Atual: {formatCurrency(d.saldoAtual)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Valor a Vincular / Amortizar (R$) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setValorVinculadoStr(valorTotalAbs.toFixed(2))}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                      >
                        Vincular 100% ({formatCurrency(valorTotalAbs)})
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={valorTotalAbs}
                        required
                        value={valorVinculadoStr}
                        onChange={(e) => setValorVinculadoStr(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CASO B: Prejuízo */}
          {!isLucro && (
            <div className="space-y-3">
              {/* Abas / Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setAbaPrejuizo('somar')}
                  disabled={dividasAtivas.length === 0}
                  className={`flex-1 py-1.5 font-bold rounded-md transition-colors cursor-pointer ${
                    abaPrejuizo === 'somar'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  Somar a dívida existente {dividasAtivas.length === 0 && '(nenhuma)'}
                </button>
                <button
                  type="button"
                  onClick={() => setAbaPrejuizo('criar')}
                  className={`flex-1 py-1.5 font-bold rounded-md transition-colors cursor-pointer ${
                    abaPrejuizo === 'criar'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Criar nova dívida
                </button>
              </div>

              {abaPrejuizo === 'somar' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Selecione a Dívida que Receberá o Prejuízo *
                    </label>
                    <select
                      value={selectedDividaId}
                      onChange={(e) => setSelectedDividaId(e.target.value)}
                      className="w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {dividasAtivas.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.nome} (Saldo Atual: {formatCurrency(d.saldoAtual)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Valor do Prejuízo a Adicionar à Dívida (R$) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setValorVinculadoStr(valorTotalAbs.toFixed(2))}
                        className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                      >
                        Vincular 100% ({formatCurrency(valorTotalAbs)})
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={valorTotalAbs}
                        required
                        value={valorVinculadoStr}
                        onChange={(e) => setValorVinculadoStr(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Aba: Criar nova dívida */
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome da Nova Dívida *
                    </label>
                    <input
                      type="text"
                      required
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      placeholder="Ex: Prejuízo BEEF3 V401"
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Valor do Prejuízo (R$) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-semibold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={valorTotalAbs}
                          required
                          value={valorVinculadoStr}
                          onChange={(e) => setValorVinculadoStr(e.target.value)}
                          className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Taxa de Juros (% a.m.)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={novaTaxa}
                          onChange={(e) => setNovaTaxa(e.target.value)}
                          className="w-full pl-2.5 pr-7 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Texto dinâmico de conferência (Sobra / Parcial) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>Redirecionado para a dívida:</span>
              <strong className="font-mono text-slate-900 dark:text-white">
                {formatCurrency(valorDigitado)}
              </strong>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
              <span>Resultado normal de opções:</span>
              <strong className={`font-mono ${sobraResultado > 0 ? (isLucro ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400') : 'text-slate-500'}`}>
                {isLucro ? formatCurrency(sobraResultado) : formatCurrency(-sobraResultado)}
              </strong>
            </div>

            <p className="text-[11px] text-slate-400 pt-0.5">
              {sobraResultado > 0
                ? `${formatCurrency(sobraResultado)} será contado como resultado normal de opções.`
                : '100% do resultado será transferido para o módulo de dívidas (R$ 0,00 contará nas opções).'}
            </p>
          </div>

          {/* Footer Actions */}
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
              disabled={isLucro && dividasAtivas.length === 0}
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                isLucro
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isLucro ? (
                `Confirmar amortização de ${formatCurrency(valorDigitado)} em ${dividaSelecionadaObj?.nome || 'dívida'}`
              ) : abaPrejuizo === 'somar' ? (
                `Confirmar registro de ${formatCurrency(valorDigitado)} em ${dividaSelecionadaObj?.nome || 'dívida'}`
              ) : (
                `Confirmar registro de ${formatCurrency(valorDigitado)} como nova dívida`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
