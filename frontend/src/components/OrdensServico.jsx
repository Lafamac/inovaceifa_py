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
  Printer,
  Fuel,
  Coins
} from 'lucide-react';

export const OrdensServico = ({ defaultSubTab = 'os' }) => {
  const { safraAtiva, fazendaAtiva, fazendas } = useTenant();
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

  // Módulo de Rateio e Abastecimento
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab);
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [gastosRateio, setGastosRateio] = useState([]);
  const [criteriosRateio, setCriteriosRateio] = useState([]);
  const [contasGerenciais, setContasGerenciais] = useState([]);

  // Estados de Rateio Operacional (Phase 6.6)
  const [rateiosOperacionais, setRateiosOperacionais] = useState([]);
  const [atividadesEducampo, setAtividadesEducampo] = useState([]);
  const [showNewRateioOperacionalModal, setShowNewRateioOperacionalModal] = useState(false);
  const [rateioOperacionalForm, setRateioOperacionalForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    fazenda_rateio: '',
    atividade_educampo: '',
    criterio_rateio: '',
    descricao_plan: '',
    funcionario_plan: '',
    horas_homem_plan: '',
    valor_hora_homem_plan: '',
    trator_plan: '',
    implemento_plan: '',
    horas_maq_plan: '',
    valor_hora_maq_plan: '',
    combustivel_plan: '',
    diesel_gasto_plan: '',
    valor_diesel_plan: '',
    qtd_plan: '',
    valor_unitario_plan: '',
    descricao_real: '',
    funcionario_real: '',
    horas_homem_real: '',
    valor_hora_homem_real: '',
    trator_real: '',
    implemento_real: '',
    horas_maq_real: '',
    valor_hora_trator_real: '',
    valor_hora_implemento_real: '',
    combustivel_real: '',
    diesel_gasto_real: '',
    valor_diesel_real: '',
    qtd_real: '',
    valor_unitario_real: ''
  });

  const getManualTotals = () => {
    let totalVal = 0;
    let totalPct = 0;
    Object.values(rateioForm.talhoes_dados || {}).forEach(item => {
      totalVal += Number(item.valor || 0);
      totalPct += Number(item.percentual || 0);
    });
    return { totalVal, totalPct };
  };

  const [showNewAbtModal, setShowNewAbtModal] = useState(false);
  const [showNewRateioModal, setShowNewRateioModal] = useState(false);

  // Formulário de Abastecimento
  const [abtForm, setAbtForm] = useState({
    maquina: '',
    combustivel: '',
    data_abastecimento: new Date().toISOString().slice(0, 10),
    quantidade: '',
    valor_unitario: '',
    valor_total: 0,
    horimetro: '',
    observacao: ''
  });

  // Formulário de Rateio
  const [rateioForm, setRateioForm] = useState({
    criterio_rateio: '',
    conta_gerencial: '',
    valor: '',
    data_gasto: new Date().toISOString().slice(0, 10),
    observacao: '',
    talhoes_dados: {} // mapeamento de talhao_id -> { valor, percentual }
  });

  // Referências para criação e apontamentos
  const [tiposOperacao, setTiposOperacao] = useState([]);
  const [talhoes, setTalhoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [turmas, setTurmas] = useState([]);
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
    insumos: [], // array de { produto_id, quantidade_total, dose_realizada }
    turmas: [] // array de { turma_id, valor_total, data_vencimento }
  });

  // Temporários para adicionar ao Apontamento
  const [tempInsumoReal, setTempInsumoReal] = useState({ produto_id: '', quantidade_total: '', dose_realizada: '' });
  const [tempMaquinaReal, setTempMaquinaReal] = useState({ maquina_id: '', horimetro_inicial: '', horimetro_final: '' });
  const [tempFuncionarioReal, setTempFuncionarioReal] = useState({ funcionario_id: '', horas_trabalhadas: '' });
  const [tempTurmaReal, setTempTurmaReal] = useState({ turma_id: '', valor_total: '', data_vencimento: new Date().toISOString().slice(0, 10) });

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

  const fetchAbastecimentos = useCallback(async () => {
    if (!safraAtiva || !fazendaAtiva) return;
    try {
      const list = await relatorioService.getAbastecimentos();
      const filtrados = list.filter(a => {
        const aFazendaId = a.fazenda_id || a.fazenda;
        const aSafraId = a.safra_id || a.safra;
        return String(aFazendaId) === String(fazendaAtiva.id) &&
               String(aSafraId) === String(safraAtiva.id) &&
               a.ativo !== false;
      });
      setAbastecimentos(filtrados);
    } catch (err) {
      console.error("Erro ao carregar abastecimentos", err);
    }
  }, [safraAtiva, fazendaAtiva]);

  const fetchGastosRateio = useCallback(async () => {
    if (!safraAtiva || !fazendaAtiva) return;
    try {
      const list = await relatorioService.getGastosRateio();
      const filtrados = list.filter(g => {
        const gFazendaId = g.fazenda_id || g.fazenda;
        const gSafraId = g.safra_id || g.safra;
        return String(gFazendaId) === String(fazendaAtiva.id) &&
               String(gSafraId) === String(safraAtiva.id) &&
               g.ativo !== false;
      });
      setGastosRateio(filtrados);
    } catch (err) {
      console.error("Erro ao carregar gastos de rateio", err);
    }
  }, [safraAtiva, fazendaAtiva]);

  const fetchRateiosOperacionais = useCallback(async () => {
    if (!safraAtiva) return;
    try {
      const list = await relatorioService.getRateiosOperacionais();
      const filtrados = list.filter(r => {
        const rSafraId = r.safra_id || r.safra;
        return String(rSafraId) === String(safraAtiva.id) &&
               r.ativo !== false;
      });
      setRateiosOperacionais(filtrados);
    } catch (err) {
      console.error("Erro ao carregar rateios operacionais", err);
    }
  }, [safraAtiva]);

  const loadReferences = useCallback(async () => {
    try {
      const [resOps, resTalhoes, resProds, resMaquinas, resFuncs, resCriterios, resContas, resEducampo, resTurmas] = await Promise.all([
        api.get('/api/ref/tipos-operacao/'),
        api.get('/api/talhoes/'),
        api.get('/api/produtos/'),
        api.get('/api/maquinas/'),
        api.get('/api/funcionarios/'),
        api.get('/api/ref/criterios-rateio/'),
        api.get('/api/ref/contas-gerenciais/'),
        api.get('/api/ref/atividades-educampo/'),
        api.get('/api/turmas-terceirizadas/')
      ]);
      setTiposOperacao(resOps.data?.results || resOps.data || []);
      
      const filterByFazenda = (list) => list.filter(item => item.fazenda_id === fazendaAtiva?.id || item.fazenda === fazendaAtiva?.id);
      
      const filterByProprietario = (list) => {
        const propId = fazendaAtiva?.proprietario;
        if (!propId) {
          return filterByFazenda(list);
        }
        const fazendasPermitidasIds = (fazendas || [])
          .filter(f => f.proprietario === propId)
          .map(f => f.id);
        return list.filter(item => 
          fazendasPermitidasIds.includes(item.fazenda_id) || 
          fazendasPermitidasIds.includes(item.fazenda)
        );
      };

      setTalhoes(filterByFazenda(resTalhoes.data?.results || resTalhoes.data || []));
      setMaquinas(filterByProprietario(resMaquinas.data?.results || resMaquinas.data || []));
      setFuncionarios(filterByFazenda(resFuncs.data?.results || resFuncs.data || []));
      setTurmas(filterByFazenda(resTurmas.data?.results || resTurmas.data || []));
      setProdutos(resProds.data?.results || resProds.data || []);
      setCriteriosRateio(resCriterios.data?.results || resCriterios.data || []);
      setContasGerenciais(resContas.data?.results || resContas.data || []);
      setAtividadesEducampo(resEducampo.data?.results || resEducampo.data || []);
    } catch (err) {
      console.error("Erro ao carregar referências de OS", err);
    }
  }, [fazendaAtiva, fazendas]);

  const fetchOrdensServico = useCallback(async () => {
    if (!safraAtiva || !fazendaAtiva) return;
    setLoading(true);
    try {
      const list = await relatorioService.getOrdensServicoReais();
      const filtradas = list.filter(o => {
        const oFazendaId = o.fazenda_id || o.fazenda;
        const oSafraId = o.safra_id || o.safra;
        return String(oFazendaId) === String(fazendaAtiva.id) && 
               String(oSafraId) === String(safraAtiva.id);
      });
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
    fetchAbastecimentos();
    fetchGastosRateio();
    fetchRateiosOperacionais();
    loadReferences();
  }, [fetchOrdensServico, fetchAbastecimentos, fetchGastosRateio, fetchRateiosOperacionais, loadReferences]);

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
    if (newOSForm.data_fim_planejada && newOSForm.data_inicio_planejada && newOSForm.data_fim_planejada < newOSForm.data_inicio_planejada) {
      showAlert('error', 'A data do Término Planejado não pode ser menor que a data de Início Planejado.');
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
        status: 'APROVADA',
        talhoes_ids: newOSForm.talhoes_selecionados.map(Number)
      };

      await api.post('/api/ordens-servico/', payload);

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

  const handleOpenAptModal = (os) => {
    const initialMaquinas = [];
    const initialFuncionarios = [];
    
    if (os.trator_planejado) {
      initialMaquinas.push({
        maquina_id: os.trator_planejado,
        horimetro_inicial: '',
        horimetro_final: ''
      });
    }
    if (os.implemento_planejado) {
      initialMaquinas.push({
        maquina_id: os.implemento_planejado,
        horimetro_inicial: '',
        horimetro_final: ''
      });
    }
    if (os.funcionario_planejado) {
      initialFuncionarios.push({
        funcionario_id: os.funcionario_planejado,
        horas_trabalhadas: ''
      });
    }

    const initialTurmas = [];
    if (os.turma_planejada) {
      initialTurmas.push({
        turma_id: os.turma_planejada,
        valor_total: '',
        data_vencimento: new Date().toISOString().slice(0, 10)
      });
    }

    setAptForm({
      data_apontamento: new Date().toISOString().slice(0, 10),
      clima: 'Bom',
      observacao: '',
      maquinas: initialMaquinas,
      funcionarios: initialFuncionarios,
      insumos: [],
      turmas: initialTurmas
    });
    setShowAptModal(true);
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

    for (const tur of (aptForm.turmas || [])) {
      const val = Number(tur.valor_total || 0);
      if (val < 0) {
        showAlert('error', 'O valor total pago à turma não pode ser negativo.');
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

      // 5. Criar sub-apontamentos de Turmas
      await Promise.all((aptForm.turmas || []).map(tur => 
        relatorioService.createApontamentoTurma({
          apontamento: aptId,
          turma: Number(tur.turma_id),
          valor_total: Number(tur.valor_total),
          data_vencimento: tur.data_vencimento
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
        insumos: [],
        turmas: []
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

  const addTempTurmaReal = () => {
    if (!tempTurmaReal.turma_id || !tempTurmaReal.valor_total || !tempTurmaReal.data_vencimento) return;

    const valor = Number(tempTurmaReal.valor_total || 0);
    if (valor < 0) {
      showAlert('error', 'O valor total não pode ser negativo.');
      return;
    }

    setAptForm(prev => ({
      ...prev,
      turmas: [...prev.turmas, { ...tempTurmaReal }]
    }));
    setTempTurmaReal({ turma_id: '', valor_total: '', data_vencimento: new Date().toISOString().slice(0, 10) });
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

  const lookup = (list, id, field = 'nome') => list.find(item => item.id === Number(id))?.[field] || '-';

  const handleAbtQtyOrPriceChange = (field, val) => {
    setAbtForm(prev => {
      const updated = { ...prev, [field]: val };
      const qty = Number(updated.quantidade || 0);
      const prc = Number(updated.valor_unitario || 0);
      updated.valor_total = Number((qty * prc).toFixed(2));
      return updated;
    });
  };

  const handleAbtCombustivelChange = (prodId) => {
    const prodObj = produtos.find(p => String(p.id) === String(prodId));
    const defaultPrice = prodObj ? String(prodObj.valor_unitario || '') : '';
    setAbtForm(prev => {
      const qty = Number(prev.quantidade || 0);
      const prc = Number(defaultPrice || 0);
      return {
        ...prev,
        combustivel: prodId,
        valor_unitario: defaultPrice,
        valor_total: Number((qty * prc).toFixed(2))
      };
    });
  };

  // Salvar Abastecimento
  const handleCreateAbastecimento = async (e) => {
    e.preventDefault();
    if (!abtForm.maquina || !abtForm.combustivel || !abtForm.quantidade || !abtForm.valor_unitario) {
      showAlert('error', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const qty = Number(abtForm.quantidade);
    const price = Number(abtForm.valor_unitario);
    const hor = abtForm.horimetro ? Number(abtForm.horimetro) : null;

    if (qty < 0 || price < 0 || (hor !== null && hor < 0)) {
      showAlert('error', 'Quantidade, valor unitário e horímetro não podem ser negativos.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fazenda: fazendaAtiva.id,
        safra: safraAtiva.id,
        maquina: Number(abtForm.maquina),
        combustivel: Number(abtForm.combustivel),
        data_abastecimento: abtForm.data_abastecimento,
        quantidade: qty,
        valor_unitario: price,
        valor_total: Number((qty * price).toFixed(2)),
        horimetro: hor,
        observacao: abtForm.observacao.toUpperCase()
      };

      await relatorioService.createAbastecimento(payload);
      showAlert('success', 'Abastecimento registrado com sucesso.');
      setShowNewAbtModal(false);
      setAbtForm({
        maquina: '',
        combustivel: '',
        data_abastecimento: new Date().toISOString().slice(0, 10),
        quantidade: '',
        valor_unitario: '',
        valor_total: 0,
        horimetro: '',
        observacao: ''
      });
      await fetchAbastecimentos();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao salvar o abastecimento.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAbastecimento = async (id) => {
    if (!window.confirm("Deseja realmente excluir este abastecimento?")) return;
    try {
      await relatorioService.deleteAbastecimento(id);
      showAlert('success', 'Abastecimento excluído.');
      await fetchAbastecimentos();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao excluir o abastecimento.');
    }
  };

  // Salvar Gasto Rateio Realizado
  const handleCreateGastoRateio = async (e) => {
    e.preventDefault();
    if (!rateioForm.criterio_rateio || !rateioForm.conta_gerencial || !rateioForm.valor) {
      showAlert('error', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const val = Number(rateioForm.valor);
    if (val <= 0) {
      showAlert('error', 'O valor do gasto deve ser maior que zero.');
      return;
    }

    const criterio = criteriosRateio.find(c => c.id === Number(rateioForm.criterio_rateio));
    const isManual = criterio && ["Direto", "Por Talhão"].includes(criterio.nome);

    let talhoes_dados = [];
    if (isManual) {
      // Validar distribuição manual
      let somaPercentual = 0;
      let somaValor = 0;
      
      for (const t of talhoes) {
        const tDados = rateioForm.talhoes_dados[t.id] || { valor: 0, percentual: 0 };
        const tVal = Number(tDados.valor || 0);
        const tPct = Number(tDados.percentual || 0);
        
        if (tVal < 0 || tPct < 0) {
          showAlert('error', 'Valores ou percentuais não podem ser negativos.');
          return;
        }
        
        if (tVal > 0 || tPct > 0) {
          somaPercentual += tPct;
          somaValor += tVal;
          talhoes_dados.push({
            talhao_id: t.id,
            valor: tVal,
            percentual: tPct
          });
        }
      }

      if (talhoes_dados.length === 0) {
        showAlert('error', 'Por favor, distribua o valor do rateio entre os talões.');
        return;
      }

      // Validar se soma fecha (permite pequena margem de arredondamento)
      const diffPercent = Math.abs(somaPercentual - 100);
      const diffValue = Math.abs(somaValor - val);

      if (diffPercent > 0.05 && diffValue > 0.05) {
        showAlert('error', `A soma da distribuição não fecha com o valor total (Valor: R$ ${somaValor.toFixed(2)} vs R$ ${val.toFixed(2)} | Percentual: ${somaPercentual.toFixed(2)}% vs 100%).`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        fazenda: fazendaAtiva.id,
        safra: safraAtiva.id,
        criterio_rateio: Number(rateioForm.criterio_rateio),
        conta_gerencial: Number(rateioForm.conta_gerencial),
        valor: val,
        data_gasto: rateioForm.data_gasto,
        observacao: rateioForm.observacao.toUpperCase(),
        talhoes_dados: isManual ? talhoes_dados : null
      };

      await relatorioService.createGastoRateio(payload);
      showAlert('success', 'Lançamento de rateio registrado.');
      setShowNewRateioModal(false);
      setRateioForm({
        criterio_rateio: '',
        conta_gerencial: '',
        valor: '',
        data_gasto: new Date().toISOString().slice(0, 10),
        observacao: '',
        talhoes_dados: {}
      });
      await fetchGastosRateio();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao salvar o rateio.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGastoRateio = async (id) => {
    if (!window.confirm("Deseja realmente excluir este lançamento de rateio?")) return;
    try {
      await relatorioService.deleteGastoRateio(id);
      showAlert('success', 'Lançamento de rateio excluído.');
      await fetchGastosRateio();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao excluir o rateio.');
    }
  };


  const handleCreateRateioOperacional = async (e) => {
    e.preventDefault();
    if (!rateioOperacionalForm.data || !rateioOperacionalForm.atividade_educampo) {
      showAlert('error', 'Por favor, preencha a data e a atividade educampo.');
      return;
    }

    setSaving(true);
    try {
      const cleanNumber = (val) => (val === '' || val === null || val === undefined) ? null : Number(val);
      const cleanString = (val) => (val === '' || val === null || val === undefined) ? null : String(val).toUpperCase();

      const payload = {
        safra: safraAtiva.id,
        data: rateioOperacionalForm.data,
        fazenda_rateio: rateioOperacionalForm.fazenda_rateio ? Number(rateioOperacionalForm.fazenda_rateio) : null,
        atividade_educampo: Number(rateioOperacionalForm.atividade_educampo),
        criterio_rateio: rateioOperacionalForm.criterio_rateio ? Number(rateioOperacionalForm.criterio_rateio) : null,
        
        // Planejado
        descricao_plan: cleanString(rateioOperacionalForm.descricao_plan),
        funcionario_plan: rateioOperacionalForm.funcionario_plan ? Number(rateioOperacionalForm.funcionario_plan) : null,
        horas_homem_plan: cleanNumber(rateioOperacionalForm.horas_homem_plan),
        valor_hora_homem_plan: cleanNumber(rateioOperacionalForm.valor_hora_homem_plan),
        trator_plan: rateioOperacionalForm.trator_plan ? Number(rateioOperacionalForm.trator_plan) : null,
        implemento_plan: rateioOperacionalForm.implemento_plan ? Number(rateioOperacionalForm.implemento_plan) : null,
        horas_maq_plan: cleanNumber(rateioOperacionalForm.horas_maq_plan),
        valor_hora_maq_plan: cleanNumber(rateioOperacionalForm.valor_hora_maq_plan),
        combustivel_plan: rateioOperacionalForm.combustivel_plan ? Number(rateioOperacionalForm.combustivel_plan) : null,
        diesel_gasto_plan: cleanNumber(rateioOperacionalForm.diesel_gasto_plan),
        valor_diesel_plan: cleanNumber(rateioOperacionalForm.valor_diesel_plan),
        qtd_plan: cleanNumber(rateioOperacionalForm.qtd_plan),
        valor_unitario_plan: cleanNumber(rateioOperacionalForm.valor_unitario_plan),

        // Realizado
        descricao_real: cleanString(rateioOperacionalForm.descricao_real),
        funcionario_real: rateioOperacionalForm.funcionario_real ? Number(rateioOperacionalForm.funcionario_real) : null,
        horas_homem_real: cleanNumber(rateioOperacionalForm.horas_homem_real),
        valor_hora_homem_real: cleanNumber(rateioOperacionalForm.valor_hora_homem_real),
        trator_real: rateioOperacionalForm.trator_real ? Number(rateioOperacionalForm.trator_real) : null,
        implemento_real: rateioOperacionalForm.implemento_real ? Number(rateioOperacionalForm.implemento_real) : null,
        horas_maq_real: cleanNumber(rateioOperacionalForm.horas_maq_real),
        valor_hora_trator_real: cleanNumber(rateioOperacionalForm.valor_hora_trator_real),
        valor_hora_implemento_real: cleanNumber(rateioOperacionalForm.valor_hora_implemento_real),
        combustivel_real: rateioOperacionalForm.combustivel_real ? Number(rateioOperacionalForm.combustivel_real) : null,
        diesel_gasto_real: cleanNumber(rateioOperacionalForm.diesel_gasto_real),
        valor_diesel_real: cleanNumber(rateioOperacionalForm.valor_diesel_real),
        qtd_real: cleanNumber(rateioOperacionalForm.qtd_real),
        valor_unitario_real: cleanNumber(rateioOperacionalForm.valor_unitario_real),
      };

      await relatorioService.createRateioOperacional(payload);
      showAlert('success', 'Rateio operacional registrado com sucesso.');
      setShowNewRateioOperacionalModal(false);
      const areaC = criteriosRateio.find(c => c.nome.includes('Área') || c.nome.includes('Area')) || { id: '' };
      setRateioOperacionalForm({
        data: new Date().toISOString().slice(0, 10),
        fazenda_rateio: '',
        atividade_educampo: '',
        criterio_rateio: areaC.id || '',
        descricao_plan: '',
        funcionario_plan: '',
        horas_homem_plan: '',
        valor_hora_homem_plan: '',
        trator_plan: '',
        implemento_plan: '',
        horas_maq_plan: '',
        valor_hora_maq_plan: '',
        combustivel_plan: '',
        diesel_gasto_plan: '',
        valor_diesel_plan: '',
        qtd_plan: '',
        valor_unitario_plan: '',
        descricao_real: '',
        funcionario_real: '',
        horas_homem_real: '',
        valor_hora_homem_real: '',
        trator_real: '',
        implemento_real: '',
        horas_maq_real: '',
        valor_hora_trator_real: '',
        valor_hora_implemento_real: '',
        combustivel_real: '',
        diesel_gasto_real: '',
        valor_diesel_real: '',
        qtd_real: '',
        valor_unitario_real: ''
      });
      await fetchRateiosOperacionais();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao salvar o rateio operacional.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenNewRateioOperacional = () => {
    const areaC = criteriosRateio.find(c => c.nome.includes('Área') || c.nome.includes('Area')) || { id: '' };
    setRateioOperacionalForm({
      data: new Date().toISOString().slice(0, 10),
      fazenda_rateio: '',
      atividade_educampo: '',
      criterio_rateio: areaC.id || '',
      descricao_plan: '',
      funcionario_plan: '',
      horas_homem_plan: '',
      valor_hora_homem_plan: '',
      trator_plan: '',
      implemento_plan: '',
      horas_maq_plan: '',
      valor_hora_maq_plan: '',
      combustivel_plan: '',
      diesel_gasto_plan: '',
      valor_diesel_plan: '',
      qtd_plan: '',
      valor_unitario_plan: '',
      descricao_real: '',
      funcionario_real: '',
      horas_homem_real: '',
      valor_hora_homem_real: '',
      trator_real: '',
      implemento_real: '',
      horas_maq_real: '',
      valor_hora_trator_real: '',
      valor_hora_implemento_real: '',
      combustivel_real: '',
      diesel_gasto_real: '',
      valor_diesel_real: '',
      qtd_real: '',
      valor_unitario_real: ''
    });
    setShowNewRateioOperacionalModal(true);
  };

  const handleDeleteRateioOperacional = async (id) => {
    if (!window.confirm("Deseja realmente excluir este rateio operacional?")) return;
    try {
      await relatorioService.deleteRateioOperacional(id);
      showAlert('success', 'Rateio operacional excluído.');
      await fetchRateiosOperacionais();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao excluir o rateio operacional.');
    }
  };

  const getRateioPreview = (valorGasto, criterioId) => {
    const val = Number(valorGasto || 0);
    if (val <= 0 || !criterioId) return [];

    const criterio = criteriosRateio.find(c => c.id === Number(criterioId));
    if (!criterio) return [];

    const count = talhoes.length;
    if (count === 0) return [];

    if (criterio.nome === "Área (Hectares)") {
      const totalArea = talhoes.reduce((acc, curr) => acc + Number(curr.area || 0), 0);
      if (totalArea > 0) {
        return talhoes.map(t => {
          const areaVal = Number(t.area || 0);
          const pct = (areaVal / totalArea) * 100;
          const valor = val * (areaVal / totalArea);
          return {
            talhao_codigo: t.codigo,
            talhao_nome: t.nome,
            percentual: pct,
            valor: valor
          };
        });
      }
    } else if (criterio.nome === "Por Fazenda") {
      return talhoes.map(t => {
        const pct = 100 / count;
        const valor = val / count;
        return {
          talhao_codigo: t.codigo,
          talhao_nome: t.nome,
          percentual: pct,
          valor: valor
        };
      });
    }

    // Default or other automated: equal distribution preview
    return talhoes.map(t => {
      const pct = 100 / count;
      const valor = val / count;
      return {
        talhao_codigo: t.codigo,
        talhao_nome: t.nome,
        percentual: pct,
        valor: valor
      };
    });
  };

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

      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print border-b border-white/[0.04] pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight font-display flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-500" />
            Execução & Operações Agrícolas
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Gerencie ordens de serviço, logs de abastecimento de combustível e rateio de despesas operacionais.
          </p>
        </div>

        {safraAtiva && activeSubTab === 'os' && (
          <button
            onClick={() => setShowNewOSModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-bold py-2.5 px-5 text-xs uppercase shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova OS Avulsa
          </button>
        )}

        {safraAtiva && activeSubTab === 'abastecimento' && (
          <button
            onClick={() => setShowNewAbtModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-bold py-2.5 px-5 text-xs uppercase shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Lançar Abastecimento
          </button>
        )}

        {safraAtiva && activeSubTab === 'rateio' && (
          <button
            onClick={() => setShowNewRateioModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-bold py-2.5 px-5 text-xs uppercase shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Lançar Gasto / Rateio
          </button>
        )}

        {safraAtiva && activeSubTab === 'rateio_operacional' && (
          <button
            onClick={handleOpenNewRateioOperacional}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-bold py-2.5 px-5 text-xs uppercase shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Lançar Rateio Operacional
          </button>
        )}
      </div>

      {/* Sub-abas de Navegação */}
      <div className="flex border-b border-white/[0.06] pb-1 gap-2 no-print">
        <button
          onClick={() => setActiveSubTab('os')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'os'
              ? 'border-emerald-500 text-emerald-400 font-bold bg-white/[0.02]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Ordens de Serviço
        </button>
        <button
          onClick={() => setActiveSubTab('abastecimento')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'abastecimento'
              ? 'border-emerald-500 text-emerald-400 font-bold bg-white/[0.02]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Fuel className="w-4 h-4" />
          Abastecimento
        </button>
        <button
          onClick={() => setActiveSubTab('rateio')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'rateio'
              ? 'border-emerald-500 text-emerald-400 font-bold bg-white/[0.02]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" />
          Rateio Realizado
        </button>
        <button
          onClick={() => setActiveSubTab('rateio_operacional')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'rateio_operacional'
              ? 'border-emerald-500 text-emerald-400 font-bold bg-white/[0.02]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Rateios Operacionais
        </button>
      </div>

      {!safraAtiva ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/10 backdrop-blur-md">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-500" />
          <h2 className="mt-4 text-sm font-bold text-slate-300">Nenhuma Safra Ativa</h2>
          <p className="mt-1 text-xs text-slate-500">Selecione uma safra ativa para carregar os dados operacionais.</p>
        </div>
      ) : activeSubTab === 'os' ? (
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
                        <span>{os.talhoes_detalhe?.length || 0} talões vinculados</span>
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
                          onClick={() => handleOpenAptModal(selectedOS)}
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

                {/* Recursos Planejados da OS */}
                {(selectedOS.funcionario_planejado_nome || selectedOS.trator_planejado_codigo || selectedOS.implemento_planejado_codigo || selectedOS.terceirizado_planejado_nome || selectedOS.turma_planejada_nome || selectedOS.usar_turma) && (
                  <div className="space-y-2 text-left border-t border-white/[0.06] pt-5">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Recursos Planejados (Presets)</span>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-300 bg-slate-950/20 p-3.5 rounded-xl border border-white/[0.04]">
                      {selectedOS.funcionario_planejado_nome && (
                        <div>
                          <span className="font-bold text-slate-500">Operador:</span> {selectedOS.funcionario_planejado_nome}
                        </div>
                      )}
                      {selectedOS.trator_planejado_codigo && (
                        <div>
                          <span className="font-bold text-slate-500">Máquina:</span> {selectedOS.trator_planejado_codigo}
                        </div>
                      )}
                      {selectedOS.implemento_planejado_codigo && (
                        <div>
                          <span className="font-bold text-slate-500">Implemento:</span> {selectedOS.implemento_planejado_codigo}
                        </div>
                      )}
                      {selectedOS.terceirizado_planejado_nome && (
                        <div>
                          <span className="font-bold text-slate-500">Terceirizado:</span> {selectedOS.terceirizado_planejado_nome}
                        </div>
                      )}
                      {(selectedOS.turma_planejada_nome || selectedOS.usar_turma) && (
                        <div>
                          <span className="font-bold text-slate-500">Turma (Panha):</span> {selectedOS.turma_planejada_nome || 'Sim'}
                          {selectedOS.valor_planejado_turma && ` (Plan: R$ ${Number(selectedOS.valor_planejado_turma).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                            
                            {/* Tratores / Máquinas */}
                            <div className="space-y-1">
                              <span className="block text-[9px] font-black text-slate-500 uppercase flex items-center gap-1">
                                <Tractor className="w-3 h-3 text-slate-500" /> Máquinas/Horímetros
                              </span>
                              {((apt.maquinas_detalhe || apt.maquinas)?.length > 0) ? (apt.maquinas_detalhe || apt.maquinas).map((m, i) => {
                                const maqCode = m.maquina_codigo || m.maquina_detalhe?.codigo || 'Máquina';
                                return (
                                  <p key={i} className="text-[10px] text-slate-300 font-semibold">
                                    {maqCode}: {m.horimetro_inicial}h → {m.horimetro_final}h
                                  </p>
                                );
                              }) : <p className="text-[10px] text-slate-600">Sem máquina apontada</p>}
                            </div>

                            {/* Pessoas / Operadores */}
                            <div className="space-y-1">
                              <span className="block text-[9px] font-black text-slate-500 uppercase flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-500" /> Equipe / Operadores
                              </span>
                              {((apt.funcionarios_detalhe || apt.funcionarios)?.length > 0) ? (apt.funcionarios_detalhe || apt.funcionarios).map((f, i) => {
                                const funcName = f.funcionario_nome || f.funcionario_detalhe?.nome || 'Operador';
                                return (
                                  <p key={i} className="text-[10px] text-slate-300 font-semibold">
                                    {funcName}: {f.horas_trabalhadas}h reais
                                  </p>
                                );
                              }) : <p className="text-[10px] text-slate-600">Sem operadores apontados</p>}
                            </div>

                            {/* Turmas Terceirizadas */}
                            <div className="space-y-1">
                              <span className="block text-[9px] font-black text-slate-500 uppercase flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-500" /> Turmas Terceirizadas
                              </span>
                              {((apt.turmas_detalhe || apt.turmas)?.length > 0) ? (apt.turmas_detalhe || apt.turmas).map((t, i) => {
                                const turmaName = t.turma_nome || t.turma_detalhe?.nome || 'Turma';
                                return (
                                  <p key={i} className="text-[10px] text-slate-300 font-semibold">
                                    {turmaName}: R$ {Number(t.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                );
                              }) : <p className="text-[10px] text-slate-600">Sem turmas apontadas</p>}
                            </div>

                            {/* Insumos / Diesel */}
                            <div className="space-y-1">
                              <span className="block text-[9px] font-black text-slate-500 uppercase flex items-center gap-1">
                                <Package className="w-3 h-3 text-slate-500" /> Insumos / Produtos
                              </span>
                              {((apt.insumos_detalhe || apt.insumos)?.length > 0) ? (apt.insumos_detalhe || apt.insumos).map((ins, i) => {
                                const prodName = ins.produto_name || ins.produto_detalhe?.nome_comercial || 'Insumo';
                                const prodUnit = ins.produto_unidade || ins.produto_detalhe?.unidade_sigla || '';
                                return (
                                  <p key={i} className="text-[10px] text-emerald-400 font-bold">
                                    {prodName}: {Number(ins.quantidade_total).toLocaleString('pt-BR')} {prodUnit}
                                  </p>
                                );
                              }) : <p className="text-[10px] text-slate-600">Sem insumo apontado</p>}
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
      ) : activeSubTab === 'abastecimento' ? (
        <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] bg-slate-900/40 space-y-6 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white font-display flex items-center gap-2">
                <Fuel className="w-5 h-5 text-emerald-500" />
                Logs de Abastecimento de Máquinas
              </h3>
              <p className="text-slate-400 text-xs mt-1">Registro de combustível abastecido. Gera saídas automáticas de estoque.</p>
            </div>
          </div>

          {abastecimentos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/5 bg-slate-950/15 p-12 text-center text-slate-500 text-xs">
              Nenhum abastecimento registrado nesta fazenda e safra.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-slate-950/20">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Data</th>
                    <th className="p-4">Máquina</th>
                    <th className="p-4">Combustível</th>
                    <th className="p-4 text-right">Qtd (Litros)</th>
                    <th className="p-4 text-right">Vl. Unitário</th>
                    <th className="p-4 text-right">Vl. Total</th>
                    <th className="p-4 text-right">Horímetro</th>
                    <th className="p-4">Observação</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-slate-350">
                  {abastecimentos.map(abt => (
                    <tr key={abt.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 whitespace-nowrap">{new Date(abt.data_abastecimento).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4 font-bold text-white">
                        {abt.maquina_codigo} <span className="text-slate-500 font-normal text-[10px]">({abt.maquina_descricao})</span>
                      </td>
                      <td className="p-4">{abt.combustivel_nome}</td>
                      <td className="p-4 text-right font-semibold">{Number(abt.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right">R$ {Number(abt.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                      <td className="p-4 text-right font-black text-emerald-450">R$ {Number(abt.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right">{abt.horimetro ? `${Number(abt.horimetro).toLocaleString('pt-BR')} h` : '-'}</td>
                      <td className="p-4 max-w-xs truncate">{abt.observacao || '-'}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteAbastecimento(abt.id)}
                          className="p-2 text-rose-500 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          title="Excluir abastecimento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeSubTab === 'rateio' ? (
        <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] bg-slate-900/40 space-y-6 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white font-display flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-500" />
                Gastos e Rateios Realizados
              </h3>
              <p className="text-slate-400 text-xs mt-1">Lançamento de custos operacionais indiretos com rateio proporcional para os talhões.</p>
            </div>
          </div>

          {gastosRateio.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/5 bg-slate-950/15 p-12 text-center text-slate-500 text-xs">
              Nenhum gasto ou rateio realizado registrado nesta fazenda e safra.
            </div>
          ) : (
            <div className="space-y-6">
              {gastosRateio.map(g => (
                <div key={g.id} className="rounded-xl border border-white/[0.06] bg-slate-950/20 p-4 space-y-4">
                  
                  {/* Header do Gasto */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/[0.06] pb-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-black text-xs uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-emerald-400">
                          {g.conta_gerencial_nome}
                        </span>
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-900 px-2.5 py-0.5 rounded-full">
                          Critério: {g.criterio_rateio_nome}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Data do Gasto: {new Date(g.data_gasto).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valor Total</span>
                        <span className="text-base font-black text-white">
                          R$ {Number(g.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteGastoRateio(g.id)}
                        className="p-2 text-rose-500 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                        title="Excluir rateio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {g.observacao && (
                    <p className="text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-white/[0.02]">
                      <strong>Obs:</strong> {g.observacao}
                    </p>
                  )}

                  {/* Detalhamento do Rateio por Talhão */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distribuição por Talhão</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {g.rateios_talhoes?.map(rt => (
                        <div key={rt.id} className="bg-slate-950/40 border border-white/[0.04] p-2.5 rounded-xl text-left space-y-1">
                          <span className="block text-[10px] font-black text-white truncate" title={rt.talhao_nome}>
                            {rt.talhao_codigo}
                          </span>
                          <div className="flex items-baseline justify-between gap-1">
                            <span className="text-[11px] font-bold text-emerald-450">
                              R$ {Number(rt.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold">
                              {Number(rt.percentual).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] bg-slate-900/40 space-y-6 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white font-display flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Rateios Operacionais
              </h3>
              <p className="text-slate-400 text-xs mt-1">Lançamento de rateios operacionais de atividades agrícolas de campo (Mão de Obra, Máquinas, Diesel e outros insumos).</p>
            </div>
          </div>

          {rateiosOperacionais.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/5 bg-slate-950/15 p-12 text-center text-slate-500 text-xs">
              Nenhum rateio operacional registrado nesta safra.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-slate-950/20 animate-in fade-in duration-300">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Data</th>
                    <th className="p-4">Fazenda Alvo</th>
                    <th className="p-4">Educampo</th>
                    <th className="p-4">Critério</th>
                    <th className="p-4">Mão de Obra Real</th>
                    <th className="p-4">Trator / Implemento Real</th>
                    <th className="p-4">Diesel Real</th>
                    <th className="p-4">Outros Custos Real</th>
                    <th className="p-4 text-right">Total Plan</th>
                    <th className="p-4 text-right">Total Real</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-slate-350">
                  {rateiosOperacionais.map(r => {
                    const moTotal = Number(r.horas_homem_real || 0) * Number(r.valor_hora_homem_real || 0);
                    const maqTotal = Number(r.horas_maq_real || 0) * (Number(r.valor_hora_trator_real || 0) + Number(r.valor_hora_implemento_real || 0));
                    const dslTotal = Number(r.diesel_gasto_real || 0) * Number(r.valor_diesel_real || 0);
                    const outTotal = Number(r.qtd_real || 0) * Number(r.valor_unitario_real || 0);

                    const moPlanTotal = Number(r.horas_homem_plan || 0) * Number(r.valor_hora_homem_plan || 0);
                    const maqPlanTotal = Number(r.horas_maq_plan || 0) * Number(r.valor_hora_maq_plan || 0);
                    const dslPlanTotal = Number(r.diesel_gasto_plan || 0) * Number(r.valor_diesel_plan || 0);
                    const outPlanTotal = Number(r.qtd_plan || 0) * Number(r.valor_unitario_plan || 0);

                    const totalReal = Number(r.valor_total_homem_real || moTotal) +
                      Number(r.valor_total_maq_real || maqTotal) +
                      Number(r.valor_total_diesel_real || dslTotal) +
                      Number(r.valor_total_real || outTotal);

                    const totalPlan = Number(r.valor_total_homem_plan || moPlanTotal) +
                      Number(r.valor_total_maq_plan || maqPlanTotal) +
                      Number(r.valor_total_diesel_plan || dslPlanTotal) +
                      Number(r.valor_total_plan || outPlanTotal);

                    return (
                      <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 whitespace-nowrap">
                          {new Date(r.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4 font-bold text-white">
                          {r.fazenda_rateio_nome || 'GLOBAL / COMPARTILHADO'}
                        </td>
                        <td className="p-4 font-semibold text-emerald-400">
                          {r.atividade_educampo_nome}
                        </td>
                        <td className="p-4 font-semibold text-slate-400">
                          {r.criterio_rateio_nome || 'ÁREA (HECTARES)'}
                        </td>
                        <td className="p-4">
                          {r.funcionario_real_nome ? (
                            <div>
                              <span className="font-bold text-white block">{r.funcionario_real_nome}</span>
                              <span className="text-slate-500 text-[10px]">{Number(r.horas_homem_real)}h x R$ {Number(r.valor_hora_homem_real).toFixed(2)}</span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-4">
                          {r.trator_real_codigo || r.implemento_real_codigo ? (
                            <div>
                              <span className="font-bold text-white block">
                                {r.trator_real_codigo || ''} {r.implemento_real_codigo ? `+ ${r.implemento_real_codigo}` : ''}
                              </span>
                              <span className="text-slate-500 text-[10px]">
                                {Number(r.horas_maq_real)}h x R$ {(Number(r.valor_hora_trator_real || 0) + Number(r.valor_hora_implemento_real || 0)).toFixed(2)}
                              </span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-4">
                          {r.combustivel_real_nome ? (
                            <div>
                              <span className="font-bold text-white block">{r.combustivel_real_nome}</span>
                              <span className="text-slate-500 text-[10px]">{Number(r.diesel_gasto_real)}L x R$ {Number(r.valor_diesel_real).toFixed(2)}</span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-4">
                          {r.descricao_real ? (
                            <div>
                              <span className="font-bold text-white block truncate max-w-[120px]">{r.descricao_real}</span>
                              <span className="text-slate-500 text-[10px]">{Number(r.qtd_real)} x R$ {Number(r.valor_unitario_real).toFixed(2)}</span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-500 font-semibold">
                          R$ {totalPlan.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right font-mono font-black text-emerald-400">
                          R$ {totalReal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteRateioOperacional(r.id)}
                            className="p-2 text-rose-500 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                            title="Excluir rateio operacional"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Nova OS Real Avulsa */}
      {showNewOSModal && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Nova Ordem de Serviço Real</span>
              </h3>
              <button type="button" onClick={() => setShowNewOSModal(false)} className="text-slate-400 hover:text-white transition-all text-xs font-bold font-mono">X</button>
            </div>

            <form onSubmit={handleCreateOSReal} className="p-6 space-y-6 text-left">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Operação *</label>
                  <select
                    required
                    value={newOSForm.tipo_operacao}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, tipo_operacao: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                  >
                    <option value="" className="bg-slate-900 text-white">Selecione...</option>
                    {tiposOperacao.map(op => (
                      <option key={op.id} value={op.id} className="bg-slate-900 text-white">{op.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Data Início Planejada *</label>
                    <input
                      type="date"
                      required
                      value={newOSForm.data_inicio_planejada}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setNewOSForm(prev => ({ ...prev, data_inicio_planejada: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Data Término Planejada *</label>
                    <input
                      type="date"
                      required
                      value={newOSForm.data_fim_planejada}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setNewOSForm(prev => ({ ...prev, data_fim_planejada: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Talhões Selecionados * (Clique para selecionar)</label>
                  <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-white/[0.04]">
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
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                              : 'bg-slate-900 border border-white/5 text-white hover:bg-slate-800'
                          }`}
                        >
                          {t.codigo}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Recomendações Operacionais</label>
                  <textarea
                    placeholder="Instruções para o tratorista/operador no campo..."
                    value={newOSForm.observacao}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, observacao: e.target.value.toUpperCase() }))}
                    rows={2}
                    className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all uppercase"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewOSModal(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Criando...' : 'Criar OS Aprovada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Apontamento Operacional */}
      {showAptModal && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl my-8 animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Apontar Atividade Operacional</span>
              </h3>
              <button type="button" onClick={() => setShowAptModal(false)} className="text-slate-400 hover:text-white transition-all text-xs font-bold font-mono">X</button>
            </div>

            <form onSubmit={handleSaveApontamentos} className="p-6 space-y-6 text-left">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Data do Apontamento *</span>
                  <input
                    type="date"
                    required
                    value={aptForm.data_apontamento}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setAptForm(prev => ({ ...prev, data_apontamento: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Clima / Tempo</span>
                  <input
                    type="text"
                    value={aptForm.clima}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setAptForm(prev => ({ ...prev, clima: e.target.value.toUpperCase() }))}
                    placeholder="BOM, CHUVOSO, NUBLADO..."
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none uppercase"
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
                        <span className="text-white font-bold">
                          {(() => {
                            const item = maquinas.find(x => String(x.id) === String(maq.maquina_id));
                            if (!item) return 'Desconhecida';
                            const fazendaOrigem = (fazendas || []).find(f => f.id === item.fazenda_id || f.id === item.fazenda);
                            return `${item.descricao}${fazendaOrigem ? ` [${fazendaOrigem.sigla}]` : ''}`;
                          })()}
                        </span>
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
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setTempMaquinaReal(prev => ({ ...prev, maquina_id: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      >
                        <option value="">Selecione...</option>
                        {maquinas.map(m => {
                          const fazendaOrigem = (fazendas || []).find(f => f.id === m.fazenda_id || f.id === m.fazenda);
                          const tagFazenda = fazendaOrigem ? ` [${fazendaOrigem.sigla}]` : '';
                          return (
                            <option key={m.id} value={m.id} className="bg-slate-900">{m.codigo} - {m.descricao}{tagFazenda}</option>
                          );
                        })}
                      </select>
                    </label>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Horímetro Inicial</span>
                      <input
                        type="number"
                        value={tempMaquinaReal.horimetro_inicial}
                        onKeyDown={handleKeyDown}
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
                        onKeyDown={handleKeyDown}
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
                        <span className="text-white font-bold">
                          {(() => {
                            const item = funcionarios.find(x => String(x.id) === String(f.funcionario_id));
                            if (!item) return 'Desconhecido';
                            const fazendaOrigem = (fazendas || []).find(f => f.id === item.fazenda_id || f.id === item.fazenda);
                            return `${item.nome}${fazendaOrigem ? ` [${fazendaOrigem.sigla}]` : ''}`;
                          })()}
                        </span>
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
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setTempFuncionarioReal(prev => ({ ...prev, funcionario_id: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      >
                        <option value="">Selecione...</option>
                        {funcionarios.map(func => {
                          const fazendaOrigem = (fazendas || []).find(f => f.id === func.fazenda_id || f.id === func.fazenda);
                          const tagFazenda = fazendaOrigem ? ` [${fazendaOrigem.sigla}]` : '';
                          return (
                            <option key={func.id} value={func.id} className="bg-slate-900">{func.nome} ({func.cargo || 'Campo'}){tagFazenda}</option>
                          );
                        })}
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
                        onKeyDown={handleKeyDown}
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

              {/* Sub-Apontamento: Turmas Terceirizadas */}
              <div className="space-y-3 border-t border-white/[0.06] pt-4">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  Turmas Terceirizadas Contratadas
                </span>

                {(aptForm.turmas || []).length > 0 && (
                  <div className="space-y-2">
                    {(aptForm.turmas || []).map((t, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl text-xs border border-white/[0.04]">
                        <span className="text-white font-bold">
                          {lookup(turmas, t.turma_id, 'nome')}
                        </span>
                        <div className="flex items-center gap-3 text-slate-400">
                          <span>Valor: R$ {Number(t.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Vencimento: {new Date(t.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                          <button type="button" onClick={() => setAptForm(prev => ({ ...prev, turmas: prev.turmas.filter((_, idx) => idx !== i) }))} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-950/20 p-3 rounded-xl border border-white/[0.04]">
                  <div className="md:col-span-5">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Escolher Turma</span>
                      <select
                        value={tempTurmaReal.turma_id}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setTempTurmaReal(prev => ({ ...prev, turma_id: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      >
                        <option value="">Selecione...</option>
                        {turmas.map(tur => (
                          <option key={tur.id} value={tur.id} className="bg-slate-900">{tur.nome} (Resp: {tur.responsavel || '-'})</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Valor Total (R$)</span>
                      <input
                        type="number"
                        placeholder="Ex: 1200"
                        value={tempTurmaReal.valor_total}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setTempTurmaReal(prev => ({ ...prev, valor_total: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      />
                    </label>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Vencimento</span>
                      <input
                        type="date"
                        value={tempTurmaReal.data_vencimento}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setTempTurmaReal(prev => ({ ...prev, data_vencimento: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                      />
                    </label>
                  </div>
                  <div className="md:col-span-1">
                    <button type="button" onClick={addTempTurmaReal} className="w-full flex h-8 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold cursor-pointer"><Plus className="w-4 h-4" /></button>
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
                        onKeyDown={handleKeyDown}
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
                        onKeyDown={handleKeyDown}
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
                        onKeyDown={handleKeyDown}
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

              <div className="space-y-1.5 border-t border-white/[0.06] pt-4">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Notas de Campo / Observações</label>
                <textarea
                  placeholder="Alguma intercorrência, quebra de máquina, chuva forte no dia..."
                  value={aptForm.observacao}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setAptForm(prev => ({ ...prev, observacao: e.target.value.toUpperCase() }))}
                  rows={2}
                  className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all uppercase"
                />
              </div>

              <div className="flex gap-3 justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  onClick={() => setShowAptModal(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Registrando...' : 'Salvar Apontamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Novo Abastecimento */}
      {showNewAbtModal && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl my-8 animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Fuel className="w-4 h-4 text-emerald-500" />
                <span>Registrar Abastecimento</span>
              </h3>
              <button type="button" onClick={() => setShowNewAbtModal(false)} className="text-slate-400 hover:text-white transition-all text-xs font-bold font-mono">X</button>
            </div>

            <form onSubmit={handleCreateAbastecimento} className="p-6 space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Máquina *</span>
                  <select
                    required
                    value={abtForm.maquina}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                      const maqId = e.target.value;
                      const selectedMaq = maquinas.find(m => String(m.id) === String(maqId));
                      const horimetroInit = selectedMaq ? (selectedMaq.horimetro_inicial !== undefined && selectedMaq.horimetro_inicial !== null ? selectedMaq.horimetro_inicial : '') : '';
                      setAbtForm(prev => ({ 
                        ...prev, 
                        maquina: maqId,
                        horimetro: horimetroInit
                      }));
                    }}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  >
                    <option value="">Selecione a máquina...</option>
                    {maquinas.map(m => {
                      const fazendaOrigem = (fazendas || []).find(f => f.id === m.fazenda_id || f.id === m.fazenda);
                      const tagFazenda = fazendaOrigem ? ` [${fazendaOrigem.sigla}]` : '';
                      return (
                        <option key={m.id} value={m.id} className="bg-slate-900">
                          {m.codigo} - {m.descricao}{tagFazenda}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>

              <div>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Combustível *</span>
                  <select
                    required
                    value={abtForm.combustivel}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => handleAbtCombustivelChange(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  >
                    <option value="">Selecione o combustível...</option>
                    {produtos
                      .filter(p => p.classificacao_nome?.toUpperCase() === 'COMBUSTÍVEL' || p.classificacao_nome?.toUpperCase() === 'COMBUSTIVEL')
                      .map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-900">
                          {p.nome_comercial} ({p.unidade_sigla || 'L'})
                        </option>
                      ))
                    }
                    {produtos.filter(p => p.classificacao_nome?.toUpperCase() === 'COMBUSTÍVEL' || p.classificacao_nome?.toUpperCase() === 'COMBUSTIVEL').length === 0 &&
                      produtos.map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-900">
                          {p.nome_comercial} ({p.unidade_sigla || 'L'})
                        </option>
                      ))
                    }
                  </select>
                </label>
              </div>

              <div>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Data do Abastecimento *</span>
                  <input
                    type="date"
                    required
                    value={abtForm.data_abastecimento}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setAbtForm(prev => ({ ...prev, data_abastecimento: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  />
                </label>
              </div>

              <div>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Horímetro da Máquina</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1250.5"
                    value={abtForm.horimetro}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setAbtForm(prev => ({ ...prev, horimetro: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  />
                </label>
              </div>

              <div>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Quantidade (Litros) *</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={abtForm.quantidade}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => handleAbtQtyOrPriceChange('quantidade', e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  />
                </label>
              </div>

              <div>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Valor Unitário (R$) *</span>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    placeholder="0.0000"
                    value={abtForm.valor_unitario}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => handleAbtQtyOrPriceChange('valor_unitario', e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  />
                </label>
              </div>

              <div className="md:col-span-2 p-3 bg-slate-950/30 rounded-xl border border-white/[0.04] flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Total Calculado:</span>
                <span className="text-base font-black text-emerald-450">
                  R$ {Number(abtForm.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Observações / Notas</label>
                <textarea
                  placeholder="Observações do abastecimento..."
                  value={abtForm.observacao}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setAbtForm(prev => ({ ...prev, observacao: e.target.value.toUpperCase() }))}
                  rows={2}
                  className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 transition-all uppercase"
                />
              </div>
              </div> {/* Close grid */}

              <div className="flex gap-3 justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewAbtModal(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Gravando...' : 'Salvar Abastecimento'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Novo Gasto e Rateio */}
      {showNewRateioModal && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl my-8 animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-500" />
                <span>Lançar Gasto e Rateio Realizado</span>
              </h3>
              <button type="button" onClick={() => setShowNewRateioModal(false)} className="text-slate-400 hover:text-white transition-all text-xs font-bold font-mono">X</button>
            </div>

            <form onSubmit={handleCreateGastoRateio} className="p-6 space-y-6 text-left">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Conta Gerencial (Despesa) *</span>
                    <select
                      required
                      value={rateioForm.conta_gerencial}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setRateioForm(prev => ({ ...prev, conta_gerencial: e.target.value }))}
                      className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                    >
                      <option value="">Selecione...</option>
                      {contasGerenciais.map(c => (
                        <option key={c.id} value={c.id} className="bg-slate-900">
                          {c.codigo} - {c.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Critério de Rateio *</span>
                    <select
                      required
                      value={rateioForm.criterio_rateio}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setRateioForm(prev => ({ ...prev, criterio_rateio: e.target.value }))}
                      className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                    >
                      <option value="">Selecione...</option>
                      {criteriosRateio.map(c => (
                        <option key={c.id} value={c.id} className="bg-slate-900">
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Valor do Gasto (R$) *</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={rateioForm.valor}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setRateioForm(prev => ({ ...prev, valor: e.target.value }))}
                      className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                    />
                  </label>
                </div>

                <div>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Data do Lançamento *</span>
                    <input
                      type="date"
                      required
                      value={rateioForm.data_gasto}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setRateioForm(prev => ({ ...prev, data_gasto: e.target.value }))}
                      className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                    />
                  </label>
                </div>

              </div>

              <div>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Observações</span>
                  <textarea
                    placeholder="Descrição complementar..."
                    value={rateioForm.observacao}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setRateioForm(prev => ({ ...prev, observacao: e.target.value.toUpperCase() }))}
                    rows={2}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none uppercase"
                  />
                </label>
              </div>

              {/* Distribuição Dinâmica / Demonstrativa */}
              {rateioForm.valor && rateioForm.criterio_rateio && (() => {
                const criterio = criteriosRateio.find(c => c.id === Number(rateioForm.criterio_rateio));
                if (!criterio) return null;
                const isManual = ["Direto", "Por Talhão"].includes(criterio.nome);

                if (isManual) {
                  const totalGasto = Number(rateioForm.valor || 0);
                  const { totalVal, totalPct } = getManualTotals();
                  const diffPercent = Math.abs(totalPct - 100);
                  const isClosePct = diffPercent <= 0.05;
                  
                  return (
                    <div className="space-y-3 border-t border-white/[0.06] pt-4">
                      <div className="flex items-center justify-between">
                        <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-emerald-500" />
                          Distribuição Manual por Talhão
                        </span>
                        
                        <div className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${
                          isClosePct
                            ? 'bg-emerald-950/50 border-emerald-800 text-emerald-450'
                            : 'bg-rose-950/50 border-rose-800 text-rose-450'
                        }`}>
                          Soma: {totalPct.toFixed(2)}% de 100% | R$ {totalVal.toFixed(2)} de R$ {totalGasto.toFixed(2)}
                        </div>
                      </div>

                      {totalGasto <= 0 ? (
                        <p className="text-xs text-amber-450 italic">Insira um valor de gasto maior que zero acima para habilitar a distribuição manual.</p>
                      ) : (
                        <div className="max-h-[200px] overflow-y-auto border border-white/[0.06] rounded-xl bg-slate-950/40 p-2 space-y-2">
                          {talhoes.map(t => {
                            const tDados = rateioForm.talhoes_dados[t.id] || { valor: '', percentual: '' };
                            return (
                              <div key={t.id} className="grid grid-cols-12 gap-3 items-center bg-slate-900/40 p-2 rounded-lg text-xs">
                                <div className="col-span-6 font-bold text-white">
                                  {t.codigo} - {t.nome}
                                </div>
                                <div className="col-span-3 flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500">R$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={tDados.valor}
                                    onKeyDown={handleKeyDown}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      const numericVal = Number(v);
                                      let pct = '';
                                      if (totalGasto > 0 && v !== '') {
                                        pct = ((numericVal / totalGasto) * 100).toFixed(2);
                                      }
                                      setRateioForm(prev => ({
                                        ...prev,
                                        talhoes_dados: {
                                          ...prev.talhoes_dados,
                                          [t.id]: { valor: v, percentual: pct }
                                        }
                                      }));
                                    }}
                                    className="w-full bg-slate-950 border border-white/[0.08] focus:border-emerald-500 rounded-lg p-1.5 text-xs text-white text-right outline-none"
                                  />
                                </div>
                                <div className="col-span-3 flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={tDados.percentual}
                                    onKeyDown={handleKeyDown}
                                    onChange={(e) => {
                                      const p = e.target.value;
                                      const numericPct = Number(p);
                                      let v = '';
                                      if (totalGasto > 0 && p !== '') {
                                        v = ((numericPct / 100) * totalGasto).toFixed(2);
                                      }
                                      setRateioForm(prev => ({
                                        ...prev,
                                        talhoes_dados: {
                                          ...prev.talhoes_dados,
                                          [t.id]: { valor: v, percentual: p }
                                        }
                                      }));
                                    }}
                                    className="w-full bg-slate-950 border border-white/[0.08] focus:border-emerald-500 rounded-lg p-1.5 text-xs text-white text-right outline-none"
                                  />
                                  <span className="text-[10px] text-slate-500">%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Automático - Exibir prévia calculada em tempo real
                  const preview = getRateioPreview(rateioForm.valor, rateioForm.criterio_rateio);
                  return (
                    <div className="space-y-3 border-t border-white/[0.06] pt-4">
                      <span className="block text-xs font-bold text-slate-355 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-teal-500" />
                        Prévia da Distribuição Automática ({criterio.nome})
                      </span>

                      <div className="max-h-[200px] overflow-y-auto border border-white/[0.06] rounded-xl bg-slate-950/40 p-2">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/[0.04] text-slate-500 font-bold uppercase">
                              <th className="p-2">Talhão</th>
                              <th className="p-2 text-right">Percentual (%)</th>
                              <th className="p-2 text-right">Valor Estimado (R$)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.02]">
                            {preview.map((row, i) => (
                              <tr key={i} className="text-slate-300">
                                <td className="p-2 font-semibold">{row.talhao_codigo} - {row.talhao_nome}</td>
                                <td className="p-2 text-right font-mono">{Number(row.percentual || 0).toFixed(2)}%</td>
                                <td className="p-2 text-right font-mono text-emerald-450">R$ {Number(row.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }
              })()}

              <div className="flex gap-3 justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewRateioModal(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Gravando...' : 'Salvar Rateio'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Novo Rateio Operacional */}
      {showNewRateioOperacionalModal && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-5xl bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl my-8 animate-in scale-in duration-200">
            <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Lançar Rateio Operacional</span>
              </h3>
              <button type="button" onClick={() => setShowNewRateioOperacionalModal(false)} className="text-slate-400 hover:text-white transition-all text-xs font-bold font-mono">X</button>
            </div>

            <form onSubmit={handleCreateRateioOperacional} className="p-6 space-y-6 text-left">
              
              {/* Seção 1: Dados Gerais */}
              <div className="bg-slate-950/30 p-4 rounded-xl border border-white/[0.04] grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                <div>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Data *</span>
                    <input
                      type="date"
                      required
                      value={rateioOperacionalForm.data}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, data: e.target.value }))}
                      className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2 px-3 text-sm text-white outline-none"
                    />
                  </label>
                </div>

                <div>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Fazenda Alvo</span>
                    <select
                      value={rateioOperacionalForm.fazenda_rateio}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, fazenda_rateio: e.target.value }))}
                      className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2 px-3 text-sm text-white outline-none"
                    >
                      <option value="">GLOBAL / COMPARTILHADO (TODAS AS FAZENDAS)</option>
                      {fazendas?.map(f => (
                        <option key={f.id} value={f.id} className="bg-slate-900">{f.nome}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Atividade Educampo *</span>
                    <select
                      required
                      value={rateioOperacionalForm.atividade_educampo}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, atividade_educampo: e.target.value }))}
                      className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2 px-3 text-sm text-white outline-none"
                    >
                      <option value="">Selecione a atividade...</option>
                      {atividadesEducampo?.map(a => (
                        <option key={a.id} value={a.id} className="bg-slate-900">{a.nome}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Critério de Rateio *</span>
                    <select
                      required
                      value={rateioOperacionalForm.criterio_rateio}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, criterio_rateio: e.target.value }))}
                      className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2 px-3 text-sm text-white outline-none"
                    >
                      <option value="">Selecione o critério...</option>
                      {criteriosRateio?.filter(c => ["Área (Hectares)", "Produção (Sacas)"].includes(c.nome)).map(c => (
                        <option key={c.id} value={c.id} className="bg-slate-900">{c.nome}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {/* Seção 2: Planejado vs Realizado (Duas Colunas) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                
                {/* Coluna Esquerda: PLANEJADO */}
                <div className="space-y-6 bg-slate-950/15 p-5 rounded-2xl border border-white/[0.04]">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-white/[0.06] pb-2 flex items-center justify-between">
                    <span>1. Custo Planejado</span>
                    <span className="text-[10px] text-slate-500 font-bold">Orçamento Estimado</span>
                  </h4>

                  {/* Mão de Obra Planejado */}
                  <div className="p-3 bg-slate-900/30 rounded-xl border border-white/[0.02] space-y-3">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Mão de Obra</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <select
                          value={rateioOperacionalForm.funcionario_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, funcionario_plan: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        >
                          <option value="">Selecione o funcionário...</option>
                          {funcionarios?.map(f => (
                            <option key={f.id} value={f.id} className="bg-slate-900">{f.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Horas plan"
                          value={rateioOperacionalForm.horas_homem_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, horas_homem_plan: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Valor/Hora plan"
                          value={rateioOperacionalForm.valor_hora_homem_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, valor_hora_homem_plan: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                    {rateioOperacionalForm.horas_homem_plan && rateioOperacionalForm.valor_hora_homem_plan && (
                      <div className="text-[10px] text-slate-500 font-bold text-right">
                        Subtotal M.O.: R$ {(Number(rateioOperacionalForm.horas_homem_plan) * Number(rateioOperacionalForm.valor_hora_homem_plan)).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Máquinas Planejado */}
                  <div className="p-3 bg-slate-900/30 rounded-xl border border-white/[0.02] space-y-3">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Máquinas & Equipamentos</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <select
                          value={rateioOperacionalForm.trator_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, trator_plan: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        >
                          <option value="">Trator plan...</option>
                          {maquinas?.filter(m => m.tipo_nome?.toLowerCase() !== 'implemento').map(m => (
                            <option key={m.id} value={m.id} className="bg-slate-900">{m.codigo}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={rateioOperacionalForm.implemento_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, implemento_plan: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        >
                          <option value="">Implemento plan...</option>
                          {maquinas?.filter(m => m.tipo_nome?.toLowerCase() === 'implemento').map(m => (
                            <option key={m.id} value={m.id} className="bg-slate-900">{m.codigo}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Horas maq plan"
                          value={rateioOperacionalForm.horas_maq_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, horas_maq_plan: e.target.value }))}
                          className="w-full bg-slate-955/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Valor/Hora maq plan"
                          value={rateioOperacionalForm.valor_hora_maq_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, valor_hora_maq_plan: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                    {rateioOperacionalForm.horas_maq_plan && rateioOperacionalForm.valor_hora_maq_plan && (
                      <div className="text-[10px] text-slate-500 font-bold text-right">
                        Subtotal Máq.: R$ {(Number(rateioOperacionalForm.horas_maq_plan) * Number(rateioOperacionalForm.valor_hora_maq_plan)).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Combustível Planejado */}
                  <div className="p-3 bg-slate-900/30 rounded-xl border border-white/[0.02] space-y-3">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Combustível</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-3">
                        <select
                          value={rateioOperacionalForm.combustivel_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => {
                            const prodId = e.target.value;
                            const prodObj = produtos.find(p => String(p.id) === String(prodId));
                            const defaultPrice = prodObj ? String(prodObj.valor_unitario || '') : '';
                            setRateioOperacionalForm(prev => ({
                              ...prev,
                              combustivel_plan: prodId,
                              valor_diesel_plan: defaultPrice
                            }));
                          }}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        >
                          <option value="">Selecione o combustível...</option>
                          {produtos?.filter(p => p.classificacao_nome?.toUpperCase() === 'COMBUSTÍVEL' || p.classificacao_nome?.toUpperCase() === 'COMBUSTIVEL' || (typeof p.classificacao === 'string' && (p.classificacao.toUpperCase() === 'COMBUSTÍVEIS' || p.classificacao.toUpperCase() === 'COMBUSTIVEL'))).map(p => (
                            <option key={p.id} value={p.id} className="bg-slate-900">{p.nome_comercial}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Litros plan"
                          value={rateioOperacionalForm.diesel_gasto_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, diesel_gasto_plan: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Valor/Litro plan"
                          value={rateioOperacionalForm.valor_diesel_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, valor_diesel_plan: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                    {rateioOperacionalForm.diesel_gasto_plan && rateioOperacionalForm.valor_diesel_plan && (
                      <div className="text-[10px] text-slate-500 font-bold text-right">
                        Subtotal Comb.: R$ {(Number(rateioOperacionalForm.diesel_gasto_plan) * Number(rateioOperacionalForm.valor_diesel_plan)).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Outros Planejado */}
                  <div className="p-3 bg-slate-900/30 rounded-xl border border-white/[0.02] space-y-3">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Outros Custos / Insumos Gerais</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          placeholder="Descrição planejado"
                          value={rateioOperacionalForm.descricao_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, descricao_plan: e.target.value.toUpperCase() }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none uppercase"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Qtd plan"
                          value={rateioOperacionalForm.qtd_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, qtd_plan: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Vl. Unitário plan"
                          value={rateioOperacionalForm.valor_unitario_plan}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, valor_unitario_plan: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                    {rateioOperacionalForm.qtd_plan && rateioOperacionalForm.valor_unitario_plan && (
                      <div className="text-[10px] text-slate-500 font-bold text-right">
                        Subtotal Outros: R$ {(Number(rateioOperacionalForm.qtd_plan) * Number(rateioOperacionalForm.valor_unitario_plan)).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Totalizador Planejado */}
                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Planejado Estimado:</span>
                    <span className="text-sm font-black text-slate-350 font-mono">
                      R$ {(() => {
                        const mo = Number(rateioOperacionalForm.horas_homem_plan || 0) * Number(rateioOperacionalForm.valor_hora_homem_plan || 0);
                        const maq = Number(rateioOperacionalForm.horas_maq_plan || 0) * Number(rateioOperacionalForm.valor_hora_maq_plan || 0);
                        const dsl = Number(rateioOperacionalForm.diesel_gasto_plan || 0) * Number(rateioOperacionalForm.valor_diesel_plan || 0);
                        const out = Number(rateioOperacionalForm.qtd_plan || 0) * Number(rateioOperacionalForm.valor_unitario_plan || 0);
                        return (mo + maq + dsl + out).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()}
                    </span>
                  </div>

                </div>

                {/* Coluna Direita: REALIZADO */}
                <div className="space-y-6 bg-emerald-950/5 p-5 rounded-2xl border border-emerald-500/10">
                  <h4 className="text-xs font-black text-emerald-450 uppercase tracking-wider border-b border-emerald-500/10 pb-2 flex items-center justify-between">
                    <span>2. Custo Realizado</span>
                    <span className="text-[10px] text-emerald-500/80 font-bold">Apontamento Efetivo</span>
                  </h4>

                  {/* Mão de Obra Realizado */}
                  <div className="p-3 bg-slate-900/30 rounded-xl border border-white/[0.02] space-y-3">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Mão de Obra</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <select
                          value={rateioOperacionalForm.funcionario_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, funcionario_real: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        >
                          <option value="">Selecione o funcionário...</option>
                          {funcionarios?.map(f => (
                            <option key={f.id} value={f.id} className="bg-slate-900">{f.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Horas real"
                          value={rateioOperacionalForm.horas_homem_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, horas_homem_real: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Valor/Hora real"
                          value={rateioOperacionalForm.valor_hora_homem_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, valor_hora_homem_real: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                    {rateioOperacionalForm.horas_homem_real && rateioOperacionalForm.valor_hora_homem_real && (
                      <div className="text-[10px] text-slate-500 font-bold text-right">
                        Subtotal M.O.: R$ {(Number(rateioOperacionalForm.horas_homem_real) * Number(rateioOperacionalForm.valor_hora_homem_real)).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Máquinas Realizado */}
                  <div className="p-3 bg-slate-900/30 rounded-xl border border-white/[0.02] space-y-3">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Máquinas & Equipamentos</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <select
                          value={rateioOperacionalForm.trator_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, trator_real: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        >
                          <option value="">Trator real...</option>
                          {maquinas?.filter(m => m.tipo_nome?.toLowerCase() !== 'implemento').map(m => (
                            <option key={m.id} value={m.id} className="bg-slate-900">{m.codigo}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={rateioOperacionalForm.implemento_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, implemento_real: e.target.value }))}
                          className="w-full bg-slate-955/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        >
                          <option value="">Implemento real...</option>
                          {maquinas?.filter(m => m.tipo_nome?.toLowerCase() === 'implemento').map(m => (
                            <option key={m.id} value={m.id} className="bg-slate-900">{m.codigo}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Horas maq real"
                          value={rateioOperacionalForm.horas_maq_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, horas_maq_real: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Vl. Trator"
                          value={rateioOperacionalForm.valor_hora_trator_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, valor_hora_trator_real: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-1.5 text-[11px] text-white outline-none"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Vl. Impl"
                          value={rateioOperacionalForm.valor_hora_implemento_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, valor_hora_implemento_real: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-1.5 text-[11px] text-white outline-none"
                        />
                      </div>
                    </div>
                    {rateioOperacionalForm.horas_maq_real && (rateioOperacionalForm.valor_hora_trator_real || rateioOperacionalForm.valor_hora_implemento_real) && (
                      <div className="text-[10px] text-slate-500 font-bold text-right">
                        Subtotal Máq.: R$ {(Number(rateioOperacionalForm.horas_maq_real) * (Number(rateioOperacionalForm.valor_hora_trator_real || 0) + Number(rateioOperacionalForm.valor_hora_implemento_real || 0))).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Combustível Realizado */}
                  <div className="p-3 bg-slate-900/30 rounded-xl border border-white/[0.02] space-y-3">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Combustível</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-3">
                        <select
                          value={rateioOperacionalForm.combustivel_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => {
                            const prodId = e.target.value;
                            const prodObj = produtos.find(p => String(p.id) === String(prodId));
                            const defaultPrice = prodObj ? String(prodObj.valor_unitario || '') : '';
                            setRateioOperacionalForm(prev => ({
                              ...prev,
                              combustivel_real: prodId,
                              valor_diesel_real: defaultPrice
                            }));
                          }}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        >
                          <option value="">Selecione o combustível...</option>
                          {produtos?.filter(p => p.classificacao_nome?.toUpperCase() === 'COMBUSTÍVEL' || p.classificacao_nome?.toUpperCase() === 'COMBUSTIVEL' || (typeof p.classificacao === 'string' && (p.classificacao.toUpperCase() === 'COMBUSTÍVEIS' || p.classificacao.toUpperCase() === 'COMBUSTIVEL'))).map(p => (
                            <option key={p.id} value={p.id} className="bg-slate-900">{p.nome_comercial}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Litros real"
                          value={rateioOperacionalForm.diesel_gasto_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, diesel_gasto_real: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Valor/Litro real"
                          value={rateioOperacionalForm.valor_diesel_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, valor_diesel_real: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                    {rateioOperacionalForm.diesel_gasto_real && rateioOperacionalForm.valor_diesel_real && (
                      <div className="text-[10px] text-slate-500 font-bold text-right">
                        Subtotal Comb.: R$ {(Number(rateioOperacionalForm.diesel_gasto_real) * Number(rateioOperacionalForm.valor_diesel_real)).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Outros Realizado */}
                  <div className="p-3 bg-slate-900/30 rounded-xl border border-white/[0.02] space-y-3">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Outros Custos / Insumos Gerais</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          placeholder="Descrição realizado"
                          value={rateioOperacionalForm.descricao_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, descricao_real: e.target.value.toUpperCase() }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none uppercase"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Qtd real"
                          value={rateioOperacionalForm.qtd_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, qtd_real: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Vl. Unitário real"
                          value={rateioOperacionalForm.valor_unitario_real}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setRateioOperacionalForm(prev => ({ ...prev, valor_unitario_real: e.target.value }))}
                          className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                    {rateioOperacionalForm.qtd_real && rateioOperacionalForm.valor_unitario_real && (
                      <div className="text-[10px] text-slate-500 font-bold text-right">
                        Subtotal Outros: R$ {(Number(rateioOperacionalForm.qtd_real) * Number(rateioOperacionalForm.valor_unitario_real)).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Totalizador Realizado */}
                  <div className="p-3.5 bg-emerald-950/50 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-450 uppercase tracking-wider">Total Realizado Efetivo:</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      R$ {(() => {
                        const mo = Number(rateioOperacionalForm.horas_homem_real || 0) * Number(rateioOperacionalForm.valor_hora_homem_real || 0);
                        const maq = Number(rateioOperacionalForm.horas_maq_real || 0) * (Number(rateioOperacionalForm.valor_hora_trator_real || 0) + Number(rateioOperacionalForm.valor_hora_implemento_real || 0));
                        const dsl = Number(rateioOperacionalForm.diesel_gasto_real || 0) * Number(rateioOperacionalForm.valor_diesel_real || 0);
                        const out = Number(rateioOperacionalForm.qtd_real || 0) * Number(rateioOperacionalForm.valor_unitario_real || 0);
                        return (mo + maq + dsl + out).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()}
                    </span>
                  </div>

                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 justify-end border-t border-white/[0.06] pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewRateioOperacionalModal(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-lg"
                >
                  {saving ? 'Gravando...' : 'Salvar Rateio Operacional'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Ficha de Impressão do Informe de Operação (exemploos.pdf) */}
      {selectedOS && (
        <div className="print-only print-page print:block hidden bg-white text-black p-4 font-sans text-[10px]">
          {/* Cabeçalho */}
          <table className="w-full border-collapse print-table">
            <tbody>
              {/* Linha 1: Logotipo, Título do Relatório, SEBRAE */}
              <tr className="border border-black">
                <td className="w-full p-3 text-center">
                  <div className="text-sm font-black tracking-wider uppercase">INFORME DE OPERAÇÃO</div>
                  <div className="text-[8px] font-bold text-slate-700 mt-0.5">Grupo Congonhas Estate Coffee</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Dados e Prazos da OS */}
          <table className="w-full border-collapse print-table border-t-0 -mt-px">
            <tbody>
              <tr className="border border-black">
                <td className="w-[15%] bg-slate-100 p-1 font-bold border-r border-black">OS Nº</td>
                <td className="w-[15%] p-1 text-center font-black border-r border-black text-sm">{selectedOS.id}</td>
                <td className="w-[15%] bg-slate-100 p-1 font-bold border-r border-black">Ação</td>
                <td className="w-[55%] p-1 font-bold text-left">{selectedOS.tipo_operacao_nome || lookup(tiposOperacao, selectedOS.tipo_operacao)}</td>
              </tr>
              <tr className="border border-black">
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Operador:</td>
                <td colSpan="3" className="p-1 font-bold text-left">
                  {selectedOS.funcionario_planejado_nome || selectedOS.terceirizado_planejado_nome || '__________________________________________________________________'}
                </td>
              </tr>
              <tr className="border border-black">
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Talhão</td>
                <td className="p-1 border-r border-black text-left font-bold" colSpan="2">
                  {selectedOS.talhoes_detalhe?.map(t => `${t.codigo} - ${t.nome}`).join(', ') || '-'}
                </td>
                <td className="p-1 text-left">
                  <span className="font-bold text-slate-700">Serviço:</span> {selectedOS.tipo_operacao_nome || lookup(tiposOperacao, selectedOS.tipo_operacao)}
                </td>
              </tr>
              <tr className="border border-black">
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Máquina</td>
                <td className="p-1 border-r border-black text-left font-bold" colSpan="2">
                  {selectedOS.trator_planejado_codigo || '_________________'}
                </td>
                <td className="p-1 text-left">
                  <span className="font-bold text-slate-700">Implemento:</span> {selectedOS.implemento_planejado_codigo || '_________________'}
                </td>
              </tr>
              <tr className="border border-black">
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Prazo Inicial Planj.</td>
                <td className="p-1 border-r border-black text-center font-bold">
                  {new Date(selectedOS.data_inicio_planejada).toLocaleDateString('pt-BR')}
                </td>
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Prazo Final Planj.</td>
                <td className="p-1 text-left font-bold">
                  {new Date(selectedOS.data_fim_planejada).toLocaleDateString('pt-BR')}
                </td>
              </tr>
              <tr className="border border-black">
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Total de Horas Planejadas</td>
                <td className="p-1 border-r border-black text-center font-mono font-bold">
                  {(() => {
                    const totalArea = selectedOS.talhoes_detalhe?.reduce((sum, t) => sum + Number(t.area || 0), 0) || 0;
                    return totalArea > 0 ? (totalArea * 0.8).toFixed(2).replace('.', ',') : '6,26';
                  })()}
                </td>
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Total de Diesel Planejado</td>
                <td className="p-1 text-left font-mono font-bold">
                  {(() => {
                    const totalArea = selectedOS.talhoes_detalhe?.reduce((sum, t) => sum + Number(t.area || 0), 0) || 0;
                    const horas = totalArea > 0 ? totalArea * 0.8 : 6.26;
                    return (horas * 6.0).toFixed(2).replace('.', ',');
                  })()}
                </td>
              </tr>
              <tr className="border border-black">
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Data Inicial de Execução</td>
                <td className="p-1 border-r border-black text-center" colSpan="2">
                  {selectedOS.data_inicio_real ? new Date(selectedOS.data_inicio_real).toLocaleDateString('pt-BR') : '____/____/________'}
                </td>
                <td className="p-1 text-left">
                  <span className="font-bold text-slate-700">Data Final de Execução:</span> {selectedOS.data_fim_real ? new Date(selectedOS.data_fim_real).toLocaleDateString('pt-BR') : '____/____/________'}
                </td>
              </tr>
              <tr className="border border-black">
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Horímetro inicial</td>
                <td className="p-1 border-r border-black text-center" colSpan="2">
                  {selectedOS.apontamentos?.[0]?.maquinas?.[0]?.horimetro_inicial || '_________________'}
                </td>
                <td className="p-1 text-left">
                  <span className="font-bold text-slate-700">Horímetro final:</span> {selectedOS.apontamentos?.[selectedOS.apontamentos.length - 1]?.maquinas?.[0]?.horimetro_final || '_________________'}
                </td>
              </tr>
              <tr className="border border-black">
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Diesel Gasto</td>
                <td className="p-1 border-r border-black text-center font-mono font-bold" colSpan="2">
                  _________________ L
                </td>
                <td className="p-1 text-left">
                  <span className="font-bold text-slate-700">Velocidade Operacional (km/h):</span> 6,00
                </td>
              </tr>
              <tr className="border border-black">
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Capacidade Implemento</td>
                <td className="p-1 border-r border-black text-center font-bold">
                  0
                </td>
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Vazão kg ou L/ha</td>
                <td className="p-1 text-left font-bold">
                  0
                </td>
              </tr>
              <tr className="border border-black">
                <td className="bg-slate-100 p-1 font-bold border-r border-black">Quantidade de bomba/bags</td>
                <td className="p-1 text-left leading-normal font-mono text-[8px]" colSpan="3">
                  <div className="mb-0.5">
                    (____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)
                  </div>
                  <div>
                    (____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)(____)
                    <span className="float-right font-bold text-[9px] mr-2">Total Gasto: __________________________</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tabela de Produtos (Insumos) */}
          <table className="w-full border-collapse print-table border-t-0 -mt-px text-center">
            <thead>
              <tr className="border border-black bg-slate-100 font-bold">
                <th className="w-[12%] p-1 text-center border-r border-black">Ordem Pré-mistura</th>
                <th className="w-[30%] p-1 text-left border-r border-black">Produtos</th>
                <th className="w-[18%] p-1 text-center border-r border-black">Dose kg ou L/Tanque</th>
                <th className="w-[18%] p-1 text-left border-r border-black">Ativo</th>
                <th className="w-[11%] p-1 text-center border-r border-black">Carência</th>
                <th className="w-[11%] p-1 text-left">Alvo</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const maxRows = 11;
                const rows = [];
                const insumos = selectedOS.insumos || [];

                for (let i = 0; i < maxRows; i++) {
                  if (i < insumos.length) {
                    const ins = insumos[i];
                    const prodName = ins.produto_detalhe?.nome_comercial || 'Insumo';
                    const chemicalGroup = ins.produto_detalhe?.grupo_quimico_nome || ins.produto_detalhe?.classificacao_nome || '-';
                    const carencia = ins.produto_detalhe?.periodo_carencia !== null ? `${ins.produto_detalhe.periodo_carencia}` : '-';
                    const alvo = ins.produto_detalhe?.alvo || '-';
                    
                    rows.push(
                      <tr key={i} className="border border-black">
                        <td className="p-1 border-r border-black font-bold">{i + 1}º</td>
                        <td className="p-1 text-left border-r border-black font-bold truncate max-w-[200px]">{prodName}</td>
                        <td className="p-1 border-r border-black font-mono font-bold">{Number(ins.dose_planejada).toLocaleString('pt-BR')}</td>
                        <td className="p-1 text-left border-r border-black truncate max-w-[120px]">{chemicalGroup}</td>
                        <td className="p-1 border-r border-black font-bold">{carencia}</td>
                        <td className="p-1 text-left truncate max-w-[100px]">{alvo}</td>
                      </tr>
                    );
                  } else {
                    rows.push(
                      <tr key={i} className="border border-black h-5">
                        <td className="p-1 border-r border-black font-bold text-slate-400">{i + 1}º</td>
                        <td className="p-1 border-r border-black">&nbsp;</td>
                        <td className="p-1 border-r border-black">&nbsp;</td>
                        <td className="p-1 border-r border-black">&nbsp;</td>
                        <td className="p-1 border-r border-black">&nbsp;</td>
                        <td className="p-1">&nbsp;</td>
                      </tr>
                    );
                  }
                }
                return rows;
              })()}
            </tbody>
          </table>

          {/* Grade de Pontas, RPM e Marcha */}
          <table className="w-full border-collapse print-table border-t-0 -mt-px text-center">
            <thead>
              <tr className="border border-black bg-slate-100 font-bold">
                <th className="w-[33.3%] p-1 text-center border-r border-black">Pontas</th>
                <th className="w-[33.3%] p-1 text-center border-r border-black">RPM</th>
                <th className="w-[33.4%] p-1 text-center">Marcha</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const logsCount = 16;
                const rows = [];
                for (let i = 0; i < logsCount; i++) {
                  rows.push(
                    <tr key={i} className="border border-black">
                      <td className="border-r border-black p-1 text-[8px] font-bold text-slate-500 text-left">Data: ____/____/____</td>
                      <td className="border-r border-black p-1 text-[8px] font-bold text-slate-500 text-left">H. Inicial: ________________</td>
                      <td className="p-1 text-[8px] font-bold text-slate-500 text-left">H. Final: __________________</td>
                    </tr>
                  );
                }
                return rows;
              })()}
            </tbody>
          </table>

          {/* Rodapé e Assinaturas */}
          <div className="border border-black border-t-0 -mt-px p-2 text-left space-y-3">
            <div>
              <span className="font-bold text-[9px] text-slate-600 block">OBS:</span>
              <p className="text-[10px] text-slate-900 font-bold min-h-[40px] leading-tight">
                {selectedOS.observacao || 'Nenhuma observação informada.'}
              </p>
            </div>

            <div className="flex justify-around pt-8 pb-3 text-center text-[10px] font-bold">
              <div className="flex flex-col items-center">
                <div className="w-48 border-t border-black"></div>
                <span className="mt-1 text-slate-700">Operador</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-48 border-t border-black"></div>
                <span className="mt-1 text-slate-700">Responsável</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
