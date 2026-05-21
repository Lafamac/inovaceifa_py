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
  Coins, 
  Search, 
  Layers, 
  Users, 
  Cpu, 
  FileSpreadsheet,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const CustoTalhao = () => {
  const { safraAtiva, fazendaAtiva } = useTenant();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!safraAtiva || !fazendaAtiva) return;
      setLoading(true);
      setError(null);
      try {
        const result = await relatorioService.getCustoTalhao(safraAtiva.id, fazendaAtiva.id);
        setData(result);
      } catch (err) {
        console.error("Falha ao obter custo por talhão", err);
        setError("Erro ao carregar dados do Custo por Talhão.");
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
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Processando Custos de Talhões...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel flex h-[400px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40 text-center px-6">
        <div className="space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 animate-pulse" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nenhum dado cadastrado de custos de talhão para a safra ativa.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val);
  };

  const filteredTalhoes = (data.custos_por_talhao || []).filter(t => 
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGeral = filteredTalhoes.reduce((acc, curr) => acc + curr.total, 0);
  const totalMO = filteredTalhoes.reduce((acc, curr) => acc + curr.mão_de_obra, 0);
  const totalHM = filteredTalhoes.reduce((acc, curr) => acc + curr.hora_maquina, 0);
  const totalInsumos = filteredTalhoes.reduce((acc, curr) => acc + curr.insumos, 0);

  return (
    <div className="space-y-6">
      
      {/* Search Header Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-500" />
            Custo Real por Talhão
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Distribuição de insumos, maquinário e pessoal baseada em apontamentos de OS Concluídas
          </p>
        </div>
        
        <div className="relative max-w-sm w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Buscar por talhão ou código..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400">Custo Total de Operações</span>
            <Coins className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-lg font-black text-slate-800 dark:text-slate-100">
            {formatCurrency(totalGeral)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400">Mão de Obra</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-lg font-black text-slate-800 dark:text-slate-100">
            {formatCurrency(totalMO)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400">Hora Máquina</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-lg font-black text-slate-800 dark:text-slate-100">
            {formatCurrency(totalHM)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400">Insumos</span>
            <Layers className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2 text-lg font-black text-slate-800 dark:text-slate-100">
            {formatCurrency(totalInsumos)}
          </div>
        </div>
      </div>

      {/* Recharts Stacked Bar Chart */}
      <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Composição de Custo por Talhão (R$)</h4>
        <div className="h-[280px] w-full">
          {filteredTalhoes.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredTalhoes}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis 
                  dataKey="codigo" 
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
                <Bar name="Mão de Obra" dataKey="mão_de_obra" stackId="a" fill="#3b82f6" />
                <Bar name="Hora Máquina" dataKey="hora_maquina" stackId="a" fill="#a855f7" />
                <Bar name="Insumos" dataKey="insumos" stackId="a" fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Nenhum talhão correspondente à busca.
            </div>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Planilha Analítica de Rateios
          </h4>
          <span className="text-[10px] text-slate-400 font-bold">{filteredTalhoes.length} talhão(ões) encontrado(s)</span>
        </div>
        
        <div className="overflow-x-auto -mx-5">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/40">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Cód</th>
                  <th className="px-5 py-3">Talhão</th>
                  <th className="px-5 py-3 text-right">Área (ha)</th>
                  <th className="px-5 py-3 text-right">Mão de Obra</th>
                  <th className="px-5 py-3 text-right">Hora Máquina</th>
                  <th className="px-5 py-3 text-right">Insumos</th>
                  <th className="px-5 py-3 text-right">Custo Total</th>
                  <th className="px-5 py-3 text-right">R$/ha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/20 text-xs text-slate-600 dark:text-slate-300">
                {filteredTalhoes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">{t.codigo}</td>
                    <td className="px-5 py-3 font-medium">{t.nome}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-500">{t.area.toFixed(1)}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(t.mão_de_obra)}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(t.hora_maquina)}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(t.insumos)}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatCurrency(t.total)}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {t.area > 0 ? formatCurrency(t.total / t.area) : 'R$ 0,00'}
                    </td>
                  </tr>
                ))}
                {filteredTalhoes.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-5 py-8 text-center text-slate-400">
                      Nenhum custo registrado ou encontrado para a safra e fazenda selecionadas.
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
