import React from 'react';
import { 
  CloudUpload, 
  CloudDownload, 
  AlertTriangle, 
  X, 
  Loader2, 
  Clock, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';

interface CloudConfirmModalProps {
  isOpen: boolean;
  type: 'upload' | 'download';
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  localCount: number;
  cloudCount?: number | null;
  lastBackupDate?: string | null;
  userEmail?: string | null;
}

export default function CloudConfirmModal({
  isOpen,
  type,
  onClose,
  onConfirm,
  loading,
  localCount,
  cloudCount,
  lastBackupDate,
  userEmail
}: CloudConfirmModalProps) {
  if (!isOpen) return null;

  const formatDateHour = (isoDate: string | null | undefined) => {
    if (!isoDate) return 'Nenhum backup anterior registrado';
    try {
      const d = new Date(isoDate);
      return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch {
      return isoDate;
    }
  };

  const isUpload = type === 'upload';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${
          isUpload ? 'bg-blue-50/60 dark:bg-blue-950/30' : 'bg-emerald-50/60 dark:bg-emerald-950/30'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm ${
              isUpload ? 'bg-blue-600' : 'bg-emerald-600'
            }`}>
              {isUpload ? <CloudUpload className="w-5 h-5" /> : <CloudDownload className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isUpload ? 'Confirmar Backup para a Nuvem' : 'Confirmar Restauração da Nuvem'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {userEmail ? `Conta: ${userEmail}` : 'Sincronização Segura'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isUpload ? (
              <>
                Você tem certeza que deseja <strong className="text-slate-900 dark:text-white">enviar as operações do cache deste dispositivo para a nuvem</strong>?
              </>
            ) : (
              <>
                Você tem certeza que deseja <strong className="text-slate-900 dark:text-white">baixar as operações da nuvem</strong> para este dispositivo?
              </>
            )}
          </p>

          {/* Details Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Operações no dispositivo atual:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {localCount} {localCount === 1 ? 'operação' : 'operações'}
              </span>
            </div>

            {cloudCount !== undefined && cloudCount !== null && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Operações salvas na nuvem:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {cloudCount} {cloudCount === 1 ? 'operação' : 'operações'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Último backup na nuvem:
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                {formatDateHour(lastBackupDate)}
              </span>
            </div>
          </div>

          {/* Warning notice */}
          <div className={`p-3 rounded-lg border flex items-start gap-2.5 text-[11px] leading-snug ${
            isUpload 
              ? 'bg-blue-50/70 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
              : 'bg-amber-50/70 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {isUpload ? (
                <span>
                  <strong>Aviso:</strong> O backup atual na nuvem será atualizado com os dados presentes agora nesta tela ({localCount} operações).
                </span>
              ) : (
                <span>
                  <strong>Atenção:</strong> Os dados locais atuais ({localCount} operações) serão substituídos pela versão salva na nuvem.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
              isUpload 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isUpload ? 'Sim, Fazer Backup' : 'Sim, Baixar e Restaurar'}
          </button>
        </div>
      </div>
    </div>
  );
}
