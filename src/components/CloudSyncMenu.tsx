import React, { useState, useRef, useEffect } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  Check, 
  Loader2, 
  X, 
  ShieldCheck, 
  HardDrive,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { useOperations } from '@/store/OperationsContext';
import { useDividas } from '@/store/DividasContext';
import { cn, formatDate } from '@/lib/utils';
import CloudConfirmModal from './CloudConfirmModal';

export default function CloudSyncMenu() {
  const { 
    user, 
    loading, 
    cloudBackupInfo, 
    checkingCloud, 
    loginWithGoogle, 
    loginWithEmail, 
    signUpWithEmail, 
    logout, 
    fazerBackupNuvem, 
    baixarDadosNuvem 
  } = useAuth();
  
  const { operacoes, importarDados, showToast } = useOperations();
  const { dividas, importarDividas } = useDividas();

  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'upload' | 'download';
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  const formatLastBackup = (isoDate: string | null | undefined) => {
    if (!isoDate) return 'Nenhum backup realizado';
    try {
      const d = new Date(isoDate);
      const dataStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `${dataStr} às ${horaStr}`;
    } catch {
      return isoDate;
    }
  };

  const handleBackupClick = () => {
    if (!user) {
      setIsOpen(false);
      setShowAuthModal(true);
      return;
    }
    setIsOpen(false);
    setConfirmModal({
      isOpen: true,
      type: 'upload'
    });
  };

  const handleDownloadClick = () => {
    if (!user) {
      setIsOpen(false);
      setShowAuthModal(true);
      return;
    }
    setIsOpen(false);
    setConfirmModal({
      isOpen: true,
      type: 'download'
    });
  };

  const handleConfirmBackup = async () => {
    if (!user) return;
    try {
      setUploading(true);
      const res = await fazerBackupNuvem(operacoes, dividas);
      showToast(`Backup de ${res.count} operações e ${dividas.length} dívidas salvo na nuvem com sucesso!`);
      setConfirmModal(null);
    } catch (err: any) {
      showToast(`Erro ao salvar na nuvem: ${err.message || 'Tente novamente'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDownload = async () => {
    if (!user) return;
    try {
      setDownloading(true);
      const res = await baixarDadosNuvem();
      if (!res.success || !res.dados) {
        showToast(res.message || 'Nenhum dado encontrado na nuvem.');
        setConfirmModal(null);
        return;
      }

      importarDados(res.dados, true);
      if (res.dividas && res.dividas.length > 0) {
        importarDividas(res.dividas, true);
      }
      const msgDividas = res.dividas && res.dividas.length > 0 ? ` e ${res.dividas.length} dívidas` : '';
      showToast(`Download concluído: ${res.dados.length} operações${msgDividas} restauradas da nuvem!`);
      setConfirmModal(null);
    } catch (err: any) {
      showToast(`Erro ao baixar da nuvem: ${err.message || 'Tente novamente'}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
        showToast('Login realizado com sucesso!');
      } else {
        await signUpWithEmail(email, password);
        showToast('Conta criada com sucesso!');
      }
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setAuthError('Email ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('Este email já está cadastrado. Faça login.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setAuthError(err.message || 'Falha ao autenticar.');
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      await loginWithGoogle();
      showToast('Login com Google realizado com sucesso!');
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Falha no login com Google.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative inline-block text-left"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Small Button beside Undo / Theme */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-full transition-all flex items-center justify-center relative cursor-pointer",
          user 
            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 ring-1 ring-blue-500/30"
            : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
        title={user ? `Logado como: ${user.email || 'Usuário'} (Opções de Nuvem & Backup)` : "Fazer Login / Backup na Nuvem"}
      >
        {user ? (
          <div className="relative">
            <Cloud className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </div>
        ) : (
          <UserIcon className="w-5 h-5" />
        )}
      </button>

      {/* Hover / Click Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header Info */}
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            {user ? (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="truncate max-w-[170px]">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {user.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await logout();
                      showToast('Você saiu da sua conta.');
                    }}
                    className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Desconectar"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-blue-500" />
                    Sincronização na Nuvem
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Faça login para salvar seus dados na nuvem e acessá-los de qualquer dispositivo.
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Fazer Login / Cadastrar
                </button>
              </div>
            )}
          </div>

          {/* Backup Info & Actions (Only when logged in or viewable) */}
          {user && (
            <div className="pt-3 space-y-3">
              {/* Last backup info box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500" />
                    Último Backup na Nuvem
                  </span>
                  {checkingCloud && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {formatLastBackup(cloudBackupInfo?.lastBackupDate)}
                </div>
                {cloudBackupInfo?.totalOperacoes !== null && cloudBackupInfo?.totalOperacoes !== undefined && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Nuvem: {cloudBackupInfo.totalOperacoes} operações salvas | Dispositivo atual: {operacoes.length}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Send cache to cloud */}
                <button
                  onClick={handleBackupClick}
                  disabled={uploading || downloading}
                  className="w-full flex items-center justify-between px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudUpload className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
                    )}
                    <span>Fazer backup pra nuvem</span>
                  </div>
                  <span className="text-[10px] font-medium bg-blue-700 px-1.5 py-0.5 rounded text-blue-100">
                    Enviar {operacoes.length}
                  </span>
                </button>

                {/* Download from cloud */}
                <button
                  onClick={handleDownloadClick}
                  disabled={uploading || downloading}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-50 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    {downloading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : (
                      <CloudDownload className="w-4 h-4 text-emerald-500" />
                    )}
                    <span>Baixar dados da nuvem</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Restaurar
                  </span>
                </button>
              </div>

              <p className="text-[9px] text-slate-400 leading-tight text-center pt-1">
                Fazer backup envia os dados do cache do navegador para sua conta na nuvem com segurança.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {authMode === 'login' ? 'Entrar no Opções Control' : 'Criar Nova Conta'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Sincronize suas operações na nuvem</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {authError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Google One-Click Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={authSubmitting}
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continuar com Google
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-semibold text-slate-400">ou com email</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  {authSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {authMode === 'login' ? 'Entrar' : 'Cadastrar e Entrar'}
                </button>
              </form>

              {/* Switch Login / Signup */}
              <div className="text-center pt-2">
                {authMode === 'login' ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ainda não tem conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setAuthError(null);
                      }}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      Cadastre-se grátis
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError(null);
                      }}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      Fazer Login
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Cloud Actions */}
      {confirmModal && (
        <CloudConfirmModal
          isOpen={confirmModal.isOpen}
          type={confirmModal.type}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.type === 'upload' ? handleConfirmBackup : handleConfirmDownload}
          loading={confirmModal.type === 'upload' ? uploading : downloading}
          localCount={operacoes.length}
          localDividasCount={dividas.length}
          cloudCount={cloudBackupInfo?.totalOperacoes}
          cloudDividasCount={cloudBackupInfo?.totalDividas}
          lastBackupDate={cloudBackupInfo?.lastBackupDate}
          userEmail={user?.email}
        />
      )}
    </div>
  );
}
