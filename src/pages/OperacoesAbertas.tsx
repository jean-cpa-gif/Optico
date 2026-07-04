import { useState } from 'react';
import { useOperations } from '@/store/OperationsContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { Operacao, EventoOperacao } from '@/types';
import { X, ChevronDown, ChevronUp, Pencil, Trash2, Clock, Plus, AlertTriangle } from 'lucide-react';
import { 
  ModalAumentarPosicao, 
  ModalEditarOperacao, 
  ModalExcluirOperacao, 
  ModalEditarEvento 
} from '@/components/Modals';

export default function OperacoesAbertas() {
  const { operacoes, rolarOperacao, encerrarOperacao, aumentarPosicao, editarOperacao, excluirOperacao, editarEvento, excluirEvento } = useOperations();
  const abertas = operacoes.filter(op => op.status === 'aberta');

  const [encerrarModal, setEncerrarModal] = useState<{ op: Operacao | null; open: boolean }>({ op: null, open: false });
  const [rolarModal, setRolarModal] = useState<{ op: Operacao | null; open: boolean }>({ op: null, open: false });
  const [aumentarModal, setAumentarModal] = useState<{ op: Operacao | null; open: boolean }>({ op: null, open: false });
  const [editarModal, setEditarModal] = useState<{ op: Operacao | null; open: boolean }>({ op: null, open: false });
  const [excluirModal, setExcluirModal] = useState<{ op: Operacao | null; open: boolean }>({ op: null, open: false });
  const [editarEventoModal, setEditarEventoModal] = useState<{ op: Operacao | null; evento: EventoOperacao | null; open: boolean }>({ op: null, evento: null, open: false });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Operações Abertas</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {abertas.map(op => (
          <OperacaoCard 
            key={op.id} 
            op={op} 
            onEncerrar={() => setEncerrarModal({ op, open: true })}
            onRolar={() => setRolarModal({ op, open: true })}
            onAumentar={() => setAumentarModal({ op, open: true })}
            onEditar={() => setEditarModal({ op, open: true })}
            onExcluir={() => setExcluirModal({ op, open: true })}
            onEditEvent={(evt) => setEditarEventoModal({ op, evento: evt, open: true })}
            onDeleteEvent={(evtId) => excluirEvento(op.id, evtId)}
            isExpanded={expandedId === op.id}
            onToggleExpand={() => setExpandedId(expandedId === op.id ? null : op.id)}
          />
        ))}
        {abertas.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
            Nenhuma operação aberta no momento.
          </div>
        )}
      </div>

      {/* MODALS */}
      {encerrarModal.open && encerrarModal.op && (
        <ModalEncerrar 
          op={encerrarModal.op} 
          onClose={() => setEncerrarModal({ op: null, open: false })}
          onConfirm={(preco, data) => {
            encerrarOperacao(encerrarModal.op!.id, preco, data);
            setEncerrarModal({ op: null, open: false });
          }}
        />
      )}

      {rolarModal.open && rolarModal.op && (
        <ModalRolar 
          op={rolarModal.op} 
          onClose={() => setRolarModal({ op: null, open: false })}
          onConfirm={(dados) => {
            rolarOperacao(rolarModal.op!.id, dados);
            setRolarModal({ op: null, open: false });
          }}
        />
      )}

      {aumentarModal.open && aumentarModal.op && (
        <ModalAumentarPosicao 
          op={aumentarModal.op}
          onClose={() => setAumentarModal({ op: null, open: false })}
          onConfirm={(quantidade, preco, data) => {
            aumentarPosicao(aumentarModal.op!.id, quantidade, preco, data);
            setAumentarModal({ op: null, open: false });
          }}
        />
      )}

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

