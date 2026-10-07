import { useState } from 'react';
import { useOperations } from '@/store/OperationsContext';
import { useDividas } from '@/store/DividasContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ChevronDown, ChevronUp, Pencil, Trash2, Clock, X, Link2, Layers } from 'lucide-react';
import { Operacao, EventoOperacao, Divida } from '@/types';
import { 
  ModalEditarOperacao, 
  ModalExcluirOperacao, 
  ModalEditarEvento 
} from '@/components/Modals';
import { ModalAjustarVinculoAoEditar } from '@/components/ModalAjustarVinculoAoEditar';
import { ModalAgruparEstrategia } from '@/components/ModalAgruparEstrategia';
import { ResumoConjuntoEstrategia } from '@/components/ResumoConjuntoEstrategia';

export default function Historico() {
  const { operacoes, editarOperacao, excluirOperacao, editarEvento, excluirEvento, atribuirGrupoEstrategia } = useOperations();
  const { dividas, ajustarVinculoOperacao } = useDividas();
  const encerradas = operacoes.filter(op => op.status === 'encerrada');
  
  const [filtroAtivo, setFiltroAtivo] = useState('');
  const [filtroEstrategia, setFiltroEstrategia] = useState('todas');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editarModal, setEditarModal] = useState<{ op: Operacao | null; open: boolean }>({ op: null, open: false });
  const [excluirModal, setExcluirModal] = useState<{ op: Operacao | null; open: boolean }>({ op: null, open: false });
  const [editarEventoModal, setEditarEventoModal] = useState<{ op: Operacao | null; evento: EventoOperacao | null; open: boolean }>({ op: null, evento: null, open: false });
  const [agruparModal, setAgruparModal] = useState<{ op: Operacao | null; open: boolean }>({ op: null, open: false });

  // Modal para ajuste de vínculo de dívida ao editar operação encerrada
  const [ajustarVinculoModal, setAjustarVinculoModal] = useState<{
    open: boolean;
    op: Operacao | null;
    campos: Partial<Operacao>;
    dividaNome: string;
    resultadoAnterior: number;
    novoResultado: number;
    valorVinculadoAtual: number;
  }>({
    open: false,
    op: null,
    campos: {},
    dividaNome: '',
    resultadoAnterior: 0,
    novoResultado: 0,
    valorVinculadoAtual: 0
  });

  const gruposCadastrados = Array.from(new Set(operacoes.map(op => op.grupoEstrategia).filter(Boolean) as string[])).sort();
  const isEstrategiaEspecifica = filtroEstrategia !== 'todas' && filtroEstrategia !== 'sem_grupo';
  const pernasDaEstrategia = isEstrategiaEspecifica 
    ? operacoes.filter(op => op.grupoEstrategia === filtroEstrategia)
    : [];
  const pernasAbertasDaEstrategia = pernasDaEstrategia.filter(op => op.status === 'aberta');

  const filtered = encerradas.filter(op => {
    const matchAtivo = filtroAtivo === '' || op.ativo.includes(filtroAtivo.toUpperCase());
    const matchEstrategia = 
      filtroEstrategia === 'todas'
        ? true
        : filtroEstrategia === 'sem_grupo'
          ? !op.grupoEstrategia
          : op.grupoEstrategia === filtroEstrategia;
    return matchAtivo && matchEstrategia;
  }).sort((a, b) => new Date(b.dataEncerramento!).getTime() - new Date(a.dataEncerramento!).getTime());

  return (
    <div className="space-y-6">
      {/* Resumo Conjunto da Estratégia (se filtrado por grupo específico) */}
      {isEstrategiaEspecifica && (
        <ResumoConjuntoEstrategia
          nomeEstrategia={filtroEstrategia}
          pernas={pernasDaEstrategia}
          onLimparFiltro={() => setFiltroEstrategia('todas')}
        />
      )}

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
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

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estratégia:</label>
            <select
              value={filtroEstrategia}
              onChange={(e) => setFiltroEstrategia(e.target.value)}
              className="rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="todas">Todas as estratégias</option>
              <option value="sem_grupo">Sem grupo</option>
              {gruposCadastrados.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {(filtroAtivo !== '' || filtroEstrategia !== 'todas') && (
            <button
              onClick={() => {
                setFiltroAtivo('');
                setFiltroEstrategia('todas');
              }}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
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
                  dividas={dividas}
                  isExpanded={expandedId === op.id}
                  onToggleExpand={() => setExpandedId(expandedId === op.id ? null : op.id)}
                  onEditar={() => setEditarModal({ op, open: true })}
                  onExcluir={() => setExcluirModal({ op, open: true })}
                  onAgrupar={() => setAgruparModal({ op, open: true })}
                  onFiltrarEstrategia={(grupo) => setFiltroEstrategia(grupo)}
                  onEditEvent={(evt) => setEditarEventoModal({ op, evento: evt, open: true })}
                  onDeleteEvent={(evtId) => excluirEvento(op.id, evtId)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Nenhuma operação encerrada encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Se estiver filtrando uma estratégia específica e houver pernas abertas nela, exibi-las aqui para visão completa de todas as pernas */}
      {isEstrategiaEspecifica && pernasAbertasDaEstrategia.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-md card-shadow border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Pernas Abertas desta Estratégia ({pernasAbertasDaEstrategia.length})
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Em Andamento
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pernas ainda ativas da estratégia "{filtroEstrategia}".
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pernasAbertasDaEstrategia.map(op => (
              <div key={op.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{op.ativo}</span>
                    <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${op.direcaoInicial === 'V' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'}`}>
                      {op.direcaoInicial === 'V' ? 'V' : 'C'} {op.tipoOpcao}
                    </span>
                  </div>
                  <button
                    onClick={() => setAgruparModal({ op, open: true })}
                    title="Gerenciar estratégia"
                    className="text-slate-400 hover:text-indigo-600 p-0.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {op.quantidadeAtual} contratos • Strike {formatCurrency(op.strikeAtual)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Vencimento: {formatDate(op.vencimentoAtual)}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Saldo de Prêmio:</span>
                  <span className={`font-mono font-bold ${op.premioLiquidoAcumulado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(op.premioLiquidoAcumulado)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {editarModal.open && editarModal.op && (
        <ModalEditarOperacao 
          op={editarModal.op}
          gruposExistentes={gruposCadastrados}
          onClose={() => setEditarModal({ op: null, open: false })}
          onConfirm={(campos) => {
            const op = editarModal.op!;
            if (op.dividaVinculadaId && op.valorVinculadoDivida) {
              const dividaAlvo = dividas.find(d => d.id === op.dividaVinculadaId);
              const isVenda = (campos.direcaoInicial ?? op.direcaoInicial) === 'V';
              const precoEnc = campos.precoEncerramento !== undefined ? (campos.precoEncerramento ?? 0) : (op.precoEncerramento ?? 0);
              const qtd = campos.quantidadeInicial !== undefined ? campos.quantidadeInicial : op.quantidadeAtual;
              
              let premioLiq = op.premioLiquidoAcumulado;
              if (campos.quantidadeInicial !== undefined && campos.precoMedioOriginal !== undefined) {
                premioLiq = isVenda ? (campos.quantidadeInicial * campos.precoMedioOriginal) : -(campos.quantidadeInicial * campos.precoMedioOriginal);
              }
              const novoResFinal = isVenda ? (premioLiq - qtd * precoEnc) : (premioLiq + qtd * precoEnc);
              const valorVinc = op.valorVinculadoDivida;
              const isLucroVinculado = valorVinc > 0;
              const isLucroNovo = novoResFinal > 0;
              const isPrejuizoNovo = novoResFinal < 0;

              const invalido = isLucroVinculado 
                ? (!isLucroNovo || novoResFinal < valorVinc)
                : (!isPrejuizoNovo || Math.abs(novoResFinal) < Math.abs(valorVinc));

              if (invalido && dividaAlvo) {
                setAjustarVinculoModal({
                  open: true,
                  op,
                  campos,
                  dividaNome: dividaAlvo.nome,
                  resultadoAnterior: op.resultadoFinal ?? 0,
                  novoResultado: novoResFinal,
                  valorVinculadoAtual: valorVinc
                });
                setEditarModal({ op: null, open: false });
                return;
              }
            }

            editarOperacao(editarModal.op!.id, campos);
            setEditarModal({ op: null, open: false });
          }}
        />
      )}

      {/* Modal de Ajuste de Vínculo com Dívida */}
      {ajustarVinculoModal.open && ajustarVinculoModal.op && (
        <ModalAjustarVinculoAoEditar
          isOpen={ajustarVinculoModal.open}
          ativo={ajustarVinculoModal.op.ativo}
          dividaNome={ajustarVinculoModal.dividaNome}
          resultadoAnterior={ajustarVinculoModal.resultadoAnterior}
          novoResultado={ajustarVinculoModal.novoResultado}
          valorVinculadoAtual={ajustarVinculoModal.valorVinculadoAtual}
          onClose={() => setAjustarVinculoModal({ open: false, op: null, campos: {}, dividaNome: '', resultadoAnterior: 0, novoResultado: 0, valorVinculadoAtual: 0 })}
          onConfirmAjuste={(acao, novoValor) => {
            const op = ajustarVinculoModal.op!;
            const campos = { ...ajustarVinculoModal.campos };

            if (acao === 'desvincular') {
              ajustarVinculoOperacao({
                operacaoId: op.id,
                dividaId: op.dividaVinculadaId!,
                acao: 'desvincular'
              });
              campos.dividaVinculadaId = null;
              campos.valorVinculadoDivida = null;
              campos.valorContadoComoResultadoOpcoes = ajustarVinculoModal.novoResultado;
            } else if (acao === 'ajustar_valor' && novoValor !== undefined) {
              ajustarVinculoOperacao({
                operacaoId: op.id,
                dividaId: op.dividaVinculadaId!,
                acao: 'ajustar_valor',
                novoValorVinculado: novoValor
              });
              const isLucro = ajustarVinculoModal.novoResultado >= 0;
              const novoValorComSinal = isLucro ? novoValor : -novoValor;
              campos.valorVinculadoDivida = novoValorComSinal;
              campos.valorContadoComoResultadoOpcoes = ajustarVinculoModal.novoResultado - novoValorComSinal;
            }

            editarOperacao(op.id, campos);
            setAjustarVinculoModal({ open: false, op: null, campos: {}, dividaNome: '', resultadoAnterior: 0, novoResultado: 0, valorVinculadoAtual: 0 });
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

      {agruparModal.open && agruparModal.op && (
        <ModalAgruparEstrategia
          isOpen={agruparModal.open}
          op={agruparModal.op}
          todasOperacoes={operacoes}
          gruposExistentes={gruposCadastrados}
          onClose={() => setAgruparModal({ op: null, open: false })}
          onSalvar={(opIds, grupo) => {
            atribuirGrupoEstrategia(opIds, grupo);
            setAgruparModal({ op: null, open: false });
          }}
        />
      )}
    </div>
  );
}

interface HistoricoRowProps {
  key?: any;
  op: Operacao;
  dividas: Divida[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditar: () => void;
  onExcluir: () => void;
  onAgrupar: () => void;
  onFiltrarEstrategia?: (grupo: string) => void;
  onEditEvent: (evt: EventoOperacao) => void;
  onDeleteEvent: (evtId: string) => void;
}

function HistoricoRow({ 
  op, 
  dividas,
  isExpanded, 
  onToggleExpand, 
  onEditar, 
  onExcluir, 
  onAgrupar,
  onFiltrarEstrategia,
  onEditEvent, 
  onDeleteEvent 
}: HistoricoRowProps) {
  const dividaVinculada = op.dividaVinculadaId ? dividas.find(d => d.id === op.dividaVinculadaId) : null;
  const temVinculo = op.valorVinculadoDivida !== null && op.valorVinculadoDivida !== undefined && op.valorVinculadoDivida !== 0;
  const valorVinculadoAbs = Math.abs(op.valorVinculadoDivida || 0);
  const isAmortizacao = (op.valorVinculadoDivida || 0) > 0;

  return (
    <>
      <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
          <div className="flex flex-col gap-1 items-start">
            <span className="underline decoration-slate-200 dark:decoration-slate-600 underline-offset-4">{op.ativo}</span>
            {op.grupoEstrategia && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFiltrarEstrategia?.(op.grupoEstrategia!);
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 transition-colors cursor-pointer"
                title={`Filtrar por esta estratégia: ${op.grupoEstrategia}`}
              >
                <Layers className="w-2.5 h-2.5 text-indigo-500" />
                <span>{op.grupoEstrategia}</span>
              </button>
            )}
            {temVinculo && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                isAmortizacao
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}>
                {isAmortizacao ? (
                  <>💰 {formatCurrency(valorVinculadoAbs)} amortizado em {dividaVinculada?.nome || 'dívida'}</>
                ) : (
                  <>📌 {formatCurrency(valorVinculadoAbs)} registrado como dívida em {dividaVinculada?.nome || 'dívida'}</>
                )}
              </span>
            )}
          </div>
        </td>
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
        <td className="px-3 py-3 text-right">
          <div className={`font-mono tracking-tighter font-medium ${op.resultadoFinal! >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(op.resultadoFinal!)}
          </div>
          {temVinculo && op.valorContadoComoResultadoOpcoes !== null && op.valorContadoComoResultadoOpcoes !== undefined && (
            <div className="text-[10px] text-slate-400 font-mono">
              Opções: {formatCurrency(op.valorContadoComoResultadoOpcoes)}
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <button 
              onClick={onAgrupar}
              title={op.grupoEstrategia ? `Gerenciar estratégia (${op.grupoEstrategia})` : "Agrupar em estratégia"}
              className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
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
                  if (evt.tipo === 'divisao') dotColor = "bg-sky-500";
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
