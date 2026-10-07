import React, { useState, useRef } from 'react';
import { useOperations } from '@/store/OperationsContext';
import { useDividas } from '@/store/DividasContext';
import { useAuth } from '@/store/AuthContext';
import { Download, Upload, AlertTriangle, Trash2, Cloud, CloudUpload, CloudDownload, Clock, Loader2, LogIn, CheckCircle2 } from 'lucide-react';
import CloudConfirmModal from '@/components/CloudConfirmModal';
import { ModalConfirmarExclusao } from '@/components/ModalConfirmarExclusao';
import { Operacao, Divida, BackupCompletoData } from '@/types';

export default function ImportExport() {
  const { operacoes, importarDados, limparDados, showToast } = useOperations();
  const { dividas, importarDividas } = useDividas();
  const { user, cloudBackupInfo, fazerBackupNuvem, baixarDadosNuvem } = useAuth();
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  const [cloudLoading, setCloudLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'upload' | 'download';
  } | null>(null);
  const [modalConfirmLimpar, setModalConfirmLimpar] = useState(false);
  const [modalConfirmSubstituir, setModalConfirmSubstituir] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatLastBackup = (isoDate: string | null | undefined) => {
    if (!isoDate) return 'Nenhum backup realizado ainda';
    try {
      const d = new Date(isoDate);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR')}`;
    } catch {
      return isoDate;
    }
  };

  const handleCloudBackupClick = () => {
    if (!user) {
      setImportStatus({ message: 'Faça login pelo botão no topo para salvar na nuvem.', type: 'error' });
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: 'upload'
    });
  };

  const handleCloudRestoreClick = () => {
    if (!user) {
      setImportStatus({ message: 'Faça login pelo botão no topo para acessar a nuvem.', type: 'error' });
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: 'download'
    });
  };

  const handleConfirmBackup = async () => {
    if (!user) return;
    try {
      setCloudLoading(true);
      const res = await fazerBackupNuvem(operacoes, dividas);
      setImportStatus({ 
        message: `Backup de ${res.count} operações e ${dividas.length} dívidas salvo com sucesso na nuvem!`, 
        type: 'success' 
      });
      showToast('Backup na nuvem realizado com sucesso!');
      setConfirmModal(null);
    } catch (err: any) {
      setImportStatus({ message: `Erro ao salvar na nuvem: ${err.message}`, type: 'error' });
    } finally {
      setCloudLoading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!user) return;
    try {
      setCloudLoading(true);
      const res = await baixarDadosNuvem();
      if (!res.success || !res.dados) {
        setImportStatus({ message: res.message || 'Nenhum dado encontrado na nuvem.', type: 'error' });
        setConfirmModal(null);
        return;
      }
      importarDados(res.dados, true);
      if (res.dividas && res.dividas.length > 0) {
        importarDividas(res.dividas, true);
      }
      const msgDividas = res.dividas && res.dividas.length > 0 ? ` e ${res.dividas.length} dívidas` : '';
      setImportStatus({ 
        message: `Sucesso: ${res.dados.length} operações${msgDividas} restauradas da nuvem!`, 
        type: 'success' 
      });
      showToast('Dados da nuvem restaurados com sucesso!');
      setConfirmModal(null);
    } catch (err: any) {
      setImportStatus({ message: `Erro ao baixar da nuvem: ${err.message}`, type: 'error' });
    } finally {
      setCloudLoading(false);
    }
  };

  const handleExport = () => {
    const backup: BackupCompletoData = {
      versao: 2,
      dataExportacao: new Date().toISOString(),
      operacoes,
      dividas
    };
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `opcoes-control-backup-${new Date().toISOString().split('T')[0]}.json`;
    
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
        const text = event.target?.result as string;
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error('Arquivo JSON corrompido ou formato inválido.');
        }

        let operacoesImportar: Operacao[] = [];
        let dividasImportar: Divida[] | undefined = undefined;

        if (Array.isArray(json)) {
          // Formato legado (apenas lista de operações)
          operacoesImportar = json;
        } else if (typeof json === 'object' && json !== null) {
          if (!Array.isArray(json.operacoes)) {
            throw new Error('Formato inválido. O arquivo de backup deve conter o campo "operacoes".');
          }
          operacoesImportar = json.operacoes;
          if (json.dividas !== undefined) {
            if (!Array.isArray(json.dividas)) {
              throw new Error('Formato inválido. O campo "dividas" deve ser uma lista.');
            }
            dividasImportar = json.dividas;
          }
        } else {
          throw new Error('Formato de backup não reconhecido.');
        }

        // Validação básica das operações
        for (const op of operacoesImportar) {
          if (!op.id || !op.ativo) {
            throw new Error('Uma ou mais operações no arquivo possuem estrutura inválida (sem id ou ticker).');
          }
        }

        // Validação básica das dívidas se fornecidas
        if (dividasImportar) {
          for (const d of dividasImportar) {
            if (!d.id || !d.nome || d.saldoInicial === undefined) {
              throw new Error('Uma ou mais dívidas no arquivo possuem estrutura inválida.');
            }
          }
        }

        // Importa operações
        importarDados(operacoesImportar, substituir);

        // Se o arquivo possui dívidas, importa dívidas.
        // Se for backup antigo de operações, aceita sem apagar dívidas existentes!
        if (dividasImportar !== undefined) {
          importarDividas(dividasImportar, substituir);
        }

        const msgDividas = dividasImportar ? ` e ${dividasImportar.length} dívidas` : '';
        setImportStatus({ 
          message: `Dados importados com sucesso (${operacoesImportar.length} operações${msgDividas}).`, 
          type: 'success' 
        });
        showToast('Backup importado com sucesso!');
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
    limparDados();
    setImportStatus({ message: "Todos os dados foram apagados com sucesso.", type: 'success' });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Importar, Exportar & Nuvem</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Gerencie a persistência de suas operações locais e sincronize com a nuvem.
        </p>
      </div>

      {importStatus.type && (
        <div className={`p-4 rounded-lg text-sm font-medium ${importStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900' : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900'}`}>
          {importStatus.message}
        </div>
      )}

      {/* Cloud Sync Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-xl border border-blue-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-blue-100 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Backup e Sincronização na Nuvem
                {user && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Conectado ({user.email})
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Último backup na nuvem: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatLastBackup(cloudBackupInfo?.lastBackupDate)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCloudBackupClick}
            disabled={cloudLoading || !user}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {cloudLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            Fazer Backup para Nuvem ({operacoes.length} no cache)
          </button>

          <button
            onClick={handleCloudRestoreClick}
            disabled={cloudLoading || !user}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 disabled:opacity-50 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {cloudLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4 text-emerald-500" />}
            Baixar Dados da Nuvem para Este Dispositivo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-md card-shadow border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
            <Download className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-1 text-slate-800 dark:text-slate-100">Exportar Arquivo Local</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">
            Baixe um arquivo JSON contendo todas as suas operações (abertas e encerradas) em seu computador.
          </p>
          <button 
            onClick={handleExport}
            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 py-2 rounded-sm text-[9px] uppercase tracking-wider font-bold transition-colors shadow-sm cursor-pointer"
          >
            Fazer Download (.json)
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-md card-shadow border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
            <Upload className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-1 text-slate-800 dark:text-slate-100">Importar Arquivo Local</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1">
            Restaure um backup anterior via arquivo JSON. Você pode mesclar com as operações atuais ou substituir tudo.
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
              className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 py-2 rounded-sm text-[9px] uppercase tracking-wider font-bold transition-colors shadow-sm cursor-pointer"
            >
              Mesclar
            </button>
            <button 
              onClick={() => setModalConfirmSubstituir(true)}
              className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 py-2 rounded-sm text-[9px] uppercase tracking-wider font-bold transition-colors shadow-sm cursor-pointer"
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
            onClick={() => setModalConfirmLimpar(true)}
            className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-sm text-[9px] uppercase tracking-wider font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar todos os dados locais
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Cloud Actions */}
      {confirmModal && (
        <CloudConfirmModal
          isOpen={confirmModal.isOpen}
          type={confirmModal.type}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.type === 'upload' ? handleConfirmBackup : handleConfirmRestore}
          loading={cloudLoading}
          localCount={operacoes.length}
          cloudCount={cloudBackupInfo?.totalOperacoes}
          lastBackupDate={cloudBackupInfo?.lastBackupDate}
          userEmail={user?.email}
        />
      )}

      {/* Modal de confirmação para limpar dados */}
      <ModalConfirmarExclusao
        isOpen={modalConfirmLimpar}
        titulo="Apagar Todos os Dados"
        descricao="ATENÇÃO: Você está prestes a apagar TODAS as operações cadastradas localmente neste navegador. Esta ação é definitiva."
        textoBotaoConfirmar="Sim, Apagar Tudo"
        onClose={() => setModalConfirmLimpar(false)}
        onConfirm={handleClear}
      />

      {/* Modal de confirmação para substituir dados por arquivo */}
      <ModalConfirmarExclusao
        isOpen={modalConfirmSubstituir}
        titulo="Substituir Dados Locais"
        descricao="Isso vai apagar todos os dados atuais e carregar apenas os dados contidos no arquivo JSON selecionado. Deseja prosseguir?"
        textoBotaoConfirmar="Prosseguir com Substituição"
        onClose={() => setModalConfirmSubstituir(false)}
        onConfirm={() => {
          if (fileInputRef.current) {
            fileInputRef.current.onchange = (e) => handleImport(e as any, true);
            fileInputRef.current.click();
          }
        }}
      />
    </div>
  );
}
