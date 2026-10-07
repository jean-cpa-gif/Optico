import React, { useState } from 'react';
import { 
  Divida, 
  ItemHistoricoDivida, 
  Operacao 
} from '@/types';
import { 
  formatCurrency, 
  formatDate 
} from '@/lib/utils';
import { 
  Percent, 
  TrendingDown, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Link2, 
  Clock, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  Edit2
} from 'lucide-react';

interface CardDividaProps {
  divida: Divida;
  operacoesEncerradas: Operacao[];
  onLancarJuro: (divida: Divida) => void;
  onLancarAmortizacao: (divida: Divida) => void;
  onMarcarQuitada: (id: string, quitada: boolean) => void;
  onExcluirDivida: (id: string) => void;
  onExcluirItemHistorico: (dividaId: string, itemId: string) => void;
  onVerOperacaoVinculada?: (operacaoId: string) => void;
}

export function CardDivida({
  divida,
  operacoesEncerradas,
  onLancarJuro,
  onLancarAmortizacao,
  onMarcarQuitada,
  onExcluirDivida,
  onExcluirItemHistorico,
  onVerOperacaoVinculada
}: CardDividaProps) {
  const [expandido, setExpandido] = useState(false);
  const [estimativaAmortManual, setEstimativaAmortManual] = useState<string>('');
  const [mostrarAjusteProjecao, setMostrarAjusteProjecao] = useState(false);

  const totalAmortizado = Math.max(0, divida.saldoInicial - divida.saldoAtual);
  const progressoPercent = divida.saldoInicial > 0
    ? Math.min(100, Math.max(0, (totalAmortizado / divida.saldoInicial) * 100))
    : 100;

  // Cálculo da Projeção de Quitação:
  // 1. Pega os últimos até 3 lançamentos de amortização
  const amortizacoes = divida.historico
    .filter(h => h.tipo === 'amortizacao')
    .slice(-3);

  const mediaAmortizacao3 = amortizacoes.length > 0
    ? amortizacoes.reduce((acc, curr) => acc + curr.valor, 0) / amortizacoes.length
    : 0;

  const valorEstimadoUsuario = parseFloat(estimativaAmortManual.replace(',', '.'));
  const amortizacaoMensalBase = (!isNaN(valorEstimadoUsuario) && valorEstimadoUsuario > 0)
    ? valorEstimadoUsuario
    : mediaAmortizacao3;

  let projecaoTexto = 'Sem amortizações suficientes para calcular';
  let projecaoMeses: number | null = null;
  let dataEstimada: string | null = null;

  if (divida.status === 'quitada' || divida.saldoAtual <= 0) {
    projecaoTexto = 'Dívida já quitada 🎉';
  } else if (amortizacaoMensalBase > 0) {
    // Considerando taxa de juros aproximada ou abatimento puro
    // Se a amortização for menor ou igual ao juro mensal, nunca quita
    const juroEstimadoMensal = divida.saldoAtual * (divida.taxaJurosMensalPercent / 100);
    const amortizacaoLiquida = amortizacaoMensalBase - juroEstimadoMensal;

    if (amortizacaoLiquida <= 0) {
      projecaoTexto = 'Amortização menor que o juro mensal';
    } else {
      projecaoMeses = Math.ceil(divida.saldoAtual / amortizacaoLiquida);
      const dataAlvo = new Date();
      dataAlvo.setMonth(dataAlvo.getMonth() + projecaoMeses);
      
      const mesesNomes = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      dataEstimada = `${mesesNomes[dataAlvo.getMonth()]}/${dataAlvo.getFullYear()}`;
      projecaoTexto = `~${projecaoMeses} ${projecaoMeses === 1 ? 'mês' : 'meses'} (${dataEstimada})`;
    }
  }

  // Ordena histórico em ordem cronológica (ou invertida para ver mais recentes primeiro, ou cronológica crescente como timeline)
  const historicoOrdenado = [...divida.historico].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${
      divida.status === 'quitada'
        ? 'bg-slate-50/70 dark:bg-slate-900/60 border-emerald-300 dark:border-emerald-900/50 shadow-sm opacity-90'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 card-shadow'
    }`}>
      {/* Top Banner / Status */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {divida.nome}
              </h3>
              {divida.status === 'quitada' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Quitada 🎉
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Em Aberto
                </span>
              )}
            </div>
            {divida.descricao && (
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                {divida.descricao}
              </p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Início: {formatDate(divida.dataInicio)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-amber-500" />
                Taxa: <strong>{divida.taxaJurosMensalPercent}% a.m.</strong>
              </span>
            </div>
          </div>

          {/* Botões de Ação Principal */}
          {divida.status === 'aberta' && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onLancarJuro(divida)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Percent className="w-3.5 h-3.5" />
                Lançar Juro
              </button>
              <button
                onClick={() => onLancarAmortizacao(divida)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                Lançar Amortização
              </button>
            </div>
          )}
        </div>

        {/* Métricas Principais (Cards de Saldo) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Saldo Atual */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Saldo Atual
            </span>
            <span className={`text-xl sm:text-2xl font-bold font-mono tracking-tight block mt-0.5 ${
              divida.saldoAtual <= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(divida.saldoAtual)}
            </span>
          </div>

          {/* Saldo Inicial */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Saldo Inicial
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-slate-700 dark:text-slate-300 block mt-1">
              {formatCurrency(divida.saldoInicial)}
            </span>
          </div>

          {/* Já Amortizado */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Já Amortizado
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 block mt-1">
              {formatCurrency(totalAmortizado)}
            </span>
          </div>

          {/* % Quitado */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Progresso
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-blue-600 dark:text-blue-400 block mt-1">
              {progressoPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Barra de Progresso Visual */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Progresso de Quitação:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {progressoPercent.toFixed(1)}% ({formatCurrency(totalAmortizado)} de {formatCurrency(divida.saldoInicial)})
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                progressoPercent >= 100
                  ? 'bg-emerald-500'
                  : progressoPercent >= 50
                  ? 'bg-blue-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${progressoPercent}%` }}
            />
          </div>
        </div>

        {/* Projeção de Quitação */}
        <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-3.5 border border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-medium">Previsão de quitação: </span>
              <strong className="text-slate-800 dark:text-slate-100 font-bold ml-1">
                {projecaoTexto}
              </strong>
              {mediaAmortizacao3 > 0 && !estimativaAmortManual && (
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  (Baseado na média recente de {formatCurrency(mediaAmortizacao3)}/mês)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarAjusteProjecao(!mostrarAjusteProjecao)}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {mostrarAjusteProjecao ? 'Ocultar ajuste' : 'Simular valor mensal'}
            </button>
          </div>
        </div>

        {mostrarAjusteProjecao && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-3">
            <span className="text-slate-600 dark:text-slate-300">Amortização mensal estimada manual:</span>
            <div className="relative w-36">
              <span className="absolute left-2.5 top-1.5 text-[11px] text-slate-400 font-semibold">R$</span>
              <input
                type="number"
                step="0.01"
                placeholder={mediaAmortizacao3 > 0 ? mediaAmortizacao3.toFixed(2) : "0,00"}
                value={estimativaAmortManual}
                onChange={(e) => setEstimativaAmortManual(e.target.value)}
                className="w-full pl-8 pr-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {estimativaAmortManual && (
              <button
                onClick={() => setEstimativaAmortManual('')}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Botão de Expansão da Timeline */}
      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-5 py-3 flex items-center justify-between">
        <button
          onClick={() => setExpandido(!expandido)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>
            {expandido ? 'Ocultar Timeline de Lançamentos' : `Ver Histórico / Timeline (${divida.historico.length} ${divida.historico.length === 1 ? 'registro' : 'registros'})`}
          </span>
        </button>

        <div className="flex items-center gap-2">
          {divida.status === 'aberta' && (
            <button
              onClick={() => onMarcarQuitada(divida.id, true)}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
              title="Marcar como quitada manualmente"
            >
              Marcar Quitada
            </button>
          )}

          {divida.status === 'quitada' && (
            <button
              onClick={() => onMarcarQuitada(divida.id, false)}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              title="Reabrir dívida"
            >
              Reabrir Dívida
            </button>
          )}

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            onClick={() => {
              if (window.confirm(`Tem certeza que deseja excluir a dívida "${divida.nome}"?`)) {
                onExcluirDivida(divida.id);
              }
            }}
            className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded cursor-pointer"
            title="Excluir Dívida"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Seção Expandida: Timeline Completa */}
      {expandido && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-white dark:bg-slate-850">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Timeline de Lançamentos & Amortizações
          </h4>

          {historicoOrdenado.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Nenhum lançamento registrado nesta dívida ainda. Utilize os botões "Lançar Juro" ou "Lançar Amortização" acima.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {historicoOrdenado.map((item) => {
                const isJuro = item.tipo === 'juro';
                const isAmort = item.tipo === 'amortizacao';
                const isIncremento = item.tipo === 'incremento';

                // Procura operação vinculada se existir
                const opVinculada = item.operacaoVinculadaId
                  ? operacoesEncerradas.find(o => o.id === item.operacaoVinculadaId)
                  : null;

                return (
                  <div key={item.id} className="relative group">
                    {/* Marcador na linha do tempo */}
                    <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 bg-white dark:bg-slate-900 ${
                      isJuro
                        ? 'border-amber-500 text-amber-500'
                        : isAmort
                        ? 'border-emerald-500 text-emerald-500'
                        : isIncremento
                        ? 'border-rose-500 text-rose-500'
                        : 'border-blue-500 text-blue-500'
                    }`} />

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isJuro
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : isAmort
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : isIncremento
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                          }`}>
                            {isJuro ? 'Juro Mensal' : isAmort ? 'Amortização' : isIncremento ? 'Prejuízo / Incremento' : 'Ajuste'}
                          </span>
                          
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {formatDate(item.data)}
                          </span>

                          {item.observacao && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              • {item.observacao}
                            </span>
                          )}
                        </div>

                        {/* Operação de Origem Vinculada */}
                        {item.operacaoVinculadaId && (
                          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Origem: Operação de opção encerrada</span>
                            {opVinculada ? (
                              <span className="font-bold underline ml-1">
                                {opVinculada.ativo} ({opVinculada.tipoOpcao}) • Resultado {formatCurrency(opVinculada.resultadoFinal ?? 0)}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] ml-1">
                                (ID: {item.operacaoVinculadaId.slice(0, 8)}...)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-left sm:text-right">
                          <span className={`font-mono font-bold text-sm block ${
                            isJuro || isIncremento
                              ? (isIncremento ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400')
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {isJuro || isIncremento ? `+${formatCurrency(item.valor)}` : `-${formatCurrency(item.valor)}`}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Saldo: {formatCurrency(item.saldoResultante)}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            if (window.confirm('Excluir este lançamento e recalcular o saldo?')) {
                              onExcluirItemHistorico(divida.id, item.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity p-1 rounded cursor-pointer"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
