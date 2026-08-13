import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { GestaoAVista } from './GestaoAVista';
import { CropComparison } from './CropComparison';
import { CashFlow } from './CashFlow';
import { OperationalEfficiency } from './OperationalEfficiency';
import { CustoTalhao } from './CustoTalhao';
import { CustoMensal } from './CustoMensal';
import { ConsumoDiesel } from './ConsumoDiesel';
import { AnaliseMOF } from './AnaliseMOF';
import { Estoque } from './Estoque';
import { ProducaoTalhao } from './ProducaoTalhao';

import { 
  Sprout, 
  MapPin, 
  Loader2, 
  AlertCircle,
  Activity, 
  DollarSign, 
  Zap, 
  TrendingUp, 
  Coins, 
  Calendar, 
  Fuel, 
  Users, 
  Package, 
  Scale, 
  ChevronDown,
  Database
} from 'lucide-react';
import { ModalBackup } from './ModalBackup';

const REPORTS = [
  { id: 'gestao-a-vista', label: 'Gestão à Vista', category: 'Geral', icon: Activity, component: GestaoAVista, desc: 'Indicadores chave e distribuição de OS' },
  { id: 'comparativo-safra', label: 'Comparativo de Safra', category: 'Financeiro', icon: DollarSign, component: CropComparison, desc: 'Custos orçados vs despesas reais' },
  { id: 'fluxo-caixa', label: 'Fluxo de Caixa', category: 'Financeiro', icon: TrendingUp, component: CashFlow, desc: 'Histórico e projeção de caixa' },
  { id: 'eficiencia-operacional', label: 'Eficiência Operacional', category: 'Operações', icon: Zap, component: OperationalEfficiency, desc: 'Horas máquina e rendimentos' },
  { id: 'custo-talhao', label: 'Custo por Talhão', category: 'Custos', icon: Coins, component: CustoTalhao, desc: 'Rateio de despesas por talhão' },
  { id: 'custo-mensal', label: 'Custo Mensal', category: 'Custos', icon: Calendar, component: CustoMensal, desc: 'Histórico temporal de despesas' },
  { id: 'consumo-diesel', label: 'Consumo de Diesel', category: 'Operações', icon: Fuel, component: ConsumoDiesel, desc: 'Rendimento de combustíveis' },
  { id: 'analise-mof', label: 'Mão de Obra Fixa', category: 'Recursos', icon: Users, component: AnaliseMOF, desc: 'Despesas com folha e encargos' },
  { id: 'estoque', label: 'Estoque / Almoxarifado', category: 'Recursos', icon: Package, component: Estoque, desc: 'Saldos e valoração de insumos' },
  { id: 'producao-talhao', label: 'Produção por Talhão', category: 'Operações', icon: Scale, component: ProducaoTalhao, desc: 'Comparativo físico de colheita' }
];

const CATEGORIES = [
  { id: 'Geral', label: 'Painel Geral' },
  { id: 'Financeiro', label: 'Financeiro' },
  { id: 'Custos', label: 'Custos & Rateios' },
  { id: 'Operações', label: 'Operações Campo' },
  { id: 'Recursos', label: 'Recursos & Estoque' }
];

