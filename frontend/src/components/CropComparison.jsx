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
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  HelpCircle,
  Percent
} from 'lucide-react';

export const CropComparison = () => {
  const { safraAtiva } = useTenant();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!safraAtiva) return;
      setLoading(true);
      setError(null);
      try {
        const result = await relatorioService.getComparativoSafra(safraAtiva.id);
        // Colocar em array caso venha objeto único da safra ativa ou lista
        setData(Array.isArray(result) ? result : [result]);
      } catch (err) {
        console.error("Falha ao obter comparativo de safras", err);
        setError("Erro ao carregar dados do comparativo.");
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
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Processando Comparativo...</span>
        </div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="glass-panel flex h-[350px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40 text-center px-6">
        <div className="space-y-2">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nenhum dado financeiro para a safra atual.</p>
        </div>
      </div>
    );
  }

  // Formatador de Moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Obter primeiro item (safra ativa)
  const currentReport = data[0] || {};
  const planejado = currentReport.custo_planejado || 0;
  const realizado = currentReport.custo_realizado || 0;
  const economia = currentReport.economia || 0;
  const atingimento = currentReport.atingimento_orcamento || 0;
  const estouro = atingimento > 100;
  const percentualDiferenca = planejado > 0 ? Math.abs(((realizado - planejado) / planejado) * 100).toFixed(1) : 0;

  return (
    <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/50">
        <div>
          <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Comparativo de Safras
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Orcamento Planejado vs Custos Reais Consolidados da Safra
          </p>
        </div>
        <div className="rounded-full bg-slate-100 dark:bg-slate-950 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-800">
          {currentReport.safra_nome} ({currentReport.safra_ano})
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        
        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">Custo Planejado</span>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-1.5 text-blue-600 dark:text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-black text-slate-800 dark:text-slate-100">
            {formatCurrency(planejado)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">Custo Realizado</span>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-1.5 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-black text-slate-800 dark:text-slate-100">
            {formatCurrency(realizado)}
          </div>
        </div>

        <div className={`rounded-xl border p-4 transition-colors ${
          estouro 
            ? 'border-rose-200/40 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/10' 
            : 'border-emerald-200/40 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">Divergência Orçamentária</span>
            <div className={`rounded-lg p-1.5 ${
              estouro 
                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' 
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
            }`}>
              {estouro ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className={`text-lg font-black ${estouro ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {estouro ? '+' : '-'}{percentualDiferenca}%
            </div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400">
              ({estouro ? 'Acima' : 'Abaixo'} do Planejado)
            </div>
          </div>
        </div>

      </div>

      {/* Chart Section */}
      <div className="h-[240px] mt-6 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[
              {
                name: 'Consolidado',
                'Planejado': planejado,
                'Realizado': realizado,
              }
            ]}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
            barGap={8}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} 
            />
            <Tooltip 
              formatter={(value) => [formatCurrency(value), '']}
              contentStyle={{ 
                backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                borderRadius: '12px', 
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
            <Bar dataKey="Planejado" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={60} />
            <Bar dataKey="Realizado" fill={estouro ? '#f43f5e' : '#10b981'} radius={[6, 6, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