interface OperacaoCardProps {
  key?: any;
  op: Operacao;
  onEncerrar: () => void;
  onRolar: () => void;
  onAumentar: () => void;
  onEditar: () => void;
  onExcluir: () => void;
  onEditEvent: (evt: EventoOperacao) => void;
  onDeleteEvent: (evtId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function OperacaoCard({ 
  op, 
  onEncerrar, 
  onRolar, 
  onAumentar, 
  onEditar, 
  onExcluir, 
  onEditEvent, 
  onDeleteEvent, 
  isExpanded, 
  onToggleExpand 
}: OperacaoCardProps) {
  const daysLeft = differenceInDays(new Date(op.vencimentoAtual), new Date());
  
  let daysColor = "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20";
  if (daysLeft <= 15 && daysLeft > 5) daysColor = "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20";
  if (daysLeft <= 5) daysColor = "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-md card-shadow border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-600">
      <div className="p-4 flex-1">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              {op.ativo}
              <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${op.direcaoInicial === 'V' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                {op.direcaoInicial === 'V' ? 'VENDA' : 'COMPRA'}
              </span>
              <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {op.tipoOpcao}
              </span>
            </h3>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={onEditar}
              title="Editar operação"
              className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={onExcluir}
              title="Excluir operação permanentemente"
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className={`ml-1 px-2 py-0.5 rounded-sm text-[9px] font-bold ${daysColor}`}>
              {daysLeft} dias
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Quantidade Atual</p>
            <p className="font-bold font-mono text-sm text-slate-800 dark:text-slate-200">{op.quantidadeAtual}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Strike Atual</p>
            <p className="font-bold font-mono text-sm text-slate-800 dark:text-slate-200">{formatCurrency(op.strikeAtual)}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Preço Médio Atual</p>
            <p className="font-bold font-mono text-sm text-slate-800 dark:text-slate-200">{formatCurrency(op.precoMedioAtual)}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Vencimento Atual</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{formatDate(op.vencimentoAtual)}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Prêmio Líquido Acumulado</p>
          <p className={`text-lg font-bold font-mono tracking-tighter ${op.premioLiquidoAcumulado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(op.premioLiquidoAcumulado)}
          </p>
        </div>
      </div>

      {/* Events Timeline Accordion */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10">
        <button 
          onClick={onToggleExpand}
          className="w-full px-4 py-2 text-[9px] uppercase font-bold text-slate-500 flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors tracking-wider"
        >
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Ver histórico / timeline ({op.historicoEventos?.length || 0})
          </span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-2.5 pl-4 space-y-4 pt-1">
              {(op.historicoEventos || []).map((evt, idx) => {
                let dotColor = "bg-blue-500";
                if (evt.tipo === 'aumento') dotColor = "bg-amber-500";
                if (evt.tipo === 'rolagem') dotColor = "bg-violet-500";
                if (evt.tipo === 'edicao') dotColor = "bg-slate-400";
                if (evt.tipo === 'encerramento') dotColor = "bg-emerald-500";

                return (
                  <div key={evt.id || idx} className="relative group/evt text-xs">
                    {/* Circle Dot on Timeline Line */}
                    <span className={`absolute -left-[22px] mt-1 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-800 ${dotColor}`} />
                    
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono font-bold text-slate-400 block">{formatDate(evt.data)}</span>
                        <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{evt.detalhes}</p>
                      </div>
                      
                      {/* Interactive inline editing for rolagem, aumento, and opening events */}
                      {evt.tipo !== 'edicao' && evt.tipo !== 'encerramento' && (
                        <div className="opacity-0 group-hover/evt:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-0.5 shadow-sm">
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
        )}
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex gap-2">
        <button 
          onClick={onEncerrar}
          className="flex-1 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-sm shadow-sm text-[10px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors cursor-pointer"
        >
          Encerrar
        </button>
        <button 
          onClick={onAumentar}
          className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-sm shadow-sm text-[10px] uppercase tracking-wider font-extrabold transition-colors flex items-center justify-center gap-1 cursor-pointer"
          title="Aumentar posição"
        >
          <Plus className="w-3.5 h-3.5" />
          Aumentar
        </button>
        <button 
          onClick={onRolar}
          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm shadow-sm text-[10px] uppercase tracking-wider font-bold transition-colors cursor-pointer"
        >
          Rolar
        </button>
      </div>
    </div>
  );
}

// Keep local components ModalEncerrar and ModalRolar so we don't break existing page dependencies
function ModalEncerrar({ op, onClose, onConfirm }: { op: Operacao, onClose: () => void, onConfirm: (p: number, d: string) => void }) {
  const [preco, setPreco] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  const p = parseFloat(preco) || 0;
  const isVenda = op.direcaoInicial === 'V';
  
  let resultadoProjetado = 0;
  if (isVenda) {
    resultadoProjetado = op.premioLiquidoAcumulado - (op.quantidadeAtual * p);
  } else {
    resultadoProjetado = op.premioLiquidoAcumulado + (op.quantidadeAtual * p);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold">Encerrar Operação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Data do Encerramento
            </label>
            <input 
              type="date" required value={data} onChange={(e) => setData(e.target.value)}
              className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Preço de {isVenda ? 'Recompra' : 'Venda'} (R$)
            </label>
            <input 
              type="number" step="0.01" min="0" required value={preco} onChange={(e) => setPreco(e.target.value)}
              className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded mt-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Resultado Final Projetado</p>
            <p className={`text-xl font-bold font-mono ${resultadoProjetado >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
              {formatCurrency(resultadoProjetado)}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onClose} className="flex-1 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm">Cancelar</button>
          <button 
            onClick={() => p > 0 && onConfirm(p, data)} 
            disabled={p <= 0}
            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-sm text-xs font-semibold transition-colors shadow-sm"
          >
            Confirmar Encerramento
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalRolar({ op, onClose, onConfirm }: { op: Operacao, onClose: () => void, onConfirm: (d: any) => void }) {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [precoRecompra, setPrecoRecompra] = useState('');
  const [precoVendaNova, setPrecoVendaNova] = useState('');
  const [quantidadeNova, setQuantidadeNova] = useState(op.quantidadeAtual.toString());
  const [strikeNovo, setStrikeNovo] = useState(op.strikeAtual.toString());
  const [novoVencimento, setNovoVencimento] = useState('');

  const isVenda = op.direcaoInicial === 'V';
  const pr = parseFloat(precoRecompra) || 0;
  const pvn = parseFloat(precoVendaNova) || 0;
  const qn = parseInt(quantidadeNova, 10) || op.quantidadeAtual;

  let premioLiquidoDaRolagem = 0;
  if (isVenda) {
    premioLiquidoDaRolagem = (qn * pvn) - (op.quantidadeAtual * pr);
  } else {
    premioLiquidoDaRolagem = (op.quantidadeAtual * pr) - (qn * pvn);
  }

  const novoPremioAcumulado = op.premioLiquidoAcumulado + premioLiquidoDaRolagem;
  const novoPrecoMedio = qn > 0 ? Math.abs(novoPremioAcumulado) / qn : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-800 my-auto">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold">Rolar Operação</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Data da Rolagem</label>
              <input type="date" required value={data} onChange={(e) => setData(e.target.value)} className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                {isVenda ? 'Preço Recompra (R$)' : 'Preço Venda (R$)'}
              </label>
              <input type="number" step="0.01" min="0" required value={precoRecompra} onChange={(e) => setPrecoRecompra(e.target.value)} className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                {isVenda ? 'Preço Venda Nova (R$)' : 'Preço Compra Nova (R$)'}
              </label>
              <input type="number" step="0.01" min="0" required value={precoVendaNova} onChange={(e) => setPrecoVendaNova(e.target.value)} className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">Nova Quantidade</label>
              <input type="number" step="1" min="1" required value={quantidadeNova} onChange={(e) => setQuantidadeNova(e.target.value)} className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">Novo Strike (R$)</label>
              <input type="number" step="0.01" min="0.01" required value={strikeNovo} onChange={(e) => setStrikeNovo(e.target.value)} className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">Novo Vencimento</label>
              <input type="date" required value={novoVencimento} onChange={(e) => setNovoVencimento(e.target.value)} className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded mt-4 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Resultado desta Rolagem</span>
              <span className={`font-bold font-mono ${premioLiquidoDaRolagem >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                {formatCurrency(premioLiquidoDaRolagem)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-1.5">
              <span className="text-slate-500 dark:text-slate-400">Novo Prêmio Acumulado</span>
              <span className={`font-bold font-mono ${novoPremioAcumulado >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                {formatCurrency(novoPremioAcumulado)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-1.5">
              <span className="text-slate-500 dark:text-slate-400">Novo Preço Médio (Ref)</span>
              <span className="font-bold font-mono">{formatCurrency(novoPrecoMedio)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onClose} className="flex-1 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm">Cancelar</button>
          <button 
            onClick={() => {
              if(pr>0 && pvn>0 && qn>0 && strikeNovo && novoVencimento) {
                onConfirm({
                  data,
                  strikeAnterior: op.strikeAtual,
                  strikeNovo: parseFloat(strikeNovo),
                  quantidadeAnterior: op.quantidadeAtual,
                  quantidadeNova: qn,
                  precoRecompra: pr,
                  precoVendaNova: pvn,
                  novoVencimento
                });
              }
            }} 
            disabled={!novoVencimento || qn<=0}
            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-sm text-xs font-semibold transition-colors shadow-sm"
          >
            Confirmar Rolagem
          </button>
        </div>
      </div>
    </div>
  );
}
