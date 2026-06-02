import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  BadgeInfo,
  Briefcase,
  Building2,
  CalendarRange,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
  Grid3X3,
  Package,
  Pencil,
  Plus,
  Search,
  Tractor,
  Trash2,
  UserCircle,
  Users,
  WalletCards,
  Warehouse,
} from 'lucide-react';
import api from '../services/api';

const emptyForms = {
  proprietarios: {
    nome: '',
    documento: '',
    email: '',
    celular: '',
    cep: '',
    endereco: '',
    bairro: '',
    cidade: '',
  },
  fazendas: { proprietario: '', nome: '', sigla: '', cnpj_ou_produtor: '', endereco: '', telefone: '', cidade: '', estado: '' },
  safras: { fazenda: '', nome: '', data_inicio: '', data_fim: '', ativa: false },
  talhoes: {
    fazenda: '',
    codigo: '',
    nome: '',
    area: '',
    tipo_irrigacao: '',
    cultura: '',
    espacamento_rua: '',
    espacamento_planta: '',
    estande: '',
    numero_plantas: '',
    material_genetico: '',
    resistencia_ferrugem: '',
    status_cultivo: '',
  },
  maquinas: {
    fazenda: '',
    codigo: '',
    descricao: '',
    marca: '',
    modelo: '',
    ano_fabricacao: '',
    tipo: '',
  },
  funcionarios: {
    fazenda: '',
    nome: '',
    cpf: '',
    cargo: '',
    grupo_trabalhador: '',
    email: '',
    criar_usuario: false,
  },
  terceirizados: { fazenda: '', nome: '', documento: '' },
  turmas: { fazenda: '', nome: '', responsavel: '' },
  produtos: {
    codigo: '',
    nome_comercial: '',
    unidade: '',
    classificacao: '',
    grupo_quimico: '',
    concentracao: '',
    periodo_carencia: '',
    alvo: '',
  },
  estoque: {
    fazenda: '',
    safra: '',
    produto: '',
    tipo_movimento: 'ENTRADA',
    quantidade: '',
    valor_unitario: '',
    data_movimento: new Date().toISOString().slice(0, 10),
    documento_referencia: '',
    origem_transferencia: '',
    destino_transferencia: '',
    observacao: '',
  },
  usuarios: { username: '', email: '', first_name: '', last_name: '', password: '', perfil_id: '', fazendas_permitidas_ids: [] },
};

const endpoints = {
  proprietarios: '/api/proprietarios/',
  fazendas: '/api/fazendas/',
  safras: '/api/safras/',
  talhoes: '/api/talhoes/',
  maquinas: '/api/maquinas/',
  funcionarios: '/api/funcionarios/',
  terceirizados: '/api/terceirizados/',
  turmas: '/api/turmas-terceirizadas/',
  produtos: '/api/produtos/',
  estoque: '/api/estoque/movimentos/',
  usuarios: '/api/accounts/usuarios/',
};

const refEndpoints = {
  culturas: '/api/ref/culturas/',
  tiposItem: '/api/ref/tipos-item/',
  tiposIrrigacao: '/api/ref/tipos-irrigacao/',
  resistenciasFerrugem: '/api/ref/resistencias-ferrugem/',
  statusCultivo: '/api/ref/status-cultivo/',
  gruposTrabalhador: '/api/ref/grupos-trabalhador/',
  classificacoesProduto: '/api/ref/classificacoes-produto/',
  gruposQuimico: '/api/ref/grupos-quimico/',
  unidadesMedida: '/api/ref/unidades-medida/',
};

const fallbackRefs = {
  culturas: [{ id: 1, nome: 'Café' }],
  tiposItem: [{ id: 1, nome: 'Máquina' }],
  tiposIrrigacao: [{ id: 1, nome: 'Não Irrigado' }],
  resistenciasFerrugem: [{ id: 1, nome: 'Não Informado' }],
  statusCultivo: [{ id: 1, nome: 'Em Produção' }],
  gruposTrabalhador: [{ id: 1, nome: 'Mão de Obra Própria' }],
  classificacoesProduto: [{ id: 1, nome: 'Outros' }],
  gruposQuimico: [{ id: 1, nome: 'Outros' }],
  unidadesMedida: [{ id: 1, sigla: 'kg', nome: 'Quilograma' }],
};

const menuSections = [
  {
    id: 'cadastros',
    label: 'Cadastros',
    icon: ClipboardList,
    description: 'Base estrutural',
    items: [
      { id: 'proprietarios', label: 'Proprietários', icon: UserCircle },
      { id: 'fazendas', label: 'Fazendas', icon: Building2 },
      { id: 'safras', label: 'Safras', icon: CalendarRange },
      { id: 'talhoes', label: 'Talhões', icon: Grid3X3 },
      { id: 'maquinas', label: 'Máquinas', icon: Tractor },
    ],
  },
  {
    id: 'operacional',
    label: 'Operacional',
    icon: Tractor,
    description: 'Planejamento e execução',
    items: [
      { id: 'planejamentos', label: 'Planejamentos', icon: CalendarRange },
      { id: 'ordens_servico', label: 'Ordens de Serviço', icon: ClipboardList },
      { id: 'apontamentos', label: 'Apontamentos', icon: Grid3X3 },
    ],
  },
  {
    id: 'suprimentos',
    label: 'Suprimentos',
    icon: Warehouse,
    description: 'Produtos e estoque',
    items: [
      { id: 'produtos', label: 'Produtos e Insumos', icon: Package },
      { id: 'estoque', label: 'Movimentações', icon: Warehouse },
      { id: 'compras', label: 'Pedidos de Compra', icon: ClipboardList },
    ],
  },
  {
    id: 'financeiro_rh',
    label: 'Financeiro & RH',
    icon: WalletCards,
    description: 'Pessoas e contas',
    items: [
      { id: 'funcionarios', label: 'Funcionários', icon: Users },
      { id: 'terceirizados', label: 'Terceirizados', icon: Briefcase },
      { id: 'turmas', label: 'Turmas', icon: Users },
      { id: 'contas_pagar', label: 'Contas a Pagar', icon: WalletCards },
      { id: 'contas_receber', label: 'Contas a Receber', icon: WalletCards },
    ],
  },
];

