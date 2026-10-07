import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Percent, AlertCircle, Edit2, Info } from 'lucide-react';
import { Divida } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ModalEditarDividaProps {
  isOpen: boolean;
  divida: Divida | null;
  onClose: () => void;
  onConfirm: (id: string, dados: {
    nome: string;
    descricao?: string;
    saldoInicial: number;
    dataInicio: string;
    taxaJurosMensalPercent: number;
    status: 'aberta' | 'quitada';
  }) => void;
}

export function ModalEditarDivida({ isOpen, divida, onClose, onConfirm }: ModalEditarDividaProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [taxaJurosMensal, setTaxaJurosMensal] = useState('0');
  const [status, setStatus] = useState<'aberta' | 'quitada'>('aberta');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (divida) {
      setNome(divida.nome);
      setDescricao(divida.descricao || '');
      setSaldoInicial(divida.saldoInicial.toString());
      setDataInicio(divida.dataInicio);
      setTaxaJurosMensal(divida.taxaJurosMensalPercent.toString());
      setStatus(divida.status);
      setErro(null);
    }
  }, [divida, isOpen]);

  if (!isOpen || !divida) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const valorSaldo = parseFloat(saldoInicial.replace(',', '.'));
    const valorTaxa = parseFloat(taxaJurosMensal.replace(',', '.'));

    if (!nome.trim()) {
      setErro('Por favor, informe o nome da dívida.');
      return;
    }

    if (isNaN(valorSaldo) || valorSaldo <= 0) {
      setErro('O saldo inicial deve ser um número maior que zero.');
      return;
    }

    if (isNaN(valorTaxa) || valorTaxa < 0) {
      setErro('A taxa de juros deve ser 0 ou maior.');
      return;
    }

    onConfirm(divida.id, {
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      saldoInicial: valorSaldo,
      dataInicio,
      taxaJurosMensalPercent: valorTaxa,
      status
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Editar Dívida
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Altere informações ou corrija cadastros incorretos
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {erro && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Dívida / Estrutura *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Trava Movida/Ambev"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Motivo da dívida, contexto de margem, etc."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Saldo Inicial (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Taxa de Juros Mensal (%) *
              </label>
              <div className="relative">
                <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-semibold">% a.m.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={taxaJurosMensal}
                  onChange={(e) => setTaxaJurosMensal(e.target.value)}
                  className="w-full pl-3 pr-14 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de Início *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status da Dívida
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'aberta' | 'quitada')}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="aberta">Em Aberto</option>
                <option value="quitada">Quitada 🎉</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span>Saldo atual registrado: <strong>{formatCurrency(divida.saldoAtual)}</strong>.</span>
              <span className="block mt-0.5 text-blue-600/80 dark:text-blue-300/80">
                Se o saldo inicial for alterado, o saldo atual e os lançamentos da timeline serão recalculados automaticamente em cadeia.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
