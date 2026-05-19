import React from 'react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { CropComparison } from './CropComparison';
import { CashFlow } from './CashFlow';
import { OperationalEfficiency } from './OperationalEfficiency';
import { 
  Sprout, 
  MapPin, 
  Layers, 
  Loader2, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const { fazendaAtiva, safraAtiva, loading } = useTenant();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Carregando painel analítico...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Welcome Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600/95 to-teal-700/95 p-6 sm:p-8 shadow-xl shadow-emerald-600/10">
        
        {/* Subtle background abstract shape */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-white/5 blur-2xl"></div>
        <div className="absolute left-1/3 bottom-0 -mb-10 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black font-display text-white">
              Olá, {user ? user.nome : 'Produtor'}!
            </h1>
            <p className="text-xs text-emerald-100/90 font-medium">
              Bem-vindo ao painel de inteligência operacional. Analise indicadores consolidados abaixo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            
            {/* Fazenda badge */}
            <div className="flex items-center space-x-2 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white border border-white/10 backdrop-blur-md">
              <MapPin className="h-4 w-4 text-emerald-300" />
              <span>{fazendaAtiva ? fazendaAtiva.nome : '-'}</span>
            </div>

            {/* Safra badge */}
            <div className="flex items-center space-x-2 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white border border-white/10 backdrop-blur-md">
              <Sprout className="h-4 w-4 text-teal-300" />
              <span>{safraAtiva ? safraAtiva.nome : 'Sem safra ativa'}</span>
            </div>

          </div>
        </div>
      </div>

      {/* Main Grid: Crop Comparison, Cash Flow and Operational Efficiency */}
      {!safraAtiva ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">Nenhuma Safra Ativa Cadastrada</h2>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Selecione ou crie uma safra vinculada a esta fazenda para carregar relatórios.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Top Row: Crop Comparison and Operational Efficiency */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CropComparison />
            <OperationalEfficiency />
          </div>

          {/* Bottom Row: Cash Flow full-width */}
          <CashFlow />

        </div>
      )}

    </main>
  );
};
