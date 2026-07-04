import { useState } from 'react';
import { useOperations } from '@/store/OperationsContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Operacao } from '@/types';

export default function Historico() {
  const { operacoes } = useOperations();
  const encerradas = operacoes.filter(op => op.status === 'encerrada');
  
  const [filtroAtivo, setFiltroAtivo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = encerradas.filter(op => 
    filtroAtivo === '' || op.ativo.includes(filtroAtivo.toUpperCase())
  ).sort((a, b) => new Date(b.dataEncerramento!).getTime() - new Date(a.dataEncerramento!).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filtrar Ativo:</label>
          <input 
            type="text" 
            placeholder="Ex: BOVA11" 
            value={filtroAtivo}
            onChange={(e) => setFiltroAtivo(e.target.value)}
            className="w-32 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-md card-shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="px-4 py-2">Ativo</th>
                <th className="px-3 py-2">Tipo / Dir</th>
                <th className="px-3 py-2">Data Abertura</th>
                <th className="px-3 py-2">Data Encerramento</th>
                <th className="px-3 py-2 text-right">Resultado Final</th>
                <th className="px-4 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map(op => (
                <HistoricoRow 
                  key={op.id} 
                  op={op} 
                  isExpanded={expandedId === op.id}
                  onToggleExpand={() => setExpandedId(expandedId === op.id ? null : op.id)}
                />
              ))}
              {filtered.length === 0 && (
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Nenhuma operação encontrada
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

function HistoricoRow({ op, isExpanded, onToggleExpand }: { op: Operacao, isExpanded: boolean, onToggleExpand: () => void }) {
  return (
    <>
      <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <td className="px-4 py-2 font-bold text-slate-700 dark:text-slate-200 underline decoration-slate-200 dark:decoration-slate-600 underline-offset-4">{op.ativo}</td>
        <td className="px-3 py-2">
          <div className="flex gap-1">
            <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${op.direcaoInicial === 'V' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              {op.direcaoInicial === 'V' ? 'V' : 'C'}
            </span>
            <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {op.tipoOpcao}
            </span>
          </div>
        </td>
        <td className="px-3 py-2 text-[10px] text-slate-500 dark:text-slate-400">{formatDate(op.dataAbertura)}</td>
        <td className="px-3 py-2 text-[10px] text-slate-500 dark:text-slate-400">{formatDate(op.dataEncerramento!)}</td>
        <td className={`px-3 py-2 text-right font-mono tracking-tighter font-medium ${op.resultadoFinal! >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {formatCurrency(op.resultadoFinal!)}
        </td>
        <td className="px-4 py-2 text-center">
          {op.historicoRolagens.length > 0 ? (
            <button 
              onClick={onToggleExpand}
              className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
              title="Ver histórico de rolagens"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          ) : (
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">S/ Rolagem</span>
          )}
        </td>
      </tr>
      {isExpanded && op.historicoRolagens.length > 0 && (
        <tr className="bg-slate-50 dark:bg-slate-800/50">
          <td colSpan={6} className="px-4 py-3">
            <div className="pl-3 border-l-2 border-blue-500 space-y-2">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Histórico de Rolagens</h4>
              {op.historicoRolagens.map((rolagem, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-4 text-xs">
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Data</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{formatDate(rolagem.data)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Quantidades</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{rolagem.quantidadeAnterior} → {rolagem.quantidadeNova}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Strikes</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(rolagem.strikeAnterior)} → {formatCurrency(rolagem.strikeNovo)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Preços (Antigo / Novo)</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(rolagem.precoRecompra)} / {formatCurrency(rolagem.precoVendaNova)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Resultado</span>
                    <span className={`font-mono font-bold tracking-tighter ${rolagem.premioLiquidoDaRolagem >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatCurrency(rolagem.premioLiquidoDaRolagem)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