const menuItems = menuSections.flatMap((section) => section.items);

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getFallbackDB = () => {
  try {
    return JSON.parse(localStorage.getItem('inovaceifa_db') || '{}');
  } catch {
    return {};
  }
};

const fieldId = (item, base) => item?.[base] ?? item?.[`${base}_id`];
const sameId = (left, right) => String(left ?? '') === String(right ?? '');
const money = (value) => Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const Cadastros = ({ currentSafraId, setActiveView }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('proprietarios');
  const [expandedSection, setExpandedSection] = useState('cadastros');
  const [records, setRecords] = useState({
    proprietarios: [],
    fazendas: [],
    safras: [],
    talhoes: [],
    maquinas: [],
    funcionarios: [],
    terceirizados: [],
    turmas: [],
    produtos: [],
    estoque: [],
    usuarios: [],
    perfis: [],
  });
  const [refs, setRefs] = useState(Object.fromEntries(Object.keys(refEndpoints).map((key) => [key, []])));
  const [forms, setForms] = useState(emptyForms);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Novas variáveis de estado para Modal e Filtro de Soft Delete
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);

  const currentForm = forms[activeTab];

  const isSuperUsuario = useMemo(() => {
    return user && (
      user.is_superuser ||
      user.perfil_id === 1 ||
      user.cargo?.toLowerCase().includes('gerente') ||
      user.cargo?.toLowerCase().includes('super') ||
      user.cargo?.toLowerCase().includes('superusuário')
    );
  }, [user]);

  const filteredMenuSections = useMemo(() => {
    return menuSections.map(section => {
      if (section.id === 'cadastros') {
        const items = [...section.items];
        if (isSuperUsuario && !items.some(x => x.id === 'usuarios')) {
          items.push({ id: 'usuarios', label: 'Usuários', icon: UserCircle });
        }
        return { ...section, items };
      }
      return section;
    });
  }, [isSuperUsuario]);

  const activeLabel = useMemo(() => {
    const allItems = filteredMenuSections.flatMap((section) => section.items);
    return allItems.find((tab) => tab.id === activeTab)?.label || 'Cadastros';
  }, [filteredMenuSections, activeTab]);

  const fazendasOptions = useMemo(
    () => records.fazendas.map((fazenda) => ({ value: fazenda.id, label: `${fazenda.nome}${fazenda.sigla ? ` (${fazenda.sigla})` : ''}` })),
    [records.fazendas],
  );

  const safrasOptions = useMemo(
    () => records.safras.map((safra) => ({ value: safra.id, label: `${safra.nome}${safra.ativa ? ' - ativa' : ''}` })),
    [records.safras],
  );

  const refOptions = (key, labelGetter = (item) => item.nome) =>
    refs[key].map((item) => ({ value: item.id, label: labelGetter(item) }));

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

  const fetchList = async (url, fallbackKey) => {
    try {
      // Forçamos a API a sempre buscar registros ativos e inativos juntos para filtragem reativa no front
      const response = await api.get(url + '?incluir_inativos=true');
      return asList(response.data);
    } catch {
      if (fallbackRefs[fallbackKey]) return fallbackRefs[fallbackKey];
      const fallbackDB = getFallbackDB();
      return asList(fallbackDB[fallbackKey]);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allowedEndpoints = { ...endpoints };
      if (!isSuperUsuario) {
        delete allowedEndpoints.usuarios;
      }

      const [loadedRecords, loadedRefs] = await Promise.all([
        Promise.all(Object.entries(allowedEndpoints).map(async ([key, url]) => [key, await fetchList(url, key)])),
        Promise.all(Object.entries(refEndpoints).map(async ([key, url]) => [key, await fetchList(url, key)])),
      ]);

      let perfisList = [];
      if (isSuperUsuario) {
        try {
          const resp = await api.get('/api/accounts/perfis/');
          perfisList = asList(resp.data);
        } catch (err) {
          console.error("Erro ao carregar perfis:", err);
        }
      }

      setRecords((prev) => ({
        ...prev,
        ...Object.fromEntries(loadedRecords),
        ...(isSuperUsuario ? { perfis: perfisList } : {}),
      }));
      setRefs(Object.fromEntries(loadedRefs));
    } catch (err) {
      console.error(err);
      showAlert('error', 'Não foi possível carregar os cadastros.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const patchForm = (key, value) => {
    setForms((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [key]: value },
    }));
  };

  const resetForm = (tab = activeTab) => {
    setForms((prev) => ({ ...prev, [tab]: emptyForms[tab] }));
  };

  const cleanPayload = (form) => {
    const payload = {};
    Object.entries(form).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) return;
      payload[key] = value;
    });
    return payload;
  };

  const fillRequiredRefs = (payload) => {
    if (activeTab === 'talhoes') {
      payload.tipo_irrigacao ||= refs.tiposIrrigacao[0]?.id;
      payload.cultura ||= refs.culturas[0]?.id;
    }
    if (activeTab === 'maquinas') payload.tipo ||= refs.tiposItem.find((item) => item.nome?.toLowerCase().includes('máquina'))?.id || refs.tiposItem[0]?.id;
    if (activeTab === 'funcionarios') payload.grupo_trabalhador ||= refs.gruposTrabalhador[0]?.id;
    if (activeTab === 'produtos') {
      payload.unidade ||= refs.unidadesMedida[0]?.id;
      payload.classificacao ||= refs.classificacoesProduto[0]?.id;
    }
    return payload;
  };

  const validatePayload = (payload) => {
    const required = {
      proprietarios: ['nome'],
      fazendas: ['proprietario', 'nome', 'sigla'],
      safras: ['fazenda', 'nome', 'data_inicio', 'data_fim'],
      talhoes: ['fazenda', 'codigo', 'nome', 'area', 'tipo_irrigacao', 'cultura'],
      maquinas: ['fazenda', 'codigo', 'descricao', 'tipo'],
      funcionarios: ['fazenda', 'nome', 'grupo_trabalhador'],
      terceirizados: ['fazenda', 'nome'],
      turmas: ['fazenda', 'nome'],
      produtos: ['nome_comercial', 'unidade', 'classificacao'],
      estoque: ['fazenda', 'safra', 'produto', 'tipo_movimento', 'quantidade', 'data_movimento'],
      usuarios: ['username', 'email', 'first_name', 'perfil_id'],
    };

    const missing = required[activeTab].filter((key) => !payload[key]);
    if (missing.length) {
      showAlert('error', `Preencha os campos obrigatórios: ${missing.join(', ')}.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    let payload = fillRequiredRefs(cleanPayload(currentForm));

    if (activeTab === 'estoque') {
      payload.safra = payload.safra || currentSafraId;
      payload.valor_total = Number(payload.quantidade || 0) * Number(payload.valor_unitario || 0);
    }

    if (!validatePayload(payload)) return;

    setSaving(true);
    try {
      if (editingId) {
        // Modo Edição
        await api.put(`${endpoints[activeTab]}${editingId}/`, payload);
        showAlert('success', 'Registro atualizado com sucesso.');
      } else {
        // Modo Criação
        const response = await api.post(endpoints[activeTab], payload);
        showAlert('success', response.data?.warning || 'Registro criado com sucesso.');
      }
      resetForm(activeTab);
      setShowModal(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      // Fallback em banco local storage
      try {
        const db = getFallbackDB();
        if (!db[activeTab]) db[activeTab] = [];
        
        if (editingId) {
          const idx = db[activeTab].findIndex(x => String(x.id) === String(editingId));
          if (idx !== -1) {
            db[activeTab][idx] = { ...db[activeTab][idx], ...payload };
          }
        } else {
          const newId = db[activeTab].length > 0 ? Math.max(...db[activeTab].map(x => x.id)) + 1 : 1;
          db[activeTab].push({ id: newId, ativo: true, ...payload });
        }
        localStorage.setItem('inovaceifa_db', JSON.stringify(db));
        showAlert('success', 'Salvo offline com sucesso.');
        resetForm(activeTab);
        setShowModal(false);
        setEditingId(null);
        await loadData();
      } catch (localErr) {
        const detail = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0];
        showAlert('error', detail || 'Erro ao salvar. Verifique contexto e campos.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Alteração de estado ativo/inativo (Soft Delete & Reativação)
  const handleToggleAtivo = async (item) => {
    const novoEstado = !item.ativo;
    const confirmMsg = novoEstado 
      ? `Deseja REATIVAR este registro?` 
      : `Deseja DESATIVAR (soft delete) este registro?`;
      
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`${endpoints[activeTab]}${item.id}/`, { ativo: novoEstado });
      showAlert('success', novoEstado ? 'Registro reativado!' : 'Registro inativado com sucesso.');
      await loadData();
    } catch (err) {
      console.error(err);
      // Fallback offline
      try {
        const db = getFallbackDB();
        const list = db[activeTab] || [];
        const found = list.find(x => String(x.id) === String(item.id));
        if (found) {
          found.ativo = novoEstado;
          localStorage.setItem('inovaceifa_db', JSON.stringify(db));
          showAlert('success', novoEstado ? 'Registro reativado offline!' : 'Registro inativado offline.');
          await loadData();
        }
      } catch (localErr) {
        showAlert('error', 'Falha ao processar alteração de status.');
      }
    }
  };

  // Preenche formulário e abre janela modal
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    const formFields = { ...emptyForms[activeTab] };
    
    Object.keys(formFields).forEach(key => {
      if (key === 'fazenda' && (item.fazenda_id || item.fazenda)) {
        formFields.fazenda = item.fazenda_id || item.fazenda;
      } else if (key === 'proprietario' && (item.proprietario_id || item.proprietario)) {
        formFields.proprietario = item.proprietario_id || item.proprietario;
      } else if (key === 'safra' && (item.safra_id || item.safra)) {
        formFields.safra = item.safra_id || item.safra;
      } else if (key === 'produto' && (item.produto_id || item.produto)) {
        formFields.produto = item.produto_id || item.produto;
      } else if (key === 'tipo_irrigacao' && (item.tipo_irrigacao_id || item.tipo_irrigacao)) {
        formFields.tipo_irrigacao = item.tipo_irrigacao_id || item.tipo_irrigacao;
      } else if (key === 'cultura' && (item.cultura_id || item.cultura)) {
        formFields.cultura = item.cultura_id || item.cultura;
      } else if (key === 'status_cultivo' && (item.status_cultivo_id || item.status_cultivo)) {
        formFields.status_cultivo = item.status_cultivo_id || item.status_cultivo;
      } else if (key === 'resistencia_ferrugem' && (item.resistencia_ferrugem_id || item.resistencia_ferrugem)) {
        formFields.resistencia_ferrugem = item.resistencia_ferrugem_id || item.resistencia_ferrugem;
      } else if (key === 'grupo_trabalhador' && (item.grupo_trabalhador_id || item.grupo_trabalhador)) {
        formFields.grupo_trabalhador = item.grupo_trabalhador_id || item.grupo_trabalhador;
      } else if (key === 'unidade' && (item.unidade_id || item.unidade)) {
        formFields.unidade = item.unidade_id || item.unidade;
      } else if (key === 'classificacao' && (item.classificacao_id || item.classificacao)) {
        formFields.classificacao = item.classificacao_id || item.classificacao;
      } else if (key === 'grupo_quimico' && (item.grupo_quimico_id || item.grupo_quimico)) {
        formFields.grupo_quimico = item.grupo_quimico_id || item.grupo_quimico;
      } else if (item[key] !== undefined) {
        formFields[key] = item[key];
      }
    });

    setForms((prev) => ({
      ...prev,
      [activeTab]: formFields
    }));
    setShowModal(true);
  };

  const filteredRows = (key, getText) => {
    const query = searchQuery.trim().toLowerCase();
    let baseList = records[key] || [];

    // Filtrar Ativos vs Inativos de acordo com o filtro do botão
    baseList = baseList.filter(item => {
      const isItemActive = item.ativo !== false;
      return showInactiveOnly ? !isItemActive : isItemActive;
    });

    if (!query) return baseList;
    return baseList.filter((item) => getText(item).toLowerCase().includes(query));
  };

  const lookup = (collection, id, fallback = '-') => collection.find((item) => sameId(item.id, id))?.nome || fallback;

  const InputField = ({ label, value, onChange, type = 'text', required = false, placeholder = '' }) => (
    <label className="block space-y-1.5 text-left">
      <span className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">{label}{required ? ' *' : ''}</span>
      <input
        type={type}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white placeholder-slate-450 outline-none transition-all"
      />
    </label>
  );

  const SelectField = ({ label, value, onChange, options, required = false, defaultOption = 'Selecione...' }) => (
    <label className="block space-y-1.5 text-left">
      <span className="block text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">{label}{required ? ' *' : ''}</span>
      <select
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-white outline-none transition-all"
      >
        <option value="" className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500">{defaultOption}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{option.label}</option>
        ))}
      </select>
    </label>
  );

  const renderFormFields = () => {
    if (activeTab === 'proprietarios') {
      return (
        <>
          <InputField required label="Nome / Razão Social" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          <InputField label="CPF / CNPJ" value={currentForm.documento} onChange={(value) => patchForm('documento', value)} />
          <InputField label="E-mail" type="email" value={currentForm.email} onChange={(value) => patchForm('email', value)} />
          <InputField label="Celular" value={currentForm.celular} onChange={(value) => patchForm('celular', value)} />
          <InputField label="CEP" value={currentForm.cep} onChange={(value) => patchForm('cep', value)} />
          <InputField label="Endereço" value={currentForm.endereco} onChange={(value) => patchForm('endereco', value)} />
          <InputField label="Bairro" value={currentForm.bairro} onChange={(value) => patchForm('bairro', value)} />
          <InputField label="Cidade / UF" value={currentForm.cidade} onChange={(value) => patchForm('cidade', value)} />
        </>
      );
    }

    if (activeTab === 'fazendas') {
      return (
        <>
          <SelectField required label="Proprietário" value={currentForm.proprietario} onChange={(value) => patchForm('proprietario', value)} options={records.proprietarios.map((item) => ({ value: item.id, label: item.nome }))} />
          <InputField required label="Nome da Fazenda" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          <InputField required label="Sigla" value={currentForm.sigla} onChange={(value) => patchForm('sigla', value.toUpperCase())} placeholder="BR" />
          <InputField label="CNPJ / Código Produtor Rural" value={currentForm.cnpj_ou_produtor} onChange={(value) => patchForm('cnpj_ou_produtor', value)} />
          <InputField label="Endereço" value={currentForm.endereco} onChange={(value) => patchForm('endereco', value)} />
          <InputField label="Telefone" value={currentForm.telefone} onChange={(value) => patchForm('telefone', value)} />
          <InputField label="Cidade" value={currentForm.cidade} onChange={(value) => patchForm('cidade', value)} />
          <InputField label="Estado" value={currentForm.estado} onChange={(value) => patchForm('estado', value)} placeholder="Ex: MG" />
        </>
      );
    }

    if (activeTab === 'safras') {
      return (
        <>
          <SelectField required label="Fazenda" value={currentForm.fazenda} onChange={(value) => patchForm('fazenda', value)} options={fazendasOptions} />
          <InputField required label="Nome da Safra" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} placeholder="2024/2025" />
          <InputField required label="Data Início" type="date" value={currentForm.data_inicio} onChange={(value) => patchForm('data_inicio', value)} />
          <InputField required label="Data Fim" type="date" value={currentForm.data_fim} onChange={(value) => patchForm('data_fim', value)} />
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={currentForm.ativa || false} onChange={(event) => patchForm('ativa', event.target.checked)} className="h-4 w-4 rounded border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/50 text-emerald-500" />
            Safra ativa desta fazenda
          </label>
        </>
      );
    }

    if (activeTab === 'talhoes') {
      return (
        <>
          <SelectField required label="Fazenda" value={currentForm.fazenda} onChange={(value) => patchForm('fazenda', value)} options={fazendasOptions} />
          <InputField required label="Código" value={currentForm.codigo} onChange={(value) => patchForm('codigo', value)} />
          <InputField required label="Nome do Talhão" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          <InputField required label="Área (ha)" type="number" value={currentForm.area} onChange={(value) => patchForm('area', value)} />
          <SelectField required label="Irrigação" value={currentForm.tipo_irrigacao} onChange={(value) => patchForm('tipo_irrigacao', value)} options={refOptions('tiposIrrigacao')} />
          <SelectField required label="Cultura" value={currentForm.cultura} onChange={(value) => patchForm('cultura', value)} options={refOptions('culturas')} />
          <SelectField label="Status Cultivo" value={currentForm.status_cultivo} onChange={(value) => patchForm('status_cultivo', value)} options={refOptions('statusCultivo')} />
          <SelectField label="Resistência Ferrugem" value={currentForm.resistencia_ferrugem} onChange={(value) => patchForm('resistencia_ferrugem', value)} options={refOptions('resistenciasFerrugem')} />
          <InputField label="Material Genético" value={currentForm.material_genetico} onChange={(value) => patchForm('material_genetico', value)} />
        </>
      );
    }

    if (activeTab === 'maquinas') {
      return (
        <>
          <SelectField required label="Fazenda" value={currentForm.fazenda} onChange={(value) => patchForm('fazenda', value)} options={fazendasOptions} />
          <InputField required label="Código / Frota" value={currentForm.codigo} onChange={(value) => patchForm('codigo', value)} />
          <InputField required label="Descrição" value={currentForm.descricao} onChange={(value) => patchForm('descricao', value)} />
          <InputField label="Marca" value={currentForm.marca} onChange={(value) => patchForm('marca', value)} />
          <InputField label="Modelo" value={currentForm.modelo} onChange={(value) => patchForm('modelo', value)} />
          <InputField label="Ano Fabricação" type="number" value={currentForm.ano_fabricacao} onChange={(value) => patchForm('ano_fabricacao', value)} />
          <SelectField required label="Tipo" value={currentForm.tipo} onChange={(value) => patchForm('tipo', value)} options={refOptions('tiposItem')} />
        </>
      );
    }

    if (activeTab === 'funcionarios') {
      return (
        <>
          <SelectField required label="Fazenda" value={currentForm.fazenda} onChange={(value) => patchForm('fazenda', value)} options={fazendasOptions} />
          <InputField required label="Nome" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          <InputField label="CPF" value={currentForm.cpf} onChange={(value) => patchForm('cpf', value)} />
          <InputField label="Cargo" value={currentForm.cargo} onChange={(value) => patchForm('cargo', value)} />
          <SelectField required label="Grupo Trabalhador" value={currentForm.grupo_trabalhador} onChange={(value) => patchForm('grupo_trabalhador', value)} options={refOptions('gruposTrabalhador')} />
          <InputField label="E-mail" type="email" value={currentForm.email} onChange={(value) => patchForm('email', value)} />
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={currentForm.criar_usuario || false} onChange={(event) => patchForm('criar_usuario', event.target.checked)} className="h-4 w-4 rounded border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/50 text-emerald-500" />
            Criar usuário para este funcionário
          </label>
        </>
      );
    }

    if (activeTab === 'terceirizados') {
      return (
        <>
          <SelectField required label="Fazenda" value={currentForm.fazenda} onChange={(value) => patchForm('fazenda', value)} options={fazendasOptions} />
          <InputField required label="Nome / Empresa" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          <InputField label="CPF / CNPJ" value={currentForm.documento} onChange={(value) => patchForm('documento', value)} />
        </>
      );
    }

    if (activeTab === 'turmas') {
      return (
        <>
          <SelectField required label="Fazenda" value={currentForm.fazenda} onChange={(value) => patchForm('fazenda', value)} options={fazendasOptions} />
          <InputField required label="Nome da Turma" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          <InputField label="Responsável" value={currentForm.responsavel} onChange={(value) => patchForm('responsavel', value)} />
        </>
      );
    }

    if (activeTab === 'produtos') {
      return (
        <>
          <InputField label="Código" value={currentForm.codigo} onChange={(value) => patchForm('codigo', value)} />
          <InputField required label="Nome Comercial" value={currentForm.nome_comercial} onChange={(value) => patchForm('nome_comercial', value)} />
          <SelectField required label="Unidade" value={currentForm.unidade} onChange={(value) => patchForm('unidade', value)} options={refOptions('unidadesMedida', (item) => `${item.sigla} - ${item.nome}`)} />
          <SelectField required label="Classificação" value={currentForm.classificacao} onChange={(value) => patchForm('classificacao', value)} options={refOptions('classificacoesProduto')} />
          <SelectField label="Grupo Químico" value={currentForm.grupo_quimico} onChange={(value) => patchForm('grupo_quimico', value)} options={refOptions('gruposQuimico')} />
          <InputField label="Concentração" value={currentForm.concentracao} onChange={(value) => patchForm('concentracao', value)} />
          <InputField label="Período de Carência (dias)" type="number" value={currentForm.periodo_carencia} onChange={(value) => patchForm('periodo_carencia', value)} />
          <InputField label="Alvo" value={currentForm.alvo} onChange={(value) => patchForm('alvo', value)} />
        </>
      );
    }

    if (activeTab === 'usuarios') {
      return (
        <>
          <InputField required label="Nome de Usuário" value={currentForm.username} onChange={(value) => patchForm('username', value)} placeholder="Ex: joao.silva" />
          <InputField required label="E-mail" type="email" value={currentForm.email} onChange={(value) => patchForm('email', value)} placeholder="Ex: joao@empresa.com" />
          <InputField required label="Primeiro Nome" value={currentForm.first_name} onChange={(value) => patchForm('first_name', value)} />
          <InputField required label="Sobrenome" value={currentForm.last_name} onChange={(value) => patchForm('last_name', value)} />
          <InputField label="Senha" type="password" value={currentForm.password} onChange={(value) => patchForm('password', value)} placeholder={editingId ? "Deixe em branco para não alterar" : "Senha do usuário (padrão: 12345)"} />
          <SelectField required label="Perfil / Cargo" value={currentForm.perfil_id} onChange={(value) => patchForm('perfil_id', value)} options={(records.perfis || []).map((p) => ({ value: p.id, label: p.nome }))} />
          
          <div className="block space-y-1.5 text-left">
            <span className="block text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">Fazendas Permitidas</span>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-3 border border-slate-200 dark:border-white/[0.08] rounded-xl bg-slate-50/50 dark:bg-slate-950/40">
              {records.fazendas.map((f) => {
                const isChecked = (currentForm.fazendas_permitidas_ids || []).includes(f.id);
                return (
                  <label key={f.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const currentList = currentForm.fazendas_permitidas_ids || [];
                        const newList = e.target.checked
                          ? [...currentList, f.id]
                          : currentList.filter(id => id !== f.id);
                        patchForm('fazendas_permitidas_ids', newList);
                      }}
                      className="h-3.5 w-3.5 rounded border-slate-200 bg-slate-50 text-emerald-500"
                    />
                    <span className="truncate">{f.nome}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <SelectField required label="Fazenda" value={currentForm.fazenda} onChange={(value) => patchForm('fazenda', value)} options={fazendasOptions} />
        <SelectField required label="Safra" value={currentForm.safra} onChange={(value) => patchForm('safra', value)} options={safrasOptions} />
        <SelectField required label="Produto" value={currentForm.produto} onChange={(value) => patchForm('produto', value)} options={records.produtos.map((item) => ({ value: item.id, label: item.nome_comercial }))} />
        <SelectField required label="Tipo Movimento" value={currentForm.tipo_movimento} onChange={(value) => patchForm('tipo_movimento', value)} options={[
          { value: 'ENTRADA', label: 'Entrada' },
          { value: 'SAIDA', label: 'Saída' },
          { value: 'AJUSTE', label: 'Ajuste' },
          { value: 'TRANSFERENCIA', label: 'Transferência' },
        ]} />
        <InputField required label="Quantidade" type="number" value={currentForm.quantidade} onChange={(value) => patchForm('quantidade', value)} />
        <InputField label="Valor Unitário" type="number" value={currentForm.valor_unitario} onChange={(value) => patchForm('valor_unitario', value)} />
        <InputField required label="Data Movimento" type="date" value={currentForm.data_movimento} onChange={(value) => patchForm('data_movimento', value)} />
        <InputField label="Documento" value={currentForm.documento_referencia} onChange={(value) => patchForm('documento_referencia', value)} />
        {currentForm.tipo_movimento === 'TRANSFERENCIA' && (
          <>
            <SelectField label="Origem" value={currentForm.origem_transferencia} onChange={(value) => patchForm('origem_transferencia', value)} options={fazendasOptions} />
            <SelectField label="Destino" value={currentForm.destino_transferencia} onChange={(value) => patchForm('destino_transferencia', value)} options={fazendasOptions} />
          </>
        )}
      </>
    );
  };

  const renderRows = () => {
    if (activeTab === 'proprietarios') {
      return filteredRows('proprietarios', (item) => `${item.nome} ${item.documento || ''} ${item.cidade || ''}`).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.nome}</p>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">{item.email || 'Sem e-mail'}</p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300 font-mono">{item.documento || '-'}</td>
          <td className="py-3 px-5 text-right text-[10px] text-slate-600 dark:text-slate-300">{item.cidade || '-'}</td>
          <td className="py-3 px-5 text-center">
            <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
              {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          </td>
        </tr>
      ));
    }

    if (activeTab === 'fazendas') {
      return filteredRows('fazendas', (item) => `${item.nome} ${item.sigla || ''} ${item.cnpj_ou_produtor || ''} ${item.cidade || ''}`).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.nome}</p>
            <div className="flex flex-wrap gap-x-2 text-[10px] text-slate-455 dark:text-slate-500">
              <span>Sigla: {item.sigla || '-'}</span>
              {item.cnpj_ou_produtor && <span>• CNPJ/Produtor: {item.cnpj_ou_produtor}</span>}
            </div>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-650 dark:text-slate-300">
            <p className="font-semibold">{lookup(records.proprietarios, fieldId(item, 'proprietario'))}</p>
            {(item.cidade || item.estado) && (
              <p className="text-[9px] text-slate-450 dark:text-slate-400 mt-0.5">{[item.cidade, item.estado].filter(Boolean).join(' - ')}</p>
            )}
          </td>
          <td className="py-3 px-5 text-right text-[10px] text-slate-600 dark:text-slate-400">
            <p className="font-medium text-slate-700 dark:text-slate-300">{item.telefone || 'Sem telefone'}</p>
            {item.endereco && <p className="text-[9px] text-slate-450 dark:text-slate-500 mt-0.5">{item.endereco}</p>}
          </td>
          <td className="py-3 px-5 text-center">
            <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
              {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          </td>
        </tr>
      ));
    }

    if (activeTab === 'safras') {
      return filteredRows('safras', (item) => item.nome).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.nome}</p>
            <p className="text-[10px] text-slate-455 dark:text-slate-500">{lookup(records.fazendas, fieldId(item, 'fazenda'))}</p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">{item.data_inicio} até {item.data_fim}</td>
          <td className="py-3 px-5 text-right text-[10px] font-bold text-emerald-500">{item.ativa ? 'Safra Ativa' : 'Inativa/Outra'}</td>
          <td className="py-3 px-5 text-center">
            <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
              {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          </td>
        </tr>
      ));
    }

    if (activeTab === 'talhoes') {
      return filteredRows('talhoes', (item) => `${item.codigo} ${item.nome}`).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.codigo} - {item.nome}</p>
            <p className="text-[10px] text-slate-455 dark:text-slate-500">{lookup(records.fazendas, fieldId(item, 'fazenda'))}</p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">{item.cultura_nome || 'Café'}</td>
          <td className="py-3 px-5 text-right text-xs font-bold text-teal-600 dark:text-teal-400">{Number(item.area || 0).toLocaleString('pt-BR')} ha</td>
          <td className="py-3 px-5 text-center">
            <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
              {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          </td>
        </tr>
      ));
    }

    if (activeTab === 'maquinas') {
      return filteredRows('maquinas', (item) => `${item.codigo} ${item.descricao}`).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.codigo} - {item.descricao}</p>
            <p className="text-[10px] text-slate-455 dark:text-slate-500">{item.marca || '-'} {item.modelo || ''}</p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">{lookup(records.fazendas, fieldId(item, 'fazenda'))}</td>
          <td className="py-3 px-5 text-right text-[10px] text-slate-600 dark:text-slate-455">{item.tipo_nome || 'Trator/Máquina'}</td>
          <td className="py-3 px-5 text-center">
            <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
              {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          </td>
        </tr>
      ));
    }

    if (activeTab === 'funcionarios') {
      return filteredRows('funcionarios', (item) => `${item.nome} ${item.cargo || ''}`).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.nome}</p>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[10px] text-slate-455 dark:text-slate-500">CPF: {item.cpf || 'Sem CPF'}</span>
              {item.email && (
                <span className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">{item.email}</span>
              )}
            </div>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">
            <div>{item.cargo || '-'}</div>
            {item.criar_usuario && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 text-[8px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-wider">
                Usuário do Sistema
              </span>
            )}
          </td>
          <td className="py-3 px-5 text-right text-[10px] text-slate-600 dark:text-slate-455">{item.grupo_trabalhador_nome || 'Trabalhador Regular'}</td>
          <td className="py-3 px-5 text-center">
            <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
              {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          </td>
        </tr>
      ));
    }

    if (activeTab === 'terceirizados') {
      return filteredRows('terceirizados', (item) => `${item.nome} ${item.documento || ''}`).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.nome}</p>
            <p className="text-[10px] text-slate-455 dark:text-slate-500">{lookup(records.fazendas, fieldId(item, 'fazenda'))}</p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">{item.documento || '-'}</td>
          <td className="py-3 px-5 text-right text-[10px] text-slate-600 dark:text-slate-450">{item.ativo === false ? 'Inativo' : 'Ativo'}</td>
          <td className="py-3 px-5 text-center">
            <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
              {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          </td>
        </tr>
      ));
    }

    if (activeTab === 'turmas') {
      return filteredRows('turmas', (item) => `${item.nome} ${item.responsavel || ''}`).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.nome}</p>
            <p className="text-[10px] text-slate-455 dark:text-slate-500">{lookup(records.fazendas, fieldId(item, 'fazenda'))}</p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">{item.responsavel || '-'}</td>
          <td className="py-3 px-5 text-right text-[10px] text-slate-600 dark:text-slate-455">{item.integrantes_detalhe?.length || 0} integrantes</td>
          <td className="py-3 px-5 text-center">
            <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
              {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          </td>
        </tr>
      ));
    }

    if (activeTab === 'produtos') {
      return filteredRows('produtos', (item) => `${item.codigo || ''} ${item.nome_comercial}`).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.nome_comercial}</p>
            <p className="text-[10px] text-slate-455 dark:text-slate-500">{item.codigo || 'Sem código'}</p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">{item.classificacao_nome || 'Insumo'}</td>
          <td className="py-3 px-5 text-right text-[10px] text-slate-600 dark:text-slate-450">{item.unidade_sigla || item.unidade_nome || '-'}</td>
          <td className="py-3 px-5 text-center">
            <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
              {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          </td>
        </tr>
      ));
    }

    if (activeTab === 'usuarios') {
      return filteredRows('usuarios', (item) => `${item.username} ${item.email} ${item.first_name} ${item.last_name}`).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.nome_completo}</p>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">Usuário: {item.username}</p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">
            <p>{item.email}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase">{item.perfil_nome || 'Sem Perfil'}</p>
          </td>
          <td className="py-3 px-5 text-right text-[10px] text-slate-600 dark:text-slate-455">
            {item.fazendas_permitidas_ids?.length || 0} fazendas
          </td>
          <td className="py-3 px-5 text-center">
            <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
              {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          </td>
        </tr>
      ));
    }

    return filteredRows('estoque', (item) => `${item.produto_nome || ''} ${item.tipo_movimento}`).map((item) => (
      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
        <td className="py-3 px-5">
          <p className="text-xs font-black text-slate-800 dark:text-white">{item.produto_nome || lookup(records.produtos, fieldId(item, 'produto'))}</p>
          <p className="text-[10px] text-slate-455 dark:text-slate-500">{item.documento_referencia || 'Sem documento'}</p>
        </td>
        <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">{item.tipo_movimento} em {item.data_movimento}</td>
        <td className="py-3 px-5 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">{Number(item.quantidade || 0).toLocaleString('pt-BR')} {item.produto_unidade_sigla || ''}<p className="text-[10px] text-slate-450 font-normal">R$ {money(item.valor_total)}</p></td>
        <td className="py-3 px-5 text-center">
          <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
            {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className="cadastros-page w-full max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-950/20 bg-rose-950/30 text-rose-300 text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-950/20 bg-emerald-950/30 text-emerald-300 text-sm font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Menu */}
        <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-24">
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-white/[0.06] bg-white dark:bg-slate-900/60 backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-500 mb-4 px-2">Menu de Módulos</h3>
            <div className="space-y-2">
              {filteredMenuSections.map((section) => {
                const SectionIcon = section.icon;
                const isExpanded = expandedSection === section.id;
                const hasActiveItem = section.items.some((item) => item.id === activeTab);

                return (
                  <div key={section.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(isExpanded ? '' : section.id)}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left transition-all cursor-pointer ${hasActiveItem ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300">
                          <SectionIcon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-black">{section.label}</span>
                          <span className="block truncate text-[10px] font-semibold text-slate-455 dark:text-slate-400">{section.description}</span>
                        </span>
                      </span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="space-y-1 border-t border-slate-200/70 bg-slate-50/60 p-2 dark:border-slate-800/80 dark:bg-slate-950/20">
                        {section.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = activeTab === item.id;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              disabled={item.disabled}
                              onClick={() => {
                                if (item.disabled) return;
                                if (item.id === 'planejamentos') {
                                  setActiveView('planejamento');
                                  return;
                                }
                                if (item.id === 'ordens_servico' || item.id === 'apontamentos') {
                                  setActiveView('operacoes');
                                  return;
                                }
                                if (item.id === 'compras') {
                                  setActiveView('financeiro', 'compras');
                                  return;
                                }
                                if (item.id === 'contas_pagar') {
                                  setActiveView('financeiro', 'pagar');
                                  return;
                                }
                                if (item.id === 'contas_receber') {
                                  setActiveView('financeiro', 'receber');
                                  return;
                                }
                                setActiveTab(item.id);
                                setSearchQuery('');
                                setShowInactiveOnly(false); // Reset to active list on tab change
                              }}
                              className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer ${isActive ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'border border-transparent text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-350 dark:hover:text-white dark:hover:bg-slate-850'}`}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <ItemIcon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{item.label}</span>
                              </span>
                              {item.disabled && (
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">em breve</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-white/[0.06] bg-white dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 font-bold">
              <BadgeInfo className="w-4 h-4" />
              <span>Contexto obrigatório</span>
            </div>
            <p className="leading-relaxed text-[11px]">Cadastros operacionais usam fazenda e, quando aplicável, safra ativa via header X-Safra-ID.</p>
          </div>
        </aside>

        {/* Unified Full-Width List & Modal Area */}
        <main className="lg:col-span-9 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/60 pb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-display">Gestão de {activeLabel}</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Dados normalizados conforme a arquitetura de multi-tenancy logical.</p>
            </div>

            {/* Novo Registro button trigger */}
            <button
              onClick={() => {
                setEditingId(null);
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Registro</span>
            </button>
          </div>

          {/* Search, Filter Tabs and Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-450 dark:text-slate-500" />
              <input
                type="text"
                placeholder={`Pesquisar em ${activeLabel}...`}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.06] focus:border-emerald-500/40 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none transition-all"
              />
            </div>

            {/* Premium Active/Inactive Toggle Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shrink-0">
              <button
                type="button"
                onClick={() => setShowInactiveOnly(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !showInactiveOnly
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Ativos
              </button>
              <button
                type="button"
                onClick={() => setShowInactiveOnly(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  showInactiveOnly
                    ? 'bg-white dark:bg-slate-800 text-rose-500 dark:text-rose-450 shadow-sm'
                    : 'text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400'
                }`}
              >
                Inativos
              </button>
            </div>
          </div>

          {/* Unified Full-Width Table */}
          <div className="glass-panel border border-slate-200/50 dark:border-white/[0.06] bg-white dark:bg-slate-900/40 rounded-2xl overflow-x-auto shadow-xl">
            <table className="w-full min-w-[768px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-405 font-black">
                  <th className="py-4 px-5">Registro</th>
                  <th className="py-4 px-5">Detalhe</th>
                  <th className="py-4 px-5 text-right">Informações / Valor</th>
                  <th className="py-4 px-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {loading ? (
                  <tr><td colSpan="4" className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">Carregando dados dos cadastros...</td></tr>
                ) : (
                  renderRows()
                )}
                {!loading && filteredRows(activeTab, () => '').length === 0 && (
                  <tr><td colSpan="4" className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium italic">Nenhum registro localizado para os filtros informados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* POPUP MODAL PARA CADASTRO / EDIÇÃO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 relative animate-in scale-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                <span>{editingId ? `Editar ${activeLabel}` : `Novo Registro de ${activeLabel}`}</span>
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {renderFormFields()}
              
              {/* Actions inside Modal */}
              <div className="flex gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 disabled:opacity-60 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
