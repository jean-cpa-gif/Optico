import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ModalConfirmarExclusaoProps {
  isOpen: boolean;
  titulo: string;
  descricao: React.ReactNode;
  textoBotaoConfirmar?: string;
  tipoPerigo?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ModalConfirmarExclusao({
  isOpen,
  titulo,
  descricao,
  textoBotaoConfirmar = 'Excluir',
  tipoPerigo = true,
  onClose,
  onConfirm
}: ModalConfirmarExclusaoProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {titulo}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {descricao}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm ${
                tipoPerigo
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {textoBotaoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
