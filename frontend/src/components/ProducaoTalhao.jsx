import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { relatorioService } from '../services/api';
import { exportToCSV } from '../services/exportUtils';
import {
  TrendingUp,
  TrendingDown,
  Sprout,
  Scale,
  Percent,
  AlertTriangle,
  Loader2,
  BarChart2,
  TableProperties
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const ProducaoTalhao = () => {
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
        const result = await relatorioService.getProducaoTalhao(safraAtiva.id, fazendaAtiva.id);
        setData(result);
      } catch (err) {
        console.error("Falha ao obter produção por talhão", err);
        setError("Erro ao carregar dados de Produção por Talhão.");
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
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Processando Produção por Talhão...</span>
        </div>
      </div>
    );
  }

  if (error || !data || !data.producao_por_talhao || data.producao_por_talhao.length === 0) {
    return (
      <div className="glass-panel flex h-[400px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40 text-center px-6">
        <div className="space-y-2">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 animate-bounce" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nenhum registro de produção disponível para esta safra.</p>
        </div>
      </div>
    );
  }

  const { producao_por_talhao, total_comercializado_sacas } = data;

  // Calculando KPIs consolidados
  const totalArea = producao_por_talhao.reduce((sum, curr) => sum + curr.area, 0);
  const totalEstimadoSacas = producao_por_talhao.reduce((sum, curr) => sum + curr.estimado.sacas, 0);
  const totalRealSacas = producao_por_talhao.reduce((sum, curr) => sum + curr.real.sacas, 0);
  const desvioTotalSacas = totalRealSacas - totalEstimadoSacas;
  const desvioTotalPercentual = totalEstimadoSacas > 0 ? (desvioTotalSacas / totalEstimadoSacas) * 100 : 0;
  
  const prodMediaEstimada = totalArea > 0 ? totalEstimadoSacas / totalArea : 0;
  const prodMediaReal = totalArea > 0 ? totalRealSacas / totalArea : 0;

  const isPositiveDesvio = desvioTotalSacas >= 0;

  // Prepara dados para o gráfico de barras
  const chartData = producao_por_talhao.map(t => ({
    name: t.codigo,
    'Estimado (sc)': t.estimado.sacas,
    'Real (sc)': t.real.sacas,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Banner Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Produzido Real */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Produção Real Total</span>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-emerald-600 dark:text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {totalRealSacas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sc
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              Volume total produzido na safra atual
            </p>
          </div>
        </div>

        {/* Produção Planejada Estimada */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Produção Estimada</span>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-2.5 text-blue-600 dark:text-blue-400">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {totalEstimadoSacas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sc
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              Volume planejado com base nas estimativas
            </p>
          </div>
        </div>

        {/* Produtividade Média Real vs Estimada */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Produtividade Real</span>
            <div className="rounded-xl bg-purple-50 dark:bg-purple-950/40 p-2.5 text-purple-600 dark:text-purple-400">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {prodMediaReal.toFixed(2)} sc/ha
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              Estimado: <span className="font-bold">{prodMediaEstimada.toFixed(2)} sc/ha</span>
            </p>
          </div>
        </div>

        {/* Desvio Total */}
        <div className={`glass-panel rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-300 ${
          isPositiveDesvio
            ? 'border-emerald-200/50 bg-emerald-50/10 dark:border-emerald-800/30 dark:bg-emerald-950/10'
            : 'border-rose-200/50 bg-rose-50/10 dark:border-rose-800/30 dark:bg-rose-950/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Divergência de Prod.</span>
            <div className={`rounded-xl p-2.5 ${
              isPositiveDesvio
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
            }`}>
              {isPositiveDesvio ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-black ${isPositiveDesvio ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPositiveDesvio ? '+' : ''}{desvioTotalSacas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sc
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" />
              Desvio de <span className="font-bold">{isPositiveDesvio ? '+' : ''}{desvioTotalPercentual.toFixed(2)}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Clustered Bar Chart */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/40">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-500" />
                Comparativo de Produção por Talhão
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Visualização lado a lado da produção estimada em sacas versus a colheita real
              </p>
            </div>
          </div>

          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                barGap={4}
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
                  tickFormatter={(val) => `${val.toLocaleString('pt-BR')}`}
                />
                <Tooltip
                  formatter={(val) => [`${val.toLocaleString('pt-BR')} sc`, '']}
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
                <Bar dataKey="Estimado (sc)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Real (sc)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Commercialized vs Total Gauge card */}
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-2">
              Comercialização de Café
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Relação entre o volume total de café produzido e o volume negociado/comercializado
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center">
              {/* Central text */}
              <div className="text-center z-10">
                <span className="text-3xl font-black text-slate-800 dark:text-slate-100">
                  {((total_comercializado_sacas / (totalRealSacas || 1)) * 100).toFixed(0)}%
                </span>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Negociado</p>
              </div>

              {/* Decorative progress ring */}
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="rgba(148, 163, 184, 0.1)"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="#10b981"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={376.99}
                  strokeDashoffset={376.99 - (376.99 * Math.min(total_comercializado_sacas / (totalRealSacas || 1), 1))}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400 dark:text-slate-400">Total Comercializado:</span>
              <span className="font-black text-slate-700 dark:text-slate-200">
                {total_comercializado_sacas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sc
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400 dark:text-slate-400">Restante em Estoque:</span>
              <span className="font-black text-amber-500">
                {Math.max(0, totalRealSacas - total_comercializado_sacas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sc
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Spreadsheet / Table */}
      <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <TableProperties className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Detalhamento Físico de Colheita</h3>
          </div>
          <button
            onClick={() => {
              const headers = ['Talhão', 'Código', 'Área (ha)', 'Sacas Estimadas', 'Prod. Est (sc/ha)', 'Sacas Colhidas', 'Prod. Real (sc/ha)', 'Desvio Físico (sc)', 'Desvio %'];
              exportToCSV(`Producao_Talhao_${fazendaAtiva?.nome || 'Fazenda'}`, headers, producao_por_talhao, t => [
                t.nome,
                t.codigo,
                t.area.toFixed(1),
                t.estimado.sacas.toFixed(2),
                t.estimado.produtividade.toFixed(2),
                t.real.sacas.toFixed(2),
                t.real.produtividade.toFixed(2),
                t.desvio_sacas.toFixed(2),
                t.desvio_percentual.toFixed(2)
              ]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <TableProperties className="w-3.5 h-3.5 text-emerald-500" />
            <span>Exportar CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/50 text-slate-400 uppercase tracking-wider font-extrabold border-b border-slate-100 dark:border-slate-800/40">
                <th className="py-3 px-4">Talhão</th>
                <th className="py-3 px-4">Área (ha)</th>
                <th className="py-3 px-4 text-center">Estimativa (sc)</th>
                <th className="py-3 px-4 text-center">Prod. Est (sc/ha)</th>
                <th className="py-3 px-4 text-center">Colheita Real (sc)</th>
                <th className="py-3 px-4 text-center">Prod. Real (sc/ha)</th>
                <th className="py-3 px-4 text-center">Desvio Físico</th>
                <th className="py-3 px-4 text-center">Desvio %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
              {producao_por_talhao.map((t) => {
                const talhaoDesvioPositivo = t.desvio_sacas >= 0;
                return (
                  <tr key={t.talhao_id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors duration-150">
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200">
                      <span className="block">{t.codigo}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{t.nome}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-500 dark:text-slate-400">
                      {t.area.toFixed(1)} ha
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-600 dark:text-slate-300">
                      {t.estimado.sacas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-500 dark:text-slate-400">
                      {t.estimado.produtividade.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-slate-800 dark:text-slate-100">
                      {t.real.sacas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-slate-800 dark:text-slate-100">
                      {t.real.produtividade.toFixed(2)}
                    </td>
                    <td className={`py-3 px-4 text-center font-bold ${
                      talhaoDesvioPositivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {talhaoDesvioPositivo ? '+' : ''}
                      {t.desvio_sacas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`py-3 px-4 text-center font-extrabold rounded-r-xl ${
                      talhaoDesvioPositivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {talhaoDesvioPositivo ? '+' : ''}
                      {t.desvio_percentual.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
