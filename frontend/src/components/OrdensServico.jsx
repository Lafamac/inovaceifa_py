import React, { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { relatorioService } from '../services/api';
import api from '../services/api';
import { 
  ClipboardList, 
  Play, 
  Check, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  MapPin, 
  Calendar,
  Tractor,
  Users,
  Package,
  Activity,
  AlertTriangle,
  X,
  Gauge,
  Clock,
  ChevronDown,
  Printer
} from 'lucide-react';

export const OrdensServico = () => {
  const { safraAtiva, fazendaAtiva } = useTenant();
  const { user } = useAuth();

  // Estados principais
  const [ordens, setOrdens] = useState([]);
  const [selectedOS, setSelectedOS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de Filtro
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Referências para criação e apontamentos
  const [tiposOperacao, setTiposOperacao] = useState([]);
  const [talhoes, setTalhoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [auditorias, setAuditorias] = useState([]);

  // Modais
  const [showNewOSModal, setShowNewOSModal] = useState(false);
  const [showAptModal, setShowAptModal] = useState(false);

  // Formulário Nova OS Real
  const [newOSForm, setNewOSForm] = useState({
    tipo_operacao: '',
    data_inicio_planejada: new Date().toISOString().slice(0, 10),
    data_fim_planejada: new Date().toISOString().slice(0, 10),
    observacao: '',
    talhoes_selecionados: [],
    insumos_selecionados: []
  });

  // Formulário de Apontamento
  const [aptForm, setAptForm] = useState({
    data_apontamento: new Date().toISOString().slice(0, 10),
    clima: 'Bom',
    observacao: '',
    maquinas: [], // array de { maquina_id, horimetro_inicial, horimetro_final }
    funcionarios: [], // array de { funcionario_id, horas_trabalhadas }
    insumos: [] // array de { produto_id, quantidade_total, dose_realizada }
  });

  // Temporários para adicionar ao Apontamento
  const [tempInsumoReal, setTempInsumoReal] = useState({ produto_id: '', quantidade_total: '', dose_realizada: '' });
  const [tempMaquinaReal, setTempMaquinaReal] = useState({ maquina_id: '', horimetro_inicial: '', horimetro_final: '' });
  const [tempFuncionarioReal, setTempFuncionarioReal] = useState({ funcionario_id: '', horas_trabalhadas: '' });

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
      const [resOps, resTalhoes, resProds, resMaquinas, resFuncs] = await Promise.all([
        api.get('/api/ref/tipos-operacao/'),
        api.get('/api/talhoes/'),
        api.get('/api/produtos/'),
        api.get('/api/maquinas/'),
        api.get('/api/funcionarios/')
      ]);
      setTiposOperacao(resOps.data?.results || resOps.data || []);
      
      const filterByFazenda = (list) => list.filter(item => item.fazenda_id === fazendaAtiva?.id || item.fazenda === fazendaAtiva?.id);
      setTalhoes(filterByFazenda(resTalhoes.data?.results || resTalhoes.data || []));
      setMaquinas(filterByFazenda(resMaquinas.data?.results || resMaquinas.data || []));
      setFuncionarios(filterByFazenda(resFuncs.data?.results || resFuncs.data || []));
      setProdutos(resProds.data?.results || resProds.data || []);
    } catch (err) {
      console.error("Erro ao carregar referências de OS", err);
    }
  }, [fazendaAtiva]);

  const fetchOrdensServico = useCallback(async () => {
    if (!safraAtiva || !fazendaAtiva) return;
    setLoading(true);
    try {
      const list = await relatorioService.getOrdensServicoReais();
      const filtradas = list.filter(o => 
        (o.fazenda_id === fazendaAtiva.id || o.fazenda === fazendaAtiva.id) && 
        (o.safra_id === safraAtiva.id || o.safra === safraAtiva.id)
      );
      setOrdens(filtradas);

      if (selectedOS) {
        const atualizada = filtradas.find(o => o.id === selectedOS.id);
        setSelectedOS(atualizada || null);
        if (atualizada) {
          fetchAuditorias(atualizada.id);
        }
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Não foi possível carregar as Ordens de Serviço.');
    } finally {
      setLoading(false);
    }
  }, [safraAtiva, fazendaAtiva, selectedOS]);

  const fetchAuditorias = async (osId) => {
    try {
      const list = await relatorioService.getAuditoriasOS(osId);
      setAuditorias(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrdensServico();
    loadReferences();
  }, [fetchOrdensServico, loadReferences]);

  const handleIniciarOS = async (id) => {
    setSaving(true);
    try {
      await relatorioService.iniciarOrdemServico(id);
      showAlert('success', 'Ordem de serviço iniciada! Status atualizado para: EM EXECUÇÃO.');
      await fetchOrdensServico();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao iniciar a Ordem de Serviço.');
    } finally {
      setSaving(false);
    }
  };

  const handleConcluirOS = async (id) => {
    setSaving(true);
    try {
      await relatorioService.concluirOrdemServico(id);
      showAlert('success', 'OS concluída com sucesso! Saídas de estoque registradas e auditoria gerada.');
      await fetchOrdensServico();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao fechar a Ordem de Serviço.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOSReal = async (e) => {
    e.preventDefault();
    if (!newOSForm.tipo_operacao) {
      showAlert('error', 'Selecione a operação.');
      return;
    }
    if (newOSForm.talhoes_selecionados.length === 0) {
      showAlert('error', 'Selecione os talhões.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fazenda: fazendaAtiva.id,
        safra: safraAtiva.id,
        tipo_operacao: Number(newOSForm.tipo_operacao),
        data_inicio_planejada: newOSForm.data_inicio_planejada,
        data_fim_planejada: newOSForm.data_fim_planejada,
        observacao: newOSForm.observacao,
        status: 'APROVADA'
      };

      const resOS = await api.post('/api/ordens-servico/', payload);
      const osId = resOS.data.id;

      // Cadastrar os talhões vinculados à OS Real
      await Promise.all(newOSForm.talhoes_selecionados.map(tId => 
        api.post('/api/ordens-servico-talhoes/', {
          ordem_servico: osId,
          talhao: Number(tId)
        })
      ));

      showAlert('success', 'Nova ordem de serviço real gerada com sucesso.');
      setShowNewOSModal(false);
      setNewOSForm({
        tipo_operacao: '',
        data_inicio_planejada: new Date().toISOString().slice(0, 10),
        data_fim_planejada: new Date().toISOString().slice(0, 10),
        observacao: '',
        talhoes_selecionados: []
      });
      await fetchOrdensServico();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Não foi possível cadastrar a OS Real.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApontamentos = async (e) => {
    e.preventDefault();

    // Validações estritas de consistência de dados
    for (const maq of aptForm.maquinas) {
      const inicial = Number(maq.horimetro_inicial || 0);
      const final = Number(maq.horimetro_final || 0);
      if (inicial < 0 || final < 0) {
        showAlert('error', 'Os horímetros de máquinas não podem ser negativos.');
        return;
      }
      if (final < inicial) {
        showAlert('error', 'O horímetro final de uma máquina não pode ser menor que o horímetro inicial.');
        return;
      }
    }

    for (const ins of aptForm.insumos) {
      const qtd = Number(ins.quantidade_total || 0);
      const dose = Number(ins.dose_realizada || 0);
      if (qtd < 0) {
        showAlert('error', 'A quantidade de insumos aplicada não pode ser negativa.');
        return;
      }
      if (dose < 0) {
        showAlert('error', 'A dose realizada de insumos não pode ser negativa.');
        return;
      }
    }

    setSaving(true);
    try {
      // 1. Criar o Apontamento Geral da Operação
      const payloadApt = {
        ordem_servico: selectedOS.id,
        data_apontamento: aptForm.data_apontamento,
        clima: aptForm.clima,
        observacao: aptForm.observacao
      };
      const resApt = await relatorioService.createApontamento(payloadApt);
      const aptId = resApt.id;

      // 2. Criar sub-apontamentos de Insumos
      await Promise.all(aptForm.insumos.map(ins => 
        relatorioService.createApontamentoInsumo({
          apontamento: aptId,
          produto: Number(ins.produto_id),
          quantidade_total: Number(ins.quantidade_total),
          dose_realizada: Number(ins.dose_realizada)
        })
      ));

      // 3. Criar sub-apontamentos de Máquinas
      await Promise.all(aptForm.maquinas.map(maq => 
        relatorioService.createApontamentoMaquina({
          apontamento: aptId,
          maquina: Number(maq.maquina_id),
          horimetro_inicial: Number(maq.horimetro_inicial),
          horimetro_final: Number(maq.horimetro_final)
        })
      ));

      // 4. Criar sub-apontamentos de Funcionários
      await Promise.all(aptForm.funcionarios.map(func => 
        relatorioService.createApontamentoFuncionario({
          apontamento: aptId,
          funcionario: Number(func.funcionario_id),
          horas_trabalhadas: Number(func.horas_trabalhadas)
        })
      ));

      showAlert('success', 'Apontamento operacional registrado com sucesso!');
      setShowAptModal(false);
      setAptForm({
        data_apontamento: new Date().toISOString().slice(0, 10),
        clima: 'Bom',
        observacao: '',
        maquinas: [],
        funcionarios: [],
        insumos: []
      });
      await fetchOrdensServico();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao salvar os apontamentos operacionais.');
    } finally {
      setSaving(false);
    }
  };

  // Funções helpers de adição temporária de apontamentos no formulário
  const addTempInsumoReal = () => {
    if (!tempInsumoReal.produto_id || !tempInsumoReal.quantidade_total) return;
    
    const qtd = Number(tempInsumoReal.quantidade_total || 0);
    const dose = Number(tempInsumoReal.dose_realizada || 0);

    if (qtd < 0) {
      showAlert('error', 'A quantidade total de insumo não pode ser negativa.');
      return;
    }
    if (dose < 0) {
      showAlert('error', 'A dose realizada do insumo não pode ser negativa.');
      return;
    }

    setAptForm(prev => ({
      ...prev,
      insumos: [...prev.insumos, { ...tempInsumoReal }]
    }));
    setTempInsumoReal({ produto_id: '', quantidade_total: '', dose_realizada: '' });
  };

  const addTempMaquinaReal = () => {
    if (!tempMaquinaReal.maquina_id) return;

    const inicial = Number(tempMaquinaReal.horimetro_inicial || 0);
    const final = Number(tempMaquinaReal.horimetro_final || 0);

    if (inicial < 0 || final < 0) {
      showAlert('error', 'Os horímetros não podem ser valores negativos.');
      return;
    }
    if (final < inicial) {
      showAlert('error', 'O horímetro final não pode ser menor que o horímetro inicial.');
      return;
    }

    setAptForm(prev => ({
      ...prev,
      maquinas: [...prev.maquinas, { ...tempMaquinaReal }]
    }));
    setTempMaquinaReal({ maquina_id: '', horimetro_inicial: '', horimetro_final: '' });
  };

  const addTempFuncionarioReal = () => {
    if (!tempFuncionarioReal.funcionario_id || !tempFuncionarioReal.horas_trabalhadas) return;

    const horas = Number(tempFuncionarioReal.horas_trabalhadas || 0);
    if (horas < 0) {
      showAlert('error', 'As horas trabalhadas não podem ser negativas.');
      return;
    }

    setAptForm(prev => ({
      ...prev,
      funcionarios: [...prev.funcionarios, { ...tempFuncionarioReal }]
    }));
    setTempFuncionarioReal({ funcionario_id: '', horas_trabalhadas: '' });
  };

  // Funções de Cálculo do Estado "ATRASADA" on-the-fly
  const isAtrasada = (os) => {
    if (os.status === 'CONCLUIDA' || os.status === 'CANCELADA') return false;
    const dataFimPlan = new Date(os.data_fim_planejada);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return dataFimPlan < hoje;
  };

  const getStatusLabel = (os) => {
    if (isAtrasada(os)) return 'ATRASADA';
    return os.status;
  };

  const getFilteredOSs = () => {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    return ordens.filter(os => {
      const statusLabel = getStatusLabel(os);
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'ATRASADA') return statusLabel === 'ATRASADA';
      return os.status === statusFilter;
    });
  };

  const lookup = (list, id, field = 'nome') => list.find(item => item.id === Number(id))?.[field] || '-';

  if (loading && ordens.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Carregando ordens de serviço do campo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Alertas de Retorno */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-950/20 bg-rose-950/30 text-rose-300 text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-950/20 bg-emerald-950/30 text-emerald-300 text-sm font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight font-display flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-500" />
            Execução de Ordens de Serviço
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Lance apontamentos reais de funcionários, diesel e horímetros em campo.
          </p>
        </div>

        {safraAtiva && (
          <button
            onClick={() => setShowNewOSModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-bold py-2.5 px-5 text-xs uppercase shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova OS Avulsa
          </button>
        )}
      </div>

      {!safraAtiva ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/10 backdrop-blur-md">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-500" />
          <h2 className="mt-4 text-sm font-bold text-slate-300">Nenhuma Safra Ativa</h2>
          <p className="mt-1 text-xs text-slate-500">Selecione uma safra ativa para carregar os apontamentos agrícolas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Coluna Esquerda: Listagem com Filtros */}
          <section className="lg:col-span-4 space-y-4 no-print">
            
            {/* Abas Rápidas de Status */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/40 rounded-xl border border-white/[0.04]">
              {[
                { id: 'ALL', label: 'Todas' },
                { id: 'APROVADA', label: 'Aprovadas' },
                { id: 'EM_EXECUCAO', label: 'Execução' },
                { id: 'CONCLUIDA', label: 'Concluídas' },
                { id: 'ATRASADA', label: '🔴 Atrasadas' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex-grow rounded-lg py-1.5 px-2 text-[10px] font-black uppercase transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Listagem em Cards */}
            {getFilteredOSs().length === 0 ? (
              <div className="rounded-2xl border border-slate-800/80 p-8 text-center bg-slate-950/20 text-slate-500 text-xs">
                Nenhuma ordem de serviço com este status encontrada.
              </div>
            ) : (
              <div className="space-y-3">
                {getFilteredOSs().map(os => {
                  const isSelected = selectedOS?.id === os.id;
                  const labelStatus = getStatusLabel(os);
                  const isAtr = labelStatus === 'ATRASADA';
                  
                  return (
                    <div
                      key={os.id}
                      onClick={() => {
                        setSelectedOS(os);
                        fetchAuditorias(os.id);
                      }}
                      className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                        isSelected 
                          ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/40 text-emerald-400 shadow-sm'
                          : 'border-white/[0.06] bg-slate-900/30 text-slate-300 hover:bg-slate-800/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold truncate">OS #{os.id} — {os.tipo_operacao_nome || lookup(tiposOperacao, os.tipo_operacao)}</h4>
                          <span className="block text-[9px] text-slate-500 mt-1">
                            Fim Previsto: {new Date(os.data_fim_planejada).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase border ${
                          isAtr 
                            ? 'bg-rose-950/60 border-rose-800 text-rose-400' 
                            : os.status === 'CONCLUIDA'
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                            : os.status === 'EM_EXECUCAO'
                            ? 'bg-teal-950/60 border-teal-800 text-teal-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}>
                          {labelStatus}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3 text-[10px] text-slate-500">
                        <span>{os.talhoes_detalhe?.length || 0} talhões vinculados</span>
                        <span>{os.apontamentos?.length || 0} apontamentos</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Coluna Direita: Detalhamento, Apontamentos e Auditorias */}
          <section className="lg:col-span-8">
            {!selectedOS ? (
              <div className="glass-panel p-12 rounded-2xl border border-white/[0.06] bg-slate-900/20 text-center text-slate-400">
                <ClipboardList className="mx-auto w-10 h-10 text-slate-600 mb-3" />
                <p className="text-xs font-bold">Selecione uma Ordem de Serviço na coluna ao lado para gerenciar apontamentos operacionais de máquinas, funcionários e defensivos.</p>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] bg-slate-900/40 space-y-6">
                
                {/* Header da OS Real Selecionada */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/[0.06] pb-5 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase border ${
                        selectedOS.status === 'CONCLUIDA'
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                          : selectedOS.status === 'EM_EXECUCAO'
                          ? 'bg-teal-950/60 border-teal-800 text-teal-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}>
                        {selectedOS.status}
                      </span>
                      {isAtrasada(selectedOS) && (
                        <span className="inline-flex rounded-full bg-rose-950/60 border border-rose-800 px-2 py-0.5 text-[8px] font-black uppercase text-rose-400 animate-pulse">ATRASADA</span>
                      )}
                    </div>
                    
                    <h2 className="text-base font-black text-white font-display">
                      OS #{selectedOS.id} — {selectedOS.tipo_operacao_nome || lookup(tiposOperacao, selectedOS.tipo_operacao)}
                    </h2>
                    <p className="text-slate-400 text-[10px] mt-1">
                      Janela técnica: {new Date(selectedOS.data_inicio_planejada).toLocaleDateString('pt-BR')} até {new Date(selectedOS.data_fim_planejada).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-350 hover:text-white font-bold px-3 py-2 text-[10px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all no-print"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-400" />
                      Imprimir OS
                    </button>

                    {selectedOS.status === 'APROVADA' && (
                      <button
                        onClick={() => handleIniciarOS(selectedOS.id)}
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 text-white font-bold px-4 py-2.5 text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Iniciar Execução
                      </button>
                    )}

                    {selectedOS.status === 'EM_EXECUCAO' && (
                      <>
                        <button
                          onClick={() => setShowAptModal(true)}
                          className="flex items-center gap-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-bold px-3 py-2 text-[10px] uppercase tracking-wider cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          Apontar Trabalho
                        </button>

                        <button
                          onClick={() => handleConcluirOS(selectedOS.id)}
                          disabled={saving}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-bold px-4 py-2.5 text-[10px] uppercase tracking-wider cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Concluir OS
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Exibição de Auditorias/Desvios se OS Concluída */}
                {auditorias.length > 0 && (
                  <div className="p-4 rounded-xl border border-rose-950/25 bg-rose-950/15 space-y-2 text-left">
                    <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Anomalias Agrícolas e Auditoria Operacional</span>
                    </h4>
                    <div className="space-y-1.5">
                      {auditorias.map(aud => (
                        <div key={aud.id} className="text-[11px] text-rose-300 font-semibold flex items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400"></span>
                          <span><strong>{aud.tipo_desvio}</strong>: {aud.descricao_desvio}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informações dos Talhões Alvo */}
                <div className="space-y-2 text-left">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Talhões da Operação</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedOS.talhoes_detalhe?.map(t => (
                      <span key={t.id} className="inline-flex rounded-xl bg-slate-950/50 border border-white/[0.06] px-3.5 py-1.5 text-xs text-white font-semibold">
                        {t.codigo} - {t.nome} ({Number(t.area).toLocaleString('pt-BR')} ha)
                      </span>
                    )) || <span className="text-xs text-slate-600">-</span>}
                  </div>
                </div>

                {/* Histórico de Apontamentos Realizados */}
                <div className="space-y-4 border-t border-white/[0.06] pt-5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2 text-left">
                    <Activity className="w-4 h-4 text-teal-500" />
                    <span>Linha do Tempo e Apontamentos ({selectedOS.apontamentos?.length || 0})</span>
                  </h3>

                  {(!selectedOS.apontamentos || selectedOS.apontamentos.length === 0) ? (
                    <div className="p-6 rounded-2xl border border-dashed border-white/5 bg-slate-950/15 text-center text-slate-500 text-xs">
                      Nenhum apontamento lançado para esta Ordem de Serviço.
                    </div>
                  ) : (
                    <div className="space-y-4 text-left">
                      {selectedOS.apontamentos.map(apt => (
                        <div key={apt.id} className="rounded-xl border border-white/[0.04] bg-slate-950/20 p-4 space-y-3">
                          
                          {/* Topo do Apontamento */}
                          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2 text-[11px] text-slate-400 font-bold">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              Data: {new Date(apt.data_apontamento).toLocaleDateString('pt-BR')}
                            </span>
                            {apt.clima && (
                              <span className="rounded-full bg-slate-900 border border-white/5 px-2 py-0.5 text-[9px] uppercase font-black text-slate-300">
                                Clima: {apt.clima}
                              </span>
                            )}
                          </div>

                          {apt.observacao && (
                            <p className="text-[10px] text-slate-400 bg-slate-900/40 p-2 rounded-lg">{apt.observacao}</p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                            
                            {/* Tratores / Máquinas */}
                            <div className="space-y-1">
                              <span className="block text-[9px] font-black text-slate-500 uppercase flex items-center gap-1">
                                <Tractor className="w-3 h-3 text-slate-500" /> Máquinas/Horímetros
                              </span>
                              {apt.maquinas_detalhe?.length > 0 ? apt.maquinas_detalhe.map((m, i) => (
                                <p key={i} className="text-[10px] text-slate-300 font-semibold">
                                  {m.maquina_codigo}: {m.horimetro_inicial}h → {m.horimetro_final}h
                                </p>
                              )) : <p className="text-[10px] text-slate-600">Sem máquina apontada</p>}
                            </div>

                            {/* Pessoas / Operadores */}
                            <div className="space-y-1">
                              <span className="block text-[9px] font-black text-slate-500 uppercase flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-500" /> Equipe / Operadores
                              </span>
                              {apt.funcionarios_detalhe?.length > 0 ? apt.funcionarios_detalhe.map((f, i) => (
                                <p key={i} className="text-[10px] text-slate-300 font-semibold">
                                  {f.funcionario_nome}: {f.horas_trabalhadas}h reais
                                </p>
                              )) : <p className="text-[10px] text-slate-600">Sem operadores apontados</p>}
                            </div>

                            {/* Insumos / Diesel */}
                            <div className="space-y-1">
                              <span className="block text-[9px] font-black text-slate-500 uppercase flex items-center gap-1">
                                <Package className="w-3 h-3 text-slate-500" /> Insumos / Produtos
                              </span>
                              {apt.insumos_detalhe?.length > 0 ? apt.insumos_detalhe.map((ins, i) => (
                                <p key={i} className="text-[10px] text-emerald-400 font-bold">
                                  {ins.produto_nome}: {Number(ins.quantidade_total).toLocaleString('pt-BR')} {ins.produto_unidade}
                                </p>
                              )) : <p className="text-[10px] text-slate-600">Sem insumo apontado</p>}
                            </div>

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

      {/* MODAL: Nova OS Real Avulsa */}
      {showNewOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-slate-900 p-6 space-y-4 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Nova Ordem de Serviço Real</span>
              </h3>
              <button onClick={() => setShowNewOSModal(false)} className="p-1 text-slate-400 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateOSReal} className="space-y-4 text-left">
              <label className="block space-y-1.5">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Operação *</span>
                <select
                  required
                  value={newOSForm.tipo_operacao}
                  onChange={(e) => setNewOSForm(prev => ({ ...prev, tipo_operacao: e.target.value }))}
                  className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                >
                  <option value="">Selecione...</option>
                  {tiposOperacao.map(op => (
                    <option key={op.id} value={op.id} className="bg-slate-900">{op.nome}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Data Início Planejada</span>
                  <input
                    type="date"
                    required
                    value={newOSForm.data_inicio_planejada}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, data_inicio_planejada: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Data Término Planejada</span>
                  <input
                    type="date"
                    required
                    value={newOSForm.data_fim_planejada}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, data_fim_planejada: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  />
                </label>
              </div>

              {/* Seleção de Talhões */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Talhões Selecionados * (Clique para selecionar)</span>
                <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-2 bg-slate-950/40 rounded-xl border border-white/[0.04]">
                  {talhoes.map(t => {
                    const isSelected = newOSForm.talhoes_selecionados.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          const exists = newOSForm.talhoes_selecionados.includes(t.id);
                          setNewOSForm(prev => ({
                            ...prev,
                            talhoes_selecionados: exists
                              ? prev.talhoes_selecionados.filter(id => id !== t.id)
                              : [...prev.talhoes_selecionados, t.id]
                          }));
                        }}
                        className={`rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                          isSelected 
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {t.codigo}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Recomendações Operacionais</span>
                <textarea
                  placeholder="Instruções para o tratorista/operador no campo..."
                  value={newOSForm.observacao}
                  onChange={(e) => setNewOSForm(prev => ({ ...prev, observacao: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md cursor-pointer"
              >
                {saving ? 'Criando...' : 'Criar OS Aprovada'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Apontamento Operacional */}
      {showAptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-slate-900 p-6 space-y-4 my-8 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Apontar Atividade Operacional</span>
              </h3>
              <button onClick={() => setShowAptModal(false)} className="p-1 text-slate-400 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSaveApontamentos} className="space-y-4 text-left">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Data do Apontamento *</span>
                  <input
                    type="date"
                    required
                    value={aptForm.data_apontamento}
                    onChange={(e) => setAptForm(prev => ({ ...prev, data_apontamento: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Clima / Tempo</span>
                  <input
                    type="text"
                    value={aptForm.clima}
                    onChange={(e) => setAptForm(prev => ({ ...prev, clima: e.target.value }))}
                    placeholder="Bom, chuvoso, nublado..."
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  />
                </label>
              </div>

              {/* Sub-Apontamento: Tratores e Máquinas */}
              <div className="space-y-3 border-t border-white/[0.06] pt-4">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tractor className="w-4 h-4 text-slate-400" />
                  Máquinas Utilizadas
                </span>
                
                {aptForm.maquinas.length > 0 && (
                  <div className="space-y-2">
                    {aptForm.maquinas.map((maq, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl text-xs border border-white/[0.04]">
                        <span className="text-white font-bold">{lookup(maquinas, maq.maquina_id, 'descricao')}</span>
                        <div className="flex items-center gap-3 text-slate-400">
                          <span>Horímetro: {maq.horimetro_inicial}h → {maq.horimetro_final}h</span>
                          <button type="button" onClick={() => setAptForm(prev => ({ ...prev, maquinas: prev.maquinas.filter((_, idx) => idx !== i) }))} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-950/20 p-3 rounded-xl border border-white/[0.04]">
                  <div className="md:col-span-5">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Escolher Máquina</span>
                      <select
                        value={tempMaquinaReal.maquina_id}
                        onChange={(e) => setTempMaquinaReal(prev => ({ ...prev, maquina_id: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      >
                        <option value="">Selecione...</option>
                        {maquinas.map(m => (
                          <option key={m.id} value={m.id} className="bg-slate-900">{m.codigo} - {m.descricao}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Horímetro Inicial</span>
                      <input
                        type="number"
                        value={tempMaquinaReal.horimetro_inicial}
                        onChange={(e) => setTempMaquinaReal(prev => ({ ...prev, horimetro_inicial: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      />
                    </label>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Horímetro Final</span>
                      <input
                        type="number"
                        value={tempMaquinaReal.horimetro_final}
                        onChange={(e) => setTempMaquinaReal(prev => ({ ...prev, horimetro_final: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      />
                    </label>
                  </div>
                  <div className="md:col-span-1">
                    <button type="button" onClick={addTempMaquinaReal} className="w-full flex h-8 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold cursor-pointer"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {/* Sub-Apontamento: Pessoas / Operadores */}
              <div className="space-y-3 border-t border-white/[0.06] pt-4">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  Mão de Obra e Operadores
                </span>

                {aptForm.funcionarios.length > 0 && (
                  <div className="space-y-2">
                    {aptForm.funcionarios.map((f, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl text-xs border border-white/[0.04]">
                        <span className="text-white font-bold">{lookup(funcionarios, f.funcionario_id, 'nome')}</span>
                        <div className="flex items-center gap-3 text-slate-400">
                          <span>Horas: {f.horas_trabalhadas}h reais</span>
                          <button type="button" onClick={() => setAptForm(prev => ({ ...prev, funcionarios: prev.funcionarios.filter((_, idx) => idx !== i) }))} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-950/20 p-3 rounded-xl border border-white/[0.04]">
                  <div className="md:col-span-8">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Escolher Funcionário</span>
                      <select
                        value={tempFuncionarioReal.funcionario_id}
                        onChange={(e) => setTempFuncionarioReal(prev => ({ ...prev, funcionario_id: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      >
                        <option value="">Selecione...</option>
                        {funcionarios.map(func => (
                          <option key={func.id} value={func.id} className="bg-slate-900">{func.nome} ({func.cargo || 'Campo'})</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Horas Reais</span>
                      <input
                        type="number"
                        placeholder="Ex: 8"
                        value={tempFuncionarioReal.horas_trabalhadas}
                        onChange={(e) => setTempFuncionarioReal(prev => ({ ...prev, horas_trabalhadas: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      />
                    </label>
                  </div>
                  <div className="md:col-span-1">
                    <button type="button" onClick={addTempFuncionarioReal} className="w-full flex h-8 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold cursor-pointer"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {/* Sub-Apontamento: Insumos Utilizados */}
              <div className="space-y-3 border-t border-white/[0.06] pt-4">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-slate-400" />
                  Insumos Reais Aplicados
                </span>

                {aptForm.insumos.length > 0 && (
                  <div className="space-y-2">
                    {aptForm.insumos.map((ins, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl text-xs border border-white/[0.04]">
                        <span className="text-white font-bold">{lookup(produtos, ins.produto_id, 'nome_comercial')}</span>
                        <div className="flex items-center gap-3 text-slate-400">
                          <span>Qtd: {ins.quantidade_total} {lookup(produtos, ins.produto_id, 'unidade_sigla')} | Dose: {ins.dose_realizada}</span>
                          <button type="button" onClick={() => setAptForm(prev => ({ ...prev, insumos: prev.insumos.filter((_, idx) => idx !== i) }))} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-950/20 p-3 rounded-xl border border-white/[0.04]">
                  <div className="md:col-span-5">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Escolher Insumo</span>
                      <select
                        value={tempInsumoReal.produto_id}
                        onChange={(e) => setTempInsumoReal(prev => ({ ...prev, produto_id: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      >
                        <option value="">Selecione...</option>
                        {produtos.map(p => (
                          <option key={p.id} value={p.id} className="bg-slate-900">{p.nome_comercial} ({p.unidade_sigla || 'un'})</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Qtd Total Aplicada</span>
                      <input
                        type="number"
                        placeholder="Ex: 50"
                        value={tempInsumoReal.quantidade_total}
                        onChange={(e) => setTempInsumoReal(prev => ({ ...prev, quantidade_total: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      />
                    </label>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Dose Realizada</span>
                      <input
                        type="number"
                        placeholder="Ex: 1.5"
                        value={tempInsumoReal.dose_realizada}
                        onChange={(e) => setTempInsumoReal(prev => ({ ...prev, dose_realizada: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      />
                    </label>
                  </div>
                  <div className="md:col-span-1">
                    <button type="button" onClick={addTempInsumoReal} className="w-full flex h-8 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold cursor-pointer"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              <label className="block space-y-1.5 border-t border-white/[0.06] pt-4">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Notas de Campo / Observações</span>
                <textarea
                  placeholder="Alguma intercorrência, quebra de máquina, chuva forte no dia..."
                  value={aptForm.observacao}
                  onChange={(e) => setAptForm(prev => ({ ...prev, observacao: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {saving ? 'Registrando...' : 'Salvar Apontamento Operacional'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
