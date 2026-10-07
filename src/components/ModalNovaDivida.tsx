import React, { useState } from 'react';
import { X, Calendar, DollarSign, Percent, AlertCircle } from 'lucide-react';

interface ModalNovaDividaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: {
    nome: string;
    descricao?: string;
    saldoInicial: number;
    dataInicio: string;
    taxaJurosMensalPercent: number;
  }) => void;
}

export function ModalNovaDivida({ isOpen, onClose, onConfirm }: ModalNovaDividaProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [taxaJurosMensal, setTaxaJurosMensal] = useState('0');
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const valorSaldo = parseFloat(saldoInicial.replace(',', '.'));
    const valorTaxa = parseFloat(taxaJurosMensal.replace(',', '.'));

    if (!nome.trim()) {
      setErro('Por favor, informe o nome ou descrição da dívida / estrutura.');
      return;
    }

    if (isNaN(valorSaldo) || valorSaldo <= 0) {
      setErro('O saldo inicial deve ser um número maior que zero.');
      return;
    }

    if (isNaN(valorTaxa) || valorTaxa < 0) {
      setErro('A taxa de juros deve ser 0 ou maior (ex: 1.1 para 1,1% ao mês).');
      return;
    }

    onConfirm({
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      saldoInicial: valorSaldo,
      dataInicio,
      taxaJurosMensalPercent: valorTaxa
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
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Nova Dívida / Estrutura Travada
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cadastre a dívida para acompanhar as amortizações com prêmios de opções
            </p>
          </div>
          <button 
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
              placeholder="Ex: Trava Movida/Ambev, Empréstimo Pessoal, etc."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição / Observação <span className="font-normal text-slate-400">(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Estrutura pra liberar margem, recomprada com dívida travada"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Saldo Inicial (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Taxa de Juros Mensal (% a.m.)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.0"
                  value={taxaJurosMensal}
                  onChange={(e) => setTaxaJurosMensal(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Coloque 0 se não incidir juros mensais.</p>
            </div>
          </div>

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
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Cadastrar Dívida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
