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

export const OrdensServico = () => {
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
  const [activeSubTab, setActiveSubTab] = useState('os');
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [gastosRateio, setGastosRateio] = useState([]);
  const [criteriosRateio, setCriteriosRateio] = useState([]);
  const [contasGerenciais, setContasGerenciais] = useState([]);

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

  const fetchAbastecimentos = useCallback(async () => {
    if (!safraAtiva || !fazendaAtiva) return;
    try {
      const list = await relatorioService.getAbastecimentos();
      const filtrados = list.filter(a => 
        (a.fazenda_id === fazendaAtiva.id || a.fazenda === fazendaAtiva.id) &&
        (a.safra_id === safraAtiva.id || a.safra === safraAtiva.id) &&
        a.ativo !== false
      );
      setAbastecimentos(filtrados);
    } catch (err) {
      console.error("Erro ao carregar abastecimentos", err);
    }
  }, [safraAtiva, fazendaAtiva]);

  const fetchGastosRateio = useCallback(async () => {
    if (!safraAtiva || !fazendaAtiva) return;
    try {
      const list = await relatorioService.getGastosRateio();
      const filtrados = list.filter(g => 
        (g.fazenda_id === fazendaAtiva.id || g.fazenda === fazendaAtiva.id) &&
        (g.safra_id === safraAtiva.id || g.safra === safraAtiva.id) &&
        g.ativo !== false
      );
      setGastosRateio(filtrados);
    } catch (err) {
      console.error("Erro ao carregar gastos de rateio", err);
    }
  }, [safraAtiva, fazendaAtiva]);

  const loadReferences = useCallback(async () => {
    try {
      const [resOps, resTalhoes, resProds, resMaquinas, resFuncs, resCriterios, resContas] = await Promise.all([
        api.get('/api/ref/tipos-operacao/'),
        api.get('/api/talhoes/'),
        api.get('/api/produtos/'),
        api.get('/api/maquinas/'),
        api.get('/api/funcionarios/'),
        api.get('/api/ref/criterios-rateio/'),
        api.get('/api/ref/contas-gerenciais/')
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
      setFuncionarios(filterByProprietario(resFuncs.data?.results || resFuncs.data || []));
      setProdutos(resProds.data?.results || resProds.data || []);
      setCriteriosRateio(resCriterios.data?.results || resCriterios.data || []);
      setContasGerenciais(resContas.data?.results || resContas.data || []);
    } catch (err) {
      console.error("Erro ao carregar referências de OS", err);
    }
  }, [fazendaAtiva, fazendas]);

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
    fetchAbastecimentos();
    fetchGastosRateio();
    loadReferences();
  }, [fetchOrdensServico, fetchAbastecimentos, fetchGastosRateio, loadReferences]);

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
      ) : (
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

            <form onSubmit={handleCreateOSReal} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="md:col-span-2">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Operação *</span>
                  <select
                    required
                    value={newOSForm.tipo_operacao}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, tipo_operacao: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  >
                    <option value="">Selecione...</option>
                    {tiposOperacao.map(op => (
                      <option key={op.id} value={op.id} className="bg-slate-900">{op.nome}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Data Início Planejada</span>
                  <input
                    type="date"
                    required
                    value={newOSForm.data_inicio_planejada}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, data_inicio_planejada: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  />
                </label>
              </div>
              
              <div>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Data Término Planejada</span>
                  <input
                    type="date"
                    required
                    value={newOSForm.data_fim_planejada}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, data_fim_planejada: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                  />
                </label>
              </div>

              {/* Seleção de Talhões */}
              <div className="md:col-span-2 space-y-2">
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
                        className={`rounded-lg px-2 py-1 text-xs font-bold transition-all cursor-pointer ${
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

              <div className="md:col-span-2">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Recomendações Operacionais</span>
                  <textarea
                    placeholder="Instruções para o tratorista/operador no campo..."
                    value={newOSForm.observacao}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setNewOSForm(prev => ({ ...prev, observacao: e.target.value.toUpperCase() }))}
                    rows={2}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none uppercase"
                  />
                </label>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md cursor-pointer"
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

              <label className="block space-y-1.5 border-t border-white/[0.06] pt-4">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Notas de Campo / Observações</span>
                <textarea
                  placeholder="Alguma intercorrência, quebra de máquina, chuva forte no dia..."
                  value={aptForm.observacao}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setAptForm(prev => ({ ...prev, observacao: e.target.value.toUpperCase() }))}
                  rows={2}
                  className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none uppercase"
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

      {/* MODAL: Novo Abastecimento */}
      {showNewAbtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-slate-900 p-6 space-y-4 my-8 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Fuel className="w-4 h-4 text-emerald-500" />
                <span>Registrar Abastecimento</span>
              </h3>
              <button 
                onClick={() => setShowNewAbtModal(false)} 
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAbastecimento} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              
              <div>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Máquina *</span>
                  <select
                    required
                    value={abtForm.maquina}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setAbtForm(prev => ({ ...prev, maquina: e.target.value }))}
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
                    onChange={(e) => setAbtForm(prev => ({ ...prev, combustivel: e.target.value }))}
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
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Observações / Notas</span>
                  <textarea
                    placeholder="Observações do abastecimento..."
                    value={abtForm.observacao}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setAbtForm(prev => ({ ...prev, observacao: e.target.value.toUpperCase() }))}
                    rows={2}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none uppercase"
                  />
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewAbtModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer"
                  tabIndex={-1}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/25 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-white/[0.08] bg-slate-900 p-6 space-y-4 my-8 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-500" />
                <span>Lançar Gasto e Rateio Realizado</span>
              </h3>
              <button 
                onClick={() => setShowNewRateioModal(false)} 
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGastoRateio} className="space-y-4 text-left">
              
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

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewRateioModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer"
                  tabIndex={-1}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/25 cursor-pointer"
                >
                  {saving ? 'Gravando...' : 'Salvar Rateio'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
