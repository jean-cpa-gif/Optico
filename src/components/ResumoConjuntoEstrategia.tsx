import React from 'react';
import { Layers, CheckCircle2, Clock, X, ArrowRight, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Operacao } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ResumoConjuntoEstrategiaProps {
  nomeEstrategia: string;
  pernas: Operacao[];
  onLimparFiltro?: () => void;
  className?: string;
}

export function ResumoConjuntoEstrategia({
  nomeEstrategia,
  pernas,
  onLimparFiltro,
  className = ''
}: ResumoConjuntoEstrategiaProps) {
  const pernasAbertas = pernas.filter(op => op.status === 'aberta');
  const pernasEncerradas = pernas.filter(op => op.status === 'encerrada');

  const saldoPremiosAbertas = pernasAbertas.reduce((acc, op) => acc + op.premioLiquidoAcumulado, 0);
  
  // Usar resultadoFinal integral para as pernas encerradas, independentemente de vínculos com dívidas.
  const resultadoRealizadoEncerradas = pernasEncerradas.reduce((acc, op) => acc + (op.resultadoFinal ?? 0), 0);

  // Só apresentar resultado final da estratégia quando todas estiverem encerradas.
  const todasEncerradas = pernas.length > 0 && pernasAbertas.length === 0;
  const resultadoFinalEstrategia = resultadoRealizadoEncerradas;

  return (
    <div className={`bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-900/60 p-4 sm:p-5 shadow-sm transition-all ${className}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-indigo-100 dark:border-slate-700/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                Resumo da Estratégia
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                "{nomeEstrategia}"
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {pernas.length} perna{pernas.length === 1 ? '' : 's'} no total ({pernasAbertas.length} aberta{pernasAbertas.length === 1 ? '' : 's'}, {pernasEncerradas.length} encerrada{pernasEncerradas.length === 1 ? '' : 's'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {todasEncerradas ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Estratégia Concluída
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Estratégia em Andamento
            </span>
          )}

          {onLimparFiltro && (
            <button
              onClick={onLimparFiltro}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Remover filtro e ver todas as operações"
            >
              <X className="w-3.5 h-3.5" />
              Limpar Filtro
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Card 1: Saldo de Prêmios (Pernas Abertas) */}
        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
            Saldo de Prêmios (Pernas Abertas)
          </p>
          <div className="flex items-baseline justify-between">
            <span className={`text-lg font-bold font-mono tracking-tight ${
              saldoPremiosAbertas >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(saldoPremiosAbertas)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {pernasAbertas.length} {pernasAbertas.length === 1 ? 'perna aberta' : 'pernas abertas'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Prêmios líquidos recebidos ou pagos das posições ainda ativas
          </p>
        </div>

        {/* Card 2: Resultado Realizado (Pernas Encerradas) */}
        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
            Resultado Realizado (Pernas Encerradas)
          </p>
          <div className="flex items-baseline justify-between">
            <span className={`text-lg font-bold font-mono tracking-tight ${
              resultadoRealizadoEncerradas >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(resultadoRealizadoEncerradas)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {pernasEncerradas.length} {pernasEncerradas.length === 1 ? 'perna encerrada' : 'pernas encerradas'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Resultado integral das pernas fechadas (sem deduções de vínculos)
          </p>
        </div>

        {/* Card 3: Resultado Final da Estratégia (SOMENTE se todas encerradas) */}
        {todasEncerradas ? (
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-lg border border-emerald-300 dark:border-emerald-800 shadow-xs sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] uppercase font-extrabold text-emerald-800 dark:text-emerald-300 tracking-wider mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resultado Final da Estratégia
            </p>
            <div className="flex items-baseline justify-between">
              <span className={`text-xl font-black font-mono tracking-tight ${
                resultadoFinalEstrategia >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatCurrency(resultadoFinalEstrategia)}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                100% Concluída
              </span>
            </div>
            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
              Soma total dos resultados realizados de todas as pernas
            </p>
          </div>
        ) : (
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-200/60 dark:border-slate-700/40 sm:col-span-2 lg:col-span-1 flex flex-col justify-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              Resultado Final da Estratégia
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
              O resultado final conjunto será consolidado assim que todas as pernas forem encerradas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
