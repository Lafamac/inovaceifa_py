import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import {
  AlertCircle,
  Briefcase,
  Building2,
  CalendarRange,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
  Database,
  Fuel,
  Grid3X3,
  Activity,
  Coins,
  ListOrdered,
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
  Wrench,
} from 'lucide-react';
import api from '../services/api';

const ALL_REFERENCES = {
  culturas: { label: 'Culturas', url: '/api/ref/culturas/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  tiposItem: { label: 'Tipos de Item', url: '/api/ref/tipos-item/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  tiposMaquina: { label: 'Tipos de Máquina', url: '/api/ref/tipos-maquina/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  statusCultivo: { label: 'Status de Cultivo', url: '/api/ref/status-cultivo/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  tiposIrrigacao: { label: 'Tipos de Irrigação', url: '/api/ref/tipos-irrigacao/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  resistenciasFerrugem: { label: 'Resistências a Ferrugem', url: '/api/ref/resistencias-ferrugem/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  statusOs: { label: 'Status de Ordem de Serviço', url: '/api/ref/status-os/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  modalidades: { label: 'Modalidades de OS', url: '/api/ref/modalidades/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  tiposRateio: { label: 'Tipos de Rateio', url: '/api/ref/tipos-rateio/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  contasGerenciais: { label: 'Contas Gerenciais', url: '/api/ref/contas-gerenciais/', fields: [{ name: 'codigo', label: 'Código', required: true }, { name: 'nome', label: 'Nome', required: true }] },
  tiposDestinacao: { label: 'Tipos de Destinação', url: '/api/ref/tipos-destinacao/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  gruposTrabalhador: { label: 'Grupos de Trabalhadores', url: '/api/ref/grupos-trabalhador/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  classificacoesProduto: { label: 'Classificações de Produto', url: '/api/ref/classificacoes-produto/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  gruposQuimico: { label: 'Grupos Químicos', url: '/api/ref/grupos-quimico/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  unidadesMedida: { label: 'Unidades de Medida', url: '/api/ref/unidades-medida/', fields: [{ name: 'sigla', label: 'Sigla', required: true }, { name: 'nome', label: 'Nome', required: true }] },
  atividadesEducampo: { label: 'Atividades Educampo', url: '/api/ref/atividades-educampo/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  criteriosRateio: { label: 'Critérios de Rateio', url: '/api/ref/criterios-rateio/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  tiposOperacao: { label: 'Tipos de Operação', url: '/api/ref/tipos-operacao/', fields: [{ name: 'nome', label: 'Nome', required: true }] },
  encargosFolha: { label: 'Encargos da Folha', url: '/api/ref/encargos-folha/', fields: [{ name: 'descricao', label: 'Descrição', required: true }, { name: 'valor', label: 'Valor (%)', type: 'number', required: true }] },
};

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
  fazendas: { proprietario: '', nome: '', sigla: '', cnpj_ou_produtor: '', endereco: '', cep: '', telefone: '', cidade: '', estado: '' },
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
    propria: true,
    horimetro_inicial: '',
  },
  funcionarios: {
    fazenda: '',
    nome: '',
    cpf: '',
    cargo: '',
    grupo_trabalhador: '',
    email: '',
    criar_usuario: false,
    salario: '',
  },
  terceirizados: { fazenda: '', nome: '', cargo: '', documento: '', salario: '' },
  turmas: { fazenda: '', nome: '', responsavel: '', qtd_pessoas: '' },
  fornecedores: { fazenda: '', nome: '', documento: '', endereco: '', bairro: '', cidade: '', estado: '', telefone: '', email: '', data_ultima_compra: '' },
  produtos: {
    codigo: '',
    nome_comercial: '',
    unidade: '',
    classificacao: '',
    grupo_quimico: '',
    concentracao: '',
    periodo_carencia: '',
    alvo: '',
    quantidade_inicial: '',
    valor_unitario_inicial: '',
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
  locacoes_maquinas: {
    maquina: '',
    safra: '',
    fazenda: '',
    tipo_cobranca: 'DIA',
    quantidade: '',
    valor_unitario: '',
    data_inicio: new Date().toISOString().slice(0, 10),
    data_fim: new Date().toISOString().slice(0, 10),
    observacao: '',
  },
  transferencias: {
    tipo_ativo: 'MAQUINA',
    maquina: '',
    funcionario: '',
    produto: '',
    origem: '',
    destino: '',
    quantidade: '',
    valor_unitario: '',
    data_transferencia: new Date().toISOString().slice(0, 10),
    observacao: '',
  },
  usuarios: { username: '', email: '', first_name: '', last_name: '', password: '', perfil_id: '', fazendas_permitidas_ids: [] },
  referencias: { nome: '', sigla: '', codigo: '' },
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
  fornecedores: '/api/fornecedores/',
  estoque: '/api/estoque/movimentos/',
  usuarios: '/api/accounts/usuarios/',
  locacoes_maquinas: '/api/locacoes-maquinas/',
  transferencias: '/api/transferencias-ativos/',
  manutencoes_maquinas: '/api/manutencoes-maquinas/',
};

const refEndpoints = {
  culturas: '/api/ref/culturas/',
  tiposItem: '/api/ref/tipos-item/',
  tiposMaquina: '/api/ref/tipos-maquina/',
  tiposIrrigacao: '/api/ref/tipos-irrigacao/',
  resistenciasFerrugem: '/api/ref/resistencias-ferrugem/',
  statusCultivo: '/api/ref/status-cultivo/',
  statusOs: '/api/ref/status-os/',
  modalidades: '/api/ref/modalidades/',
  tiposRateio: '/api/ref/tipos-rateio/',
  contasGerenciais: '/api/ref/contas-gerenciais/',
  tiposDestinacao: '/api/ref/tipos-destinacao/',
  gruposTrabalhador: '/api/ref/grupos-trabalhador/',
  classificacoesProduto: '/api/ref/classificacoes-produto/',
  gruposQuimico: '/api/ref/grupos-quimico/',
  unidadesMedida: '/api/ref/unidades-medida/',
  atividadesEducampo: '/api/ref/atividades-educampo/',
  criteriosRateio: '/api/ref/criterios-rateio/',
  tiposOperacao: '/api/ref/tipos-operacao/',
  encargosFolha: '/api/ref/encargos-folha/',
};

const fallbackRefs = {
  culturas: [{ id: 1, nome: 'Café' }],
  tiposItem: [{ id: 1, nome: 'Máquina' }],
  tiposMaquina: [{ id: 1, nome: 'Trator' }],
  tiposIrrigacao: [{ id: 1, nome: 'Não Irrigado' }],
  resistenciasFerrugem: [{ id: 1, nome: 'Não Informado' }],
  statusCultivo: [{ id: 1, nome: 'Em Produção' }],
  statusOs: [{ id: 1, nome: 'Rascunho' }],
  modalidades: [{ id: 1, nome: 'Própria' }],
  tiposRateio: [{ id: 1, nome: 'Por Área' }],
  contasGerenciais: [{ id: 1, codigo: '1.01', nome: 'Insumos' }],
  tiposDestinacao: [{ id: 1, nome: 'Produção' }],
  gruposTrabalhador: [{ id: 1, nome: 'Mão de Obra Própria' }],
  classificacoesProduto: [{ id: 1, nome: 'Outros' }],
  gruposQuimico: [{ id: 1, nome: 'Outros' }],
  unidadesMedida: [{ id: 1, sigla: 'kg', nome: 'Quilograma' }],
  atividadesEducampo: [{ id: 1, nome: 'Outros' }],
  criteriosRateio: [{ id: 1, nome: 'Área' }],
  tiposOperacao: [{ id: 1, nome: 'Geral' }],
  encargosFolha: [{ id: 1, descricao: 'Encargos Sociais', valor: 34.00 }],
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
      { id: 'funcionarios', label: 'Funcionários', icon: Users },
      { id: 'terceirizados', label: 'Terceirizados', icon: Briefcase },
      { id: 'turmas', label: 'Turmas', icon: Users },
      { id: 'transferencias', label: 'Transferências', icon: ClipboardList },
      { id: 'locacoes_maquinas', label: 'Locação de Máquinas', icon: Tractor },
      { id: 'referencias', label: 'Tabelas de Referência', icon: Database },
    ],
  },
  {
    id: 'suprimentos',
    label: 'Suprimentos',
    icon: Warehouse,
    description: 'Produtos e estoque',
    items: [
      { id: 'produtos', label: 'Produtos e Insumos', icon: Package },
      { id: 'fornecedores', label: 'Fornecedores', icon: Users },
      { id: 'estoque', label: 'Movimentações', icon: Warehouse },
      { id: 'compras', label: 'Pedidos de Compra', icon: ClipboardList, targetView: 'financeiro', targetSubTab: 'compras' },
    ],
  },
  {
    id: 'operacional',
    label: 'Operacional',
    icon: Tractor,
    description: 'Planejamento e execução',
    items: [
      { id: 'planejamentos', label: 'Planejamentos', icon: CalendarRange, targetView: 'planejamento' },
      { id: 'ordens_servico', label: 'Ordens de Serviço', icon: ClipboardList, targetView: 'operacoes', targetSubTab: 'os' },
      { id: 'abastecimentos', label: 'Abastecimentos', icon: Fuel, targetView: 'operacoes', targetSubTab: 'abastecimento' },
      { id: 'rateios_realizados', label: 'Rateios Realizados', icon: Coins, targetView: 'operacoes', targetSubTab: 'rateio' },
      { id: 'rateios_operacionais', label: 'Rateios Operacionais', icon: Activity, targetView: 'operacoes', targetSubTab: 'rateio_operacional' },
    ],
  },
  {
    id: 'financeiro_rh',
    label: 'Financeiro',
    icon: WalletCards,
    description: 'Vendas e contas',
    items: [
      { id: 'vendas', label: 'Pedidos de Venda', icon: ListOrdered, targetView: 'financeiro', targetSubTab: 'vendas' },
      { id: 'contas_pagar', label: 'Contas a Pagar', icon: WalletCards, targetView: 'financeiro', targetSubTab: 'pagar' },
      { id: 'contas_receber', label: 'Contas a Receber', icon: WalletCards, targetView: 'financeiro', targetSubTab: 'receber' },
    ],
  },
];

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
const lookup = (collection, id, fallback = '-') => (collection || []).find((item) => sameId(item.id, id))?.nome || fallback;
const money = (value) => Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const addDaysToDate = (dateValue, daysValue) => {
  const days = Number(daysValue);
  if (!dateValue || !Number.isFinite(days) || days <= 0) return '';
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + Math.trunc(days));
  return date.toISOString().slice(0, 10);
};

const formatMask = (val, mask) => {
  if (!val) return '';
  if (mask === 'telefone') {
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length > 10) {
      digits = digits.slice(2);
    }
    if (digits.startsWith('0') && digits.length > 10) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 11);
    if (digits.length <= 2) {
      return digits.length > 0 ? `(${digits}` : '';
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
  }
  if (mask === 'cep') {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) {
      return digits;
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
  }
  if (mask === 'documento') {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 11) {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    } else {
      const truncated = digits.slice(0, 14);
      if (truncated.length <= 12) {
        return `${truncated.slice(0, 2)}.${truncated.slice(2, 5)}.${truncated.slice(5, 8)}/${truncated.slice(8)}`;
      }
      return `${truncated.slice(0, 2)}.${truncated.slice(2, 5)}.${truncated.slice(5, 8)}/${truncated.slice(8, 12)}-${truncated.slice(12, 14)}`;
    }
  }
  return val;
};

const InputField = ({ label, value, onChange, type = 'text', required = false, placeholder = '', mask, ...props }) => {
  const formattedValue = formatMask(value, mask);

  return (
    <label className="block space-y-1.5 text-left">
      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{label}{required ? ' *' : ''}</span>
      <input
        type={type}
        value={formattedValue}
        onChange={(event) => {
          let rawVal = event.target.value;
          if (type === 'text') {
            rawVal = rawVal.toUpperCase();
          }
          onChange(formatMask(rawVal, mask));
        }}
        onKeyDown={(event) => {
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
        }}
        placeholder={placeholder}
        {...props}
        className={`w-full bg-white border border-slate-200 focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 placeholder-slate-450 outline-none transition-all ${type === 'text' && !mask ? 'uppercase' : ''}`}
      />
    </label>
  );
};

const SelectField = ({ label, value, onChange, options, required = false, defaultOption = 'Selecione...' }) => (
  <label className="block space-y-1.5 text-left">
    <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{label}{required ? ' *' : ''}</span>
    <select
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
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
                    break;
                  }
                }
                nextIndex++;
              }
            }
          }
        }
      }}
      className="w-full bg-white border border-slate-200 focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-slate-800 outline-none transition-all"
    >
      <option value="" className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500">{defaultOption}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{option.label}</option>
      ))}
    </select>
  </label>
);

