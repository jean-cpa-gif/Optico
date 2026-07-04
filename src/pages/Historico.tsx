import { useState } from 'react';
import { useOperations } from '@/store/OperationsContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ChevronDown, ChevronUp, Pencil, Trash2, Clock, X } from 'lucide-react';
import { Operacao, EventoOperacao } from '@/types';
import { 
  ModalEditarOperacao, 
  ModalExcluirOperacao, 
  ModalEditarEvento 
} from '@/components/Modals';

export default function Historico() {
  const { operacoes, editarOperacao, excluirOperacao, editarEvento, excluirEvento } = useOperations();
  const encerradas = operacoes.filter(op => op.status === 'encerrada');
  
  const [filtroAtivo, setFiltroAtivo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editarModal, setEditarModal] = useState<{ op: Operacao | null; open: boolean }>({ op: null, open: false });
  const [excluirModal, setExcluirModal] = useState<{ op: Operacao | null; open: boolean }>({ op: null, open: false });
  const [editarEventoModal, setEditarEventoModal] = useState<{ op: Operacao | null; evento: EventoOperacao | null; open: boolean }>({ op: null, evento: null, open: false });

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
                <th className="px-4 py-3">Ativo</th>
                <th className="px-3 py-3">Tipo / Dir</th>
                <th className="px-3 py-3">Data Abertura</th>
                <th className="px-3 py-3">Data Encerramento</th>
                <th className="px-3 py-3 text-right">Resultado Final</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map(op => (
                <HistoricoRow 
                  key={op.id} 
                  op={op} 
                  isExpanded={expandedId === op.id}
                  onToggleExpand={() => setExpandedId(expandedId === op.id ? null : op.id)}
                  onEditar={() => setEditarModal({ op, open: true })}
                  onExcluir={() => setExcluirModal({ op, open: true })}
                  onEditEvent={(evt) => setEditarEventoModal({ op, evento: evt, open: true })}
                  onDeleteEvent={(evtId) => excluirEvento(op.id, evtId)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Nenhuma operação encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {editarModal.open && editarModal.op && (
        <ModalEditarOperacao 
          op={editarModal.op}
          onClose={() => setEditarModal({ op: null, open: false })}
          onConfirm={(campos) => {
            editarOperacao(editarModal.op!.id, campos);
            setEditarModal({ op: null, open: false });
          }}
        />
      )}

      {excluirModal.open && excluirModal.op && (
        <ModalExcluirOperacao 
          op={excluirModal.op}
          onClose={() => setExcluirModal({ op: null, open: false })}
          onConfirm={() => {
            excluirOperacao(excluirModal.op!.id);
            setExcluirModal({ op: null, open: false });
          }}
        />
      )}

      {editarEventoModal.open && editarEventoModal.op && editarEventoModal.evento && (
        <ModalEditarEvento 
          op={editarEventoModal.op}
          evento={editarEventoModal.evento}
          onClose={() => setEditarEventoModal({ op: null, evento: null, open: false })}
          onConfirm={(novosCampos) => {
            editarEvento(editarEventoModal.op!.id, editarEventoModal.evento!.id, novosCampos);
            setEditarEventoModal({ op: null, evento: null, open: false });
          }}
        />
      )}
    </div>
  );
}

interface HistoricoRowProps {
  key?: any;
  op: Operacao;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditar: () => void;
  onExcluir: () => void;
  onEditEvent: (evt: EventoOperacao) => void;
  onDeleteEvent: (evtId: string) => void;
}

function HistoricoRow({ 
  op, 
  isExpanded, 
  onToggleExpand, 
  onEditar, 
  onExcluir, 
  onEditEvent, 
  onDeleteEvent 
}: HistoricoRowProps) {
  return (
    <>
      <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200 underline decoration-slate-200 dark:decoration-slate-600 underline-offset-4">{op.ativo}</td>
        <td className="px-3 py-3">
          <div className="flex gap-1">
            <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${op.direcaoInicial === 'V' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              {op.direcaoInicial === 'V' ? 'V' : 'C'}
            </span>
            <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {op.tipoOpcao}
            </span>
          </div>
        </td>
        <td className="px-3 py-3 text-[10px] text-slate-500 dark:text-slate-400">{formatDate(op.dataAbertura)}</td>
        <td className="px-3 py-3 text-[10px] text-slate-500 dark:text-slate-400">{formatDate(op.dataEncerramento!)}</td>
        <td className={`px-3 py-3 text-right font-mono tracking-tighter font-medium ${op.resultadoFinal! >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {formatCurrency(op.resultadoFinal!)}
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <button 
              onClick={onEditar}
              title="Editar operação"
              className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={onExcluir}
              title="Excluir operação permanentemente"
              className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={onToggleExpand}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-1"
              title="Ver histórico / timeline completo"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50 dark:bg-slate-800/40">
          <td colSpan={6} className="px-6 py-4">
            <div className="pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4 text-slate-300 dark:text-slate-500" />
                Linha do Tempo de Eventos
              </div>
              
              <div className="space-y-4 ml-1">
                {(op.historicoEventos || []).map((evt, idx) => {
                  let dotColor = "bg-blue-500";
                  if (evt.tipo === 'aumento') dotColor = "bg-amber-500";
                  if (evt.tipo === 'rolagem') dotColor = "bg-violet-500";
                  if (evt.tipo === 'edicao') dotColor = "bg-slate-400";
                  if (evt.tipo === 'encerramento') dotColor = "bg-emerald-500";

                  return (
                    <div key={evt.id || idx} className="relative group text-xs">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[22px] mt-1 w-2 h-2 rounded-full ring-4 ring-slate-50 dark:ring-slate-800 ${dotColor}`} />
                      
                      <div className="flex justify-between items-start gap-2 max-w-xl">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono font-bold text-slate-400 block">{formatDate(evt.data)}</span>
                          <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{evt.detalhes}</p>
                        </div>
                        
                        {/* Interactive inline editing for rolagem, aumento, and opening events inside history */}
                        {evt.tipo !== 'edicao' && evt.tipo !== 'encerramento' && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-0.5 shadow-sm">
                            <button 
                              onClick={() => onEditEvent(evt)}
                              title="Editar evento"
                              className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 p-0.5 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            {evt.tipo !== 'abertura' && (
                              <button 
                                onClick={() => onDeleteEvent(evt.id)}
                                title="Excluir evento do histórico"
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