export const Dashboard = () => {
  const { user } = useAuth();
  const { fazendaAtiva, safraAtiva, tenantVersion, loading } = useTenant();
  const [activeReportId, setActiveReportId] = useState('gestao-a-vista');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const dataUltimoBackup = user?.data_ultimo_backup;
  const showBackupWarning = !dataUltimoBackup || (new Date() - new Date(dataUltimoBackup)) > (7 * 24 * 60 * 60 * 1000);

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

  const activeReport = REPORTS.find(r => r.id === activeReportId) || REPORTS[0];
  const ActiveReportComponent = activeReport.component;
  const tenantReportKey = `${activeReportId}-${fazendaAtiva?.id || 'sem-fazenda'}-${safraAtiva?.id || 'sem-safra'}-${tenantVersion}`;

  const selectReport = (id) => {
    setActiveReportId(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Welcome Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600/95 to-teal-700/95 p-6 sm:p-8 shadow-xl shadow-emerald-600/10">
        
        {/* Subtle background abstract shapes */}
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

      {/* Alert Banner for Backup */}
      {showBackupWarning && (
        <div className="mb-6 p-4 rounded-xl border border-amber-550/15 dark:border-amber-500/10 bg-amber-50 dark:bg-amber-500/5 text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-left">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Recomendação de Segurança: Realize um Backup</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {dataUltimoBackup 
                  ? `Seu último backup foi realizado em ${new Date(dataUltimoBackup).toLocaleDateString('pt-BR')}. Evite perder seus registros de safra e finanças realizando um backup periódico.`
                  : "Você ainda não realizou nenhum backup dos seus dados! Baixe uma cópia de segurança para garantir a integridade dos seus dados contra imprevistos."
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-400 px-3 py-1.5 text-xs font-bold transition-all border border-amber-200 dark:border-amber-500/15 cursor-pointer shrink-0 align-middle self-start sm:self-center"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Fazer Backup</span>
          </button>
        </div>
      )}

      {/* Main Switcher and Report Container */}
      {!safraAtiva ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white/35 dark:bg-slate-900/35 backdrop-blur-md">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">Nenhuma Safra Ativa Cadastrada</h2>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Selecione ou crie uma safra vinculada a esta fazenda para carregar relatórios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* MOBILE TABS SELECTOR (Sticky top, collapses on large viewports) */}
          <div className="lg:hidden relative z-20">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-between w-full rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-5 py-4 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-2 text-emerald-600 dark:text-emerald-400">
                  <activeReport.icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{activeReport.category}</span>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{activeReport.label}</h4>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile reports dropdown items */}
            {isMobileMenuOpen && (
              <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-2 shadow-xl z-30 divide-y divide-slate-100 dark:divide-slate-800/40 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                {CATEGORIES.map(category => {
                  const categoryReports = REPORTS.filter(r => r.category === category.id);
                  return (
                    <div key={category.id} className="py-2.5 px-3">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">
                        {category.label}
                      </span>
                      <div className="space-y-1">
                        {categoryReports.map(report => (
                          <button
                            key={report.id}
                            onClick={() => selectReport(report.id)}
                            className={`flex items-center space-x-3 w-full px-3 py-2 rounded-xl text-left transition-colors duration-150 ${
                              report.id === activeReportId
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950/50'
                            }`}
                          >
                            <report.icon className="h-4 w-4 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-xs font-bold block">{report.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DESKTOP SIDEBAR SWITCHER (Always visible on large viewports) */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="glass-panel sticky top-6 rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40 p-4 shadow-sm space-y-5">
              
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">
                  Painéis & Relatórios
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 px-2">
                  Selecione um relatório analítico para visualizar.
                </p>
              </div>

              <div className="space-y-5">
                {CATEGORIES.map(category => {
                  const categoryReports = REPORTS.filter(r => r.category === category.id);
                  return (
                    <div key={category.id} className="space-y-1.5">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider px-2 block">
                        {category.label}
                      </span>
                      <div className="space-y-0.5">
                        {categoryReports.map(report => {
                          const isActive = report.id === activeReportId;
                          return (
                            <button
                              key={report.id}
                              onClick={() => selectReport(report.id)}
                              className={`flex items-center space-x-3 w-full px-3 py-2 rounded-xl text-left transition-all duration-200 group border ${
                                isActive
                                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-950/20'
                              }`}
                            >
                              <report.icon className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 duration-200 ${
                                isActive ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'
                              }`} />
                              <div className="min-w-0">
                                <span className="text-xs font-semibold block">{report.label}</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate block mt-0.5 font-normal">
                                  {report.desc}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* ACTIVE REPORT RENDER PANEL */}
          <div className="lg:col-span-3 min-w-0">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ActiveReportComponent key={tenantReportKey} />
            </div>
          </div>

        </div>
      )}

      </main>

      <ModalBackup 
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </>
  );
};
