import React, { useState, useEffect, useRef } from 'react';
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
  Calendar
} from 'lucide-react';

export const Header = ({ activeView, setActiveView }) => {
  const { user, logout } = useAuth();
  const { 
    fazendas, 
    safras, 
    fazendaAtiva, 
    safraAtiva, 
    selecionarFazenda, 
    selecionarSafra 
  } = useTenant();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showFazendaMenu, setShowFazendaMenu] = useState(false);
  const [showSafraMenu, setShowSafraMenu] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const profileRef = useRef(null);
  const fazendaRef = useRef(null);
  const safraRef = useRef(null);

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
      if (fazendaRef.current && !fazendaRef.current.contains(e.target)) {
        setShowFazendaMenu(false);
      }
      if (safraRef.current && !safraRef.current.contains(e.target)) {
        setShowSafraMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/50 bg-white/70 dark:border-slate-800/50 dark:bg-slate-900/70 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Logo and Tab Navigation */}
          <div className="flex items-center space-x-6">
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
              <nav className="flex items-center space-x-1 border-l border-slate-200/40 dark:border-slate-800/50 pl-6 h-8">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'dashboard'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                      : 'border border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/[0.02]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Painel</span>
                </button>
                <button
                  onClick={() => setActiveView('planejamento')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'planejamento'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                      : 'border border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/[0.02]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Planejamento</span>
                </button>
                <button
                  onClick={() => setActiveView('operacoes')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'operacoes'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                      : 'border border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/[0.02]'
                  }`}
                >
                  <Tractor className="w-3.5 h-3.5" />
                  <span>Operações</span>
                </button>
                <button
                  onClick={() => setActiveView('cadastros')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'cadastros'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                      : 'border border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/[0.02]'
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
            <div className="hidden md:flex items-center space-x-4">
              
              {/* Fazenda Selector */}
              <div className="relative" ref={fazendaRef}>
                <button
                  onClick={() => setShowFazendaMenu(!showFazendaMenu)}
                  className="flex items-center space-x-2 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none"
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{fazendaAtiva ? fazendaAtiva.nome : 'Carregando fazenda...'}</span>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${showFazendaMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showFazendaMenu && (
                  <div className="absolute left-0 mt-1.5 w-56 rounded-xl border border-slate-200/60 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Selecionar Fazenda
                    </div>
                    {fazendas.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          selecionarFazenda(f);
                          setShowFazendaMenu(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                          fazendaAtiva?.id === f.id
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{f.nome}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{f.municipio}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Safra Selector */}
              <div className="relative" ref={safraRef}>
                <button
                  onClick={() => setShowSafraMenu(!showSafraMenu)}
                  className="flex items-center space-x-2 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none"
                >
                  <Sprout className="h-3.5 w-3.5 text-teal-500" />
                  <span>{safraAtiva ? safraAtiva.nome : 'Carregando safra...'}</span>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${showSafraMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showSafraMenu && (
                  <div className="absolute left-0 mt-1.5 w-48 rounded-xl border border-slate-200/60 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
                          safraAtiva?.id === s.id
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{s.nome}</span>
                        {s.ativa && (
                          <span className="rounded bg-emerald-100 px-1 py-0.5 text-[8px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
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
          <div className="flex items-center space-x-3">
            
            {/* Theme switcher button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all focus:outline-none cursor-pointer"
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
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 rounded-xl border border-slate-200/60 p-1.5 pr-3 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition-all focus:outline-none"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 font-display">
                    <span className="text-xs font-black uppercase">{user.nome.charAt(0)}</span>
                  </div>
                  
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-bold leading-none text-slate-800 dark:text-slate-200">{user.nome}</div>
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{user.cargo}</div>
                  </div>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-slate-200/60 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="border-b border-slate-100 dark:border-slate-800/80 px-2.5 pb-2 pt-1.5 mb-1.5">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{user.nome}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{user.email}</div>
                    </div>

                    <button
                      onClick={() => {
                        setIsPasswordModalOpen(true);
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Lock className="h-4.5 w-4.5 text-slate-400" />
                      <span>Alterar Senha</span>
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
      </header>

      {/* Alterar Senha Modal */}
      <ModalChangePassword 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </>
  );
};