export const Cadastros = ({ currentSafraId, setActiveView }) => {
  const { user } = useAuth();
  const { atualizarTenant, fazendaAtiva, selecionarFazenda, safraAtiva } = useTenant();
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
    fornecedores: [],
    estoque: [],
    usuarios: [],
    perfis: [],
    saldos: [],
    locacoes_maquinas: [],
    transferencias: [],
    manutencoes_maquinas: [],
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
  const [selectedRefTab, setSelectedRefTab] = useState('culturas');

  // Filtros de Movimentações de Estoque
  const [selectedEstoqueProduto, setSelectedEstoqueProduto] = useState('');
  const [estoqueDataInicio, setEstoqueDataInicio] = useState('');
  const [estoqueDataFim, setEstoqueDataFim] = useState('');

  // Variáveis para modal de cópia de produtos entre safras
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceSafraId, setCopySourceSafraId] = useState('');
  const [copyCarryStock, setCopyCarryStock] = useState(false);

  const [newMaintenance, setNewMaintenance] = useState({
    data: new Date().toISOString().slice(0, 10),
    data_vencimento: new Date().toISOString().slice(0, 10),
    descricao: '',
    valor: '',
    nota_fiscal: ''
  });
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [maintenanceMachine, setMaintenanceMachine] = useState(null);
  const [rentalToClose, setRentalToClose] = useState(null);
  const [rentalToExtend, setRentalToExtend] = useState(null);
  const [rentalCloseForm, setRentalCloseForm] = useState({
    quantidade_final: '',
    valor_final: '',
    data_encerramento: new Date().toISOString().slice(0, 10),
    data_vencimento: new Date().toISOString().slice(0, 10),
  });
  const [rentalExtendDate, setRentalExtendDate] = useState('');

  const currentForm = forms[activeTab];

  const overdueRentals = useMemo(() => (
    (records.locacoes_maquinas || []).filter((item) => item.status === 'ABERTA' && item.em_atraso)
  ), [records.locacoes_maquinas]);

  const isSuperUsuario = useMemo(() => {
    return user && (
      user.is_superuser ||
      user.perfil_id === 1 ||
      (user.cargo || '').toLowerCase().includes('gerente') ||
      (user.cargo || '').toLowerCase().includes('super') ||
      (user.cargo || '').toLowerCase().includes('superusuário')
    );
  }, [user]);

  const filteredMenuSections = useMemo(() => {
    return menuSections.map(section => {
      if (section.id === 'cadastros') {
        let items = [...section.items];
        if (!isSuperUsuario) {
          items = items.filter(x => x.id !== 'proprietarios');
        }
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

  const fazendasOptions = useMemo(() => {
    const list = [...records.fazendas];
    if (user?.perfil_id === 1) {
      list.sort((a, b) => a.nome.localeCompare(b.nome));
    }
    return list.map((fazenda) => ({ value: fazenda.id, label: `${fazenda.nome}${fazenda.sigla ? ` (${fazenda.sigla})` : ''}` }));
  }, [records.fazendas, user]);

  const safrasOptions = useMemo(() => {
    const activeFarmId = fazendaAtiva?.id;
    return (records?.safras || [])
      .filter((safra) => {
        const fazendaId = safra?.fazenda_id || safra?.fazenda;
        return activeFarmId && sameId(fazendaId, activeFarmId);
      })
      .map((safra) => ({ value: safra.id, label: `${safra.nome}${safra.ativa ? ' - ativa' : ''}` }));
  }, [records?.safras, fazendaAtiva]);

  const otherSafrasOptions = useMemo(() => {
    const activeFarmId = fazendaAtiva?.id;
    return (records?.safras || [])
      .filter((s) => {
        if (!s || !s.id || sameId(s.id, currentSafraId)) return false;
        const fazendaId = s?.fazenda_id || s?.fazenda;
        return activeFarmId && sameId(fazendaId, activeFarmId);
      })
      .map((s) => {
        const fazendaNome = lookup(records?.fazendas || [], fieldId(s, 'fazenda'));
        return { value: s.id, label: `${s.nome || ''} (${fazendaNome})` };
      });
  }, [records?.safras, records?.fazendas, currentSafraId, fazendaAtiva]);

  const handleCopySafra = async (event) => {
    event.preventDefault();
    if (!copySourceSafraId) {
      showAlert('error', 'Selecione a safra de origem.');
      return;
    }
    
    setSaving(true);
    try {
      const response = await api.post('/api/produtos/copiar-safra/', {
        safra_origem_id: copySourceSafraId,
        safra_destino_id: currentSafraId,
        carregar_estoque: copyCarryStock,
      });
      
      showAlert('success', response.data?.detail || 'Produtos importados com sucesso!');
      setShowCopyModal(false);
      setCopySourceSafraId('');
      setCopyCarryStock(false);
      await loadData();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message;
      showAlert('error', `Erro ao importar produtos: ${detail}`);
    } finally {
      setSaving(false);
    }
  };

  const refOptions = (key, labelGetter = (item) => item.nome) =>
    refs[key].map((item) => ({ value: item.id, label: labelGetter(item) }));

  const showAlert = (type, message, persistent = false) => {
    if (type === 'error') {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!persistent) {
      window.setTimeout(() => {
        setError('');
        setSuccess('');
      }, 4500);
    }
  };

  const fetchList = async (url, fallbackKey) => {
    try {
      // Forçamos a API a sempre buscar registros ativos e inativos juntos para filtragem reativa no front
      // Adicionamos um cache-buster para evitar que o navegador cacheie as respostas da API
      const response = await api.get(`${url}?incluir_inativos=true&_=${new Date().getTime()}`);
      return asList(response.data);
    } catch (error) {
      // Se o backend respondeu com erro (error.response existe), propagamos o erro
      // ao invés de retornar os dados locais simulados do localStorage
      if (error.response) {
        throw error;
      }
      const fallbackDB = getFallbackDB();
      if (fallbackDB[fallbackKey]) {
        return asList(fallbackDB[fallbackKey]);
      }
      if (fallbackRefs[fallbackKey]) {
        return fallbackRefs[fallbackKey].map(x => ({ ...x, ativo: x.ativo !== false }));
      }
      return [];
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allowedEndpoints = { ...endpoints };
      if (!isSuperUsuario) {
        delete allowedEndpoints.usuarios;
        delete allowedEndpoints.proprietarios;
      }

      // Carregar registros operacionais individualmente para que falhas em um endpoint não quebrem os outros
      const loadedRecordsPromises = Object.entries(allowedEndpoints).map(async ([key, url]) => {
        try {
          const list = await fetchList(url, key);
          return [key, list];
        } catch (err) {
          console.error(`Erro ao carregar o cadastro ${key}:`, err);
          return [key, []];
        }
      });

      // Carregar tabelas de referência individualmente
      const loadedRefsPromises = Object.entries(refEndpoints).map(async ([key, url]) => {
        try {
          const list = await fetchList(url, key);
          return [key, list];
        } catch (err) {
          console.error(`Erro ao carregar a referência ${key}:`, err);
          return [key, []];
        }
      });

      const [loadedRecords, loadedRefs] = await Promise.all([
        Promise.all(loadedRecordsPromises),
        Promise.all(loadedRefsPromises),
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

      let saldosEstoque = [];
      if (fazendaAtiva && currentSafraId) {
        try {
          const res = await api.get('/api/estoque/saldos/');
          saldosEstoque = asList(res.data);
        } catch (e) {
          console.error("Erro ao carregar saldos de estoque:", e);
          try {
            const db = getFallbackDB();
            const localMovements = asList(db.estoque);
            const prodSaldos = {};
            localMovements.forEach(m => {
              const mFazenda = fieldId(m, 'fazenda');
              const mSafra = fieldId(m, 'safra');
              const mProduto = fieldId(m, 'produto');
              
              if (sameId(mFazenda, fazendaAtiva.id) && sameId(mSafra, currentSafraId) && m.ativo !== false) {
                const qty = Number(m.quantidade || 0);
                if (!prodSaldos[mProduto]) prodSaldos[mProduto] = 0;
                
                if (m.tipo_movimento === 'ENTRADA' || m.tipo_movimento === 'AJUSTE') {
                  prodSaldos[mProduto] += qty;
                } else if (m.tipo_movimento === 'SAIDA') {
                  prodSaldos[mProduto] -= qty;
                } else if (m.tipo_movimento === 'TRANSFERENCIA') {
                  const mOrigem = fieldId(m, 'origem_transferencia');
                  const mDestino = fieldId(m, 'destino_transferencia');
                  if (sameId(mOrigem, fazendaAtiva.id)) {
                    prodSaldos[mProduto] -= qty;
                  }
                  if (sameId(mDestino, fazendaAtiva.id)) {
                    prodSaldos[mProduto] += qty;
                  }
                }
              }
            });
            saldosEstoque = Object.entries(prodSaldos).map(([prodId, saldo]) => ({
              produto_id: Number(prodId),
              saldo: saldo
            }));
          } catch (localErr) {
            console.error("Erro ao calcular saldos locais de estoque:", localErr);
          }
        }
      }

      setRecords((prev) => ({
        ...prev,
        ...Object.fromEntries(loadedRecords),
        ...(isSuperUsuario ? { perfis: perfisList } : {}),
        saldos: saldosEstoque,
      }));
      setRefs(Object.fromEntries(loadedRefs));
    } catch (err) {
      console.error(err);
      showAlert('error', 'Não foi possível carregar os cadastros.');
    } finally {
      setLoading(false);
    }
  }, [user, fazendaAtiva, currentSafraId, isSuperUsuario]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (user && !isSuperUsuario && activeTab === 'proprietarios') {
      setActiveTab('fazendas');
    }
  }, [user, isSuperUsuario, activeTab]);

  useEffect(() => {
    if (!editingId) {
      setForms((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((tab) => {
          if (updated[tab]) {
            const patch = {};
            if (fazendaAtiva && 'fazenda' in updated[tab]) {
              patch.fazenda = fazendaAtiva.id;
            }
            if (fazendaAtiva && 'origem' in updated[tab]) {
              patch.origem = fazendaAtiva.id;
            }
            if (safraAtiva && 'safra' in updated[tab]) {
              patch.safra = safraAtiva.id;
            }
            if (Object.keys(patch).length > 0) {
              updated[tab] = { ...updated[tab], ...patch };
            }
          }
        });
        return updated;
      });
    }
  }, [fazendaAtiva, safraAtiva, editingId]);

  const patchForm = (key, value) => {
    setForms((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [key]: value },
    }));
  };

  const resetForm = (tab = activeTab) => {
    setForms((prev) => {
      const defaultForm = { ...emptyForms[tab] };
      if (fazendaAtiva && 'fazenda' in defaultForm) {
        defaultForm.fazenda = fazendaAtiva.id;
      }
      if (fazendaAtiva && 'origem' in defaultForm) {
        defaultForm.origem = fazendaAtiva.id;
      }
      if (safraAtiva && 'safra' in defaultForm) {
        defaultForm.safra = safraAtiva.id;
      }
      return { ...prev, [tab]: defaultForm };
    });
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
    if (activeTab === 'maquinas') payload.tipo ||= refs.tiposMaquina.find((item) => item.nome?.toLowerCase().includes('trator'))?.id || refs.tiposMaquina[0]?.id;
    if (activeTab === 'funcionarios') payload.grupo_trabalhador ||= refs.gruposTrabalhador[0]?.id;
    if (activeTab === 'produtos') {
      payload.unidade ||= refs.unidadesMedida[0]?.id;
      payload.classificacao ||= refs.classificacoesProduto[0]?.id;
      if (fazendaAtiva) payload.fazenda = fazendaAtiva.id;
      if (currentSafraId) payload.safra = currentSafraId;
    }
    return payload;
  };

  const validatePayload = (payload) => {
    const required = {
      proprietarios: ['nome', 'email'],
      fazendas: isSuperUsuario ? ['proprietario', 'nome', 'sigla'] : ['nome', 'sigla'],
      safras: ['fazenda', 'nome', 'data_inicio', 'data_fim'],
      talhoes: ['fazenda', 'codigo', 'nome', 'area', 'tipo_irrigacao', 'cultura'],
      maquinas: ['fazenda', 'codigo', 'descricao', 'tipo'],
      funcionarios: ['fazenda', 'nome', 'grupo_trabalhador'],
      terceirizados: ['fazenda', 'nome'],
      turmas: ['fazenda', 'nome'],
      produtos: ['nome_comercial', 'unidade', 'classificacao'],
      fornecedores: ['nome'],
      estoque: ['fazenda', 'safra', 'produto', 'tipo_movimento', 'quantidade', 'data_movimento'],
      usuarios: ['username', 'email', 'first_name', 'perfil_id'],
      locacoes_maquinas: ['maquina', 'tipo_cobranca', 'valor_unitario', 'data_inicio', 'data_fim'],
      transferencias: ['tipo_ativo', 'origem', 'destino', 'data_transferencia'],
      referencias: ALL_REFERENCES[selectedRefTab].fields.filter((f) => f.required).map((f) => f.name),
    };

    const targetKey = activeTab === 'referencias' ? 'referencias' : activeTab;
    const missing = required[targetKey].filter((key) => !payload[key]);
    if (missing.length) {
      showAlert('error', `Preencha os campos obrigatórios: ${missing.join(', ')}.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const targetKey = activeTab === 'referencias' ? 'referencias' : activeTab;
    
    // Se for a aba de transferências e for do tipo PRODUTO, enviamos para o endpoint de estoque
    if (activeTab === 'transferencias' && forms.transferencias.tipo_ativo === 'PRODUTO') {
      const payload = {
        tipo_movimento: 'TRANSFERENCIA',
        produto: forms.transferencias.produto,
        quantidade: Number(forms.transferencias.quantidade || 0),
        valor_unitario: Number(forms.transferencias.valor_unitario || 0),
        data_movimento: forms.transferencias.data_transferencia,
        origem_transferencia: forms.transferencias.origem,
        destino_transferencia: forms.transferencias.destino,
        observacao: forms.transferencias.observacao,
        safra: currentSafraId,
      };

      if (!payload.produto || !payload.quantidade || !payload.origem_transferencia || !payload.destino_transferencia || !payload.data_movimento) {
        showAlert('error', 'Preencha os campos obrigatórios para transferência de produto.');
        return;
      }
      
      if (payload.origem_transferencia === payload.destino_transferencia) {
        showAlert('error', 'A fazenda de origem e destino devem ser diferentes.');
        return;
      }

      setSaving(true);
      try {
        const response = await api.post('/api/estoque/movimentos/', payload);
        showAlert('success', response.data?.warning || 'Transferência de produto realizada com sucesso.');
        resetForm('transferencias');
        setShowModal(false);
        setEditingId(null);
        await loadData();
      } catch (err) {
        console.error(err);
        const detail = err.response?.data?.detail || err.message;
        showAlert('error', `Erro ao transferir produto: ${detail}`);
      } finally {
        setSaving(false);
      }
      return;
    }

    let payload = fillRequiredRefs(cleanPayload(forms[targetKey]));

    if (activeTab === 'estoque') {
      payload.safra = payload.safra || currentSafraId;
      payload.valor_total = Number(payload.quantidade || 0) * Number(payload.valor_unitario || 0);
    }

    if (activeTab === 'locacoes_maquinas') {
      payload.safra = payload.safra || currentSafraId;
      payload.fazenda = payload.fazenda || (fazendaAtiva ? fazendaAtiva.id : '');
    }

    if (!validatePayload(payload)) return;

    setSaving(true);
    let createdFarmId = null;
    try {
      if (editingId) {
        // Modo Edição
        const url = activeTab === 'referencias'
          ? `${refEndpoints[selectedRefTab]}${editingId}/`
          : `${endpoints[activeTab]}${editingId}/`;
        
        let editPayload = payload;
        if (activeTab === 'produtos') {
          const { quantidade_inicial, valor_unitario_inicial, ...cleaned } = payload;
          editPayload = cleaned;
        }

        await api.put(url, editPayload);
        showAlert('success', 'Registro atualizado com sucesso.');
      } else {
        // Modo Criação
        const url = activeTab === 'referencias'
          ? refEndpoints[selectedRefTab]
          : endpoints[activeTab];
        
        let createPayload = payload;
        let qInitial = null;
        let vUnitInitial = null;
        if (activeTab === 'produtos') {
          const { quantidade_inicial, valor_unitario_inicial, ...cleaned } = payload;
          createPayload = cleaned;
          qInitial = quantidade_inicial;
          vUnitInitial = valor_unitario_inicial;
        }

        const response = await api.post(url, createPayload);
        if (activeTab === 'fazendas') {
          createdFarmId = response.data?.id;
        }
        
        let successMsg = response.data?.warning || 'Registro criado com sucesso.';
        let isPersistent = false;
        if (activeTab === 'proprietarios') {
          successMsg = 'Proprietário cadastrado com sucesso! O usuário correspondente foi criado e os dados de acesso foram enviados por e-mail.';
          isPersistent = true;
          alert(successMsg);
        } else if (activeTab === 'funcionarios' && payload.criar_usuario && payload.email) {
          successMsg = 'Funcionário cadastrado com sucesso! O usuário correspondente foi criado e os dados de acesso foram enviados por e-mail.';
          isPersistent = true;
          alert(successMsg);
        }
        
        showAlert('success', successMsg, isPersistent);

        // Lançar estoque inicial automaticamente para novo produto se informado
        if (activeTab === 'produtos' && qInitial && Number(qInitial) > 0) {
          if (fazendaAtiva && currentSafraId) {
            try {
              await api.post('/api/estoque/movimentos/', {
                fazenda: fazendaAtiva.id,
                safra: currentSafraId,
                produto: response.data.id,
                tipo_movimento: 'ENTRADA',
                quantidade: Number(qInitial),
                valor_unitario: Number(vUnitInitial || 0),
                valor_total: Number(qInitial) * Number(vUnitInitial || 0),
                data_movimento: new Date().toISOString().slice(0, 10),
                documento_referencia: 'ESTOQUE INICIAL',
                observacao: 'LANÇAMENTO AUTOMÁTICO DE ESTOQUE INICIAL NO CADASTRO DO PRODUTO.'
              });
            } catch (stockErr) {
              console.error("Erro ao criar estoque inicial para o produto:", stockErr);
              showAlert('error', 'Produto criado, mas erro ao registrar estoque inicial: ' + (stockErr.response?.data?.detail || stockErr.message));
            }
          } else {
            showAlert('error', 'Produto criado, mas estoque inicial não pôde ser lançado porque nenhuma fazenda ou safra está selecionada no cabeçalho.');
          }
        }
      }

      await loadData();
      if (activeTab === 'fazendas' || activeTab === 'safras') {
        try {
          if (atualizarTenant) {
            await atualizarTenant();
          }
        } catch (e) {
          console.error("Erro ao atualizar tenant", e);
        }
      }

      // Alternar automaticamente para a fazenda do registro cadastrado/editado para atualizar a listagem no contexto correto
      if (payload.fazenda && selecionarFazenda) {
        try {
          selecionarFazenda(payload.fazenda);
        } catch (e) {
          console.error("Erro ao selecionar fazenda do registro:", e);
        }
      }

      if (createdFarmId) {
        setActiveTab('safras');
        setForms((prev) => ({
          ...prev,
          safras: {
            ...emptyForms.safras,
            fazenda: createdFarmId,
            ativa: true,
          },
        }));
        setEditingId(null);
        setShowModal(true);
        showAlert('success', 'Fazenda cadastrada! Defina agora a safra inicial ativa para esta fazenda.');
      } else {
        resetForm(targetKey);
        setShowModal(false);
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        const detail = err.response.data?.detail || err.response.data?.error || JSON.stringify(err.response.data);
        showAlert('error', `Erro ao salvar: ${detail}`);
        setSaving(false);
        return;
      }
      // Fallback em banco local storage
      try {
        const db = getFallbackDB();
        const fallbackKey = activeTab === 'referencias' ? selectedRefTab : activeTab;
        if (!db[fallbackKey]) db[fallbackKey] = [];

        let localNewId = null;
        if (editingId) {
          const idx = db[fallbackKey].findIndex(x => String(x.id) === String(editingId));
          if (idx !== -1) {
            let editPayload = { ...payload };
            if (activeTab === 'produtos') {
              const { quantidade_inicial, valor_unitario_inicial, ...cleaned } = payload;
              editPayload = cleaned;
            }
            db[fallbackKey][idx] = { ...db[fallbackKey][idx], ...editPayload };
          }
        } else {
          localNewId = db[fallbackKey].length > 0 ? Math.max(...db[fallbackKey].map(x => x.id)) + 1 : 1;
          
          let createPayload = { ...payload };
          if (activeTab === 'produtos') {
            const { quantidade_inicial, valor_unitario_inicial, ...cleaned } = payload;
            createPayload = cleaned;
          }
          
          db[fallbackKey].push({ id: localNewId, ativo: true, ...createPayload });
          
          if (activeTab === 'fazendas') {
            createdFarmId = localNewId;
          }

          // Lançar estoque inicial automaticamente para novo produto se informado no fallback
          if (activeTab === 'produtos' && payload.quantidade_inicial && Number(payload.quantidade_inicial) > 0) {
            if (!db.estoque) db.estoque = [];
            const movementId = db.estoque.length > 0 ? Math.max(...db.estoque.map(x => x.id)) + 1 : 1;
            db.estoque.push({
              id: movementId,
              ativo: true,
              fazenda: fazendaAtiva?.id || '',
              safra: currentSafraId || '',
              produto: localNewId,
              tipo_movimento: 'ENTRADA',
              quantidade: Number(payload.quantidade_inicial),
              valor_unitario: Number(payload.valor_unitario_inicial || 0),
              valor_total: Number(payload.quantidade_inicial) * Number(payload.valor_unitario_inicial || 0),
              data_movimento: new Date().toISOString().slice(0, 10),
              documento_referencia: 'ESTOQUE INICIAL',
              observacao: 'LANÇAMENTO AUTOMÁTICO DE ESTOQUE INICIAL NO CADASTRO DO PRODUTO (OFFLINE).'
            });
          }
        }
        localStorage.setItem('inovaceifa_db', JSON.stringify(db));
        showAlert('success', 'Salvo offline com sucesso.');

        await loadData();
        if (activeTab === 'fazendas' || activeTab === 'safras') {
          try {
            if (atualizarTenant) {
              await atualizarTenant();
            }
          } catch (e) {
            console.error("Erro ao atualizar tenant", e);
          }
        }

        if (createdFarmId) {
          setActiveTab('safras');
          setForms((prev) => ({
            ...prev,
            safras: {
              ...emptyForms.safras,
              fazenda: createdFarmId,
              ativa: true,
            },
          }));
          setEditingId(null);
          setShowModal(true);
          showAlert('success', 'Fazenda cadastrada offline! Defina agora a safra inicial ativa para esta fazenda.');
        } else {
          resetForm(targetKey);
          setShowModal(false);
          setEditingId(null);
        }
      } catch (localErr) {
        const detail = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0];
        showAlert('error', detail || 'Erro ao salvar. Verifique contexto e campos.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Alteração de estado ativo/inativo (Soft Delete & Reativação)
  const openRentalClose = (item) => {
    const quantidadeSugerida = item.quantidade_final || item.quantidade || '';
    const valorSugerido = item.valor_final || item.valor_total || '';
    setRentalToClose(item);
    setRentalCloseForm({
      quantidade_final: quantidadeSugerida,
      valor_final: valorSugerido,
      data_encerramento: new Date().toISOString().slice(0, 10),
      data_vencimento: new Date().toISOString().slice(0, 10),
    });
  };

  const handleCloseRental = async (event) => {
    event.preventDefault();
    if (!rentalToClose) return;
    if (rentalToClose.tipo_cobranca === 'HORA' && !rentalCloseForm.quantidade_final) {
      showAlert('error', 'Informe a quantidade efetiva de horas trabalhadas.');
      return;
    }
    if (!rentalCloseForm.valor_final || !rentalCloseForm.data_vencimento) {
      showAlert('error', 'Informe o valor final e a data prevista para pagamento.');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/api/locacoes-maquinas/${rentalToClose.id}/encerrar/`, rentalCloseForm);
      showAlert('success', 'Locação encerrada e conta a pagar gerada com sucesso.');
      setRentalToClose(null);
      await loadData();
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Erro ao encerrar a locação.');
    } finally {
      setSaving(false);
    }
  };

  const openRentalExtension = (item) => {
    setRentalToExtend(item);
    setRentalExtendDate('');
  };

  const handleExtendRental = async (event) => {
    event.preventDefault();
    if (!rentalToExtend || !rentalExtendDate) return;

    setSaving(true);
    try {
      await api.post(`/api/locacoes-maquinas/${rentalToExtend.id}/prorrogar/`, {
        nova_data_fim: rentalExtendDate,
      });
      showAlert('success', 'Prazo da locação prorrogado com sucesso.');
      setRentalToExtend(null);
      await loadData();
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Erro ao prorrogar a locação.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (item) => {
    const novoEstado = item.ativo !== false ? false : true;
    const confirmMsg = novoEstado
      ? `Deseja REATIVAR este registro?`
      : `Deseja DESATIVAR (soft delete) este registro?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      let url = '';
      if (item.isProduct) {
        url = `/api/estoque/movimentos/${item.rawId}/`;
      } else {
        url = activeTab === 'referencias'
          ? `${refEndpoints[selectedRefTab]}${item.id}/`
          : `${endpoints[activeTab]}${item.id}/`;
      }
      await api.patch(url, { ativo: novoEstado });
      showAlert('success', novoEstado ? 'Registro reativado!' : 'Registro inativado com sucesso.');
      await loadData();
    } catch (err) {
      console.error(err);
      if (err.response) {
        const detail = err.response.data?.detail || err.response.data?.error || JSON.stringify(err.response.data);
        showAlert('error', `Erro ao alterar status: ${detail}`);
        return;
      }
      // Fallback offline
      try {
        const db = getFallbackDB();
        const targetKey = activeTab === 'referencias' ? selectedRefTab : activeTab;
        const list = db[targetKey] || [];
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
    const targetKey = activeTab === 'referencias' ? 'referencias' : activeTab;
    const formFields = {};

    if (activeTab === 'referencias') {
      const config = ALL_REFERENCES[selectedRefTab];
      config.fields.forEach(field => {
        formFields[field.name] = item[field.name] !== undefined ? item[field.name] : '';
      });
    } else {
      Object.assign(formFields, emptyForms[targetKey]);
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
    }

    setForms((prev) => ({
      ...prev,
      [targetKey]: formFields
    }));
    setShowModal(true);
  };

  const handleAddMaintenance = async () => {
    if (!maintenanceMachine) return;
    if (!newMaintenance.descricao || !newMaintenance.valor || !newMaintenance.data || !newMaintenance.data_vencimento) {
      showAlert('error', 'Preencha a data, vencimento, trabalho realizado e o valor da manutenção.');
      return;
    }
    setSavingMaintenance(true);
    try {
      await api.post('/api/manutencoes-maquinas/', {
        maquina: maintenanceMachine.id,
        safra: safraAtiva?.id,
        data: newMaintenance.data,
        data_vencimento: newMaintenance.data_vencimento,
        descricao: newMaintenance.descricao,
        valor: Number(newMaintenance.valor),
        nota_fiscal: newMaintenance.nota_fiscal
      });
      showAlert('success', 'Manutenção registrada e conta a pagar gerada com sucesso!');
      setNewMaintenance({
        data: new Date().toISOString().slice(0, 10),
        data_vencimento: new Date().toISOString().slice(0, 10),
        descricao: '',
        valor: '',
        nota_fiscal: ''
      });
      await loadData();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message;
      showAlert('error', `Erro ao registrar manutenção: ${detail}`);
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleDeleteMaintenance = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta manutenção?')) return;
    try {
      await api.delete(`/api/manutencoes-maquinas/${id}/`);
      showAlert('success', 'Manutenção excluída com sucesso!');
      await loadData();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro ao excluir manutenção.');
    }
  };

  const filteredRows = (key, getText) => {
    const query = searchQuery.trim().toLowerCase();
    
    let baseList;
    if (key === 'referencias') {
      baseList = refs[selectedRefTab] || [];
    } else if (key === 'transferencias') {
      const assetTransfers = records.transferencias || [];
      const productTransfers = (records.estoque || [])
        .filter(m => m.tipo_movimento === 'TRANSFERENCIA')
        .map(pt => ({
          id: `prod_${pt.id}`,
          tipo_ativo: 'PRODUTO',
          produto: pt.produto,
          produto_nome: pt.produto_nome || lookup(records.produtos, fieldId(pt, 'produto')),
          origem: pt.origem_transferencia || pt.fazenda,
          origem_nome: pt.origem_transferencia_nome || lookup(records.fazendas, fieldId(pt, 'origem_transferencia') || fieldId(pt, 'fazenda')),
          destino: pt.destino_transferencia,
          destino_nome: pt.destino_transferencia_nome || lookup(records.fazendas, fieldId(pt, 'destino_transferencia')),
          data_transferencia: pt.data_movimento,
          quantidade: pt.quantidade,
          valor_unitario: pt.valor_unitario,
          valor_total: pt.valor_total,
          observacao: pt.observacao,
          ativo: pt.ativo,
          isProduct: true,
          rawId: pt.id,
        }));
      baseList = [...assetTransfers, ...productTransfers];
    } else {
      baseList = records[key] || [];
    }

    // Filtrar Ativos vs Inativos de acordo com o filtro do botão
    baseList = baseList.filter(item => {
      const isItemActive = item.ativo !== false;
      return showInactiveOnly ? !isItemActive : isItemActive;
    });

    // Se for a aba de safras, talhões, máquinas, locações, funcionários, terceirizados ou turmas, filtrar apenas registros da fazenda selecionada (tenant)
    if ((key === 'safras' || key === 'talhoes' || key === 'maquinas' || key === 'locacoes_maquinas' || key === 'funcionarios' || key === 'terceirizados' || key === 'turmas' || key === 'fornecedores') && fazendaAtiva) {
      baseList = baseList.filter(item => sameId(fieldId(item, 'fazenda'), fazendaAtiva.id));
    }
    if (key === 'transferencias' && fazendaAtiva) {
      baseList = baseList.filter(item => {
        const itemOrigem = fieldId(item, 'origem');
        const itemDestino = fieldId(item, 'destino');
        const activeFarmId = fazendaAtiva.id;
        const origemId = (itemOrigem && typeof itemOrigem === 'object') ? itemOrigem.id : itemOrigem;
        const destinoId = (itemDestino && typeof itemDestino === 'object') ? itemDestino.id : itemDestino;
        return sameId(origemId, activeFarmId) || sameId(destinoId, activeFarmId);
      });
    }

    if (key === 'estoque') {
      if (fazendaAtiva) {
        baseList = baseList.filter(item => 
          sameId(fieldId(item, 'fazenda'), fazendaAtiva.id) ||
          (item.tipo_movimento === 'TRANSFERENCIA' && (
            sameId(fieldId(item, 'origem_transferencia'), fazendaAtiva.id) ||
            sameId(fieldId(item, 'destino_transferencia'), fazendaAtiva.id)
          ))
        );
      }
      if (selectedEstoqueProduto) {
        baseList = baseList.filter(item => sameId(fieldId(item, 'produto'), selectedEstoqueProduto));
      } else {
        baseList = [];
      }
      if (estoqueDataInicio) {
        baseList = baseList.filter(item => item.data_movimento >= estoqueDataInicio);
      }
      if (estoqueDataFim) {
        baseList = baseList.filter(item => item.data_movimento <= estoqueDataFim);
      }
    }

    if (!query) return baseList;
    return baseList.filter((item) => getText(item).toLowerCase().includes(query));
  };

  const getActiveTabGetText = useCallback((tab) => {
    switch (tab) {
      case 'proprietarios':
        return (item) => `${item.nome} ${item.documento || ''} ${item.cidade || ''}`;
      case 'fazendas':
        return (item) => `${item.nome} ${item.sigla || ''} ${item.cnpj_ou_produtor || ''} ${item.cidade || ''}`;
      case 'safras':
        return (item) => item.nome || '';
      case 'talhoes':
        return (item) => `${item.codigo} ${item.nome}`;
      case 'maquinas':
        return (item) => `${item.codigo} ${item.descricao}`;
      case 'funcionarios':
        return (item) => `${item.nome} ${item.cargo || ''}`;
      case 'terceirizados':
        return (item) => `${item.nome} ${item.documento || ''}`;
      case 'turmas':
        return (item) => `${item.nome} ${item.responsavel || ''}`;
      case 'fornecedores':
        return (item) => `${item.nome} ${item.documento || ''} ${item.email || ''}`;
      case 'produtos':
        return (item) => `${item.codigo || ''} ${item.nome_comercial}`;
      case 'usuarios':
        return (item) => `${item.username} ${item.email} ${item.first_name} ${item.last_name}`;
      case 'referencias':
        if (selectedRefTab === 'unidadesMedida') return (item) => `${item.sigla} ${item.nome}`;
        if (selectedRefTab === 'contasGerenciais') return (item) => `${item.codigo} ${item.nome}`;
        return (item) => item.nome || '';
      case 'locacoes_maquinas':
        return (item) => `${item.maquina_codigo || ''} ${item.tipo_cobranca || ''} ${item.observacao || ''}`;
      case 'transferencias':
        return (item) => `${item.tipo_ativo || ''} ${item.maquina_codigo || ''} ${item.funcionario_nome || ''} ${item.produto_nome || ''} ${item.observacao || ''}`;
      default:
        return (item) => `${item.produto_nome || ''} ${item.tipo_movimento}`;
    }
  }, [selectedRefTab]);

  const renderFormFields = () => {
    if (activeTab === 'proprietarios') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <InputField required label="Nome / Razão Social" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          </div>
          <InputField label="CPF / CNPJ" value={currentForm.documento} onChange={(value) => patchForm('documento', value)} />
          <InputField required label="E-mail" type="email" value={currentForm.email} onChange={(value) => patchForm('email', value)} />
          <InputField label="Celular" value={currentForm.celular} onChange={(value) => patchForm('celular', value)} mask="telefone" maxLength={15} placeholder="(00) 00000-0000" />
          <InputField label="CEP" value={currentForm.cep} onChange={(value) => patchForm('cep', value)} mask="cep" maxLength={9} placeholder="00000-000" />
          <div className="md:col-span-2">
            <InputField label="Endereço" value={currentForm.endereco} onChange={(value) => patchForm('endereco', value)} />
          </div>
          <InputField label="Bairro" value={currentForm.bairro} onChange={(value) => patchForm('bairro', value)} />
          <InputField label="Cidade / UF" value={currentForm.cidade} onChange={(value) => patchForm('cidade', value)} />
        </div>
      );
    }

    if (activeTab === 'fazendas') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isSuperUsuario && (
            <SelectField key="proprietario" required label="Proprietário" value={currentForm.proprietario} onChange={(value) => patchForm('proprietario', value)} options={records.proprietarios.map((item) => ({ value: item.id, label: item.nome }))} />
          )}
          <InputField key="cnpj_ou_produtor" label="CNPJ / Código Produtor Rural" value={currentForm.cnpj_ou_produtor} onChange={(value) => patchForm('cnpj_ou_produtor', value)} />

          <InputField key="nome" required label="Nome da Fazenda" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          <InputField key="sigla" required label="Sigla" value={currentForm.sigla} onChange={(value) => patchForm('sigla', value.toUpperCase())} placeholder="BR" />

          <InputField key="endereco" label="Endereço" value={currentForm.endereco} onChange={(value) => patchForm('endereco', value)} />
          <InputField key="cidade" label="Cidade" value={currentForm.cidade} onChange={(value) => patchForm('cidade', value)} />

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <InputField key="cep" label="CEP" value={currentForm.cep} onChange={(value) => patchForm('cep', value)} mask="cep" maxLength={9} placeholder="00000-000" />
            </div>
            <div className="md:col-span-2">
              <InputField key="estado" label="Estado" value={currentForm.estado} onChange={(value) => patchForm('estado', value)} maxLength={2} placeholder="MG" />
            </div>
            <div className="md:col-span-6">
              <InputField key="telefone" label="Telefone" value={currentForm.telefone} onChange={(value) => patchForm('telefone', value)} mask="telefone" maxLength={15} placeholder="(00) 00000-0000" />
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'safras') {
      return (
        <>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField required label="Código" value={currentForm.codigo} onChange={(value) => patchForm('codigo', value)} />
          <InputField required label="Nome do Talhão" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          <InputField required label="Área (ha)" type="number" value={currentForm.area} onChange={(value) => patchForm('area', value)} />
          <SelectField required label="Irrigação" value={currentForm.tipo_irrigacao} onChange={(value) => patchForm('tipo_irrigacao', value)} options={refOptions('tiposIrrigacao')} />
          <SelectField required label="Cultura" value={currentForm.cultura} onChange={(value) => patchForm('cultura', value)} options={refOptions('culturas')} />
          <SelectField label="Status Cultivo" value={currentForm.status_cultivo} onChange={(value) => patchForm('status_cultivo', value)} options={refOptions('statusCultivo')} />
          <SelectField label="Resistência Ferrugem" value={currentForm.resistencia_ferrugem} onChange={(value) => patchForm('resistencia_ferrugem', value)} options={refOptions('resistenciasFerrugem')} />
          <div className="md:col-span-2">
            <InputField label="Material Genético" value={currentForm.material_genetico} onChange={(value) => patchForm('material_genetico', value)} />
          </div>
        </div>
      );
    }

    if (activeTab === 'maquinas') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField required label="Código / Frota" value={currentForm.codigo} onChange={(value) => patchForm('codigo', value)} />
          <div className="md:col-span-2">
            <InputField required label="Descrição" value={currentForm.descricao} onChange={(value) => patchForm('descricao', value)} />
          </div>
          <InputField label="Marca" value={currentForm.marca} onChange={(value) => patchForm('marca', value)} />
          <InputField label="Modelo" value={currentForm.modelo} onChange={(value) => patchForm('modelo', value)} />
          <InputField label="Ano Fabricação" type="number" value={currentForm.ano_fabricacao} onChange={(value) => patchForm('ano_fabricacao', value)} />
          <InputField label="Horímetro Inicial (h)" type="number" step="any" value={currentForm.horimetro_inicial} onChange={(value) => patchForm('horimetro_inicial', value)} />
          <SelectField required label="Tipo" value={currentForm.tipo} onChange={(value) => patchForm('tipo', value)} options={refOptions('tiposMaquina')} />
          <SelectField required label="Propriedade da Máquina" value={currentForm.propria === false ? 'false' : 'true'} onChange={(value) => patchForm('propria', value === 'true')} options={[{ value: 'true', label: 'PRÓPRIA' }, { value: 'false', label: 'ALUGADA' }]} />
        </div>
      );
    }


    if (activeTab === 'locacoes_maquinas') {
      const maquinasOptions = refOptions('tiposMaquina');
      const quantidadeLabel = currentForm.tipo_cobranca === 'HORA'
        ? 'Horas Previstas'
        : currentForm.tipo_cobranca === 'DIA'
          ? 'Dias Previstos'
          : currentForm.tipo_cobranca === 'MES'
            ? 'Meses Previstos'
            : 'Quantidade Prevista';
      const updateRentalField = (field, value) => {
        if (field === 'tipo_cobranca') {
          setForms((prev) => {
            const rental = { ...prev.locacoes_maquinas, tipo_cobranca: value };
            if (value === 'DIA') {
              rental.data_fim = addDaysToDate(rental.data_inicio, rental.quantidade) || rental.data_fim;
            }
            return { ...prev, locacoes_maquinas: rental };
          });
          return;
        }

        if (field === 'quantidade' || field === 'data_inicio') {
          setForms((prev) => {
            const rental = { ...prev.locacoes_maquinas, [field]: value };
            if (rental.tipo_cobranca === 'DIA') {
              rental.data_fim = addDaysToDate(rental.data_inicio, rental.quantidade) || rental.data_fim;
            }
            return { ...prev, locacoes_maquinas: rental };
          });
          return;
        }

        patchForm(field, value);
      };

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField required label="Tipo de Máquina" value={currentForm.maquina} onChange={(value) => patchForm('maquina', value)} options={maquinasOptions} />
          <SelectField required label="Tipo de Cobrança" value={currentForm.tipo_cobranca} onChange={(value) => updateRentalField('tipo_cobranca', value)} options={[{ value: 'DIA', label: 'DIÁRIA' }, { value: 'HORA', label: 'HORA' }, { value: 'MES', label: 'MÊS' }, { value: 'OUTRO', label: 'OUTRO' }]} />
          <InputField label={quantidadeLabel} type="number" step={currentForm.tipo_cobranca === 'DIA' ? '1' : 'any'} value={currentForm.quantidade} onChange={(value) => updateRentalField('quantidade', value)} />
          <InputField required label="Tarifa Estimada (R$)" type="number" step="any" value={currentForm.valor_unitario} onChange={(value) => patchForm('valor_unitario', value)} />
          <InputField required label="Data Início" type="date" value={currentForm.data_inicio} onChange={(value) => updateRentalField('data_inicio', value)} />
          <InputField required label="Término Previsto" type="date" value={currentForm.data_fim} onChange={(value) => patchForm('data_fim', value)} />
          <div className="md:col-span-2">
            <InputField label="Observação" value={currentForm.observacao} onChange={(value) => patchForm('observacao', value)} />
          </div>
          <p className="md:col-span-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-300">
            A conta a pagar será criada somente quando a locação for encerrada, usando a quantidade efetiva, o valor final e a data prevista para pagamento.
          </p>
        </div>
      );
    }

    if (activeTab === 'transferencias') {
      const origemId = currentForm.origem;
      
      const maquinasOrigemOptions = (records.maquinas || [])
        .filter(m => sameId(fieldId(m, 'fazenda'), origemId))
        .map(m => ({ value: m.id, label: `${m.codigo} - ${m.descricao}` }));

      const funcionariosOrigemOptions = (records.funcionarios || [])
        .filter(f => sameId(fieldId(f, 'fazenda'), origemId))
        .map(f => ({ value: f.id, label: f.nome }));

      const produtosOptions = (records.produtos || [])
        .map(p => ({ value: p.id, label: p.nome_comercial }));

      const origemOptions = (records.fazendas || [])
        .filter(f => sameId(f.id, fazendaAtiva?.id) || (editingId && sameId(f.id, currentForm.origem)))
        .map(f => ({ value: f.id, label: `${f.nome}${f.sigla ? ` (${f.sigla})` : ''}` }));

      const destinoOptions = (records.fazendas || [])
        .filter(f => {
          const isSameOwner = sameId(f.proprietario || f.proprietario_id, fazendaAtiva?.proprietario || fazendaAtiva?.proprietario_id);
          const isNotActiveFarm = !sameId(f.id, fazendaAtiva?.id);
          const isOriginalDest = editingId && sameId(f.id, currentForm.destino);
          return (isSameOwner && isNotActiveFarm) || isOriginalDest;
        })
        .map(f => ({ value: f.id, label: `${f.nome}${f.sigla ? ` (${f.sigla})` : ''}` }));

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField required label="Tipo de Ativo" value={currentForm.tipo_ativo} onChange={(value) => {
            patchForm('tipo_ativo', value);
            patchForm('maquina', '');
            patchForm('funcionario', '');
            patchForm('produto', '');
          }} options={[{ value: 'MAQUINA', label: 'MÁQUINA' }, { value: 'FUNCIONARIO', label: 'FUNCIONÁRIO' }, { value: 'PRODUTO', label: 'PRODUTO / INSUMO' }]} />
          
          <InputField required label="Data da Transferência" type="date" value={currentForm.data_transferencia} onChange={(value) => patchForm('data_transferencia', value)} />
          
          <SelectField required label="Fazenda de Origem" value={currentForm.origem} onChange={(value) => {
            patchForm('origem', value);
            patchForm('maquina', '');
            patchForm('funcionario', '');
          }} options={origemOptions} />
          
          <SelectField required label="Fazenda de Destino" value={currentForm.destino} onChange={(value) => patchForm('destino', value)} options={destinoOptions} />

          {currentForm.tipo_ativo === 'MAQUINA' && (
            <div className="md:col-span-2">
              <SelectField required label="Máquina" value={currentForm.maquina} onChange={(value) => patchForm('maquina', value)} options={maquinasOrigemOptions} />
            </div>
          )}

          {currentForm.tipo_ativo === 'FUNCIONARIO' && (
            <div className="md:col-span-2">
              <SelectField required label="Funcionário" value={currentForm.funcionario} onChange={(value) => patchForm('funcionario', value)} options={funcionariosOrigemOptions} />
            </div>
          )}

          {currentForm.tipo_ativo === 'PRODUTO' && (
            <>
              <SelectField required label="Produto / Insumo" value={currentForm.produto} onChange={(value) => patchForm('produto', value)} options={produtosOptions} />
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <InputField required label="Quantidade" type="number" step="any" value={currentForm.quantidade} onChange={(value) => patchForm('quantidade', value)} />
                <InputField label="Valor Unitário (R$)" type="number" step="any" value={currentForm.valor_unitario} onChange={(value) => patchForm('valor_unitario', value)} />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <InputField label="Observação" value={currentForm.observacao} onChange={(value) => patchForm('observacao', value)} />
          </div>
        </div>
      );
    }

    if (activeTab === 'funcionarios') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField required label="Nome" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          <InputField label="CPF" value={currentForm.cpf} onChange={(value) => patchForm('cpf', value)} />
          <InputField label="Cargo" value={currentForm.cargo} onChange={(value) => patchForm('cargo', value)} />
          <SelectField required label="Grupo Trabalhador" value={currentForm.grupo_trabalhador} onChange={(value) => patchForm('grupo_trabalhador', value)} options={refOptions('gruposTrabalhador')} />
          <InputField label="E-mail" type="email" value={currentForm.email} onChange={(value) => patchForm('email', value)} />
          <InputField required label="Salário Base / Custo Mensal (R$)" type="number" step="any" value={currentForm.salario} onChange={(value) => patchForm('salario', value)} />
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={currentForm.criar_usuario || false} onChange={(event) => patchForm('criar_usuario', event.target.checked)} className="h-4 w-4 rounded border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/50 text-emerald-500" />
              Criar usuário para este funcionário
            </label>
          </div>
        </div>
      );
    }

    if (activeTab === 'terceirizados') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField required label="Nome / Empresa" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          <InputField label="Cargo / Função" value={currentForm.cargo} onChange={(value) => patchForm('cargo', value)} />
          <InputField label="CPF / CNPJ" value={currentForm.documento} onChange={(value) => patchForm('documento', value)} />
          <InputField required label="Salário / Custo Mensal (R$)" type="number" step="any" value={currentForm.salario} onChange={(value) => patchForm('salario', value)} />
        </div>
      );
    }

    if (activeTab === 'turmas') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField required label="Nome da Turma" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          <InputField label="Responsável" value={currentForm.responsavel} onChange={(value) => patchForm('responsavel', value)} />
          <InputField label="Quantidade de Pessoas" type="number" value={currentForm.qtd_pessoas} onChange={(value) => patchForm('qtd_pessoas', value)} />
        </div>
      );
    }

    if (activeTab === 'produtos') {
      const saldoItem = (records.saldos || []).find((s) => sameId(s.produto_id, editingId));
      const currentStockQty = saldoItem ? Number(saldoItem.saldo) : 0;

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Código" value={currentForm.codigo} onChange={(value) => patchForm('codigo', value)} />
          <InputField required label="Nome Comercial" value={currentForm.nome_comercial} onChange={(value) => patchForm('nome_comercial', value)} />
          <SelectField required label="Unidade" value={currentForm.unidade} onChange={(value) => patchForm('unidade', value)} options={refOptions('unidadesMedida', (item) => `${item.sigla} - ${item.nome}`)} />
          <SelectField required label="Classificação" value={currentForm.classificacao} onChange={(value) => patchForm('classificacao', value)} options={refOptions('classificacoesProduto')} />
          <SelectField label="Grupo Químico" value={currentForm.grupo_quimico} onChange={(value) => patchForm('grupo_quimico', value)} options={refOptions('gruposQuimico')} />
          <InputField label="Concentração" value={currentForm.concentracao} onChange={(value) => patchForm('concentracao', value)} />
          <InputField label="Período de Carência (dias)" type="number" value={currentForm.periodo_carencia} onChange={(value) => patchForm('periodo_carencia', value)} />
          <InputField label="Alvo" value={currentForm.alvo} onChange={(value) => patchForm('alvo', value)} />
          {editingId ? (
            <InputField label="Quantidade Atual em Estoque" type="number" value={currentStockQty} disabled onChange={() => {}} />
          ) : (
            <>
              <InputField label="Quantidade Inicial em Estoque" type="number" value={currentForm.quantidade_inicial || ''} onChange={(value) => patchForm('quantidade_inicial', value)} />
              <InputField label="Valor Unitário Inicial (R$)" type="number" value={currentForm.valor_unitario_inicial || ''} onChange={(value) => patchForm('valor_unitario_inicial', value)} />
            </>
          )}
        </div>
      );
    }

    if (activeTab === 'fornecedores') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField required label="Razão Social / Nome" value={currentForm.nome} onChange={(value) => patchForm('nome', value)} />
          <InputField label="CNPJ / CPF" value={currentForm.documento} onChange={(value) => patchForm('documento', value)} mask="documento" maxLength={18} placeholder="00.000.000/0000-00" />
          <InputField label="Endereço" value={currentForm.endereco} onChange={(value) => patchForm('endereco', value)} />
          <InputField label="Bairro" value={currentForm.bairro} onChange={(value) => patchForm('bairro', value)} />
          <InputField label="Cidade" value={currentForm.cidade} onChange={(value) => patchForm('cidade', value)} />
          <InputField label="Estado (UF)" maxLength={2} value={currentForm.estado} onChange={(value) => patchForm('estado', value)} placeholder="MG" />
          <InputField label="Celular / Telefone" mask="telefone" value={currentForm.telefone} onChange={(value) => patchForm('telefone', value)} maxLength={15} placeholder="(00) 00000-0000" />
          <InputField label="E-mail" type="email" value={currentForm.email} onChange={(value) => patchForm('email', value)} placeholder="fornecedor@empresa.com" />
          {editingId && (
            <InputField label="Data da Última Compra" type="date" disabled value={currentForm.data_ultima_compra || ''} onChange={() => {}} />
          )}
        </div>
      );
    }

    if (activeTab === 'usuarios') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField required label="Nome de Usuário" value={currentForm.username} onChange={(value) => patchForm('username', value)} placeholder="Ex: JOAO.SILVA" />
          <InputField required label="E-mail" type="email" value={currentForm.email} onChange={(value) => patchForm('email', value)} placeholder="Ex: joao@empresa.com" />
          <InputField required label="Primeiro Nome" value={currentForm.first_name} onChange={(value) => patchForm('first_name', value)} />
          <InputField required label="Sobrenome" value={currentForm.last_name} onChange={(value) => patchForm('last_name', value)} />
          <InputField label="Senha" type="password" value={currentForm.password} onChange={(value) => patchForm('password', value)} placeholder={editingId ? "Deixe em branco para não alterar" : "Senha do usuário (padrão: 12345)"} />
          <SelectField required label="Perfil / Cargo" value={currentForm.perfil_id} onChange={(value) => patchForm('perfil_id', value)} options={(records.perfis || []).map((p) => ({ value: p.id, label: p.nome }))} />

          <div className="md:col-span-2 block space-y-1.5 text-left">
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
        </div>
      );
    }

    if (activeTab === 'referencias') {
      const config = ALL_REFERENCES[selectedRefTab];
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.fields.map((field) => (
            <div key={field.name} className={config.fields.length === 1 ? "md:col-span-2" : ""}>
              <InputField
                required={field.required}
                label={field.label}
                type={field.type || 'text'}
                step={field.type === 'number' ? 'any' : undefined}
                value={currentForm[field.name] || ''}
                onChange={(value) => patchForm(field.name, value)}
              />
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'estoque') {
      const activeFarmId = fazendaAtiva?.id;
      const filteredProdutos = records.produtos.filter((item) => {
        const itemFarmId = item.fazenda_id || item.fazenda;
        return !itemFarmId || sameId(itemFarmId, activeFarmId);
      });

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField required label="Safra" value={currentForm.safra} onChange={(value) => patchForm('safra', value)} options={safrasOptions} />
          <SelectField required label="Produto" value={currentForm.produto} onChange={(value) => patchForm('produto', value)} options={filteredProdutos.map((item) => ({ value: item.id, label: item.nome_comercial }))} />
          <SelectField required label="Tipo Movimento" value={currentForm.tipo_movimento} onChange={(value) => patchForm('tipo_movimento', value)} options={[
            { value: 'ENTRADA', label: 'Entrada' },
            { value: 'SAIDA', label: 'Saída' },
            { value: 'AJUSTE', label: 'Ajuste' },
            { value: 'TRANSFERENCIA', label: 'Transferência' },
          ]} />
          <InputField required label="Quantidade" type="number" value={currentForm.quantidade} onChange={(value) => patchForm('quantidade', value)} />
          <InputField label="Valor Unitário" type="number" value={currentForm.valor_unitario} onChange={(value) => patchForm('valor_unitario', value)} />
          <InputField required label="Data Movimento" type="date" value={currentForm.data_movimento} onChange={(value) => patchForm('data_movimento', value)} />
          <div className="md:col-span-2">
            <InputField label="Documento" value={currentForm.documento_referencia} onChange={(value) => patchForm('documento_referencia', value)} />
          </div>
          {currentForm.tipo_movimento === 'TRANSFERENCIA' && (
            <>
              <SelectField label="Origem" value={currentForm.origem_transferencia} onChange={(value) => patchForm('origem_transferencia', value)} options={fazendasOptions} />
              <SelectField label="Destino" value={currentForm.destino_transferencia} onChange={(value) => patchForm('destino_transferencia', value)} options={fazendasOptions} />
            </>
          )}
        </div>
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
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {item.telefone ? formatMask(item.telefone, 'telefone') : 'Sem telefone'}
            </p>
            {(item.endereco || item.cep) && (
              <p className="text-[9px] text-slate-455 dark:text-slate-500 mt-0.5">
                {[item.endereco, item.cep ? `CEP: ${item.cep}` : ''].filter(Boolean).join(' - ')}
              </p>
            )}
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
          <td className="py-3 px-5 text-right">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.tipo_nome || 'Trator/Máquina'}</p>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">Horímetro Inicial: {Number(item.horimetro_inicial || 0).toLocaleString('pt-BR')} h</p>
          </td>
          <td className="py-3 px-5 text-center">
            <button
              type="button"
              onClick={() => {
                setMaintenanceMachine(item);
                setNewMaintenance({
                  data: new Date().toISOString().slice(0, 10),
                  data_vencimento: new Date().toISOString().slice(0, 10),
                  descricao: '',
                  valor: '',
                  nota_fiscal: ''
                });
              }}
              className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 mr-2 cursor-pointer"
              title="Manutenções"
            >
              <Wrench className="h-3.5 w-3.5" />
            </button>
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
          <td className="py-3 px-5 text-right">
            <div className="text-[10px] text-slate-600 dark:text-slate-455">{item.grupo_trabalhador_nome || 'Trabalhador Regular'}</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Salário: R$ {money(item.salario)}</div>
            <div className="text-[10px] font-semibold text-emerald-650 dark:text-emerald-450">Encargos: R$ {money(item.encargos)}</div>
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

    if (activeTab === 'terceirizados') {
      return filteredRows('terceirizados', (item) => `${item.nome} ${item.documento || ''} ${item.cargo || ''}`).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.nome}</p>
            <p className="text-[10px] text-slate-455 dark:text-slate-500">{lookup(records.fazendas, fieldId(item, 'fazenda'))}</p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">
            <p className="font-semibold">{item.documento || '-'}</p>
            {item.cargo && <p className="text-slate-450 dark:text-slate-400 mt-0.5">{item.cargo}</p>}
          </td>
          <td className="py-3 px-5 text-right">
            <div className="text-[10px] text-slate-650 dark:text-slate-455">{item.ativo === false ? 'Inativo' : 'Ativo'}</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Salário: R$ {money(item.salario)}</div>
            <div className="text-[10px] font-semibold text-emerald-650 dark:text-emerald-450">Encargos: R$ {money(item.encargos)}</div>
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

    if (activeTab === 'turmas') {
      return filteredRows('turmas', (item) => `${item.nome} ${item.responsavel || ''}`).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.nome}</p>
            <p className="text-[10px] text-slate-455 dark:text-slate-500">{lookup(records.fazendas, fieldId(item, 'fazenda'))}</p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">
            <p>Responsável: {item.responsavel || '-'}</p>
          </td>
          <td className="py-3 px-5 text-right text-xs font-bold text-slate-800 dark:text-white">
            {item.qtd_pessoas || 0}
            <p className="text-[9px] text-slate-450 dark:text-slate-500 font-normal">Pessoas na Panha</p>
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

    if (activeTab === 'produtos') {
      return filteredRows('produtos', (item) => `${item.codigo || ''} ${item.nome_comercial}`).map((item) => {
        const saldoItem = (records.saldos || []).find(s => sameId(s.produto_id, item.id));
        const qtdSaldo = saldoItem ? saldoItem.saldo : 0;
        
        return (
          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
            <td className="py-3 px-5">
              <p className="text-xs font-black text-slate-800 dark:text-white">{item.nome_comercial}</p>
              <p className="text-[10px] text-slate-455 dark:text-slate-500">{item.codigo || 'Sem código'}</p>
            </td>
            <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">{item.classificacao_nome || 'Insumo'}</td>
            <td className="py-3 px-5 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {Number(qtdSaldo).toLocaleString('pt-BR')} {item.unidade_sigla || item.unidade_nome || '-'}
            </td>
            <td className="py-3 px-5 text-center">
              <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
                {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
            </td>
          </tr>
        );
      });
    }

    if (activeTab === 'fornecedores') {
      return filteredRows('fornecedores', (item) => `${item.nome} ${item.documento || ''} ${item.email || ''}`).map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">{item.nome}</p>
            <p className="text-[10px] text-slate-455 dark:text-slate-500">Última compra: {item.data_ultima_compra ? new Date(item.data_ultima_compra + 'T00:00:00').toLocaleDateString('pt-BR') : 'Nenhuma compra'}</p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">
            <p className="font-semibold">{item.documento ? formatMask(item.documento, 'documento') : 'Sem documento'}</p>
            <p className="text-[9px] text-slate-450 dark:text-slate-400 mt-0.5">{[item.cidade, item.estado].filter(Boolean).join(' - ')}</p>
          </td>
          <td className="py-3 px-5 text-right text-[10px] text-slate-600 dark:text-slate-300 font-medium">
            <p className="font-medium text-slate-700 dark:text-slate-300">{item.telefone ? formatMask(item.telefone, 'telefone') : 'Sem telefone'}</p>
            <p className="text-[9px] text-slate-455 dark:text-slate-400 mt-0.5">{item.email || 'Sem e-mail'}</p>
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

    if (activeTab === 'referencias') {
      const list = filteredRows('referencias', (item) => {
        if (selectedRefTab === 'unidadesMedida') {
          return `${item.sigla} ${item.nome}`;
        }
        if (selectedRefTab === 'contasGerenciais') {
          return `${item.codigo} ${item.nome}`;
        }
        if (selectedRefTab === 'encargosFolha') {
          return `${item.descricao} ${item.valor}`;
        }
        return item.nome || item.descricao || '';
      });

      return list.map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
          <td className="py-3 px-5">
            <p className="text-xs font-black text-slate-800 dark:text-white">
              {item.nome || item.descricao || ''}
            </p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300 font-mono">
            {selectedRefTab === 'unidadesMedida' ? `SIGLA: ${item.sigla || '-'}` : 
             selectedRefTab === 'contasGerenciais' ? `CÓDIGO: ${item.codigo || '-'}` : 
             selectedRefTab === 'encargosFolha' ? `VALOR: ${Number(item.valor || 0).toLocaleString('pt-BR')}%` : '-'}
          </td>
          <td className="py-3 px-5 text-right text-[10px] text-slate-600 dark:text-slate-300 font-bold">
            {item.ativo !== false ? 'ATIVO' : 'INATIVO'}
          </td>
          <td className="py-3 px-5 text-center">
            {isSuperUsuario ? (
              <>
                <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 mr-2 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
                  {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>
              </>
            ) : (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Somente leitura</span>
            )}
          </td>
        </tr>
      ));
    }

    if (activeTab === 'locacoes_maquinas') {
      return filteredRows('locacoes_maquinas', getActiveTabGetText('locacoes_maquinas')).map((item) => (
        <tr key={item.id} className={`${item.em_atraso ? 'bg-amber-50/70 dark:bg-amber-950/10' : ''} hover:bg-slate-50/50 dark:hover:bg-white/[0.01]`}>
          <td className="py-3 px-5">
            <div className="flex items-center gap-2">
              <p className="text-xs font-black text-slate-800 dark:text-white">
                {item.maquina_codigo || lookup(refs.tiposMaquina, fieldId(item, 'maquina'))}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${item.status === 'ENCERRADA' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : item.em_atraso ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'}`}>
                {item.em_atraso ? `VENCIDA HÁ ${item.dias_atraso} DIA(S)` : item.status || 'ABERTA'}
              </span>
            </div>
            <p className="text-[10px] text-slate-455 dark:text-slate-500">
              Período: {item.data_inicio} a {item.data_fim}
            </p>
          </td>
          <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">
            Cobrança por {item.tipo_cobranca || 'DIA'}
            <p>{item.quantidade ? `${item.quantidade} previsto(s) × R$ ${money(item.valor_unitario)}` : `Tarifa: R$ ${money(item.valor_unitario)}`}</p>
          </td>
          <td className="py-3 px-5 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {item.status === 'ENCERRADA' ? `R$ ${money(item.valor_final)}` : `Estimado: R$ ${money(item.valor_total)}`}
            <p className="text-[9px] text-slate-450 font-normal">
              {item.status === 'ENCERRADA' ? `Pagamento: ${item.data_vencimento}` : `${item.prorrogacoes || 0} prorrogação(ões)`}
            </p>
          </td>
          <td className="py-3 px-5 text-center">
            {item.status === 'ABERTA' && (
              <div className="flex justify-center gap-1.5">
                <button type="button" onClick={() => openRentalClose(item)} className="rounded-lg border border-emerald-300 px-2 py-1 text-[10px] font-black text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30">Encerrar</button>
                <button type="button" onClick={() => openRentalExtension(item)} className="rounded-lg border border-sky-300 px-2 py-1 text-[10px] font-black text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950/30">Prorrogar</button>
                <button type="button" onClick={() => handleStartEdit(item)} className="p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 cursor-pointer" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </td>
        </tr>
      ));
    }

    if (activeTab === 'transferencias') {
      return filteredRows('transferencias', getActiveTabGetText('transferencias')).map((item) => {
        let descricaoAtivo = '';
        if (item.tipo_ativo === 'MAQUINA') {
          descricaoAtivo = item.maquina_codigo || lookup(records.maquinas, fieldId(item, 'maquina'));
        } else if (item.tipo_ativo === 'FUNCIONARIO') {
          descricaoAtivo = item.funcionario_nome || lookup(records.funcionarios, fieldId(item, 'funcionario'));
        } else {
          descricaoAtivo = item.produto_nome || lookup(records.produtos, fieldId(item, 'produto'));
        }
        
        return (
          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
            <td className="py-3 px-5">
              <p className="text-xs font-black text-slate-800 dark:text-white uppercase">
                {item.tipo_ativo || 'Ativo'}
              </p>
              <p className="text-[10px] font-bold text-slate-655 dark:text-slate-300">
                {descricaoAtivo}
              </p>
            </td>
            <td className="py-3 px-5 text-[10px] text-slate-655 dark:text-slate-300">
              Origem: {item.origem_nome || lookup(records.fazendas, fieldId(item, 'origem'))} → Destino: {item.destino_nome || lookup(records.fazendas, fieldId(item, 'destino'))}
            </td>
            <td className="py-3 px-5 text-right text-xs font-bold text-slate-600 dark:text-slate-350">
              {item.data_transferencia || item.data_movimento}
              {item.quantidade && <p className="text-[9px] text-teal-500 font-bold">{Number(item.quantidade).toLocaleString('pt-BR')} unidades</p>}
            </td>
            <td className="py-3 px-5 text-center">
              <button type="button" onClick={() => handleToggleAtivo(item)} className={`p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 cursor-pointer ${item.ativo !== false ? 'hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500' : 'hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500'}`} title={item.ativo !== false ? 'Desativar' : 'Reativar'}>
                {item.ativo !== false ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
            </td>
          </tr>
        );
      });
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
        <div className="mb-6 p-4 rounded-xl border border-rose-200 dark:border-rose-950/20 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-sm font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <p>{error}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setError('')} 
            className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 font-black cursor-pointer text-base px-2 focus:outline-none"
            title="Fechar"
          >
            ✕
          </button>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-200 dark:border-emerald-950/20 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p>{success}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setSuccess('')} 
            className="text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-200 font-black cursor-pointer text-base px-2 focus:outline-none"
            title="Fechar"
          >
            ✕
          </button>
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
                                if (item.targetView) {
                                  setActiveView(item.targetView, item.targetSubTab);
                                  return;
                                }
                                setActiveTab(item.id);
                                setSearchQuery('');
                                setShowInactiveOnly(false); // Reset to active list on tab change
                                setSelectedEstoqueProduto('');
                                setEstoqueDataInicio('');
                                setEstoqueDataFim('');
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
        </aside>

        {/* Unified Full-Width List & Modal Area */}
        <main className="lg:col-span-9 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/60 pb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-display">Gestão de {activeLabel}</h1>
            </div>

            {/* Novo Registro / Importar Safra button triggers */}
            {((activeTab !== 'referencias') || isSuperUsuario) && (
              <div className="flex items-center gap-3">
                {activeTab === 'produtos' && (
                  <button
                    onClick={() => {
                      setCopySourceSafraId('');
                      setCopyCarryStock(false);
                      setShowCopyModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-500/30 dark:border-emerald-550/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-xs font-bold uppercase transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Importar Safra</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingId(null);
                    resetForm();
                    setError('');
                    setSuccess('');
                    setShowModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Registro</span>
                </button>
              </div>
            )}
          </div>

          {overdueRentals.length > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-black">Existem {overdueRentals.length} locação(ões) de máquinas fora do período informado</h2>
                  <p className="mt-1 text-xs font-semibold text-amber-800 dark:text-amber-300">Escolha encerrar o aluguel para gerar o contas a pagar ou prorrogue o prazo.</p>
                  <div className="mt-3 space-y-2">
                    {overdueRentals.map((item) => (
                      <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-white/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-slate-950/30">
                        <span className="text-xs font-bold">{item.maquina_codigo || item.maquina_descricao} · vencida há {item.dias_atraso} dia(s)</span>
                        <span className="flex gap-2">
                          <button type="button" onClick={() => openRentalClose(item)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-emerald-500">Encerrar</button>
                          <button type="button" onClick={() => openRentalExtension(item)} className="rounded-lg border border-sky-400 px-3 py-1.5 text-[10px] font-black uppercase text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/30">Prorrogar</button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Painel de Filtros de Movimentação de Estoque */}
          {activeTab === 'estoque' && (
            <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-white/[0.06] bg-white dark:bg-slate-900/40 shadow-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
              
              {/* Produto Select */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                  Produto para consulta
                </label>
                <select
                  value={selectedEstoqueProduto}
                  onChange={(e) => setSelectedEstoqueProduto(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white outline-none transition-all font-bold cursor-pointer h-10"
                >
                  <option value="" className="text-slate-450 dark:text-slate-500">SELECIONE O PRODUTO...</option>
                  {(records.produtos || [])
                    .filter(p => p.ativo !== false)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome_comercial} {p.codigo ? `(${p.codigo})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Safra Select */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                  Cultura / Safra
                </label>
                <select
                  value={safraAtiva?.id || ''}
                  onChange={(e) => {
                    const selected = (records.safras || []).find(s => sameId(s.id, e.target.value));
                    if (selected) selecionarSafra(selected);
                  }}
                  className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white outline-none transition-all font-bold cursor-pointer h-10"
                >
                  {safrasOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Período */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5 truncate">
                    De
                  </label>
                  <input
                    type="date"
                    value={estoqueDataInicio}
                    onChange={(e) => setEstoqueDataInicio(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white outline-none transition-all h-10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5 truncate">
                    Até
                  </label>
                  <input
                    type="date"
                    value={estoqueDataFim}
                    onChange={(e) => setEstoqueDataFim(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white outline-none transition-all h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search, Filter Tabs and Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 w-full md:max-w-xl">
              {/* Search Input */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Search className="h-4 w-4 text-slate-450 dark:text-slate-500" />
                </span>
                <input
                  type="text"
                  placeholder={`Pesquisar em ${activeLabel}...`}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.06] focus:border-emerald-500/40 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none transition-all"
                />
              </div>

              {activeTab === 'referencias' && (
                <div className="w-full md:w-64">
                  <select
                    value={selectedRefTab}
                    onChange={(e) => {
                      setSelectedRefTab(e.target.value);
                      setSearchQuery('');
                    }}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white outline-none transition-all font-bold cursor-pointer"
                  >
                    {Object.entries(ALL_REFERENCES)
                      .sort((a, b) => a[1].label.localeCompare(b[1].label))
                      .map(([key, val]) => (
                        <option key={key} value={key} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{val.label}</option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Premium Active/Inactive Toggle Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shrink-0">
              <button
                type="button"
                onClick={() => setShowInactiveOnly(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!showInactiveOnly
                    ? 'active-filter-button bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'inactive-filter-button text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white'
                  }`}
              >
                Ativos
              </button>
              <button
                type="button"
                onClick={() => setShowInactiveOnly(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${showInactiveOnly
                    ? 'active-filter-button bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-200 shadow-sm'
                    : 'inactive-filter-button text-slate-500 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-200'
                  }`}
              >
                Inativos
              </button>
            </div>
          </div>

          {/* Unified Full-Width Table */}
          {activeTab === 'estoque' && !selectedEstoqueProduto ? (
            <div className="glass-panel p-8 text-center rounded-2xl border border-slate-200/50 dark:border-white/[0.06] bg-white dark:bg-slate-900/40 shadow-xl backdrop-blur-md max-w-2xl mx-auto py-12 animate-in fade-in duration-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto mb-4">
                <Warehouse className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2">Consulta de Movimentações</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                Selecione um produto no painel de filtros acima para visualizar o histórico detalhado de movimentações (entradas, saídas, ajustes e transferências) no período desejado.
              </p>
            </div>
          ) : (
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
                   {!loading && filteredRows(activeTab, getActiveTabGetText(activeTab)).length === 0 && (
                    <tr><td colSpan="4" className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium italic">Nenhum registro localizado para os filtros informados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {rentalToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="app-modal-panel w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Encerrar locação de máquina</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{rentalToClose.maquina_codigo || rentalToClose.maquina_descricao} · cobrança por {rentalToClose.tipo_cobranca}</p>
              </div>
              <button type="button" onClick={() => setRentalToClose(null)} className="text-xl font-black text-slate-400 hover:text-slate-700 dark:hover:text-white">×</button>
            </div>

            <form onSubmit={handleCloseRental} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                required={rentalToClose.tipo_cobranca === 'HORA'}
                label={rentalToClose.tipo_cobranca === 'HORA' ? 'Horas Trabalhadas' : 'Quantidade Efetiva'}
                type="number"
                step="any"
                value={rentalCloseForm.quantidade_final}
                onChange={(value) => setRentalCloseForm((prev) => ({
                  ...prev,
                  quantidade_final: value,
                  valor_final: value ? (Number(value) * Number(rentalToClose.valor_unitario || 0)).toFixed(2) : prev.valor_final,
                }))}
              />
              <InputField required label="Valor Final do Aluguel (R$)" type="number" step="any" value={rentalCloseForm.valor_final} onChange={(value) => setRentalCloseForm((prev) => ({ ...prev, valor_final: value }))} />
              <InputField required label="Data de Encerramento" type="date" value={rentalCloseForm.data_encerramento} onChange={(value) => setRentalCloseForm((prev) => ({ ...prev, data_encerramento: value }))} />
              <InputField required label="Data Prevista para Pagamento" type="date" value={rentalCloseForm.data_vencimento} onChange={(value) => setRentalCloseForm((prev) => ({ ...prev, data_vencimento: value }))} />
              <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                Ao confirmar, a locação será encerrada e uma única conta a pagar será criada com o valor e vencimento informados.
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button type="button" onClick={() => setRentalToClose(null)} className="secondary-action-button rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancelar</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black uppercase text-white hover:bg-emerald-500 disabled:opacity-50">{saving ? 'Encerrando...' : 'Encerrar e Gerar Conta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rentalToExtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="app-modal-panel w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Prorrogar locação</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Prazo atual: {rentalToExtend.data_fim}</p>
            <form onSubmit={handleExtendRental} className="mt-5 space-y-4">
              <InputField required label="Nova Data de Término" type="date" value={rentalExtendDate} onChange={setRentalExtendDate} />
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button type="button" onClick={() => setRentalToExtend(null)} className="secondary-action-button rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancelar</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-black uppercase text-white hover:bg-sky-500 disabled:opacity-50">{saving ? 'Salvando...' : 'Prorrogar Prazo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL PARA CADASTRO / EDIÇÃO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`app-modal-panel w-full ${(activeTab === 'proprietarios' || activeTab === 'fazendas' || activeTab === 'usuarios' || activeTab === 'talhoes' || activeTab === 'maquinas' || activeTab === 'referencias' || activeTab === 'turmas' || activeTab === 'locacoes_maquinas' || activeTab === 'transferencias' || activeTab === 'funcionarios' || activeTab === 'terceirizados' || activeTab === 'fornecedores' || activeTab === 'produtos' || activeTab === 'estoque') ? 'max-w-2xl' : 'max-w-lg'} rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 relative animate-in scale-in duration-200`}>

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
                  setError('');
                  setSuccess('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {error && (
                <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-950/20 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              {renderFormFields()}

              {/* Actions inside Modal */}
              <div className="flex gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6">
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    resetForm();
                    setError('');
                    setSuccess('');
                  }}
                  className="secondary-action-button flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold uppercase transition-all cursor-pointer"
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

      {/* POPUP MODAL PARA IMPORTAR PRODUTOS DE OUTRA SAFRA */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 relative animate-in scale-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-emerald-500" />
                <span>Importar Produtos de Safra</span>
              </h2>
              <button
                onClick={() => {
                  setShowCopyModal(false);
                  setCopySourceSafraId('');
                  setCopyCarryStock(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCopySafra} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <SelectField
                    required
                    label="Safra de Origem"
                    value={copySourceSafraId}
                    onChange={setCopySourceSafraId}
                    options={otherSafrasOptions}
                    defaultOption="Selecione a safra de origem..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={copyCarryStock}
                      onChange={(event) => setCopyCarryStock(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/50 text-emerald-500"
                    />
                    Transportar saldos físicos para a nova safra
                  </label>
                </div>
              </div>

              {/* Actions inside Modal */}
              <div className="flex gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6">
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => {
                    setShowCopyModal(false);
                    setCopySourceSafraId('');
                    setCopyCarryStock(false);
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
                  {saving ? 'Importando...' : 'Confirmar Importação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL DEDICADO PARA MANUTENÇÃO DE MÁQUINAS */}
      {maintenanceMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 relative animate-in scale-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-500" />
                <span>Manutenções: {maintenanceMachine.codigo} - {maintenanceMachine.descricao}</span>
              </h2>
              <button
                onClick={() => setMaintenanceMachine(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Sub-form to Add Maintenance */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nova Manutenção</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InputField
                    label="Data da Manutenção"
                    type="date"
                    value={newMaintenance.data}
                    onChange={(val) => setNewMaintenance(prev => ({ ...prev, data: val }))}
                  />
                  <InputField
                    label="Vencimento do Pagamento"
                    type="date"
                    value={newMaintenance.data_vencimento}
                    onChange={(val) => setNewMaintenance(prev => ({ ...prev, data_vencimento: val }))}
                  />
                  <InputField
                    label="Valor (R$)"
                    type="number"
                    step="any"
                    value={newMaintenance.valor}
                    onChange={(val) => setNewMaintenance(prev => ({ ...prev, valor: val }))}
                  />
                  <InputField
                    label="Número da Nota Fiscal (NF)"
                    value={newMaintenance.nota_fiscal}
                    onChange={(val) => setNewMaintenance(prev => ({ ...prev, nota_fiscal: val }))}
                  />
                  <div className="md:col-span-2">
                    <InputField
                      label="O que foi realizado / Descrição"
                      value={newMaintenance.descricao}
                      onChange={(val) => setNewMaintenance(prev => ({ ...prev, descricao: val }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={savingMaintenance}
                    onClick={handleAddMaintenance}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 disabled:opacity-60 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    {savingMaintenance ? 'Registrando...' : 'Registrar Manutenção'}
                  </button>
                </div>
              </div>

              {/* Maintenance History List */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Histórico na Safra Ativa</p>
                {((records.manutencoes_maquinas || []).filter(m => sameId(m.maquina, maintenanceMachine.id) && m.ativo !== false)).length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50/50 dark:bg-slate-950/10 rounded-xl border border-slate-100 dark:border-slate-800/40">Nenhuma manutenção registrada nesta safra.</p>
                ) : (
                  <div className="overflow-hidden border border-slate-100 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                          <th className="py-2.5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Data</th>
                          <th className="py-2.5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Descrição / NF</th>
                          <th className="py-2.5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Vencimento</th>
                          <th className="py-2.5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Valor</th>
                          <th className="py-2.5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center w-12">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {((records.manutencoes_maquinas || []).filter(m => sameId(m.maquina, maintenanceMachine.id) && m.ativo !== false)).map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10">
                            <td className="py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {m.data ? new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="py-2.5 px-4 text-xs text-slate-500 dark:text-slate-400 uppercase break-all">
                              {m.descricao}{m.nota_fiscal ? ` (NF: ${m.nota_fiscal})` : ''}
                            </td>
                            <td className="py-2.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                              {m.data_vencimento ? new Date(m.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="py-2.5 px-4 text-xs font-black text-slate-800 dark:text-white text-right">
                              {Number(m.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteMaintenance(m.id)}
                                className="text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                                title="Excluir manutenção"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
