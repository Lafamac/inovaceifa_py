import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { relatorioService } from '../services/api';
import { 
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { 
  Fuel, 
  TrendingUp, 
  Gauge, 
  Loader2,
  AlertCircle,
  Truck,
  Cpu
} from 'lucide-react';

export const ConsumoDiesel = () => {
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
        const result = await relatorioService.getConsumoDiesel(safraAtiva.id, fazendaAtiva.id);
        setData(result);
      } catch (err) {
        console.error("Falha ao obter consumo de diesel", err);
        setError("Erro ao carregar dados do Consumo de Diesel.");
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
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Processando Consumo de Diesel...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel flex h-[400px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40 text-center px-6">
        <div className="space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 animate-pulse" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nenhum consumo de combustível cadastrado na safra atual.</p>
        </div>
      </div>
    );
  }

  const { consolidado, consumo_mensal_estoque, maquinas_abastecimento } = data;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Fuel className="w-4 h-4 text-emerald-500" />
          Consumo de Óleo Diesel
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Monitoramento do consumo de diesel no estoque interno e despesa com abastecimento de máquinas
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Consumido (L)</span>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {consolidado.total_litros.toLocaleString('pt-BR')} L
            </h3>
            <span className="text-[10px] text-slate-400">litros retirados</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custo de Abastecimento</span>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(consolidado.total_valor)}
            </h3>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preço Médio do Diesel</span>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {formatCurrency(consolidado.preco_medio)}
            </h3>
            <span className="text-[10px] text-slate-400">por litro</span>
          </div>
        </div>

      </div>

      {/* Monthly chart & Machine usage row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Consumption Chart */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm lg:col-span-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Consumo Mensal de Combustível</h4>
          <div className="h-[260px] w-full">
            {consumo_mensal_estoque && consumo_mensal_estoque.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={consumo_mensal_estoque}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis 
                    dataKey="mes" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    label={{ value: 'Litros (L)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: '9px', fontWeight: 'bold' } }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `R$ ${v}`}
                    label={{ value: 'Preço Médio (R$/L)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: '9px', fontWeight: 'bold' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                      borderRadius: '12px', 
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                  <Bar yAxisId="left" name="Litros Consumidos" dataKey="litros" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  <Line yAxisId="right" type="monotone" name="Preço do Diesel (R$)" dataKey="preco_medio" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Nenhum dado mensal de diesel encontrado.
              </div>
            )}
          </div>
        </div>

        {/* Machine details card */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm flex flex-col">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-500" />
            Consumo das Máquinas
          </h4>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {maquinas_abastecimento && maquinas_abastecimento.map((maq) => {
              const cod = maq.codigo || maq.maquina_codigo || maq.codigo_maquina || maq.maquina__codigo || "MÁQ";
              const cost = maq.custo_abastecimento_total || 0;
              const hours = maq.horas_trabalhadas_total || 0;
              const valHour = hours > 0 ? cost / hours : 0;
              
              return (
                <div key={maq.maquina_id} className="rounded-xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {cod}
                    </span>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(cost)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{maq.descricao}</p>
                  
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 pt-2 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" />
                      {hours.toFixed(1)} h trab.
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Gauge className="w-3.5 h-3.5" />
                      {formatCurrency(valHour)}/h
                    </span>
                  </div>
                </div>
              );
            })}
            
            {(!maquinas_abastecimento || maquinas_abastecimento.length === 0) && (
              <div className="text-center text-xs text-slate-400 py-12">
                Nenhum abastecimento associado a máquinas.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
