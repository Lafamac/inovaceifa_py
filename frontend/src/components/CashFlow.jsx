import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { relatorioService } from '../services/api';
import { exportToCSV } from '../services/exportUtils';
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
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Search, 
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  Ban
} from 'lucide-react';

export const CashFlow = () => {
  const { safraAtiva } = useTenant();
  
  // States
  const [groupedData, setGroupedData] = useState([]);
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      if (!safraAtiva) return;
      setLoading(true);
      setError(null);
      try {
        const result = await relatorioService.getFluxoCaixa(safraAtiva.id);
        setGroupedData(result.grouped || []);
        setLedgerData(result.ledger || []);
      } catch (err) {
        console.error("Falha ao obter fluxo de caixa", err);
        setError("Erro ao carregar dados do fluxo de caixa.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [safraAtiva]);

  // Formatadores de moedas e datas
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  // Filtrar os dados do Ledger (Livro Razão)
  const filteredLedger = ledgerData.filter(item => {
    // 1. Filtrar registros cancelados (devem ser ignorados)
    if (item.status === 'CANCELADO') return false;

    // 2. Filtro de pesquisa textual
    const matchesSearch = item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.categoria.toLowerCase().includes(searchTerm.toLowerCase());

    // 3. Filtro de Status
    let matchesStatus = true;
    if (statusFilter === 'PAGO_RECEBIDO') {
      matchesStatus = item.status === 'PAGO' || item.status === 'RECEBIDO';
    } else if (statusFilter === 'PENDENTE') {
      matchesStatus = item.status === 'PENDENTE';
    } else if (statusFilter === 'ATRASADO') {
      matchesStatus = item.status === 'PENDENTE' && item.atrasado;
    }

    // 4. Filtro por data de vencimento
    const itemDate = new Date(item.vencimento);
    let matchesStartDate = true;
    let matchesEndDate = true;

    if (startDate) {
      matchesStartDate = itemDate >= new Date(startDate);
    }
    if (endDate) {
      matchesEndDate = itemDate <= new Date(endDate);
    }

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  if (loading) {
    return (
      <div className="glass-panel flex h-[400px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Processando Fluxo de Caixa...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/50">
        <div>
          <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-500" />
            Fluxo de Caixa Mensal
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acompanhamento de Realizações de Receitas/Despesas e Projeções Financeiras
          </p>
        </div>
      </div>

      {/* Gráfico do fluxo de caixa */}
      <div className="h-[260px] mt-6 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={groupedData}
            margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPrevisto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
            <XAxis 
              dataKey="periodo" 
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
            <Area type="monotone" name="Saldo Realizado" dataKey="saldo_realizado" stroke="#10b981" fillOpacity={1} fill="url(#colorRealizado)" strokeWidth={2.5} />
            <Area type="monotone" name="Saldo Previsto (Projetado)" dataKey="saldo_previsto" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrevisto)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Seção do Razão Financeiro (Tabela interativa com filtros de busca e data) */}
      <div className="mt-8 border-t border-slate-100 dark:border-slate-800/80 pt-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Lançamentos e Obrigações da Safra
          </h4>
          <button
            onClick={() => {
              const headers = ['Descrição', 'Categoria', 'Vencimento', 'Status', 'Tipo', 'Valor'];
              exportToCSV(`Fluxo_Caixa_Lancamentos`, headers, filteredLedger, item => [
                item.descricao,
                item.categoria,
                item.vencimento,
                item.status,
                item.tipo,
                item.valor.toFixed(2)
              ]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Exportar CSV</span>
          </button>
        </div>

        {/* Filters Controls Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/55">
          
          {/* Busca textual */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:border-emerald-500 focus:outline-none dark:text-white transition-all shadow-sm"
            />
          </div>

          {/* Filtro de Status */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:border-emerald-500 focus:outline-none dark:text-white transition-all shadow-sm appearance-none"
            >
              <option value="ALL">Todos os Lançamentos</option>
              <option value="PAGO_RECEBIDO">Liquidados (Realizados)</option>
              <option value="PENDENTE">Pendentes (Previstos)</option>
              <option value="ATRASADO">🔴 Atrasados (Atenção!)</option>
            </select>
          </div>

          {/* Data Inicial */}
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="date"
              placeholder="Data Inicial"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:border-emerald-500 focus:outline-none dark:text-white transition-all shadow-sm"
            />
          </div>

          {/* Data Final */}
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="date"
              placeholder="Data Final"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:border-emerald-500 focus:outline-none dark:text-white transition-all shadow-sm"
            />
          </div>

        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/50 dark:border-slate-800/80">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950/45">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Descrição / Categoria</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Vencimento</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Valor</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900/20 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-xs font-semibold text-slate-400 dark:text-slate-400">
                    Nenhum lançamento correspondente aos filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => {
                  const isDespesa = item.tipo === 'DESPESA';
                  const isPendente = item.status === 'PENDENTE';
                  const isAtrasado = isPendente && item.atrasado;

                  return (
                    <tr 
                      key={item.id}
                      className={`transition-colors ${
                        isAtrasado 
                          ? 'bg-rose-50/30 dark:bg-rose-950/10 hover:bg-rose-50/50 dark:hover:bg-rose-950/20' 
                          : isPendente
                          ? 'bg-amber-50/10 hover:bg-amber-50/20'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                      }`}
                    >
                      {/* Descricao */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.descricao}</span>
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mt-0.5">{item.categoria}</span>
                        </div>
                      </td>
                      
                      {/* Vencimento */}
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {formatDate(item.vencimento)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isAtrasado ? (
                          <div className="inline-flex items-center space-x-1 rounded-full bg-rose-100 dark:bg-rose-950/55 px-2 py-0.5 text-[9px] font-bold text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 shadow-sm animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Atrasado</span>
                          </div>
                        ) : isPendente ? (
                          <div className="inline-flex items-center space-x-1 rounded-full bg-amber-100 dark:bg-amber-950/55 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pendente</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 dark:bg-emerald-950/55 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Liquidado</span>
                          </div>
                        )}
                      </td>

                      {/* Valor */}
                      <td className={`px-4 py-3.5 text-right text-xs font-black ${
                        isDespesa ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isDespesa ? '-' : '+'}{formatCurrency(item.valor)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
