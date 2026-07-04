import { useState } from 'react';
import { useOperations } from '@/store/OperationsContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { Operacao } from '@/types';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

export default function OperacoesAbertas() {
  const { operacoes, rolarOperacao, encerrarOperacao } = useOperations();
  const abertas = operacoes.filter(op => op.status === 'aberta');

  const [encerrarModal, setEncerrarModal] = useState<{ op: Operacao | null; open: boolean }>({ op: null, open: false });
  const [rolarModal, setRolarModal] = useState<{ op: Operacao | null; open: boolean }>({ op: null, open: false });
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
    </div>
  );
}

function OperacaoCard({ op, onEncerrar, onRolar, isExpanded, onToggleExpand }: { op: Operacao, onEncerrar: () => void, onRolar: () => void, isExpanded: boolean, onToggleExpand: () => void }) {
  const daysLeft = differenceInDays(new Date(op.vencimentoAtual), new Date());
  
  let daysColor = "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20";
  if (daysLeft <= 15 && daysLeft > 5) daysColor = "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20";
  if (daysLeft <= 5) daysColor = "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-md card-shadow border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-all">
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
          <div className={`px-2 py-0.5 rounded-sm text-[9px] font-bold ${daysColor}`}>
            {daysLeft} dias
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Quantidade</p>
            <p className="font-bold font-mono text-sm text-slate-800 dark:text-slate-200">{op.quantidadeAtual}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Strike Atual</p>
            <p className="font-bold font-mono text-sm text-slate-800 dark:text-slate-200">{formatCurrency(op.strikeAtual)}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Preço Médio</p>
            <p className="font-bold font-mono text-sm text-slate-800 dark:text-slate-200">{formatCurrency(op.precoMedioAtual)}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Vencimento</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{formatDate(op.vencimentoAtual)}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Prêmio Líquido</p>
          <p className={`text-lg font-bold font-mono tracking-tighter ${op.premioLiquidoAcumulado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(op.premioLiquidoAcumulado)}
          </p>
        </div>
      </div>

      {op.historicoRolagens.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          <button 
            onClick={onToggleExpand}
            className="w-full px-4 py-2 text-[9px] uppercase font-bold text-slate-500 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors tracking-wider"
          >
            Ver histórico de rolagens ({op.historicoRolagens.length})
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          
          {isExpanded && (
            <div className="px-4 pb-3 bg-slate-50 dark:bg-slate-700/30">
              <div className="space-y-3 pt-1">
                {op.historicoRolagens.map((rolagem, idx) => (
                  <div key={idx} className="text-xs border-l-2 border-blue-500 pl-3">
                    <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">{formatDate(rolagem.data)}</p>
                    <div className="grid grid-cols-2 gap-2 text-slate-500 dark:text-slate-400">
                      <div><span className="opacity-70 font-semibold text-[10px] uppercase tracking-wider">Qtd:</span> {rolagem.quantidadeAnterior} → {rolagem.quantidadeNova}</div>
                      <div><span className="opacity-70 font-semibold text-[10px] uppercase tracking-wider">Strike:</span> {rolagem.strikeAnterior} → {rolagem.strikeNovo}</div>
                      <div><span className="opacity-70 font-semibold text-[10px] uppercase tracking-wider">Preço C/V:</span> {rolagem.precoRecompra} / {rolagem.precoVendaNova}</div>
                      <div><span className="opacity-70 font-semibold text-[10px] uppercase tracking-wider">Venc:</span> {formatDate(rolagem.novoVencimento)}</div>
                    </div>
                    <p className={`mt-2 font-mono font-bold tracking-tighter ${rolagem.premioLiquidoDaRolagem >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      Resultado da rolagem: {formatCurrency(rolagem.premioLiquidoDaRolagem)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex gap-2">
        <button 
          onClick={onEncerrar}
          className="flex-1 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-sm shadow-sm text-[10px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
        >
          Encerrar
        </button>
        <button 
          onClick={onRolar}
          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm shadow-sm text-[10px] uppercase tracking-wider font-bold transition-colors"
        >
          Rolar
        </button>
      </div>
    </div>
  );
}

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
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold">Encerrar Operação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data do Encerramento
            </label>
            <input 
              type="date" required value={data} onChange={(e) => setData(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preço de {isVenda ? 'Recompra' : 'Venda'} (R$)
            </label>
            <input 
              type="number" step="0.01" min="0" required value={preco} onChange={(e) => setPreco(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mt-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Resultado Final Projetado</p>
            <p className={`text-xl font-bold font-mono ${resultadoProjetado >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
              {formatCurrency(resultadoProjetado)}
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancelar</button>
          <button 
            onClick={() => p > 0 && onConfirm(p, data)} 
            disabled={p <= 0}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Confirmar
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
    // Para compra inicial, rolar = vender antiga, comprar nova
    premioLiquidoDaRolagem = (op.quantidadeAtual * pr) - (qn * pvn); // pr here is assumed "preco de venda da perna antiga", pvn is "preco de recompra da nova"
    // To keep it simple, we label the inputs accordingly
  }

  const novoPremioAcumulado = op.premioLiquidoAcumulado + premioLiquidoDaRolagem;
  const novoPrecoMedio = Math.abs(novoPremioAcumulado) / qn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full shadow-xl border border-gray-200 dark:border-gray-800 my-auto">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold">Rolar Operação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data da Rolagem</label>
              <input type="date" required value={data} onChange={(e) => setData(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isVenda ? 'Preço Recompra Atual (R$)' : 'Preço Venda Atual (R$)'}
              </label>
              <input type="number" step="0.01" min="0" required value={precoRecompra} onChange={(e) => setPrecoRecompra(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isVenda ? 'Preço Venda Nova (R$)' : 'Preço Compra Nova (R$)'}
              </label>
              <input type="number" step="0.01" min="0" required value={precoVendaNova} onChange={(e) => setPrecoVendaNova(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova Quantidade</label>
              <input type="number" step="1" min="1" required value={quantidadeNova} onChange={(e) => setQuantidadeNova(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Novo Strike (R$)</label>
              <input type="number" step="0.01" min="0.01" required value={strikeNovo} onChange={(e) => setStrikeNovo(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Novo Vencimento</label>
              <input type="date" required value={novoVencimento} onChange={(e) => setNovoVencimento(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mt-4 border border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Resultado desta Rolagem</span>
              <span className={`font-bold font-mono ${premioLiquidoDaRolagem >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                {formatCurrency(premioLiquidoDaRolagem)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Novo Prêmio Acumulado</span>
              <span className={`font-bold font-mono ${novoPremioAcumulado >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                {formatCurrency(novoPremioAcumulado)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Novo Preço Médio (Ref)</span>
              <span className="font-bold font-mono">{formatCurrency(novoPrecoMedio)}</span>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancelar</button>
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
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Confirmar Rolagem
          </button>
        </div>
      </div>
    </div>
  );
}
