import React, { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { relatorioService } from '../services/api';
import api from '../services/api';
import { 
  Sprout, 
  Calendar, 
  MapPin, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  FileText, 
  Check, 
  Lock, 
  LockOpen,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';

export const Planejamentos = () => {
  const { safraAtiva, fazendaAtiva } = useTenant();
  const { user } = useAuth();
  const isSuperUsuario = user && (
    user.is_superuser ||
    user.perfil_id === 1 ||
    user.cargo?.toLowerCase().includes('gerente') ||
    user.cargo?.toLowerCase().includes('super')
  );

  // Estados principais
  const [planejamentos, setPlanejamentos] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos', 'aberto', 'aprovado'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Referências do banco
  const [tiposOperacao, setTiposOperacao] = useState([]);
  const [talhoes, setTalhoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [terceirizados, setTerceirizados] = useState([]);
  const [turmas, setTurmas] = useState([]);

  // Formulário de Novo Planejamento
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({
    descricao: '',
    data_planejamento: new Date().toISOString().slice(0, 10),
    observacao: ''
  });

  // Formulário de Nova OS Planejada
  const [showNewOSModal, setShowNewOSModal] = useState(false);
  const [newOSForm, setNewOSForm] = useState({
    tipo_operacao: '',
    data_inicio_planejada: new Date().toISOString().slice(0, 10),
    data_fim_planejada: new Date().toISOString().slice(0, 10),
    observacao: '',
    talhoes_selecionados: [],
    insumos_selecionados: [], // array de { produto_id, dose_planejada, quantidade_planejada }
    funcionario: '',
    trator: '',
    implemento: '',
    terceirizado: '',
    usar_turma: false,
    valor_planejado_turma: ''
  });

  // Temporários para adicionar Insumo na OS
  const [tempInsumo, setTempInsumo] = useState({ produto_id: '', dose_planejada: '', quantidade_planejada: '' });

  const showAlert = (type, message) => {
    if (type === 'error') {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }
    window.setTimeout(() => {
      setError('');
      setSuccess('');
    }, 4500);
  };

  const loadReferences = useCallback(async () => {
    try {
      const [resOps, resTalhoes, resProds, resFuncs, resMaqs, resTerceirizados, resTurmas] = await Promise.all([
        api.get('/api/ref/tipos-operacao/'),
        api.get('/api/talhoes/'),
        api.get('/api/produtos/'),
        api.get('/api/funcionarios/'),
        api.get('/api/maquinas/'),
        api.get('/api/terceirizados/'),
        api.get('/api/turmas-terceirizadas/')
      ]);
      setTiposOperacao(resOps.data?.results || resOps.data || []);
      
      // Filtrar talões da fazenda ativa
      const allTalhoes = resTalhoes.data?.results || resTalhoes.data || [];
      const currentTalhoes = allTalhoes.filter(t => t.fazenda_id === fazendaAtiva?.id || t.fazenda === fazendaAtiva?.id);
      setTalhoes(currentTalhoes);
      
      setProdutos(resProds.data?.results || resProds.data || []);

      // Filtrar funcionários da fazenda ativa
      const allFuncs = resFuncs.data?.results || resFuncs.data || [];
      const currentFuncs = allFuncs.filter(f => f.fazenda_id === fazendaAtiva?.id || f.fazenda === fazendaAtiva?.id);
      setFuncionarios(currentFuncs);

      // Filtrar máquinas da fazenda ativa
      const allMaqs = resMaqs.data?.results || resMaqs.data || [];
      const currentMaqs = allMaqs.filter(m => m.fazenda_id === fazendaAtiva?.id || m.fazenda === fazendaAtiva?.id);
      setMaquinas(currentMaqs);

      // Filtrar terceirizados da fazenda ativa
      const allTerceirizados = resTerceirizados.data?.results || resTerceirizados.data || [];
      const currentTerceirizados = allTerceirizados.filter(t => t.fazenda_id === fazendaAtiva?.id || t.fazenda === fazendaAtiva?.id);
      setTerceirizados(currentTerceirizados);

      // Filtrar turmas da fazenda ativa
      const allTurmas = resTurmas.data?.results || resTurmas.data || [];
      const currentTurmas = allTurmas.filter(t => t.fazenda_id === fazendaAtiva?.id || t.fazenda === fazendaAtiva?.id);
      setTurmas(currentTurmas);
    } catch (err) {
      console.error("Erro ao carregar referências", err);
    }
  }, [fazendaAtiva]);

  const fetchPlanejamentos = useCallback(async () => {
    if (!safraAtiva || !fazendaAtiva) return [];
    setLoading(true);
    try {
      const list = await relatorioService.getPlanejamentos();
      // Filtrar por fazenda e safra ativas
      const filtrados = list.filter(p => 
        (p.fazenda_id === fazendaAtiva.id || p.fazenda === fazendaAtiva.id) && 
        (p.safra_id === safraAtiva.id || p.safra === safraAtiva.id)
      );
      setPlanejamentos(filtrados);
      return filtrados;
    } catch (err) {
      console.error(err);
      showAlert('error', 'Não foi possível carregar os planejamentos.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [safraAtiva, fazendaAtiva]);

  useEffect(() => {
    fetchPlanejamentos();
    loadReferences();
  }, [fetchPlanejamentos, loadReferences]);

  // Sempre que a lista de planejamentos ou o filtro de status mudarem,
  // seleciona automaticamente o primeiro planejamento correspondente àquele filtro (se houver).
  useEffect(() => {
    if (!loading && planejamentos.length > 0) {
      const filtered = planejamentos.filter(plan => {
        if (statusFilter === 'aberto') return !plan.aprovado;
        if (statusFilter === 'aprovado') return plan.aprovado;
        return true;
      });
      
      if (filtered.length > 0) {
        // Só atualizamos se o selectedPlan atual não for um dos itens da lista filtrada
        const isCurrentlySelectedInFiltered = filtered.some(p => p.id === selectedPlan?.id);
        if (!isCurrentlySelectedInFiltered) {
          setSelectedPlan(filtered[0]);
        }
      } else {
        setSelectedPlan(null);
      }
    } else if (!loading && planejamentos.length === 0) {
      setSelectedPlan(null);
    }
  }, [statusFilter, planejamentos, loading, selectedPlan]);

  const handleCreatePlanejamento = async (e) => {
    e.preventDefault();
    if (!newPlanForm.descricao) {
      showAlert('error', 'Digite uma descrição para o planejamento.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...newPlanForm,
        fazenda: fazendaAtiva.id,
        safra: safraAtiva.id
      };
      await relatorioService.createPlanejamento(payload);
      showAlert('success', 'Planejamento de safra criado com sucesso!');
      setShowNewPlanModal(false);
      setNewPlanForm({
        descricao: '',
        data_planejamento: new Date().toISOString().slice(0, 10),
        observacao: ''
      });
      await fetchPlanejamentos();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao salvar o planejamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleAprovar = async (id) => {
    if (!isSuperUsuario) {
      showAlert('error', 'Apenas o Superusuário tem permissão para aprovar planejamentos.');
      return;
    }
    setSaving(true);
    try {
      await relatorioService.aprovarPlanejamento(id);
      showAlert('success', 'Planejamento aprovado com sucesso! Alterações futuras foram bloqueadas.');
      const list = await fetchPlanejamentos();
      const atualizado = list.find(p => p.id === id);
      if (atualizado) setSelectedPlan(atualizado);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Falha ao aprovar o planejamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleGerarOSs = async (id) => {
    if (!isSuperUsuario) {
      showAlert('error', 'Apenas o Superusuário tem permissão para gerar Ordens de Serviço.');
      return;
    }
    setSaving(true);
    try {
      const res = await relatorioService.gerarOrdensServico(id);
      showAlert('success', res.detail || 'Ordens de Serviço Reais geradas com sucesso!');
      const list = await fetchPlanejamentos();
      const atualizado = list.find(p => p.id === id);
      if (atualizado) setSelectedPlan(atualizado);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao gerar as Ordens de Serviço a partir do planejamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOSPlanejada = async (e) => {
    e.preventDefault();
    if (!newOSForm.tipo_operacao) {
      showAlert('error', 'Selecione o tipo de operação.');
      return;
    }
    if (newOSForm.talhoes_selecionados.length === 0) {
      showAlert('error', 'Selecione ao menos um talhão.');
      return;
    }
    if (newOSForm.data_fim_planejada && newOSForm.data_inicio_planejada && newOSForm.data_fim_planejada < newOSForm.data_inicio_planejada) {
      showAlert('error', 'A data do Término Planejado não pode ser menor que a data de Início Planejado.');
      return;
    }

    setSaving(true);
    try {
      // Criar a OS Planejada com talhões e insumos aninhados
      const osPayload = {
        planejamento: selectedPlan.id,
        tipo_operacao: Number(newOSForm.tipo_operacao),
        data_inicio_planejada: newOSForm.data_inicio_planejada,
        data_fim_planejada: newOSForm.data_fim_planejada,
        observacao: newOSForm.observacao,
        talhoes_ids: newOSForm.talhoes_selecionados.map(Number),
        funcionario: newOSForm.funcionario ? Number(newOSForm.funcionario) : null,
        trator: newOSForm.trator ? Number(newOSForm.trator) : null,
        implemento: newOSForm.implemento ? Number(newOSForm.implemento) : null,
        terceirizado: newOSForm.terceirizado ? Number(newOSForm.terceirizado) : null,
        turma: null,
        usar_turma: !!newOSForm.usar_turma,
        valor_planejado_turma: newOSForm.usar_turma && newOSForm.valor_planejado_turma ? Number(newOSForm.valor_planejado_turma) : null,
        insumos: newOSForm.insumos_selecionados.map(ins => ({
          produto: Number(ins.produto_id),
          dose_planejada: Number(ins.dose_planejada),
          quantidade_planejada: Number(ins.quantidade_planejada)
        }))
      };
      await api.post('/api/ordens-servico-planejadas/', osPayload);

      showAlert('success', 'Atividade planejada adicionada com sucesso!');
      setShowNewOSModal(false);
      setNewOSForm({
        tipo_operacao: '',
        data_inicio_planejada: new Date().toISOString().slice(0, 10),
        data_fim_planejada: new Date().toISOString().slice(0, 10),
        observacao: '',
        talhoes_selecionados: [],
        insumos_selecionados: [],
        funcionario: '',
        trator: '',
        implemento: '',
        terceirizado: '',
        usar_turma: false,
        valor_planejado_turma: ''
      });
      const list = await fetchPlanejamentos();
      const atualizado = list.find(p => p.id === selectedPlan.id);
      if (atualizado) setSelectedPlan(atualizado);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao salvar a atividade planejada.');
    } finally {
      setSaving(false);
    }
  };

  const addTempInsumo = () => {
    if (!tempInsumo.produto_id || !tempInsumo.dose_planejada || !tempInsumo.quantidade_planejada) {
      showAlert('error', 'Preencha todos os campos do insumo.');
      return;
    }
    setNewOSForm(prev => ({
      ...prev,
      insumos_selecionados: [...prev.insumos_selecionados, { ...tempInsumo }]
    }));
    setTempInsumo({ produto_id: '', dose_planejada: '', quantidade_planejada: '' });
  };

  const removeInsumoFromOS = (idx) => {
    setNewOSForm(prev => ({
      ...prev,
      insumos_selecionados: prev.insumos_selecionados.filter((_, i) => i !== idx)
    }));
  };

  const handleToggleTalhaoSelection = (tId) => {
    setNewOSForm(prev => {
      const exists = prev.talhoes_selecionados.includes(tId);
      return {
        ...prev,
        talhoes_selecionados: exists
          ? prev.talhoes_selecionados.filter(id => id !== tId)
          : [...prev.talhoes_selecionados, tId]
      };
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const form = event.target.form;
      if (form) {
        const index = Array.prototype.indexOf.call(form, event.target);
        if (index > -1) {
          let nextIndex = index + 1;
          while (nextIndex < form.elements.length) {
            const nextEl = form.elements[nextIndex];
            if (nextEl && !nextEl.disabled && nextEl.tabIndex !== -1 && nextEl.type !== 'hidden') {
              if (['INPUT', 'SELECT', 'TEXTAREA'].includes(nextEl.tagName) || nextEl.type === 'submit') {
                nextEl.focus();
                if (nextEl.select) nextEl.select();
                break;
              }
            }
            nextIndex++;
          }
        }
      }
    }
  };

  if (loading && planejamentos.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Carregando planejamentos agrícolas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Mensagens de Alerta */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-950/20 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-950/20 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
            <Sprout className="w-6 h-6 text-emerald-500" />
            Planejamento de Safra
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">
            Mapeie o orçamento, distribua insumos por talhão e gere as OSs da safra.
          </p>
        </div>

        {safraAtiva && (
          <button
            onClick={() => setShowNewPlanModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-bold py-2.5 px-5 text-xs uppercase shadow-md shadow-emerald-600/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Planejamento
          </button>
        )}
      </div>

      {!safraAtiva ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-white/80 dark:bg-slate-900/10 backdrop-blur-md">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-500 animate-pulse" />
          <h2 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">Nenhuma Safra Ativa</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Selecione uma safra ativa no seletor do topo para gerenciar os planejamentos agrícolas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Coluna Esquerda: Listagem de Planejamentos */}
          <section className="lg:col-span-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Planejamentos da Safra</h3>
            </div>

            {/* Filtros de Status */}
            <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/[0.04] text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('todos')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                  statusFilter === 'todos'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('aberto')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                  statusFilter === 'aberto'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Em Aberto
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('aprovado')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                  statusFilter === 'aprovado'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Aprovados
              </button>
            </div>
            
            {(() => {
              const filtered = planejamentos.filter(plan => {
                if (statusFilter === 'aberto') return !plan.aprovado;
                if (statusFilter === 'aprovado') return plan.aprovado;
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 p-8 text-center bg-slate-50 dark:bg-slate-950/20 text-slate-500 text-xs">
                    Nenhum planejamento correspondente ao filtro.
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filtered.map(plan => {
                    const isSelected = selectedPlan?.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                          isSelected 
                            ? 'planning-selected-card bg-indigo-100 dark:bg-indigo-950/35 border-indigo-400 dark:border-indigo-500/60 text-indigo-950 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-300/50 dark:ring-indigo-400/20'
                            : 'glass-panel border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate">{plan.descricao}</h4>
                            <span className={`block text-[9px] mt-1 font-mono uppercase tracking-wider ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                              Criado em {new Date(plan.data_planejamento).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {plan.aprovado ? (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-950 border border-emerald-900 text-emerald-400">
                              <Lock className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-950 border border-amber-900 text-amber-400">
                              <LockOpen className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <div className={`mt-4 flex items-center justify-between border-t pt-3 text-[10px] ${isSelected ? 'border-indigo-300/70 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-400' : 'border-slate-200 dark:border-white/[0.04] text-slate-600 dark:text-slate-400'}`}>
                          <span>{plan.ordens_servico?.length || 0} atividades planejadas</span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-indigo-700 dark:text-indigo-400' : ''}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>

          {/* Coluna Direita: Detalhamento do Planejamento Selecionado */}
          <section className="lg:col-span-8">
            {!selectedPlan ? (
              <div className="glass-panel p-12 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-slate-900/40 text-center text-slate-600 dark:text-slate-300">
                <FileText className="mx-auto w-10 h-10 text-slate-500 dark:text-slate-400 mb-3" />
                <p className="text-xs font-bold">Selecione um planejamento na coluna ao lado para visualizar os detalhes, OSs estruturadas e orçamentos.</p>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-slate-900/40 space-y-6">
                
                {/* Cabeçalho do Planejamento Selecionado */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-white/[0.06] pb-5 gap-4">
                  <div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border mb-2 ${
                      selectedPlan.aprovado 
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400' 
                        : 'bg-amber-950/60 border-amber-800 text-amber-400'
                    }`}>
                      {selectedPlan.aprovado ? <Lock className="w-2.5 h-2.5" /> : <LockOpen className="w-2.5 h-2.5" />}
                      {selectedPlan.aprovado ? 'Aprovado (Bloqueado)' : 'Rascunho (Editável)'}
                    </span>
                    <h2 className="text-base font-black text-slate-900 dark:text-white font-display">{selectedPlan.descricao}</h2>
                    {selectedPlan.observacao && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 max-w-xl">{selectedPlan.observacao}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!selectedPlan.aprovado && isSuperUsuario && (
                      <button
                        onClick={() => handleAprovar(selectedPlan.id)}
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold px-3 py-2 text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aprovar
                      </button>
                    )}
                    
                    {isSuperUsuario && (
                      <button
                        onClick={() => handleGerarOSs(selectedPlan.id)}
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-bold px-3.5 py-2 text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        Gerar OS Reais
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-telas de OS Planejadas */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-teal-500" />
                      <span>Atividades Planejadas ({selectedPlan.ordens_servico?.length || 0})</span>
                    </h3>
                    
                    {!selectedPlan.aprovado && (
                      <button
                        onClick={() => setShowNewOSModal(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-450 hover:to-teal-500 text-white font-black px-4 py-2 text-[10px] uppercase tracking-wider cursor-pointer shadow-md shadow-emerald-500/10"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Atividade
                      </button>
                    )}
                  </div>

                  {(!selectedPlan.ordens_servico || selectedPlan.ordens_servico.length === 0) ? (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/15 text-center text-slate-600 dark:text-slate-400 text-xs">
                      Nenhuma ordem de serviço planejada adicionada a este orçamento.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedPlan.ordens_servico.map((os, idx) => (
                        <div key={os.id || idx} className="rounded-xl border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-slate-950/30 p-4 space-y-3 text-left">
                          
                          <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/[0.04] pb-2.5">
                            <div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white">{os.tipo_operacao_nome || `Operação #${os.tipo_operacao}`}</h4>
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                                Janela: {new Date(os.data_inicio_planejada).toLocaleDateString('pt-BR')} até {new Date(os.data_fim_planejada).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>

                          {os.observacao && (
                            <p className="text-[10px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 p-2 rounded-lg">{os.observacao}</p>
                          )}

                          {/* Talhões da OS */}
                          <div className="space-y-1">
                            <span className="block text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Talhões Alvo</span>
                            <div className="flex flex-wrap gap-1.5">
                              {os.talhoes_detalhe?.map(t => (
                                <span key={t.id} className="inline-flex rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-2 py-0.5 text-[9px] text-slate-700 dark:text-slate-300">
                                  {t.codigo} - {t.nome} ({Number(t.area).toLocaleString('pt-BR')} ha)
                                </span>
                              )) || <span className="text-[10px] text-slate-600 dark:text-slate-400">Nenhum talhão selecionado</span>}
                            </div>
                          </div>

                           {/* Recursos Planejados */}
                          {(os.funcionario_nome || os.trator_codigo || os.implemento_codigo || os.terceirizado_nome || os.usar_turma) && (
                            <div className="space-y-1 border-t border-slate-200 dark:border-white/[0.02] pt-2">
                              <span className="block text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Recursos Planejados</span>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-700 dark:text-slate-300">
                                {os.funcionario_nome && (
                                  <div>
                                    <span className="font-bold text-slate-500">Operador:</span> {os.funcionario_nome}
                                  </div>
                                )}
                                {os.trator_codigo && (
                                  <div>
                                    <span className="font-bold text-slate-500">Máquina:</span> {os.trator_codigo}
                                  </div>
                                )}
                                {os.implemento_codigo && (
                                  <div>
                                    <span className="font-bold text-slate-500">Implemento:</span> {os.implemento_codigo}
                                  </div>
                                )}
                                {os.terceirizado_nome && (
                                  <div>
                                    <span className="font-bold text-slate-500">Terceirizado:</span> {os.terceirizado_nome}
                                  </div>
                                )}
                                {os.usar_turma && (
                                  <div>
                                    <span className="font-bold text-slate-500">Turma (Panha):</span> Sim
                                    {os.valor_planejado_turma && ` (Plan: R$ ${Number(os.valor_planejado_turma).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Insumos Planejados */}
                          <div className="space-y-1.5 border-t border-slate-200 dark:border-white/[0.02] pt-2">
                            <span className="block text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Insumos e Doses Planejadas</span>
                            {((os.insumos_detalhe || os.insumos)?.length > 0) ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {(os.insumos_detalhe || os.insumos).map(ins => {
                                  const prodName = ins.produto_nome || ins.produto_detalhe?.nome_comercial || 'Insumo';
                                  const prodUnit = ins.produto_unidade || ins.produto_detalhe?.unidade_sigla || 'un';
                                  return (
                                    <div key={ins.id} className="flex justify-between items-center rounded-lg bg-white dark:bg-slate-900/60 p-2 border border-slate-200 dark:border-white/[0.02]">
                                      <span className="text-[10px] text-slate-900 dark:text-white font-bold truncate max-w-[150px]">{prodName}</span>
                                      <span className="text-[9px] text-emerald-400 font-mono">
                                        Dose: {Number(ins.dose_planejada).toLocaleString('pt-BR')} | Total: {Number(ins.quantidade_planejada).toLocaleString('pt-BR')} {prodUnit}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600 dark:text-slate-400">Nenhum insumo planejado para esta operação</span>
                            )}
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </section>

        </div>
      )}

      {/* MODAL: Novo Planejamento de Safra */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="app-modal-panel w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900 p-6 space-y-4 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Novo Planejamento de Safra</span>
              </h3>
              <button onClick={() => setShowNewPlanModal(false)} className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreatePlanejamento} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="md:col-span-2">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Descrição do Planejamento *</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Planejamento Agrícola e Adubação Secagem 2024/25"
                    value={newPlanForm.descricao}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewPlanForm(prev => ({ ...prev, descricao: e.target.value.toUpperCase() }))}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white outline-none uppercase"
                  />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Data do Planejamento *</span>
                  <input
                    type="date"
                    required
                    value={newPlanForm.data_planejamento}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewPlanForm(prev => ({ ...prev, data_planejamento: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white outline-none"
                  />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Observações / Notas</span>
                  <textarea
                    placeholder="Notas adicionais sobre o orçamento e premissas da safra..."
                    value={newPlanForm.observacao}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewPlanForm(prev => ({ ...prev, observacao: e.target.value.toUpperCase() }))}
                    rows={3}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white outline-none uppercase"
                  />
                </label>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {saving ? 'Criando...' : 'Salvar Planejamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nova OS Planejada */}
      {showNewOSModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="app-modal-panel w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900 p-6 space-y-4 my-8 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Adicionar Atividade</span>
              </h3>
              <button onClick={() => setShowNewOSModal(false)} className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAddOSPlanejada} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Operação *</span>
                  <select
                    required
                    value={newOSForm.tipo_operacao}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, tipo_operacao: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white outline-none"
                  >
                    <option value="" className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">Selecione...</option>
                    {tiposOperacao.map(op => (
                      <option key={op.id} value={op.id} className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">{op.nome}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1.5">
                    <span className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Início Planejado</span>
                    <input
                      type="date"
                      required
                      value={newOSForm.data_inicio_planejada}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setNewOSForm(prev => ({ ...prev, data_inicio_planejada: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white outline-none"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Término Planejado</span>
                    <input
                      type="date"
                      required
                      value={newOSForm.data_fim_planejada}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setNewOSForm(prev => ({ ...prev, data_fim_planejada: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white outline-none"
                    />
                  </label>
                </div>
              </div>

              {/* Operador e Máquinas Planejadas */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-white/[0.06] pt-4">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Operador Planejado</span>
                  <select
                    value={newOSForm.funcionario}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, funcionario: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white outline-none"
                  >
                    <option value="" className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">Selecione...</option>
                    {funcionarios.map(f => (
                      <option key={f.id} value={f.id} className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">{f.nome} ({f.cargo || 'Campo'})</option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Máquina Planejada</span>
                  <select
                    value={newOSForm.trator}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, trator: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white outline-none"
                  >
                    <option value="" className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">Selecione...</option>
                    {maquinas.filter(m => m.tipo_nome?.toLowerCase().includes('trator')).map(m => (
                      <option key={m.id} value={m.id} className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">{m.codigo} - {m.descricao}</option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Implemento Planejado</span>
                  <select
                    value={newOSForm.implemento}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, implemento: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white outline-none"
                  >
                    <option value="" className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">Selecione...</option>
                    {maquinas.filter(m => !m.tipo_nome?.toLowerCase().includes('trator')).map(m => (
                      <option key={m.id} value={m.id} className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">{m.codigo} - {m.descricao}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Terceirizados e Turmas Planejadas */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-white/[0.06] pt-4">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Terceirizado Planejado</span>
                  <select
                    value={newOSForm.terceirizado}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, terceirizado: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white outline-none"
                  >
                    <option value="" className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">Selecione...</option>
                    {terceirizados.map(t => (
                      <option key={t.id} value={t.id} className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">{t.nome} ({t.cargo || 'Terceirizado'})</option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Usar Turma para Panha (Colheita)</span>
                  <select
                    value={newOSForm.usar_turma ? 'sim' : 'nao'}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, usar_turma: e.target.value === 'sim' }))}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white outline-none"
                  >
                    <option value="nao" className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">Não</option>
                    <option value="sim" className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">Sim</option>
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Valor Planejado da Turma (R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    disabled={!newOSForm.usar_turma}
                    value={newOSForm.valor_planejado_turma}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, valor_planejado_turma: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950/50 disabled:bg-slate-100 dark:disabled:bg-slate-950/20 disabled:opacity-50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white outline-none"
                  />
                </label>
              </div>

              {/* Seletor de Talhões */}
              <div className="md:col-span-2 space-y-2">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Talhões Selecionados * (Clique para selecionar)</span>
                {talhoes.length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhum talhão cadastrado para esta fazenda.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-2 bg-slate-55 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-white/[0.04]">
                    {talhoes.map(t => {
                      const isSelected = newOSForm.talhoes_selecionados.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleToggleTalhaoSelection(t.id)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
                          }`}
                        >
                          {t.codigo} ({Number(t.area).toLocaleString('pt-BR')} ha)
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Formulário Interno de Insumos */}
              <div className="md:col-span-2 space-y-3 border-t border-slate-100 dark:border-white/[0.06] pt-4">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Insumos Planejados</span>
                
                {/* Lista de insumos adicionados */}
                {newOSForm.insumos_selecionados.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {newOSForm.insumos_selecionados.map((ins, idx) => {
                      const prodName = produtos.find(p => p.id === Number(ins.produto_id))?.nome_comercial || 'Insumo';
                      const prodUnit = produtos.find(p => p.id === Number(ins.produto_id))?.unidade_sigla || 'un';
                      return (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/[0.04] p-2.5 rounded-xl text-xs">
                          <span className="text-slate-800 dark:text-white font-bold">{prodName}</span>
                          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <span>Dose: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{ins.dose_planejada}</strong></span>
                            <span>Total: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{ins.quantidade_planejada} {prodUnit}</strong></span>
                            <button type="button" onClick={() => removeInsumoFromOS(idx)} className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Controles para adicionar insumo */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-55 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200 dark:border-white/[0.04]">
                  <div className="md:col-span-5 text-left">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Escolher Produto</span>
                      <select
                        value={tempInsumo.produto_id}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setTempInsumo(prev => ({ ...prev, produto_id: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-slate-800 dark:text-white outline-none"
                      >
                        <option value="" className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">Selecione...</option>
                        {produtos.map(p => (
                          <option key={p.id} value={p.id} className="text-slate-850 dark:text-white bg-white dark:bg-slate-900">{p.nome_comercial} ({p.unidade_sigla || 'un'})</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="md:col-span-3 text-left">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Dose (ha/planta)</span>
                      <input
                        type="number"
                        placeholder="Ex: 2.5"
                        value={tempInsumo.dose_planejada}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setTempInsumo(prev => ({ ...prev, dose_planejada: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-slate-800 dark:text-white outline-none"
                      />
                    </label>
                  </div>
                  <div className="md:col-span-3 text-left">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Qtd Total Planejada</span>
                      <input
                        type="number"
                        placeholder="Ex: 500"
                        value={tempInsumo.quantidade_planejada}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setTempInsumo(prev => ({ ...prev, quantidade_planejada: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-slate-800 dark:text-white outline-none"
                      />
                    </label>
                  </div>
                  <div className="md:col-span-1 text-center">
                    <button
                      type="button"
                      onClick={addTempInsumo}
                      className="w-full flex h-8 items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5 border-t border-slate-100 dark:border-white/[0.06] pt-4">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Recomendações / Instruções Técnicas</span>
                  <textarea
                    placeholder="Instruções para o operador no campo..."
                    value={newOSForm.observacao}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, observacao: e.target.value.toUpperCase() }))}
                    rows={2}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white outline-none uppercase"
                  />
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowNewOSModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Salvar Atividade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
