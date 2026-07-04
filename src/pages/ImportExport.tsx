import React, { useState, useRef } from 'react';
import { useOperations } from '@/store/OperationsContext';
import { Download, Upload, AlertTriangle, Trash2 } from 'lucide-react';

export default function ImportExport() {
  const { operacoes, importarDados, limparDados } = useOperations();
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(operacoes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `opcoes-control-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>, substituir: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          throw new Error('Formato inválido. O arquivo deve conter uma lista de operações.');
        }
        
        importarDados(json, substituir);
        setImportStatus({ message: `Dados importados com sucesso (${json.length} operações).`, type: 'success' });
      } catch (err: any) {
        setImportStatus({ message: `Erro ao importar: ${err.message}`, type: 'error' });
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    const confirm1 = window.confirm("ATENÇÃO: Você está prestes a apagar TODAS as operações cadastradas. Deseja continuar?");
    if (confirm1) {
      const confirm2 = window.confirm("TEM CERTEZA ABSOLUTA? Esta ação é irreversível.");
      if (confirm2) {
        limparDados();
        setImportStatus({ message: "Todos os dados foram apagados com sucesso.", type: 'success' });
      }
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold">Importar / Exportar Dados</h2>

      {importStatus.type && (
        <div className={`p-4 rounded-lg text-sm font-medium ${importStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900' : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900'}`}>
          {importStatus.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-md card-shadow border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
            <Download className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-1 text-slate-800 dark:text-slate-100">Exportar Dados</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">
            Baixe um arquivo JSON contendo todas as suas operações (abertas e encerradas). Guarde-o como backup.
          </p>
          <button 
            onClick={handleExport}
            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 py-2 rounded-sm text-[9px] uppercase tracking-wider font-bold transition-colors shadow-sm"
          >
            Fazer Download (.json)
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-md card-shadow border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
            <Upload className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-1 text-slate-800 dark:text-slate-100">Importar Dados</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">
            Restaure um backup anterior. Você pode mesclar com as operações atuais ou substituir tudo.
          </p>
          
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={(e) => handleImport(e, false)} 
          />
          
          <div className="flex w-full gap-2">
            <button 
              onClick={() => {
                if(fileInputRef.current) {
                  fileInputRef.current.onchange = (e) => handleImport(e as any, false);
                  fileInputRef.current.click();
                }
              }}
              className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 py-2 rounded-sm text-[9px] uppercase tracking-wider font-bold transition-colors shadow-sm"
            >
              Mesclar
            </button>
            <button 
              onClick={() => {
                if(window.confirm('Isso vai apagar todos os dados atuais e carregar apenas os do arquivo. Tem certeza?')) {
                  if(fileInputRef.current) {
                    fileInputRef.current.onchange = (e) => handleImport(e as any, true);
                    fileInputRef.current.click();
                  }
                }
              }}
              className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 py-2 rounded-sm text-[9px] uppercase tracking-wider font-bold transition-colors shadow-sm"
            >
              Substituir
            </button>
          </div>
        </div>
      </div>

      <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-md border border-rose-200 dark:border-rose-900/30 flex items-start gap-3">
        <div className="mt-0.5 text-rose-600 dark:text-rose-500">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-rose-800 dark:text-rose-400 mb-0.5">Zona de Perigo</h3>
          <p className="text-xs text-rose-600 dark:text-rose-300 mb-3">
            A ação abaixo apagará permanentemente todos os dados do aplicativo armazenados neste navegador.
          </p>
          <button 
            onClick={handleClear}
            className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-sm text-[9px] uppercase tracking-wider font-bold transition-colors shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar todos os dados
          </button>
        </div>
      </div>
    </div>
  );
}
