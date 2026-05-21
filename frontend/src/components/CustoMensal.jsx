import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { relatorioService } from '../services/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  CalendarDays,
  DollarSign, 
  Layers, 
  Users, 
  Hammer,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const CustoMensal = () => {
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
        const result = await relatorioService.getCustoMensal(safraAtiva.id, fazendaAtiva.id);
        setData(result);
      } catch (err) {
        console.error("Falha ao obter custo mensal", err);
        setError("Erro ao carregar dados do Custo Mensal.");
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
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Processando Histórico Mensal...</span>
        </div>
      </div>
    );
  }

  if (error || !data || !data.custos_mensais || data.custos_mensais.length === 0) {
    return (
      <div className="glass-panel flex h-[400px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40 text-center px-6">
        <div className="space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 animate-pulse" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nenhum custo mensal registrado para esta fazenda e safra.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val);
  };

  const totalConsolidado = data.custos_mensais.reduce((acc, curr) => acc + curr.total, 0);
  const totalInsumos = data.custos_mensais.reduce((acc, curr) => acc + curr.insumos, 0);
  const totalMO = data.custos_mensais.reduce((acc, curr) => acc + curr.mao_obra, 0);
  const totalOutros = data.custos_mensais.reduce((acc, curr) => acc + curr.outros, 0);

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-500" />
          Consolidado Mensal de Custos
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Distribuição temporal de despesas registradas em Contas a Pagar agrupadas por classificação
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-400">Acumulado na Safra</span>
          <div className="mt-2 text-lg font-black text-slate-800 dark:text-slate-100">
            {formatCurrency(totalConsolidado)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-400">Investimento em Insumos</span>
          <div className="mt-2 text-lg font-black text-teal-600 dark:text-teal-400">
            {formatCurrency(totalInsumos)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-400">Mão de Obra Fixa/Terceiros</span>
          <div className="mt-2 text-lg font-black text-blue-600 dark:text-blue-400">
            {formatCurrency(totalMO)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-400">Manutenção & Administrativo</span>
          <div className="mt-2 text-lg font-black text-purple-600 dark:text-purple-400">
            {formatCurrency(totalOutros)}
          </div>
        </div>
      </div>

      {/* Stacked Area Chart */}
      <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Evolução dos Custos Mensais (R$)</h4>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.custos_mensais}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorInsumos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMO" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutros" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis 
                dataKey="mes" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
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
                  fontSize: '11px'
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
              <Area type="monotone" name="Insumos" dataKey="insumos" stroke="#14b8a6" fillOpacity={1} fill="url(#colorInsumos)" stackId="1" />
              <Area type="monotone" name="Mão de Obra" dataKey="mao_obra" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMO)" stackId="1" />
              <Area type="monotone" name="Outros" dataKey="outros" stroke="#a855f7" fillOpacity={1} fill="url(#colorOutros)" stackId="1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly details */}
      <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          Detalhamento Cronológico
        </h4>
        <div className="overflow-x-auto -mx-5">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/40">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Mês / Período</th>
                  <th className="px-5 py-3 text-right">Insumos</th>
                  <th className="px-5 py-3 text-right">Mão de Obra</th>
                  <th className="px-5 py-3 text-right">Outros</th>
                  <th className="px-5 py-3 text-right">Custo Consolidado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/20 text-xs text-slate-600 dark:text-slate-300">
                {data.custos_mensais.map((m) => (
                  <tr key={m.key} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">{m.mes}</td>
                    <td className="px-5 py-3 text-right font-medium text-teal-600 dark:text-teal-400">{formatCurrency(m.insumos)}</td>
                    <td className="px-5 py-3 text-right text-blue-600 dark:text-blue-400">{formatCurrency(m.mao_obra)}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{formatCurrency(m.outros)}</td>
                    <td className="px-5 py-3 text-right font-black text-slate-800 dark:text-slate-100">{formatCurrency(m.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
