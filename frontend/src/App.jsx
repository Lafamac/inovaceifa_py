import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Cadastros } from './components/Cadastros';
import { Planejamentos } from './components/Planejamentos';
import { OrdensServico } from './components/OrdensServico';
import { Financeiro } from './components/Financeiro';
import { Login } from './components/Login';
import { Footer } from './components/Footer';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const { safraAtiva } = useTenant();
  const [activeView, setActiveView] = useState('dashboard');
  const [financeiroSubTab, setFinanceiroSubTab] = useState('compras');

  const changeView = (view, subTab = 'compras') => {
    setActiveView(view);
    if (subTab) {
      setFinanceiroSubTab(subTab);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Carregando Inova Ceifa...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#070b13] dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Header containing selectors and dark mode toggle */}
      <Header activeView={activeView} setActiveView={changeView} />

      {/* Main Content Area with dynamic tab routing */}
      <div className="flex-grow animate-fade-in-up" key={activeView}>
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'planejamento' && <Planejamentos />}
        {activeView === 'operacoes' && <OrdensServico />}
        {activeView === 'financeiro' && <Financeiro defaultSubTab={financeiroSubTab} />}
        {activeView === 'cadastros' && <Cadastros currentSafraId={safraAtiva?.id} setActiveView={changeView} />}
      </div>

      {/* Footer */}
      <Footer />

    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <AppContent />
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;
