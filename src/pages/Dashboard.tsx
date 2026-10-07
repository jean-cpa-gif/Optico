import { useState } from 'react';
import { useOperations } from '@/store/OperationsContext';
import { useDividas } from '@/store/DividasContext';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '@/components/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import VencimentoAlerta from '@/components/VencimentoAlerta';
import { TrendingUp, TrendingDown, Wallet, Scale, ChevronDown, ChevronUp, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { operacoes } = useOperations();
  const { dividas } = useDividas();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Estados para expansão dos 3 cards de topo
  const [expandedCard, setExpandedCard] = useState<'opcoes' | 'dividas' | 'liquido' | null>(null);

  const abertas = operacoes.filter(op => op.status === 'aberta');
  const encerradas = operacoes.filter(op => op.status === 'encerrada');

  // Regra de não-duplicação (Item 3 do requisito):
  const getValorConsiderado = (op: typeof operacoes[0]) => {
    if (op.valorContadoComoResultadoOpcoes !== null && op.valorContadoComoResultadoOpcoes !== undefined) {
      return op.valorContadoComoResultadoOpcoes;
    }
    return op.resultadoFinal || 0;
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

  const ganhadoras = encerradas.filter(op => (op.resultadoFinal || 0) > 0).length;
  const perdedoras = encerradas.filter(op => (op.resultadoFinal || 0) < 0).length;
  const taxaAcerto = encerradas.length > 0 ? (ganhadoras / encerradas.length) * 100 : 0;

  // Chart: Result per month usando getValorConsiderado
  const resultPorMes = encerradas.reduce((acc, op) => {
    if (!op.dataEncerramento) return acc;
    const mes = op.dataEncerramento.substring(0, 7); // YYYY-MM
    acc[mes] = (acc[mes] || 0) + getValorConsiderado(op);
    return acc;
  }, {} as Record<string, number>);

  const dataGraficoMes = Object.entries(resultPorMes)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, valor]): { mes: string; valor: number } => ({ mes, valor: valor as number }));

  // Chart: Result per Asset usando getValorConsiderado
  const resultPorAtivo = encerradas.reduce((acc, op) => {
    acc[op.ativo] = (acc[op.ativo] || 0) + getValorConsiderado(op);
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

      {/* Métricas Auxiliares */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-md card-shadow border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Taxa de Acerto</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {taxaAcerto.toFixed(1)}%
          </div>
          <div className="flex h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${taxaAcerto}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-md card-shadow border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Operações Abertas</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {abertas.length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-md card-shadow border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Operações Encerradas</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {encerradas.length}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Resultado das Opções por Mês</h3>
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
                    formatter={(value: number) => [formatCurrency(value), 'Resultado']}
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

        <div className="bg-white dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Resultado das Opções por Ativo</h3>
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
              <div className="h-full flex items-center justify-center text-gray-400">Sem dados suficientes</div>
            )}
            {dataGraficoAtivo.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {dataGraficoAtivo.slice(0, 6).map((entry, index) => (
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
