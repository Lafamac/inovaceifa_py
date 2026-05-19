import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { relatorioService } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Compass, 
  Clock, 
  Gauge, 
  Briefcase,
  AlertTriangle,
  MapPin,
  ClipboardList
} from 'lucide-react';

export const OperationalEfficiency = () => {
  const { safraAtiva } = useTenant();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!safraAtiva) return;
      setLoading(true);
      setError(null);
      try {
        const result = await relatorioService.getEficienciaOperacional(safraAtiva.id);
        setData(result);
      } catch (err) {
        console.error("Falha ao obter eficiência operacional", err);
        setError("Erro ao carregar dados de eficiência operacional.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [safraAtiva]);

  if (loading) {
    return (
      <div className="glass-panel flex h-[350px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Processando Eficiência...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel flex h-[350px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40 text-center px-6">
        <div className="space-y-2">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nenhum dado operacional para a safra atual.</p>
        </div>
      </div>
    );
  }

  const {
    total_horas_trabalhadas_proprias,
    total_area_talhoes_concluidos,
    eficiencia_global_ha_hora,
    breakdown_operacoes,
    ordens_servico_concluidas
  } = data;

  // Formatar números
  const formatHa = (val) => {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(val)} ha`;
  };

  const formatHrs = (val) => {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(val)} h`;
  };

  const formatEficiencia = (val) => {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(val)} ha/h`;
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/50">
        <div>
          <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-500 animate-spin-slow" />
            Eficiência Operacional
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rendimento de Talhões Executados por Horas de Trabalho de Funcionários Próprios
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        
        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">Hectares Executados</span>
            <div className="mt-2 text-lg font-black text-slate-800 dark:text-slate-100">
              {formatHa(total_area_talhoes_concluidos)}
            </div>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 mt-1 block">Soma de Talhões de OS Concluídas</span>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-emerald-600 dark:text-emerald-400">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">Horas Próprias Consolidadas</span>
            <div className="mt-2 text-lg font-black text-slate-800 dark:text-slate-100">
              {formatHrs(total_horas_trabalhadas_proprias)}
            </div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 block">Apontamentos de Mão de Obra Própria</span>
          </div>
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 p-3 text-indigo-600 dark:text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">Produtividade Média Global</span>
            <div className="mt-2 text-lg font-black text-slate-800 dark:text-slate-100">
              {formatEficiencia(eficiencia_global_ha_hora)}
            </div>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 mt-1 block">Hectares por Hora Trabalhada</span>
          </div>
          <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-3 text-teal-600 dark:text-teal-400">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Operations breakdown list & chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
        
        {/* Horizontal Bar Chart breakdown */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
            Rendimento por Tipo de Operação
          </h4>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={breakdown_operacoes}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis 
                  type="number" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="nome" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  width={90}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'area' ? formatHa(value) : formatHrs(value), 
                    name === 'area' ? 'Área Trabalhada' : 'Horas Gastas'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                    borderRadius: '12px', 
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="area" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Finished Service Orders list */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-emerald-500" />
            Ordens de Serviço Concluídas
          </h4>
          <div className="max-h-[200px] overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800">
            {ordens_servico_concluidas.length === 0 ? (
              <div className="p-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                Nenhuma OS concluída nesta safra.
              </div>
            ) : (
              ordens_servico_concluidas.map((os) => (
                <div key={os.id} className="p-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 flex items-center justify-between text-xs transition-all">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800 dark:text-slate-200">OS #{os.id} — {os.tipo}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      Talhões: {os.talhoes.join(', ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-800 dark:text-slate-100">{formatHa(os.area_total)}</div>
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold">CONCLUÍDA</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
