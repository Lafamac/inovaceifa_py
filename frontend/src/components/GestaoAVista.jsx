import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { relatorioService } from '../services/api';
import { 
  Sprout, 
  Map, 
  Layers, 
  DollarSign, 
  Clock, 
  Zap, 
  ClipboardList, 
  AlertCircle,
  TrendingUp,
  Loader2,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

export const GestaoAVista = () => {
  const { safraAtiva, fazendaAtiva } = useTenant();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!safraAtiva || !fazendaAtiva) return;
      setLoading(true);
      setError(null);
      try {
        const result = await relatorioService.getGestaoAVista(safraAtiva.id, fazendaAtiva.id);
        setData(result);
      } catch (err) {
        console.error("Falha ao obter gestão à vista", err);
        setError("Erro ao carregar dados da Gestão à Vista.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [safraAtiva, fazendaAtiva]);

  if (loading) {
    return (
      <div className="glass-panel flex h-[400px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Processando Gestão à Vista...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel flex h-[400px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40 text-center px-6">
        <div className="space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 animate-pulse" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Erro ao carregar os dados de Gestão à Vista.</p>
        </div>
      </div>
    );
  }

  const { kpis } = data;
  const statusLabels = {
    RASCUNHO: 'Rascunho',
    APROVADA: 'Aprovada',
    EM_EXECUCAO: 'Em Execução',
    CONCLUIDA: 'Concluída',
    CANCELADA: 'Cancelada',
    ATRASADA: 'Atrasada'
  };

  const statusColors = {
    RASCUNHO: '#94a3b8',
    APROVADA: '#3b82f6',
    EM_EXECUCAO: '#f59e0b',
    CONCLUIDA: '#10b981',
    CANCELADA: '#ef4444',
    ATRASADA: '#8b5cf6'
  };

  const pieData = Object.entries(kpis.os_status || {})
    .filter(([key, val]) => val > 0 && key !== 'ATRASADA') // Evitar duplicar no gráfico circular o atrasado se for contabilizado separadamente
    .map(([key, val]) => ({
      name: statusLabels[key] || key,
      value: val,
      color: statusColors[key] || '#cbd5e1'
    }));

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Hectares Cultivados */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 group relative">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Hectares Cultivados</span>
              <div className="relative inline-block cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-400 transition-colors" />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-slate-900/95 dark:bg-slate-950/95 text-white text-[10px] rounded-lg p-2.5 shadow-xl z-50 text-center font-normal leading-relaxed">
                  Área total de talhões ativos cadastrados para esta fazenda.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900/95 dark:border-t-slate-950/95"></div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-emerald-600 dark:text-emerald-400">
              <Map className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {Number(kpis.hectares_cultivados || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 5 })} ha
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Área total de talhões cadastrados</p>
          </div>
        </div>

        {/* Produção Esperada */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 group relative">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Produção Esperada</span>
              <div className="relative inline-block cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-400 transition-colors" />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-slate-900/95 dark:bg-slate-950/95 text-white text-[10px] rounded-lg p-2.5 shadow-xl z-50 text-center font-normal leading-relaxed">
                  Total de sacas estimado para a safra ativa, calculado a partir da produtividade esperada de cada talhão.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900/95 dark:border-t-slate-950/95"></div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-teal-50 dark:bg-teal-950/40 p-2.5 text-teal-600 dark:text-teal-400">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{kpis.estimativa_producao_sacas.toLocaleString('pt-BR')} sc</h3>
            <p className="text-[10px] text-slate-400 mt-1">Produtividade média esperada: <span className="font-bold text-teal-600">{kpis.produtividade_esperada.toFixed(1)} sc/ha</span></p>
          </div>
        </div>

        {/* Orçamento COE */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 group relative">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Custo COE Realizado</span>
              <div className="relative inline-block cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-400 transition-colors" />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-slate-900/95 dark:bg-slate-950/95 text-white text-[10px] rounded-lg p-2.5 shadow-xl z-50 text-center font-normal leading-relaxed">
                  Custo Operacional Efetivo realizado na safra, somando Contas a Pagar, Salários, Custos de Máquinas e Consumo de Estoque.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900/95 dark:border-t-slate-950/95"></div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-2.5 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(kpis.coe_realizado)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Orçado Planejado: <span className="font-bold">{formatCurrency(kpis.coe_planejado)}</span></p>
          </div>
        </div>

        {/* Eficiência Operacional */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 group relative">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Rendimento Médio</span>
              <div className="relative inline-block cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-400 transition-colors" />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-slate-900/95 dark:bg-slate-950/95 text-white text-[10px] rounded-lg p-2.5 shadow-xl z-50 text-center font-normal leading-relaxed">
                  Média de hectares trabalhados por hora em operações de campo concluídas nesta safra.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900/95 dark:border-t-slate-950/95"></div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-purple-50 dark:bg-purple-950/40 p-2.5 text-purple-600 dark:text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{kpis.eficiencia_geral.toFixed(2)} ha/h</h3>
            <p className="text-[10px] text-slate-400 mt-1">Total de <span className="font-bold text-purple-600">{kpis.total_horas_operador.toFixed(0)} horas</span> de campo</p>
          </div>
        </div>

      </div>

      {/* OS Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Breakdown Table */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-500" />
            Status das Ordens de Serviço
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(kpis.os_status || {}).map(([key, val]) => (
              <div key={key} className="rounded-xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 p-4 flex flex-col justify-between relative overflow-hidden">
                {key === 'ATRASADA' && val > 0 && (
                  <div className="absolute top-0 right-0 w-2 h-2 rounded-bl bg-rose-500"></div>
                )}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{statusLabels[key]}</span>
                  <div className="text-2xl font-black mt-2" style={{ color: statusColors[key] }}>
                    {val}
                  </div>
                </div>
                {key === 'ATRASADA' && val > 0 && (
                  <span className="text-[9px] font-extrabold text-rose-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Requer atenção!
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart of OS */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-2">Distribuição Operacional</h3>
          <div className="h-[180px] w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                      borderRadius: '8px', 
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400">Nenhum dado de OS cadastrado</span>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {pieData.map((entry, idx) => (
              <div key={idx} className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
