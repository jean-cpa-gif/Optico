import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useOperations } from '@/store/OperationsContext';
import { differenceInDays } from 'date-fns';

interface VencimentoAlertaProps {
  onBannerClick?: () => void;
}

export default function VencimentoAlerta({ onBannerClick }: VencimentoAlertaProps) {
  const { operacoes, dismissedBannerKey, setDismissedBannerKey } = useOperations();
  
  const abertas = operacoes.filter(op => op.status === 'aberta');
  const now = new Date();

  // Filter operations with 10 or fewer days remaining until expiration (and not already expired)
  const opsProximas = abertas.filter(op => {
    const days = differenceInDays(new Date(op.vencimentoAtual), now);
    return days >= 0 && days <= 10;
  });

  if (opsProximas.length === 0) {
    return null;
  }

  // Generate a key based on active near-expiry items to reset dismiss state if the list of near-expiry options changes
  const currentKey = opsProximas
    .map(op => `${op.id}-${op.vencimentoAtual}`)
    .sort()
    .join(',');

  if (dismissedBannerKey === currentKey) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedBannerKey(currentKey);
  };

  return (
    <div 
      id="vencimento-banner-container"
      onClick={onBannerClick}
      className={`p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg flex items-center justify-between text-amber-800 dark:text-amber-200 text-sm shadow-sm transition-all animate-fade-in ${
        onBannerClick ? 'cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-950/30' : ''
      }`}
    >
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="font-semibold text-xs sm:text-sm">
          {opsProximas.length === 1 
            ? `1 opção vence nos próximos 10 dias — considere rolar ou encerrar.`
            : `${opsProximas.length} opções vencem nos próximos 10 dias — considere rolar ou encerrar.`}
        </span>
      </div>
      <button 
        id="vencimento-banner-close"
        onClick={handleDismiss}
        className="p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 cursor-pointer transition-colors"
        aria-label="Dispensar alerta"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
