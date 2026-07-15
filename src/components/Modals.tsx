import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Operacao, EventoOperacao } from '@/types';
import { formatCurrency } from '@/lib/utils';

// ==========================================
// MODAL: AUMENTAR POSIÇÃO
// ==========================================
interface ModalAumentarPosicaoProps {
  op: Operacao;
  onClose: () => void;
  onConfirm: (quantidade: number, preco: number, data: string) => void;
}

export function ModalAumentarPosicao({ op, onClose, onConfirm }: ModalAumentarPosicaoProps) {
  const [quantidade, setQuantidade] = useState('100');
  const [preco, setPreco] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [tipoAjuste, setTipoAjuste] = useState<'aumento' | 'reducao'>('aumento');

  const parsedQty = parseInt(quantidade, 10) || 0;
  
  // Se o usuário digitou um número negativo, tratamos automaticamente como redução.
  const effectiveTipo = parsedQty < 0 ? 'reducao' : tipoAjuste;
  
  // Calculamos a quantidade com o sinal correto.
  const qty = effectiveTipo === 'reducao' ? -Math.abs(parsedQty) : Math.abs(parsedQty);
  const prc = parseFloat(preco) || 0;

  const isVenda = op.direcaoInicial === 'V';
  const valorFinanceiroDaAdicao = qty * prc;
  
  let novoPremioAcumulado = op.premioLiquidoAcumulado;
  if (isVenda) {
    novoPremioAcumulado += valorFinanceiroDaAdicao;
  } else {
    novoPremioAcumulado -= valorFinanceiroDaAdicao;
  }

  const novaQuantidade = op.quantidadeAtual + qty;
  const novoPrecoMedio = novaQuantidade > 0 ? Math.abs(novoPremioAcumulado) / novaQuantidade : 0;

  const erroExcessoReducao = effectiveTipo === 'reducao' && Math.abs(qty) > op.quantidadeAtual;
  const isButtonDisabled = qty === 0 || prc <= 0 || erroExcessoReducao;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-800 animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Ajustar Posição em {op.ativo}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Seletor de Tipo de Ajuste */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded border border-slate-200/40 dark:border-slate-700/40">
            <button
              type="button"
              onClick={() => {
                setTipoAjuste('aumento');
                if (parsedQty < 0) {
                  setQuantidade(Math.abs(parsedQty).toString());
                }
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-sm transition-all cursor-pointer text-center ${
                effectiveTipo === 'aumento'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Aumentar Posição
            </button>
            <button
              type="button"
              onClick={() => setTipoAjuste('reducao')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-sm transition-all cursor-pointer text-center ${
                effectiveTipo === 'reducao'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Diminuir Posição
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {effectiveTipo === 'reducao' ? 'Quantidade a Reduzir' : 'Quantidade a Adicionar'}
              </label>
              <input 
                type="number" step="1" required value={quantidade} 
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder={effectiveTipo === 'reducao' ? 'Ex: 100' : 'Ex: 100'}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {isVenda 
                  ? (effectiveTipo === 'reducao' ? 'Preço de Recompra (R$)' : 'Preço de Venda (R$)')
                  : (effectiveTipo === 'reducao' ? 'Preço de Venda (R$)' : 'Preço de Compra (R$)')
                }
              </label>
              <input 
                type="number" step="0.01" min="0" required value={preco} onChange={(e) => setPreco(e.target.value)}
                className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: 1.50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Data do Ajuste</label>
            <input 
              type="date" required value={data} onChange={(e) => setData(e.target.value)}
              className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Erro de Excesso de Redução */}
          {erroExcessoReducao && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 rounded text-xs flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                A quantidade a reduzir ({Math.abs(qty)}) é maior do que a quantidade atualmente aberta nesta operação ({op.quantidadeAtual} un).
              </span>
            </div>
          )}

          <div className="bg-amber-50/50 dark:bg-amber-950/10 p-3.5 rounded border border-amber-200/50 dark:border-amber-900/20 space-y-2">
            <h4 className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Preview do Novo Estado</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-400">Quantidade Atual:</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{op.quantidadeAtual} un</p>
              </div>
              <div>
                <p className="text-slate-400">Nova Quantidade:</p>
                <p className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  {novaQuantidade} un
                </p>
              </div>
              <div>
                <p className="text-slate-400">Novo Preço Médio:</p>
                <p className="font-bold font-mono text-slate-800 dark:text-slate-200">{formatCurrency(novoPrecoMedio)}</p>
              </div>
              <div>
                <p className="text-slate-400">Novo Prêmio Acumulado:</p>
                <p className={`font-bold font-mono ${novoPremioAcumulado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrency(novoPremioAcumulado)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onClose} className="flex-1 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm cursor-pointer text-center">
            Cancelar
          </button>
          <button 
            onClick={() => !isButtonDisabled && onConfirm(qty, prc, data)} 
            disabled={isButtonDisabled}
            className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-sm text-xs transition-colors shadow-sm cursor-pointer text-center"
          >
            {effectiveTipo === 'reducao' ? 'Confirmar Redução' : 'Confirmar Aumento'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: EDITAR OPERAÇÃO COMPLETAMENTE
// ==========================================
interface ModalEditarOperacaoProps {
  op: Operacao;
  onClose: () => void;
  onConfirm: (campos: Partial<Operacao>) => void;
}

export function ModalEditarOperacao({ op, onClose, onConfirm }: ModalEditarOperacaoProps) {
  const [ativo, setAtivo] = useState(op.ativo);
  const [tipoOpcao, setTipoOpcao] = useState(op.tipoOpcao);
  const [direcaoInicial, setDirecaoInicial] = useState(op.direcaoInicial);
  const [strikeInicial, setStrikeInicial] = useState(op.strikeInicial.toString());
  const [quantidadeInicial, setQuantidadeInicial] = useState(op.quantidadeInicial.toString());
  const [precoMedioOriginal, setPrecoMedioOriginal] = useState(op.precoMedioOriginal.toString());
  const [dataAbertura, setDataAbertura] = useState(op.dataAbertura);
  const [vencimentoAtual, setVencimentoAtual] = useState(op.vencimentoAtual);
  const [status, setStatus] = useState(op.status);
  
  // closed operation parameters
  const [precoEncerramento, setPrecoEncerramento] = useState(op.precoEncerramento?.toString() || '');
  const [dataEncerramento, setDataEncerramento] = useState(op.dataEncerramento || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const campos: Partial<Operacao> = {
      ativo: ativo.toUpperCase(),
      tipoOpcao,
      direcaoInicial,
      strikeInicial: parseFloat(strikeInicial) || 0,
      quantidadeInicial: parseInt(quantidadeInicial, 10) || 0,
      precoMedioOriginal: parseFloat(precoMedioOriginal) || 0,
      dataAbertura,
      vencimentoAtual,
      status,
    };

    if (status === 'encerrada') {
      campos.precoEncerramento = parseFloat(precoEncerramento) || 0;
      campos.dataEncerramento = dataEncerramento || new Date().toISOString().split('T')[0];
    } else {
      campos.precoEncerramento = null;
      campos.dataEncerramento = null;
    }

    onConfirm(campos);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-lg w-full shadow-xl border border-slate-200 dark:border-slate-800 my-auto">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Editar Operação</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Ativo (Ticker)</label>
                <input 
                  type="text" required value={ativo} onChange={(e) => setAtivo(e.target.value)}
                  className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm uppercase font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Tipo de Opção</label>
                <select 
                  value={tipoOpcao} onChange={(e) => setTipoOpcao(e.target.value as 'PUT' | 'CALL')}
                  className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm"
                >
                  <option value="PUT">PUT</option>
                  <option value="CALL">CALL</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Direção Inicial</label>
                <select 
                  value={direcaoInicial} onChange={(e) => setDirecaoInicial(e.target.value as 'C' | 'V')}
                  className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-semibold text-amber-600 dark:text-amber-500"
                >
                  <option value="V">VENDA (Lançamento)</option>
                  <option value="C">COMPRA (Titular)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Status</label>
                <select 
                  value={status} onChange={(e) => setStatus(e.target.value as 'aberta' | 'encerrada')}
                  className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm"
                >
                  <option value="aberta">Aberta</option>
                  <option value="encerrada">Encerrada</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Strike Inicial (R$)</label>
                <input 
                  type="number" step="0.01" min="0" required value={strikeInicial} onChange={(e) => setStrikeInicial(e.target.value)}
                  className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Quantidade Inicial</label>
                <input 
                  type="number" step="1" min="1" required value={quantidadeInicial} onChange={(e) => setQuantidadeInicial(e.target.value)}
                  className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Preço Médio Inicial (R$)</label>
                <input 
                  type="number" step="0.01" min="0" required value={precoMedioOriginal} onChange={(e) => setPrecoMedioOriginal(e.target.value)}
                  className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Data de Abertura</label>
                <input 
                  type="date" required value={dataAbertura} onChange={(e) => setDataAbertura(e.target.value)}
                  className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Vencimento Atual</label>
                <input 
                  type="date" required value={vencimentoAtual} onChange={(e) => setVencimentoAtual(e.target.value)}
                  className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm"
                />
              </div>
            </div>

            {status === 'encerrada' && (
              <div className="p-3 bg-rose-50/30 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/20 rounded grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <h4 className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Informações de Encerramento</h4>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Preço de Encerramento (R$)</label>
                  <input 
                    type="number" step="0.01" min="0" required={status === 'encerrada'} value={precoEncerramento} onChange={(e) => setPrecoEncerramento(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Data de Encerramento</label>
                  <input 
                    type="date" required={status === 'encerrada'} value={dataEncerramento} onChange={(e) => setDataEncerramento(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm"
                  />
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-slate-400 text-center italic pt-1">
              Nota: Ao salvar, todo o prêmio líquido e preços médios serão recalculados automaticamente preservando rolagens e aumentos de posição cadastrados.
            </p>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm">Cancelar</button>
            <button type="submit" className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-sm text-xs transition-colors shadow-sm">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: EXCLUIR OPERAÇÃO DEFINITIVAMENTE
// ==========================================
interface ModalExcluirOperacaoProps {
  op: Operacao;
  onClose: () => void;
  onConfirm: () => void;
}

export function ModalExcluirOperacao({ op, onClose, onConfirm }: ModalExcluirOperacaoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-sm w-full shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="p-5 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-950/50 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Excluir operação permanentemente?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Você tem certeza de que deseja deletar a operação de <span className="font-semibold text-slate-800 dark:text-slate-200">{op.ativo}</span>?
            </p>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-2 rounded border border-rose-200/50 dark:border-rose-900/10">
              Esta ação apagará permanentemente a operação inteira do sistema (não irá para o histórico). Você poderá usar o botão Desfazer se mudar de ideia.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onClose} className="flex-1 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-sm text-xs transition-colors shadow-sm">Excluir</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: EDITAR EVENTO INDIVIDUAL (timeline)
// ==========================================
interface ModalEditarEventoProps {
  op: Operacao;
  evento: EventoOperacao;
  onClose: () => void;
  onConfirm: (novosCampos: Partial<EventoOperacao>) => void;
}

export function ModalEditarEvento({ op, evento, onClose, onConfirm }: ModalEditarEventoProps) {
  const [data, setData] = useState(evento.data);

  // aumento specific fields
  const [quantidade, setQuantidade] = useState(evento.quantidade?.toString() || '');
  const [preco, setPreco] = useState(evento.preco?.toString() || '');

  // rolagem specific fields
  const [strikeAnterior, setStrikeAnterior] = useState(evento.strikeAnterior?.toString() || '');
  const [strikeNovo, setStrikeNovo] = useState(evento.strikeNovo?.toString() || '');
  const [quantidadeAnterior, setQuantidadeAnterior] = useState(evento.quantidadeAnterior?.toString() || '');
  const [quantidadeNova, setQuantidadeNova] = useState(evento.quantidadeNova?.toString() || '');
  const [precoRecompra, setPrecoRecompra] = useState(evento.precoRecompra?.toString() || '');
  const [precoVendaNova, setPrecoVendaNova] = useState(evento.precoVendaNova?.toString() || '');
  const [novoVencimento, setNovoVencimento] = useState(evento.novoVencimento || '');

  // abertura specific fields
  const [strike, setStrike] = useState(evento.strike?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const novosCampos: Partial<EventoOperacao> = {
      data
    };

    if (evento.tipo === 'aumento') {
      novosCampos.quantidade = parseInt(quantidade, 10) || 0;
      novosCampos.preco = parseFloat(preco) || 0;
    } else if (evento.tipo === 'rolagem') {
      novosCampos.strikeAnterior = parseFloat(strikeAnterior) || 0;
      novosCampos.strikeNovo = parseFloat(strikeNovo) || 0;
      novosCampos.quantidadeAnterior = parseInt(quantidadeAnterior, 10) || 0;
      novosCampos.quantidadeNova = parseInt(quantidadeNova, 10) || 0;
      novosCampos.precoRecompra = parseFloat(precoRecompra) || 0;
      novosCampos.precoVendaNova = parseFloat(precoVendaNova) || 0;
      novosCampos.novoVencimento = novoVencimento;
    } else if (evento.tipo === 'abertura') {
      novosCampos.quantidade = parseInt(quantidade, 10) || 0;
      novosCampos.preco = parseFloat(preco) || 0;
      novosCampos.strike = parseFloat(strike) || 0;
    }

    onConfirm(novosCampos);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wider">
            Editar Evento: {evento.tipo === 'abertura' ? 'Abertura' : evento.tipo === 'rolagem' ? 'Rolagem' : 'Aumento de Posição'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Data do Evento</label>
              <input 
                type="date" required value={data} onChange={(e) => setData(e.target.value)}
                className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm"
              />
            </div>

            {evento.tipo === 'aumento' && (
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Quantidade Adicionada</label>
                  <input 
                    type="number" step="1" min="1" required value={quantidade} onChange={(e) => setQuantidade(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Preço Unitário (R$)</label>
                  <input 
                    type="number" step="0.01" min="0" required value={preco} onChange={(e) => setPreco(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                  />
                </div>
              </>
            )}

            {evento.tipo === 'abertura' && (
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Quantidade Inicial</label>
                  <input 
                    type="number" step="1" min="1" required value={quantidade} onChange={(e) => setQuantidade(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Preço Unitário Inicial (R$)</label>
                  <input 
                    type="number" step="0.01" min="0" required value={preco} onChange={(e) => setPreco(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Strike Inicial (R$)</label>
                  <input 
                    type="number" step="0.01" min="0" required value={strike} onChange={(e) => setStrike(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                  />
                </div>
              </>
            )}

            {evento.tipo === 'rolagem' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Qtd Anterior</label>
                  <input 
                    type="number" step="1" required value={quantidadeAnterior} onChange={(e) => setQuantidadeAnterior(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Qtd Nova</label>
                  <input 
                    type="number" step="1" required value={quantidadeNova} onChange={(e) => setQuantidadeNova(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Strike Anterior (R$)</label>
                  <input 
                    type="number" step="0.01" required value={strikeAnterior} onChange={(e) => setStrikeAnterior(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Strike Novo (R$)</label>
                  <input 
                    type="number" step="0.01" required value={strikeNovo} onChange={(e) => setStrikeNovo(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Preço Recompra (R$)</label>
                  <input 
                    type="number" step="0.01" required value={precoRecompra} onChange={(e) => setPrecoRecompra(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Preço Venda Nova (R$)</label>
                  <input 
                    type="number" step="0.01" required value={precoVendaNova} onChange={(e) => setPrecoVendaNova(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Novo Vencimento</label>
                  <input 
                    type="date" required value={novoVencimento} onChange={(e) => setNovoVencimento(e.target.value)}
                    className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm"
                  />
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-slate-400 text-center italic pt-1">
              Nota: Alterar esses valores recalcula a operação inteira.
            </p>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm">Cancelar</button>
            <button type="submit" className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-sm text-xs transition-colors shadow-sm">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}
