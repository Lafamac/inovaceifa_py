import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { ModalChangePassword } from './ModalChangePassword';
import { 
  Sun, 
  Moon, 
  ChevronDown, 
  Settings, 
  LogOut, 
  User, 
  Sprout, 
  MapPin,
  Lock,
  Loader2,
  LayoutDashboard,
  FileSpreadsheet,
  Tractor,
  Calendar,
  WalletCards,
  Database
} from 'lucide-react';
import { ModalBackup } from './ModalBackup';

export const Header = ({ activeView, setActiveView }) => {
  const { user, logout } = useAuth();
  const { 
    fazendas, 
    safras, 
    fazendaAtiva, 
    safraAtiva, 
    selecionarFazenda, 
    selecionarSafra,
    loading
  } = useTenant();

  const sortedFazendas = useMemo(() => {
    return [...fazendas].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [fazendas]);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showFazendaMenu, setShowFazendaMenu] = useState(false);
  const [showSafraMenu, setShowSafraMenu] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const isFazendaSelecionada = (fazenda) => String(fazendaAtiva?.id ?? '') === String(fazenda.id);
  const isSafraSelecionada = (safra) => String(safraAtiva?.id ?? '') === String(safra.id);

  const profileRef = useRef(null);
  const desktopFazendaRef = useRef(null);
  const desktopSafraRef = useRef(null);
  const mobileFazendaRef = useRef(null);
  const mobileSafraRef = useRef(null);

  // Sync dark class on mount and theme switches
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Click outside menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      const clickedInsideFazenda =
        desktopFazendaRef.current?.contains(e.target) ||
        mobileFazendaRef.current?.contains(e.target);
      const clickedInsideSafra =
        desktopSafraRef.current?.contains(e.target) ||
        mobileSafraRef.current?.contains(e.target);

      if (!clickedInsideFazenda) {
        setShowFazendaMenu(false);
      }
      if (!clickedInsideSafra) {
        setShowSafraMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 dark:border-slate-800/50 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Logo and Tab Navigation */}
          <div className="flex items-center space-x-4 md:space-x-6 shrink-0">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('dashboard')}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                <Sprout className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight font-display bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                  Inova Ceifa
                </span>
                <span className="block text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                  Agro Analytics
                </span>
              </div>
            </div>

            {/* Premium Tab Swapper */}
            {user && (
              <nav className="flex items-center space-x-1 border-l border-slate-200/40 dark:border-slate-800/50 pl-3 md:pl-6 h-8 overflow-x-auto scrollbar-none flex-nowrap max-w-[160px] sm:max-w-[280px] md:max-w-none">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer shrink-0 ${
                    activeView === 'dashboard'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/15'
                      : 'border border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-white/[0.02]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Painel</span>
                </button>
                <button
                  onClick={() => setActiveView('planejamento')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer shrink-0 ${
                    activeView === 'planejamento'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/15'
                      : 'border border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-white/[0.02]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Planejamento</span>
                </button>
                <button
                  onClick={() => setActiveView('operacoes')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer shrink-0 ${
                    activeView === 'operacoes'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/15'
                      : 'border border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-white/[0.02]'
                  }`}
                >
                  <Tractor className="w-3.5 h-3.5" />
                  <span>Operações</span>
                </button>
                <button
                  onClick={() => setActiveView('financeiro')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer shrink-0 ${
                    activeView === 'financeiro'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/15'
                      : 'border border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-white/[0.02]'
                  }`}
                >
                  <WalletCards className="w-3.5 h-3.5" />
                  <span>Financeiro</span>
                </button>
                <button
                  onClick={() => setActiveView('cadastros')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer shrink-0 ${
                    activeView === 'cadastros'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/15'
                      : 'border border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-white/[0.02]'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Cadastros</span>
                </button>
              </nav>
            )}
          </div>

          {/* Centered tenant selectors */}
          {user && (
            <div className="hidden xl:flex items-center space-x-4 shrink-0">
              
              {/* Fazenda Selector */}
              <div className="relative z-50" ref={desktopFazendaRef}>
                <button
                  onClick={() => {
                    setShowFazendaMenu(!showFazendaMenu);
                    setShowSafraMenu(false);
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center space-x-2 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all focus:outline-none max-w-[160px] xl:max-w-[240px] cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{loading ? 'Carregando fazenda...' : (fazendaAtiva ? fazendaAtiva.nome : 'Fazenda...')}</span>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${showFazendaMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showFazendaMenu && (
                  <div className="absolute left-0 z-50 mt-1.5 w-56 max-h-64 overflow-y-auto rounded-xl border border-slate-200/60 bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider sticky top-0 bg-white dark:bg-slate-900 pb-1 z-10 border-b border-slate-100 dark:border-slate-800/60 mb-1">
                      Selecionar Fazenda
                    </div>
                    {sortedFazendas.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          selecionarFazenda(f.id);
                          setShowFazendaMenu(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                          isFazendaSelecionada(f)
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                        }`}
                      >
                        <span className="truncate pr-2">{f.nome}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{f.municipio}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Safra Selector */}
              <div className="relative z-50" ref={desktopSafraRef}>
                <button
                  onClick={() => {
                    setShowSafraMenu(!showSafraMenu);
                    setShowFazendaMenu(false);
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center space-x-2 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all focus:outline-none max-w-[120px] xl:max-w-[180px] cursor-pointer"
                >
                  <Sprout className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                  <span className="truncate">{loading ? 'Carregando safra...' : (safraAtiva ? safraAtiva.nome : (safras.length === 0 ? 'Sem safra' : 'Safra...'))}</span>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${showSafraMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showSafraMenu && (
                  <div className="absolute left-0 z-50 mt-1.5 w-48 max-h-64 overflow-y-auto rounded-xl border border-slate-200/60 bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider sticky top-0 bg-white dark:bg-slate-900 pb-1 z-10 border-b border-slate-100 dark:border-slate-800/60 mb-1">
                      Cultura / Safra
                    </div>
                    {safras.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          selecionarSafra(s);
                          setShowSafraMenu(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                          isSafraSelecionada(s)
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                        }`}
                      >
                        <span className="truncate pr-2">{s.nome}</span>
                        {s.ativa && (
                          <span className="rounded bg-emerald-100 px-1 py-0.5 text-[8px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 shrink-0">
                            Ativa
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Right section tools */}
          <div className="flex items-center space-x-3 shrink-0">
            
            {/* Theme switcher button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-all focus:outline-none cursor-pointer"
              title="Alternar Tema"
            >
              {darkMode ? (
                <Sun className="h-4.5 w-4.5 text-amber-500 animate-spin-slow" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-indigo-500" />
              )}
            </button>

            {/* Profile Dropdown */}
            {user && (
              <div className="relative z-50" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 rounded-xl border border-slate-200/60 p-1.5 pr-3 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition-all focus:outline-none cursor-pointer"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 font-display">
                    <span className="text-xs font-black uppercase">{user.nome.charAt(0)}</span>
                  </div>
                  
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-bold leading-none text-slate-800 dark:text-slate-300">{user.nome}</div>
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{user.cargo}</div>
                  </div>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 z-50 mt-1.5 w-52 rounded-xl border border-slate-200/60 bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="border-b border-slate-100 dark:border-slate-800/80 px-2.5 pb-2 pt-1.5 mb-1.5">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-400">{user.nome}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{user.email}</div>
                    </div>

                    <button
                      onClick={() => {
                        setIsPasswordModalOpen(true);
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Lock className="h-4.5 w-4.5 text-slate-400" />
                      <span>Alterar Senha</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsBackupModalOpen(true);
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Database className="h-4.5 w-4.5 text-slate-400" />
                      <span>Backup de Dados</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4.5 w-4.5 text-rose-400" />
                      <span>Desconectar</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Mobile Sub-Header for tenant selectors (only on mobile/tablet) */}
        {user && (
          <div className="xl:hidden flex items-center justify-between gap-3 border-t border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/50 px-4 py-2 backdrop-blur-md transition-colors duration-300">
            
            {/* Fazenda Selector */}
            <div className="relative flex-1 z-50" ref={mobileFazendaRef}>
              <button
                onClick={() => {
                  setShowFazendaMenu(!showFazendaMenu);
                  setShowSafraMenu(false);
                  setShowProfileMenu(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all focus:outline-none active:scale-98 cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{loading ? 'Carregando fazenda...' : (fazendaAtiva ? fazendaAtiva.nome : 'Fazenda...')}</span>
                </div>
                <ChevronDown className={`h-3 w-3 text-slate-400 shrink-0 transition-transform ${showFazendaMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showFazendaMenu && (
                <div className="absolute left-0 z-50 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider sticky top-0 bg-white dark:bg-slate-900 pb-1 z-10 border-b border-slate-100 dark:border-slate-800/60 mb-1">
                    Selecionar Fazenda
                  </div>
                  {sortedFazendas.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        selecionarFazenda(f.id);
                        setShowFazendaMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer active:bg-emerald-100 dark:active:bg-emerald-900/60 ${
                        isFazendaSelecionada(f)
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-bold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-2">{f.nome}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{f.municipio}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Safra Selector */}
            <div className="relative flex-1 z-50" ref={mobileSafraRef}>
              <button
                onClick={() => {
                  setShowSafraMenu(!showSafraMenu);
                  setShowFazendaMenu(false);
                  setShowProfileMenu(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all focus:outline-none active:scale-98 cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Sprout className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                  <span className="truncate">{loading ? 'Carregando safra...' : (safraAtiva ? safraAtiva.nome : (safras.length === 0 ? 'Sem safra' : 'Safra...'))}</span>
                </div>
                <ChevronDown className={`h-3 w-3 text-slate-400 shrink-0 transition-transform ${showSafraMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showSafraMenu && (
                <div className="absolute right-0 z-50 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider sticky top-0 bg-white dark:bg-slate-900 pb-1 z-10 border-b border-slate-100 dark:border-slate-800/60 mb-1">
                    Cultura / Safra
                  </div>
                  {safras.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        selecionarSafra(s);
                        setShowSafraMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer active:bg-teal-100 dark:active:bg-teal-900/60 ${
                        isSafraSelecionada(s)
                          ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 font-bold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-2">{s.nome}</span>
                      {s.ativa && (
                        <span className="rounded bg-emerald-100 px-1 py-0.5 text-[8px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 shrink-0">
                          Ativa
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </header>

      {/* Alterar Senha Modal */}
      <ModalChangePassword 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

      <ModalBackup 
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </>
  );
};

