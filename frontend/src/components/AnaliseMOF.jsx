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
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  Contact, 
  Loader2,
  AlertCircle,
  PiggyBank,
  BadgeAlert
} from 'lucide-react';

export const AnaliseMOF = () => {
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
        const result = await relatorioService.getAnaliseMOF(safraAtiva.id, fazendaAtiva.id);
        setData(result);
      } catch (err) {
        console.error("Falha ao obter análise MOF", err);
        setError("Erro ao carregar dados da Mão de Obra Fixa.");
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
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Processando Custos de Pessoal...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel flex h-[400px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40 text-center px-6">
        <div className="space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 animate-pulse" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nenhum custo de mão de obra fixa cadastrado para esta safra.</p>
        </div>
      </div>
    );
  }

  const { folha_mensal, funcionarios_totais } = data;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val);
  };

  const totalBase = folha_mensal.reduce((sum, curr) => sum + curr.salario_base, 0);
  const totalEncargos = folha_mensal.reduce((sum, curr) => sum + curr.encargos, 0);
  const totalBeneficios = folha_mensal.reduce((sum, curr) => sum + curr.beneficios, 0);
  const totalGeral = totalBase + totalEncargos + totalBeneficios;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500" />
          Análise de Mão de Obra Fixa (MOF)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Estatísticas consolidadas da folha de pagamento interna, incluindo salários, encargos sociais e benefícios
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Folha de Pessoal</span>
          <span className="mt-1 text-lg font-black text-slate-800 dark:text-slate-100 block">
            {formatCurrency(totalGeral)}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Salários Base</span>
          <span className="mt-1 text-lg font-black text-blue-600 dark:text-blue-400 block">
            {formatCurrency(totalBase)}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Encargos Sociais</span>
          <span className="mt-1 text-lg font-black text-purple-600 dark:text-purple-400 block">
            {formatCurrency(totalEncargos)}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Benefícios e Prêmios</span>
          <span className="mt-1 text-lg font-black text-teal-600 dark:text-teal-400 block">
            {formatCurrency(totalBeneficios)}
          </span>
        </div>

      </div>

      {/* Chart Section */}
      <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Composição Mensal da Folha (R$)</h4>
        <div className="h-[260px] w-full">
          {folha_mensal && folha_mensal.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={folha_mensal}
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
                <Bar name="Salário Base" dataKey="salario_base" stackId="a" fill="#3b82f6" />
                <Bar name="Encargos Sociais" dataKey="encargos" stackId="a" fill="#a855f7" />
                <Bar name="Benefícios" dataKey="beneficios" stackId="a" fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Nenhum dado mensal de folha encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Employee List */}
      <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm overflow-hidden">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Contact className="w-4 h-4 text-emerald-500" />
          Acumulado por Colaborador Próprio
        </h4>
        
        <div className="overflow-x-auto -mx-5">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/40">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Colaborador</th>
                  <th className="px-5 py-3">Cargo</th>
                  <th className="px-5 py-3">Grupo</th>
                  <th className="px-5 py-3 text-right">Meses Trab.</th>
                  <th className="px-5 py-3 text-right">Salário Base</th>
                  <th className="px-5 py-3 text-right">Encargos</th>
                  <th className="px-5 py-3 text-right">Benefícios</th>
                  <th className="px-5 py-3 text-right">Total Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/20 text-xs text-slate-600 dark:text-slate-300">
                {funcionarios_totais && funcionarios_totais.map((f) => (
                  <tr key={f.funcionario_id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">{f.nome}</td>
                    <td className="px-5 py-3 font-medium">{f.cargo}</td>
                    <td className="px-5 py-3 text-slate-500">{f.grupo}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-500">{f.meses_trabalhados}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(f.salario_base)}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(f.encargos)}</td>
                    <td className="px-5 py-3 text-right text-teal-600 dark:text-teal-400">{formatCurrency(f.beneficios)}</td>
                    <td className="px-5 py-3 text-right font-black text-slate-800 dark:text-slate-100">{formatCurrency(f.total)}</td>
                  </tr>
                ))}
                {(!funcionarios_totais || funcionarios_totais.length === 0) && (
                  <tr>
                    <td colSpan="8" className="px-5 py-8 text-center text-slate-400">
                      Nenhum colaborador próprio associado à folha desta safra.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
