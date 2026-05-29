import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { relatorioService } from '../services/api';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  BadgeAlert,
  Loader2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Boxes,
  X
} from 'lucide-react';

export const Estoque = () => {
  const { safraAtiva, fazendaAtiva } = useTenant();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNegativeOnly, setFilterNegativeOnly] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!safraAtiva || !fazendaAtiva) return;
      setLoading(true);
      setError(null);
      try {
        const result = await relatorioService.getEstoque(safraAtiva.id, fazendaAtiva.id);
        setData(result);
      } catch (err) {
        console.error("Falha ao obter estoque", err);
        setError("Erro ao carregar dados do Estoque.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [safraAtiva, fazendaAtiva]);

  // Alerta de estoque baixo flutuante (Toast)
  useEffect(() => {
    if (data && data.estoque) {
      const negatives = data.estoque.filter(item => item.alerta_negativo).length;
      if (negatives > 0) {
        setToastMessage(`Aviso de Ruptura: Existem ${negatives} insumos operando com saldo negativo no almoxarifado!`);
        setShowToast(true);
        const timer = setTimeout(() => {
          setShowToast(false);
        }, 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [data]);

  if (loading) {
    return (
      <div className="glass-panel flex h-[400px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Processando Saldos de Almoxarifado...</span>
        </div>
      </div>
    );
  }

  if (error || !data || !data.estoque || data.estoque.length === 0) {
    return (
      <div className="glass-panel flex h-[400px] items-center justify-center rounded-2xl border border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40 text-center px-6">
        <div className="space-y-2">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 animate-pulse" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nenhuma movimentação de estoque registrada para esta safra.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val);
  };

  const filteredEstoque = data.estoque.filter(item => {
    const matchesSearch = item.nome_comercial.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.classificacao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesNegative = filterNegativeOnly ? item.alerta_negativo : true;
    
    return matchesSearch && matchesNegative;
  });

  const totalItens = data.estoque.length;
  const itensNegativos = data.estoque.filter(item => item.alerta_negativo).length;
  const valorTotalEstoque = data.estoque.reduce((acc, curr) => acc + (curr.saldo > 0 ? curr.valor_total : 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-500" />
            Valorização de Almoxarifado
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Saldos físicos atuais valorizados através do custo médio móvel de aquisição
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Alerta Negativos Filter Button */}
          <button
            onClick={() => setFilterNegativeOnly(!filterNegativeOnly)}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold border transition-colors ${
              filterNegativeOnly 
                ? 'bg-rose-500 text-white border-rose-500' 
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${filterNegativeOnly ? 'text-white' : 'text-rose-500 animate-pulse'}`} />
            <span>Saldos Negativos ({itensNegativos})</span>
          </button>

          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Buscar insumos..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor Total Estocado</span>
          <span className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
            {formatCurrency(valorTotalEstoque)}
          </span>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Produtos Cadastrados</span>
          <span className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100 block">
            {totalItens} <span className="text-xs text-slate-400 font-bold">itens</span>
          </span>
        </div>

        <div className={`glass-panel rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
          itensNegativos > 0 
            ? 'border-rose-300/40 bg-rose-50/10 dark:border-rose-950/20' 
            : 'border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50'
        }`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alertas de Ruptura</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${itensNegativos > 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>
              {itensNegativos}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">com saldo negativo</span>
          </div>
        </div>

      </div>

      {/* Critical Stock Alert Banner */}
      {itensNegativos > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200/30 bg-rose-50/20 dark:bg-rose-950/10 p-4 text-xs font-semibold text-rose-600 dark:text-rose-400 animate-pulse">
          <BadgeAlert className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-black">Atenção: Existem insumos operando com saldo negativo no sistema!</h4>
            <p className="text-[11px] font-medium text-rose-500/90 mt-0.5">O saldo negativo é exibido como um alerta dinâmico nas OSs de consumo real, sem bloqueio operacional, mas exige a conciliação física ou entrada de notas fiscais de compra.</p>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEstoque.map((item) => (
          <div 
            key={item.produto_id} 
            className={`glass-panel rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
              item.alerta_negativo 
                ? 'border-rose-300/50 dark:border-rose-950/50 bg-rose-50/10 dark:bg-rose-950/5 shadow-rose-500/5 ring-1 ring-rose-500/10' 
                : 'border-slate-200/50 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/50'
            }`}
          >
            {item.alerta_negativo && (
              <div className="absolute top-0 right-0 rounded-bl-xl bg-rose-500 px-2 py-0.5 text-[8px] font-black uppercase text-white tracking-widest flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                Negativo
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">{item.codigo}</span>
                <span className="rounded-lg bg-slate-100 dark:bg-slate-950 px-2 py-0.5 text-[9px] font-extrabold text-slate-500 dark:text-slate-400 border border-slate-200/20">
                  {item.classificacao}
                </span>
              </div>
              
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 pr-10 line-clamp-1">{item.nome_comercial}</h4>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/40 grid grid-cols-2 gap-4 text-xs font-bold">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Saldo em Estoque</span>
                <span className={`text-base font-black ${item.alerta_negativo ? 'text-rose-500 font-extrabold' : 'text-slate-800 dark:text-slate-100'}`}>
                  {item.saldo.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {item.unidade}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Preço Médio</span>
                <span className="text-sm font-black text-slate-500 dark:text-slate-400 block mt-0.5">
                  {formatCurrency(item.preco_medio)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">Valorização Total</span>
              <span className={`text-sm font-extrabold ${item.alerta_negativo ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {formatCurrency(item.valor_total)}
              </span>
            </div>

          </div>
        ))}

        {filteredEstoque.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            Nenhum insumo atende aos critérios de pesquisa informados.
          </div>
        )}
      </div>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-rose-500/30 bg-rose-950/95 p-4 text-xs font-semibold text-rose-300 shadow-2xl shadow-rose-950/20 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
            <p className="leading-normal">{toastMessage}</p>
          </div>
          <button 
            onClick={() => setShowToast(false)} 
            className="p-1 hover:bg-rose-900/50 rounded-lg text-rose-400 transition-colors shrink-0 cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
