import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FolderOpen, History, Settings2, Sun, Moon, Menu, X, Undo2 } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';
import { useOperations } from '@/store/OperationsContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { podeDesfazer, desfazer, toast, hideToast } = useOperations();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Nova Operação', href: '/nova', icon: PlusCircle },
    { name: 'Operações Abertas', href: '/abertas', icon: FolderOpen },
    { name: 'Histórico', href: '/historico', icon: History },
    { name: 'Importar / Exportar', href: '/import-export', icon: Settings2 },
  ];

  const currentNav = navigation.find(item => item.href === location.pathname);
  const title = currentNav ? currentNav.name : 'Opções Control';

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');


  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 transform transition-transform duration-200 lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 flex items-center space-x-3 text-white">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">OC</div>
          <span className="text-xl font-bold tracking-tight">Opções Control</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "sidebar-active text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center">
            <button
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 mr-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={desfazer}
              disabled={!podeDesfazer}
              className={cn(
                "p-2 rounded-full transition-colors flex items-center justify-center",
                podeDesfazer 
                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer" 
                  : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
              )}
              title={podeDesfazer ? "Desfazer última ação (Ctrl+Z)" : "Nada para desfazer"}
            >
              <Undo2 className="w-5 h-5" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>
        
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {children}
        </div>

        {/* Floating Interactive Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-slate-100 dark:bg-white dark:text-slate-900 px-4 py-3 rounded-md shadow-lg border border-slate-800 dark:border-slate-200 flex items-center justify-between gap-4 max-w-sm transition-all animate-bounce">
            <span className="text-xs font-semibold">{toast.mensagem}</span>
            {toast.action && (
              <button 
                onClick={() => {
                  toast.action?.onClick();
                  hideToast();
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 dark:text-amber-600 dark:hover:text-amber-700 bg-slate-800 dark:bg-slate-100 px-2 py-1 rounded-sm"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
