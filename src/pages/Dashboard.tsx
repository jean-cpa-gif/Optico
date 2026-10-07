import React, { useState } from 'react';
import { useOperations } from '@/store/OperationsContext';
import { useDividas } from '@/store/DividasContext';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '@/components/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import VencimentoAlerta from '@/components/VencimentoAlerta';
import { TrendingUp, TrendingDown, Wallet, Scale, ChevronDown, ChevronUp, Layers, CheckCircle2, ArrowRight, Search, X, RotateCcw } from 'lucide-react';

export default function Dashboard() {
  const { operacoes } = useOperations();
  const { dividas } = useDividas();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Estados para expansão dos 3 cards de topo
  const [expandedCard, setExpandedCard] = useState<'opcoes' | 'dividas' | 'liquido' | null>(null);

  // Estados da busca e filtros de análise por ativo no gráfico
  const [inputBuscaAtivo, setInputBuscaAtivo] = useState('');
  const [termoBuscaAtivo, setTermoBuscaAtivo] = useState('');
  const [filtroTipoOpcao, setFiltroTipoOpcao] = useState<'todos' | 'PUT' | 'CALL'>('todos');
  const [filtroDirecao, setFiltroDirecao] = useState<'todas' | 'V' | 'C'>('todas');
  const [historicoBuscas, setHistoricoBuscas] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dashboard-busca-ativos-historico');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 10);
      }
    } catch (e) {
      console.error('Erro ao ler histórico de busca', e);
    }
    return [];
  });

  const abertas = operacoes.filter(op => op.status === 'aberta');
  const encerradas = operacoes.filter(op => op.status === 'encerrada');

  // Regra de não-duplicação (Item 3 do requisito):
  // Usar valorContadoComoResultadoOpcoes exclusivamente na composição dos cards do Dashboard.
  // Atenção: zero é um valor válido; utilizar valorContadoComoResultadoOpcoes ?? resultadoFinal, não ||.
  const getValorConsiderado = (op: typeof operacoes[0]) => {
    return (op.valorContadoComoResultadoOpcoes ?? op.resultadoFinal) ?? 0;
  };

  // 1. "Resultado das Opções" — soma de valorConsiderado de todas as operações encerradas
  const resultadoOpcoesLimpo = encerradas.reduce((acc, op) => acc + getValorConsiderado(op), 0);

  // Total de lucro/prejuízo transferido/vinculado para dívidas
  const totalAmortizadoEmDividas = encerradas.reduce((acc, op) => {
    if (op.valorVinculadoDivida && op.valorVinculadoDivida > 0) {
      return acc + op.valorVinculadoDivida;
    }
    return acc;
  }, 0);

  const totalPrejuizoEmDividas = encerradas.reduce((acc, op) => {
    if (op.valorVinculadoDivida && op.valorVinculadoDivida < 0) {
      return acc + Math.abs(op.valorVinculadoDivida);
    }
    return acc;
  }, 0);

  // 2. "Dívida em Aberto" — soma do saldoAtual de todas as dívidas com status: "aberta"
  const dividasAbertas = dividas.filter(d => d.status === 'aberta');
  const dividaEmAberto = dividasAbertas.reduce((acc, d) => acc + d.saldoAtual, 0);

  // 3. "Resultado Líquido Total" — Resultado das Opções - Dívida em Aberto
  const resultadoLiquidoTotal = resultadoOpcoesLimpo - dividaEmAberto;

  // ESTATÍSTICAS DE DESEMPENHO REAL DAS OPERAÇÕES:
  // "Nas estatísticas de desempenho das operações — lucro/prejuízo acumulado, taxa de acerto, médias de ganhos e perdas
  // e gráficos de desempenho, quando existentes — usar sempre resultadoFinal, independentemente de vínculo com dívida."
  const resultadoRealTotal = encerradas.reduce((acc, op) => acc + (op.resultadoFinal ?? 0), 0);
  const operacoesGanhadoras = encerradas.filter(op => (op.resultadoFinal ?? 0) > 0);
  const operacoesPerdedoras = encerradas.filter(op => (op.resultadoFinal ?? 0) < 0);
  const ganhadoras = operacoesGanhadoras.length;
  const perdedoras = operacoesPerdedoras.length;
  const taxaAcerto = encerradas.length > 0 ? (ganhadoras / encerradas.length) * 100 : 0;

  const somaGanhos = operacoesGanhadoras.reduce((acc, op) => acc + (op.resultadoFinal ?? 0), 0);
  const somaPerdas = operacoesPerdedoras.reduce((acc, op) => acc + (op.resultadoFinal ?? 0), 0);
  const mediaGanho = ganhadoras > 0 ? somaGanhos / ganhadoras : 0;
  const mediaPerda = perdedoras > 0 ? somaPerdas / perdedoras : 0;

  // Gráficos de Desempenho usando resultadoFinal integral
  const resultPorMes = encerradas.reduce((acc, op) => {
    if (!op.dataEncerramento) return acc;
    const mes = op.dataEncerramento.substring(0, 7); // YYYY-MM
    acc[mes] = (acc[mes] || 0) + (op.resultadoFinal ?? 0);
    return acc;
  }, {} as Record<string, number>);

  const dataGraficoMes = Object.entries(resultPorMes)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, valor]): { mes: string; valor: number } => ({ mes, valor: valor as number }));

  // Funções para controle da busca e histórico
  const dispararBusca = (termo: string) => {
    const termoLimpo = termo.trim();
    setTermoBuscaAtivo(termoLimpo);
    setInputBuscaAtivo(termoLimpo);

    if (termoLimpo) {
      setHistoricoBuscas(prev => {
        const normalizado = termoLimpo.toUpperCase();
        const filtrado = prev.filter(item => item.toUpperCase() !== normalizado);
        const novo = [termoLimpo.toUpperCase(), ...filtrado].slice(0, 10);
        try {
          localStorage.setItem('dashboard-busca-ativos-historico', JSON.stringify(novo));
        } catch (e) {}
        return novo;
      });
    }
  };

  const excluirSugestao = (e: React.MouseEvent, itemParaExcluir: string) => {
    e.stopPropagation();
    setHistoricoBuscas(prev => {
      const novo = prev.filter(item => item.toUpperCase() !== itemParaExcluir.toUpperCase());
      try {
        localStorage.setItem('dashboard-busca-ativos-historico', JSON.stringify(novo));
      } catch (e) {}
      return novo;
    });
  };

  const limparHistorico = () => {
    setHistoricoBuscas([]);
    try {
      localStorage.removeItem('dashboard-busca-ativos-historico');
    } catch (e) {}
  };

  const limparFiltrosBusca = () => {
    setTermoBuscaAtivo('');
    setInputBuscaAtivo('');
    setFiltroTipoOpcao('todos');
    setFiltroDirecao('todas');
  };

  // Operações filtradas na área do gráfico de Desempenho por Ativo:
  // Usa o nome da opção op.ativo com busca case-insensitive e filtros combináveis de PUT/CALL e Compra/Venda
  const operacoesGraficoAtivo = encerradas.filter(op => {
    if (termoBuscaAtivo) {
      if (!op.ativo.toLowerCase().includes(termoBuscaAtivo.toLowerCase())) {
        return false;
      }
    }
    if (filtroTipoOpcao !== 'todos') {
      if (op.tipoOpcao !== filtroTipoOpcao) return false;
    }
    if (filtroDirecao !== 'todas') {
      if (op.direcaoInicial !== filtroDirecao) return false;
    }
    return true;
  });

  const resultadoSomadoBusca = operacoesGraficoAtivo.reduce((acc, op) => acc + (op.resultadoFinal ?? 0), 0);
  const qtdOperacoesBusca = operacoesGraficoAtivo.length;

  const resultPorAtivo = operacoesGraficoAtivo.reduce((acc, op) => {
    acc[op.ativo] = (acc[op.ativo] || 0) + (op.resultadoFinal ?? 0);
    return acc;
  }, {} as Record<string, number>);

  const dataGraficoAtivo = Object.entries(resultPorAtivo)
    .sort((a, b) => (b[1] as number) - (a[1] as number)) // sort by profit
    .map(([name, value]): { name: string; value: number } => ({ name, value: value as number }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899', '#ef4444'];
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';

  const toggleExpand = (card: 'opcoes' | 'dividas' | 'liquido') => {
    setExpandedCard(prev => prev === card ? null : card);
  };

  return (
    <div className="space-y-6">
      <VencimentoAlerta onBannerClick={() => navigate('/abertas', { state: { sortByExpiry: true } })} />

      {/* 4. Dashboard com três indicadores de topo (responsivos, com detalhamento expansível) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Resultado das Opções */}
        <div 
          onClick={() => toggleExpand('opcoes')}
          className={`bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border card-shadow cursor-pointer transition-all duration-150 hover:border-slate-400 dark:hover:border-slate-600 ${
            expandedCard === 'opcoes' ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Resultado das Opções
                </span>
                <span className={`text-2xl font-bold font-mono tracking-tight block mt-0.5 ${
                  resultadoOpcoesLimpo >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'
                }`}>
                  {formatCurrency(resultadoOpcoesLimpo)}
                </span>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
              {expandedCard === 'opcoes' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            Resultado limpo (não contabiliza lucros redirecionados a dívidas).
          </p>

          {expandedCard === 'opcoes' && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80 space-y-2 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in">
              <div className="flex justify-between">
                <span>Total de operações encerradas:</span>
                <span className="font-bold">{encerradas.length}</span>
              </div>
              {totalAmortizadoEmDividas > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Usado para amortizar dívidas:</span>
                  <span className="font-mono font-bold">+{formatCurrency(totalAmortizadoEmDividas)}</span>
                </div>
              )}
              {totalPrejuizoEmDividas > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
                  <span>Prejuízos transformados em dívidas:</span>
                  <span className="font-mono font-bold">-{formatCurrency(totalPrejuizoEmDividas)}</span>
                </div>
              )}
              <p className="text-[10px] text-slate-400 italic pt-1">
                {totalAmortizadoEmDividas > 0
                  ? `${formatCurrency(totalAmortizadoEmDividas)} já foi usado para amortizar dívidas e não está contabilizado aqui para evitar duplicidade.`
                  : 'Nenhum lucro de opção foi redirecionado a dívidas até o momento.'}
              </p>
            </div>
          )}
        </div>

        {/* Card 2: Dívida em Aberto */}
        <div 
          onClick={() => toggleExpand('dividas')}
          className={`bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border card-shadow cursor-pointer transition-all duration-150 hover:border-slate-400 dark:hover:border-slate-600 ${
            expandedCard === 'dividas' ? 'ring-2 ring-rose-500 border-rose-500' : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Dívida em Aberto
                </span>
                <span className="text-2xl font-bold font-mono tracking-tight block mt-0.5 text-rose-600 dark:text-rose-400">
                  {formatCurrency(dividaEmAberto)}
                </span>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
              {expandedCard === 'dividas' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            Passivo atual de estruturas travadas e dívidas em aberto.
          </p>

          {expandedCard === 'dividas' && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80 space-y-2 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in">
              <div className="flex justify-between">
                <span>Dívidas ativas em aberto:</span>
                <span className="font-bold">{dividasAbertas.length}</span>
              </div>
              {dividasAbertas.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                  {dividasAbertas.map(d => (
                    <div key={d.id} className="flex justify-between items-center text-[11px] bg-slate-50 dark:bg-slate-750 p-1.5 rounded">
                      <span className="truncate max-w-[180px] font-medium">{d.nome}</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatCurrency(d.saldoAtual)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Você não possui nenhuma dívida ativa! 🎉</p>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/dividas');
                }}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 pt-1"
              >
                Gerenciar Dívidas <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Card 3: Resultado Líquido Total */}
        <div 
          onClick={() => toggleExpand('liquido')}
          className={`bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border card-shadow cursor-pointer transition-all duration-150 hover:border-slate-400 dark:hover:border-slate-600 ${
            expandedCard === 'liquido' ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                resultadoLiquidoTotal >= 0 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              }`}>
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Resultado Líquido Total
                </span>
                <span className={`text-2xl font-bold font-mono tracking-tight block mt-0.5 ${
                  resultadoLiquidoTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {formatCurrency(resultadoLiquidoTotal)}
                </span>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
              {expandedCard === 'liquido' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            Resultado real descontando todas as dívidas que ainda restam pagar.
          </p>

          {expandedCard === 'liquido' && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in">
              <div className="flex justify-between">
                <span>(+) Resultado das Opções:</span>
                <span className="font-mono font-bold">{formatCurrency(resultadoOpcoesLimpo)}</span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>(-) Dívida em Aberto:</span>
                <span className="font-mono font-bold">-{formatCurrency(dividaEmAberto)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-bold">
                <span>(=) Saldo Líquido Real:</span>
                <span className={`font-mono ${resultadoLiquidoTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrency(resultadoLiquidoTotal)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estatísticas de Desempenho Real das Operações */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-md card-shadow border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Desempenho Integral (Trades)</div>
          <div className={`text-lg sm:text-xl font-bold font-mono ${resultadoRealTotal >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
            {formatCurrency(resultadoRealTotal)}
          </div>
          <span className="text-[10px] text-slate-400">Total gerado em opções</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-md card-shadow border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Taxa de Acerto</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {taxaAcerto.toFixed(1)}%
          </div>
          <div className="flex h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${taxaAcerto}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-md card-shadow border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Média Ganho / Perda</div>
          <div className="text-xs font-mono font-bold mt-1 space-y-0.5">
            <div className="text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(mediaGanho)} <span className="text-[10px] font-normal text-slate-400 font-sans">({ganhadoras})</span>
            </div>
            <div className="text-rose-600 dark:text-rose-400">
              {formatCurrency(mediaPerda)} <span className="text-[10px] font-normal text-slate-400 font-sans">({perdedoras})</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-md card-shadow border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Operações Cadastradas</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {encerradas.length} <span className="text-xs font-normal text-slate-400 font-sans">encerradas</span>
          </div>
          <span className="text-[10px] text-slate-400">{abertas.length} em aberto</span>
        </div>
      </div>

      {/* Gráficos de Desempenho Real (baseados em resultadoFinal) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Desempenho por Mês (Resultado Real)</h3>
            <span className="text-[10px] text-slate-400 font-medium">resultadoFinal integral</span>
          </div>
          <div className="h-56">
            {dataGraficoMes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataGraficoMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="mes" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                  <Tooltip 
                    cursor={{ fill: theme === 'dark' ? '#1f2937' : '#f3f4f6' }}
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#111827' : '#ffffff', borderColor: gridColor, borderRadius: '8px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Resultado Real']}
                  />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {dataGraficoMes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.valor >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Sem dados suficientes</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col space-y-3">
          {/* Cabeçalho do Card com Título e Indicadores Somados */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Desempenho por Ativo (Resultado Real)</h3>
              <span className="text-[10px] text-slate-400 font-medium">resultadoFinal integral das operações encerradas</span>
            </div>

            {/* Resultado Somado e Quantidade Filtrada */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Resultado Somado</span>
                <span className={`text-sm font-bold font-mono tracking-tight block ${
                  resultadoSomadoBusca >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {formatCurrency(resultadoSomadoBusca)}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Encerradas</span>
                <span className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300 block">
                  {qtdOperacoesBusca} <span className="text-[10px] font-normal text-slate-400">op.</span>
                </span>
              </div>
            </div>
          </div>

          {/* Campo de Busca e Filtros Combináveis */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Formulário de Busca por Ticker */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  dispararBusca(inputBuscaAtivo);
                }}
                className="flex-1 flex items-center relative"
              >
                <input
                  type="text"
                  value={inputBuscaAtivo}
                  onChange={(e) => setInputBuscaAtivo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      dispararBusca(inputBuscaAtivo);
                    }
                  }}
                  placeholder="Buscar ativo (ex: BEEF, PETR, VALE)... [Enter ou lupa]"
                  className="w-full pl-3 pr-20 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <div className="absolute right-1 flex items-center gap-1">
                  {inputBuscaAtivo && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputBuscaAtivo('');
                        if (termoBuscaAtivo) dispararBusca('');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Limpar texto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Pesquisar (Enter ou clique)"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Buscar</span>
                  </button>
                </div>
              </form>

              {/* Filtros Combináveis PUT/CALL e Compra/Venda */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={filtroTipoOpcao}
                  onChange={(e) => setFiltroTipoOpcao(e.target.value as 'todos' | 'PUT' | 'CALL')}
                  className="text-xs py-1.5 px-2 rounded-md bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                  title="Filtrar por tipo de opção"
                >
                  <option value="todos">Tipo: Todos</option>
                  <option value="PUT">Apenas PUT</option>
                  <option value="CALL">Apenas CALL</option>
                </select>

                <select
                  value={filtroDirecao}
                  onChange={(e) => setFiltroDirecao(e.target.value as 'todas' | 'V' | 'C')}
                  className="text-xs py-1.5 px-2 rounded-md bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                  title="Filtrar por direção inicial"
                >
                  <option value="todas">Direção: Todas</option>
                  <option value="V">Venda (V)</option>
                  <option value="C">Compra (C)</option>
                </select>

                {(termoBuscaAtivo || filtroTipoOpcao !== 'todos' || filtroDirecao !== 'todas') && (
                  <button
                    type="button"
                    onClick={limparFiltrosBusca}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="Limpar filtros da análise"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Aviso de filtro de busca ativo */}
            {termoBuscaAtivo && (
              <div className="flex items-center justify-between text-xs px-2.5 py-1 bg-blue-50/70 dark:bg-blue-950/40 rounded border border-blue-200/80 dark:border-blue-900/50 text-blue-700 dark:text-blue-300">
                <span>
                  Filtrando por: <strong className="font-mono uppercase">{termoBuscaAtivo}</strong> ({qtdOperacoesBusca} encontrada{qtdOperacoesBusca === 1 ? '' : 's'})
                </span>
                <button
                  type="button"
                  onClick={() => dispararBusca('')}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Remover filtro
                </button>
              </div>
            )}

            {/* Histórico das últimas 10 pesquisas únicas como sugestões clicáveis */}
            {historicoBuscas.length > 0 && (
              <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 mr-0.5">
                  Recentes:
                </span>
                {historicoBuscas.map(sugestao => (
                  <span
                    key={sugestao}
                    onClick={() => dispararBusca(sugestao)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono cursor-pointer transition-colors border select-none ${
                      termoBuscaAtivo.toUpperCase() === sugestao.toUpperCase()
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                        : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title={`Filtrar por ${sugestao}`}
                  >
                    <span>{sugestao}</span>
                    <button
                      type="button"
                      onClick={(e) => excluirSugestao(e, sugestao)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 p-0.5 rounded-full"
                      title="Excluir do histórico"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={limparHistorico}
                  className="text-[10px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-1 cursor-pointer underline"
                  title="Apagar todo o histórico de buscas salvas"
                >
                  Limpar histórico
                </button>
              </div>
            )}
          </div>

          {/* Gráfico das operações filtradas */}
          <div className="h-56">
            {dataGraficoAtivo.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataGraficoAtivo}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dataGraficoAtivo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#111827' : '#ffffff', borderColor: gridColor, borderRadius: '8px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Resultado']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                <span>Nenhuma operação encerrada encontrada</span>
                {(termoBuscaAtivo || filtroTipoOpcao !== 'todos' || filtroDirecao !== 'todas') && (
                  <span className="text-[10px] text-slate-400 mt-1">Tente ajustar a busca ou os filtros acima</span>
                )}
              </div>
            )}
            {dataGraficoAtivo.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {dataGraficoAtivo.slice(0, 8).map((entry, index) => (
                  <div key={entry.name} className="flex items-center text-[10px] uppercase font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span>{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">Últimas 5 Operações Encerradas</h3>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="px-4 py-2">Ativo</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Dir</th>
                <th className="px-3 py-2 text-center">Encerramento</th>
                <th className="px-4 py-2 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-700">
              {encerradas.slice(0, 5).map((op) => (
                <tr key={op.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-2 font-bold text-slate-700 dark:text-slate-200">{op.ativo}</td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">{op.tipoOpcao}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${op.direcaoInicial === 'V' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {op.direcaoInicial}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-[10px] text-slate-500 dark:text-slate-400">{op.dataEncerramento}</td>
                  <td className={`px-4 py-2 text-right font-mono font-medium tracking-tighter ${op.resultadoFinal! >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(op.resultadoFinal!)}
                  </td>
                </tr>
              ))}
              {encerradas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Nenhuma operação encerrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
