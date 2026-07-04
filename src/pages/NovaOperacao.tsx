import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOperations } from '@/store/OperationsContext';

export default function NovaOperacao() {
  const { addOperacao } = useOperations();
  const navigate = useNavigate();

  const [direcaoInicial, setDirecaoInicial] = useState<'C' | 'V'>('V');
  const [ativo, setAtivo] = useState('');
  const [tipoOpcao, setTipoOpcao] = useState<'PUT' | 'CALL'>('PUT');
  const [strikeInicial, setStrikeInicial] = useState('');
  const [quantidadeInicial, setQuantidadeInicial] = useState('');
  const [precoMedioOriginal, setPrecoMedioOriginal] = useState('');
  const [dataAbertura, setDataAbertura] = useState(new Date().toISOString().split('T')[0]);
  const [vencimentoAtual, setVencimentoAtual] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ativo || !strikeInicial || !quantidadeInicial || !precoMedioOriginal || !dataAbertura || !vencimentoAtual) return;

    addOperacao({
      ativo: ativo.toUpperCase(),
      tipoOpcao,
      direcaoInicial,
      strikeInicial: parseFloat(strikeInicial),
      quantidadeInicial: parseInt(quantidadeInicial, 10),
      precoMedioOriginal: parseFloat(precoMedioOriginal),
      dataAbertura,
      vencimentoAtual,
    });

    navigate('/abertas');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Nova Operação</h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-4 rounded-md card-shadow border border-slate-200 dark:border-slate-700 space-y-4">
        
        {/* Direção */}
        <div>
          <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Direção Inicial</label>
          <div className="flex rounded shadow-sm">
            <button
              type="button"
              onClick={() => setDirecaoInicial('V')}
              className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-l-sm border ${direcaoInicial === 'V' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
            >
              Venda (Lançamento)
            </button>
            <button
              type="button"
              onClick={() => setDirecaoInicial('C')}
              className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-r-sm border-y border-r ${direcaoInicial === 'C' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
            >
              Compra (Titular)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Ativo (Ticker)</label>
            <input
              type="text"
              required
              placeholder="Ex: PETR4"
              value={ativo}
              onChange={(e) => setAtivo(e.target.value)}
              className="w-full rounded-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Tipo de Opção</label>
            <select
              value={tipoOpcao}
              onChange={(e) => setTipoOpcao(e.target.value as 'PUT' | 'CALL')}
              className="w-full rounded-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PUT">PUT (Venda)</option>
              <option value="CALL">CALL (Compra)</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Strike (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={strikeInicial}
              onChange={(e) => setStrikeInicial(e.target.value)}
              className="w-full rounded-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Quantidade</label>
            <input
              type="number"
              step="1"
              min="1"
              required
              value={quantidadeInicial}
              onChange={(e) => setQuantidadeInicial(e.target.value)}
              className="w-full rounded-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Preço (R$ por unidade)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={precoMedioOriginal}
              onChange={(e) => setPrecoMedioOriginal(e.target.value)}
              className="w-full rounded-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Data de Abertura</label>
            <input
              type="date"
              required
              value={dataAbertura}
              onChange={(e) => setDataAbertura(e.target.value)}
              className="w-full rounded-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Vencimento</label>
            <input
              type="date"
              required
              value={vencimentoAtual}
              onChange={(e) => setVencimentoAtual(e.target.value)}
              className="w-full rounded-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] uppercase tracking-wider font-bold py-2 px-4 rounded-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Salvar Operação
          </button>
        </div>
      </form>
    </div>
  );
}
