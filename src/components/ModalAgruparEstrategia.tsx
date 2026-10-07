import React, { useState } from 'react';
import { X, Layers, Plus, Unlink, Check, Search } from 'lucide-react';
import { Operacao } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ModalAgruparEstrategiaProps {
  isOpen: boolean;
  op: Operacao;
  todasOperacoes: Operacao[];
  gruposExistentes: string[];
  onClose: () => void;
  onSalvar: (opIds: string[], novoGrupo: string | null) => void;
}

export function ModalAgruparEstrategia({
  isOpen,
  op,
  todasOperacoes,
  gruposExistentes,
  onClose,
  onSalvar
}: ModalAgruparEstrategiaProps) {
  if (!isOpen) return null;

  const [modo, setModo] = useState<'existente' | 'novo'>(
    gruposExistentes.length > 0 && op.grupoEstrategia && gruposExistentes.includes(op.grupoEstrategia)
      ? 'existente'
      : gruposExistentes.length > 0
        ? 'existente'
        : 'novo'
  );
  const [grupoSelecionado, setGrupoSelecionado] = useState<string>(
    op.grupoEstrategia || (gruposExistentes.length > 0 ? gruposExistentes[0] : '')
  );
  const [novoNomeGrupo, setNovoNomeGrupo] = useState<string>('');
  
  // Selected other operations to group together
  const [outrasOpSelecionadas, setOutrasOpSelecionadas] = useState<string[]>([]);
  const [buscaOutras, setBuscaOutras] = useState('');

  // Other operations available to join this group
  const outrasOperacoes = todasOperacoes.filter(o => o.id !== op.id);
  const outrasFiltradas = outrasOperacoes.filter(o => {
    if (!buscaOutras) return true;
    const termo = buscaOutras.toLowerCase();
    return o.ativo.toLowerCase().includes(termo) ||
      (o.grupoEstrategia && o.grupoEstrategia.toLowerCase().includes(termo));
  });

  const toggleOutraOp = (id: string) => {
    setOutrasOpSelecionadas(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const nomeFinalGrupo = modo === 'existente' ? grupoSelecionado.trim() : novoNomeGrupo.trim();
  const podeSalvar = nomeFinalGrupo.length > 0;

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeSalvar) return;
    const todosIds = [op.id, ...outrasOpSelecionadas];
    onSalvar(todosIds, nomeFinalGrupo);
    onClose();
  };

  const handleDesagruparApenasEsta = () => {
    onSalvar([op.id], null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Agrupar em Estratégia
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reúna pernas de opções para acompanhar o resultado conjunto
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSalvar} className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Operação atual info */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{op.ativo}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  op.direcaoInicial === 'V' 
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                }`}>
                  {op.direcaoInicial === 'V' ? 'VENDA' : 'COMPRA'} {op.tipoOpcao}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  op.status === 'aberta' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {op.status === 'aberta' ? 'Aberta' : 'Encerrada'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Strike {formatCurrency(op.strikeAtual)} • Venc: {formatDate(op.vencimentoAtual)}
              </p>
            </div>

            {op.grupoEstrategia && (
              <button
                type="button"
                onClick={handleDesagruparApenasEsta}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
                title="Remove esta perna do grupo sem apagar a operação"
              >
                <Unlink className="w-3.5 h-3.5" />
                Desagrupar
              </button>
            )}
          </div>

          {/* Seletor de Modo de Estratégia */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Nome da Estratégia
            </label>

            {gruposExistentes.length > 0 && (
              <div className="flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModo('existente')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    modo === 'existente'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Selecionar Existente
                </button>
                <button
                  type="button"
                  onClick={() => setModo('novo')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    modo === 'novo'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  Criar Nova
                </button>
              </div>
            )}

            {modo === 'existente' && gruposExistentes.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={grupoSelecionado}
                  onChange={(e) => setGrupoSelecionado(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {gruposExistentes.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Esta operação será vinculada ao grupo selecionado.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Ex: Trava de Alta PETR4, Iron Condor, Straddle BOVA11..."
                  value={novoNomeGrupo}
                  onChange={(e) => setNovoNomeGrupo(e.target.value)}
                  autoFocus
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Digite um nome de sua preferência para identificar a estratégia e todas as suas pernas.
                </p>
              </div>
            )}
          </div>

          {/* Adicionar outras pernas juntas */}
          {outrasOperacoes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reunir outras operações nesta estratégia ({outrasOpSelecionadas.length} selecionada{outrasOpSelecionadas.length === 1 ? '' : 's'})
                </label>
                {outrasOperacoes.length > 4 && (
                  <div className="relative w-36">
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={buscaOutras}
                      onChange={(e) => setBuscaOutras(e.target.value)}
                      className="w-full text-[11px] rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 focus:outline-none"
                    />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Selecione abaixo as outras pernas que compõem esta mesma operação estruturada:
              </p>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50/50 dark:bg-slate-900/30">
                {outrasFiltradas.map(o => {
                  const isChecked = outrasOpSelecionadas.includes(o.id);
                  return (
                    <label
                      key={o.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer border text-xs transition-colors ${
                        isChecked
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-200'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOutraOp(o.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{o.ativo}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              ({o.direcaoInicial === 'V' ? 'Venda' : 'Compra'} {o.tipoOpcao})
                            </span>
                            <span className={`px-1 rounded text-[9px] font-bold ${
                              o.status === 'aberta'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {o.status === 'aberta' ? 'Aberta' : 'Encerrada'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Strike {formatCurrency(o.strikeAtual)} • Venc: {formatDate(o.vencimentoAtual)}
                            {o.grupoEstrategia && (
                              <span className="ml-1 text-indigo-500">• Grupo atual: {o.grupoEstrategia}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}

                {outrasFiltradas.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-3">
                    Nenhuma outra operação encontrada.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!podeSalvar}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-md text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Salvar Estratégia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
