import { useOperations } from '@/store/OperationsContext';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '@/components/ThemeProvider';

export default function Dashboard() {
  const { operacoes } = useOperations();
  const { theme } = useTheme();

  const abertas = operacoes.filter(op => op.status === 'aberta');
  const encerradas = operacoes.filter(op => op.status === 'encerrada');

  const resultadoTotal = encerradas.reduce((acc, op) => acc + (op.resultadoFinal || 0), 0);
  const ganhadoras = encerradas.filter(op => (op.resultadoFinal || 0) > 0).length;
  const perdedoras = encerradas.filter(op => (op.resultadoFinal || 0) < 0).length;
  const taxaAcerto = encerradas.length > 0 ? (ganhadoras / encerradas.length) * 100 : 0;

  // Chart: Result per month
  const resultPorMes = encerradas.reduce((acc, op) => {
    if (!op.dataEncerramento) return acc;
    const mes = op.dataEncerramento.substring(0, 7); // YYYY-MM
    acc[mes] = (acc[mes] || 0) + (op.resultadoFinal || 0);
    return acc;
  }, {} as Record<string, number>);

  const dataGraficoMes = Object.entries(resultPorMes)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, valor]) => ({ mes, valor }));

  // Chart: Result per Asset
  const resultPorAtivo = encerradas.reduce((acc, op) => {
    acc[op.ativo] = (acc[op.ativo] || 0) + (op.resultadoFinal || 0);
    return acc;
  }, {} as Record<string, number>);

  const dataGraficoAtivo = Object.entries(resultPorAtivo)
    .sort((a, b) => b[1] - a[1]) // sort by profit
    .map(([name, value]) => ({ name, value }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899', '#ef4444'];
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-md card-shadow border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Resultado Acumulado</div>
          <div className={`text-xl font-bold font-mono ${resultadoTotal >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
            {formatCurrency(resultadoTotal)}
          </div>
        </div>
        
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Resultado por Mês</h3>
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
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Resultado por Ativo</h3>
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
