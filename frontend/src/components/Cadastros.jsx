import React, { useState, useEffect } from 'react';
import { relatorioService } from '../services/api';
import { 
  Building2, CalendarRange, Grid3X3, Users, FileSpreadsheet, 
  Plus, CheckCircle2, AlertCircle, Trash2, HelpCircle, 
  MapPin, Scale, ChevronRight, Search, ShieldAlert, BadgeInfo,
  UserCircle, Tractor, Package, Briefcase
} from 'lucide-react';

export const Cadastros = ({ currentSafraId }) => {
  const [activeTab, setActiveTab] = useState('proprietarios');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Loaded Entities State
  const [proprietarios, setProprietarios] = useState([]);
  const [fazendas, setFazendas] = useState([]);
  const [safras, setSafras] = useState([]);
  const [talhoes, setTalhoes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [terceirizados, setTerceirizados] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [ordensServico, setOrdensServico] = useState([]);

  // Form inputs state
  const [proprietarioForm, setProprietarioForm] = useState({ nome: '', cpf_cnpj: '' });
  const [fazendaForm, setFazendaForm] = useState({ nome: '', municipio: '', area_total: '', proprietario_id: '' });
  const [talhaoForm, setTalhaoForm] = useState({ fazenda_id: '', nome: '', area: '', solo: 'Argiloso' });
  const [maquinaForm, setMaquinaForm] = useState({ proprietario_id: '', nome: '', modelo: '', placa: '' });
  const [funcionarioForm, setFuncionarioForm] = useState({ proprietario_id: '', nome: '', cargo: '', taxa_horaria: '', tipo: 'PROPRIO' });
  const [terceirizadoForm, setTerceirizadoForm] = useState({ proprietario_id: '', nome: '', empresa: '', especialidade: '' });
  const [turmaForm, setTurmaForm] = useState({ proprietario_id: '', nome: '', lider_id: '' });
  const [produtoForm, setProdutoForm] = useState({ nome: '', categoria: 'Insumo', unidade: 'Kg' });
  const [safraForm, setSafraForm] = useState({ fazenda_id: '', nome: '', data_inicio: '', data_fim: '', ativa: false, custo_planejado: '' });
  const [osForm, setOsForm] = useState({ safra_id: '', tipo: 'Colheita Mecanizada', talhoes: [], funcionario_id: '', status: 'EM_ANDAMENTO', horas_trabalhadas: '' });

  // Load all database entities on mount and after changes
  const loadAllData = async () => {
    try {
      const f = await relatorioService.getFazendas().catch(() => []);
      const s = await relatorioService.getSafras().catch(() => []);
      const t = await relatorioService.getTalhoes().catch(() => []);
      const fn = await relatorioService.getFuncionarios().catch(() => []);
      const o = await relatorioService.getOrdensServico().catch(() => []);

      if (f?.length > 0) setFazendas(f);
      if (s?.length > 0) setSafras(s);
      if (t?.length > 0) setTalhoes(t);
      if (fn?.length > 0) setFuncionarios(fn);
      if (o?.length > 0) setOrdensServico(o);
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const triggerAlert = (type, message) => {
    if (type === 'error') {
      setError(message);
      setTimeout(() => setError(''), 4000);
    } else {
      setSuccess(message);
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  // Submit handlers (Local state updates for missing APIs to allow UI preview)
  const handleProprietarioSubmit = (e) => {
    e.preventDefault();
    if (!proprietarioForm.nome) return triggerAlert('error', 'Preencha o nome do Proprietário.');
    setProprietarios([...proprietarios, { ...proprietarioForm, id: Date.now() }]);
    triggerAlert('success', 'Proprietário cadastrado!');
    setProprietarioForm({ nome: '', cpf_cnpj: '' });
  };

  const handleFazendaSubmit = async (e) => {
    e.preventDefault();
    if (!fazendaForm.nome || !fazendaForm.proprietario_id) return triggerAlert('error', 'Nome e Proprietário são obrigatórios.');
    
    try {
      await relatorioService.createFazenda(fazendaForm);
      loadAllData();
    } catch {
      setFazendas([...fazendas, { ...fazendaForm, id: Date.now() }]); // Fallback mock
    }
    triggerAlert('success', 'Fazenda cadastrada!');
    setFazendaForm({ nome: '', municipio: '', area_total: '', proprietario_id: '' });
  };

  const handleTalhaoSubmit = async (e) => {
    e.preventDefault();
    if (!talhaoForm.nome || !talhaoForm.fazenda_id) return triggerAlert('error', 'Nome e Fazenda são obrigatórios.');
    try {
      await relatorioService.createTalhao(talhaoForm);
      loadAllData();
    } catch {
      setTalhoes([...talhoes, { ...talhaoForm, id: Date.now() }]);
    }
    triggerAlert('success', 'Talhão cadastrado!');
    setTalhaoForm({ fazenda_id: '', nome: '', area: '', solo: 'Argiloso' });
  };

  const handleMaquinaSubmit = (e) => {
    e.preventDefault();
    if (!maquinaForm.nome || !maquinaForm.proprietario_id) return triggerAlert('error', 'Nome e Proprietário obrigatórios.');
    setMaquinas([...maquinas, { ...maquinaForm, id: Date.now() }]);
    triggerAlert('success', 'Máquina cadastrada!');
    setMaquinaForm({ proprietario_id: '', nome: '', modelo: '', placa: '' });
  };

  const handleFuncionarioSubmit = async (e) => {
    e.preventDefault();
    if (!funcionarioForm.nome || !funcionarioForm.proprietario_id) return triggerAlert('error', 'Nome e Proprietário obrigatórios.');
    try {
      await relatorioService.createFuncionario(funcionarioForm);
      loadAllData();
    } catch {
      setFuncionarios([...funcionarios, { ...funcionarioForm, id: Date.now() }]);
    }
    triggerAlert('success', 'Funcionário cadastrado!');
    setFuncionarioForm({ proprietario_id: '', nome: '', cargo: '', taxa_horaria: '', tipo: 'PROPRIO' });
  };

  const handleTerceirizadoSubmit = (e) => {
    e.preventDefault();
    if (!terceirizadoForm.nome || !terceirizadoForm.proprietario_id) return triggerAlert('error', 'Nome e Proprietário obrigatórios.');
    setTerceirizados([...terceirizados, { ...terceirizadoForm, id: Date.now() }]);
    triggerAlert('success', 'Terceirizado cadastrado!');
    setTerceirizadoForm({ proprietario_id: '', nome: '', empresa: '', especialidade: '' });
  };

  const handleTurmaSubmit = (e) => {
    e.preventDefault();
    if (!turmaForm.nome || !turmaForm.proprietario_id) return triggerAlert('error', 'Nome e Proprietário obrigatórios.');
    setTurmas([...turmas, { ...turmaForm, id: Date.now() }]);
    triggerAlert('success', 'Turma cadastrada!');
    setTurmaForm({ proprietario_id: '', nome: '', lider_id: '' });
  };

  const handleProdutoSubmit = (e) => {
    e.preventDefault();
    if (!produtoForm.nome) return triggerAlert('error', 'Nome do produto obrigatório.');
    setProdutos([...produtos, { ...produtoForm, id: Date.now() }]);
    triggerAlert('success', 'Produto cadastrado!');
    setProdutoForm({ nome: '', categoria: 'Insumo', unidade: 'Kg' });
  };

  const handleSafraSubmit = async (e) => {
    e.preventDefault();
    if (!safraForm.fazenda_id || !safraForm.nome) return triggerAlert('error', 'Fazenda e Nome são obrigatórios.');
    try {
      await relatorioService.createSafra(safraForm);
      loadAllData();
    } catch {
      setSafras([...safras, { ...safraForm, id: Date.now() }]);
    }
    triggerAlert('success', 'Safra cadastrada!');
    setSafraForm({ fazenda_id: '', nome: '', data_inicio: '', data_fim: '', ativa: false, custo_planejado: '' });
  };

  const handleOsSubmit = async (e) => {
    e.preventDefault();
    if (!osForm.safra_id || !osForm.funcionario_id || osForm.talhoes.length === 0) {
      return triggerAlert('error', 'Selecione Safra, Responsável e Talhões.');
    }
    try {
      await relatorioService.createOrdemServico(osForm);
      loadAllData();
    } catch {
      setOrdensServico([...ordensServico, { ...osForm, id: Date.now() }]);
    }
    triggerAlert('success', 'OS registrada!');
    setOsForm({ safra_id: '', tipo: 'Colheita Mecanizada', talhoes: [], funcionario_id: '', status: 'EM_ANDAMENTO', horas_trabalhadas: '' });
  };

  const toggleTalhaoInOS = (talhaoNome) => {
    const isSelected = osForm.talhoes.includes(talhaoNome);
    if (isSelected) {
      setOsForm({ ...osForm, talhoes: osForm.talhoes.filter(t => t !== talhaoNome) });
    } else {
      setOsForm({ ...osForm, talhoes: [...osForm.talhoes, talhaoNome] });
    }
  };

  // Filters & Tabs helpers
  const tabGroups = [
    {
      title: 'Estrutura Fundiária',
      items: [
        { id: 'proprietarios', label: 'Proprietários', icon: UserCircle },
        { id: 'fazendas', label: 'Fazendas', icon: Building2 },
        { id: 'talhoes', label: 'Talhões / Glebas', icon: Grid3X3 },
      ]
    },
    {
      title: 'Ativos e Materiais',
      items: [
        { id: 'maquinas', label: 'Máquinas e Equip.', icon: Tractor },
        { id: 'produtos', label: 'Produtos e Insumos', icon: Package },
      ]
    },
    {
      title: 'Recursos Humanos',
      items: [
        { id: 'funcionarios', label: 'Funcionários', icon: Users },
        { id: 'terceirizados', label: 'Terceirizados', icon: Briefcase },
        { id: 'turmas', label: 'Turmas de Trabalho', icon: Users },
      ]
    },
    {
      title: 'Operacional e Execução',
      items: [
        { id: 'safras', label: 'Safras / Ciclos', icon: CalendarRange },
        { id: 'ordens_servico', label: 'Ordens de Serviço', icon: FileSpreadsheet },
      ]
    }
  ];

  const InputField = ({ label, value, onChange, type="text", placeholder="" }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
      />
    </div>
  );

  const SelectField = ({ label, value, onChange, options, defaultOption="Selecione..." }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">{label}</label>
      <select value={value} onChange={onChange} className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 rounded-xl py-2.5 px-3 text-sm text-white outline-none transition-all">
        <option value="" className="bg-slate-900 text-slate-500">{defaultOption}</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value} className="bg-slate-900 text-white">{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-950/20 bg-rose-950/30 text-rose-300 text-sm font-semibold flex items-center gap-3 animate-bounce-slow">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-950/20 bg-emerald-950/30 text-emerald-300 text-sm font-semibold flex items-center gap-3 animate-pulse">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar Tabs */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-4 px-2">
              Módulos de Cadastro
            </h3>
            <div className="flex flex-col space-y-4">
              {tabGroups.map((group, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 px-2">{group.title}</h4>
                  {group.items.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm font-bold transition-all focus:outline-none cursor-pointer ${
                          isActive 
                            ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 text-emerald-300 shadow-sm' 
                            : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span>{tab.label}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-90 text-emerald-400' : 'text-slate-600'}`} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-panel p-4.5 rounded-2xl border border-white/[0.06] bg-slate-900/40 text-xs text-slate-400 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <BadgeInfo className="w-4 h-4" />
              <span>Hierarquia Estrutural</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Máquinas e Funcionários pertencem ao <strong>Proprietário</strong>, podendo ser alocados em diferentes Fazendas e Talhões de forma dinâmica.
            </p>
          </div>
        </div>

        {/* Tab Panel Content */}
        <div className="lg:col-span-9 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight capitalize font-display">
                Gestão de {activeTab.replace('_', ' ')}
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Adicione novos registros e gerencie os dados estruturais do sistema.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Form Section */}
            <div className="md:col-span-4 glass-panel p-6 rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-md">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-5 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Novo Registro</span>
              </h2>

              {activeTab === 'proprietarios' && (
                <form onSubmit={handleProprietarioSubmit} className="space-y-4">
                  <InputField label="Nome / Razão Social" value={proprietarioForm.nome} onChange={e => setProprietarioForm({...proprietarioForm, nome: e.target.value})} placeholder="Ex: Agro Holding" />
                  <InputField label="CPF / CNPJ" value={proprietarioForm.cpf_cnpj} onChange={e => setProprietarioForm({...proprietarioForm, cpf_cnpj: e.target.value})} placeholder="000.000.000-00" />
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all mt-6 cursor-pointer">Salvar</button>
                </form>
              )}

              {activeTab === 'fazendas' && (
                <form onSubmit={handleFazendaSubmit} className="space-y-4">
                  <SelectField label="Proprietário" value={fazendaForm.proprietario_id} onChange={e => setFazendaForm({...fazendaForm, proprietario_id: e.target.value})} options={proprietarios.map(p => ({value: p.id, label: p.nome}))} />
                  <InputField label="Nome da Fazenda" value={fazendaForm.nome} onChange={e => setFazendaForm({...fazendaForm, nome: e.target.value})} placeholder="Ex: Fazenda Bela Vista" />
                  <InputField label="Município - UF" value={fazendaForm.municipio} onChange={e => setFazendaForm({...fazendaForm, municipio: e.target.value})} placeholder="Ex: Araguari - MG" />
                  <InputField label="Área Total (Ha)" type="number" value={fazendaForm.area_total} onChange={e => setFazendaForm({...fazendaForm, area_total: e.target.value})} placeholder="Ex: 850.50" />
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all mt-6 cursor-pointer">Salvar</button>
                </form>
              )}

              {activeTab === 'talhoes' && (
                <form onSubmit={handleTalhaoSubmit} className="space-y-4">
                  <SelectField label="Fazenda" value={talhaoForm.fazenda_id} onChange={e => setTalhaoForm({...talhaoForm, fazenda_id: e.target.value})} options={fazendas.map(f => ({value: f.id, label: f.nome}))} />
                  <InputField label="Identificação / Nome" value={talhaoForm.nome} onChange={e => setTalhaoForm({...talhaoForm, nome: e.target.value})} placeholder="Ex: Talhão A1" />
                  <InputField label="Área (Ha)" type="number" value={talhaoForm.area} onChange={e => setTalhaoForm({...talhaoForm, area: e.target.value})} placeholder="Ex: 240.00" />
                  <SelectField label="Tipo de Solo" value={talhaoForm.solo} onChange={e => setTalhaoForm({...talhaoForm, solo: e.target.value})} options={[{value:'Argiloso', label:'Argiloso'}, {value:'Misto', label:'Misto'}, {value:'Arenoso', label:'Arenoso'}]} />
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all mt-6 cursor-pointer">Salvar</button>
                </form>
              )}

              {activeTab === 'maquinas' && (
                <form onSubmit={handleMaquinaSubmit} className="space-y-4">
                  <SelectField label="Proprietário" value={maquinaForm.proprietario_id} onChange={e => setMaquinaForm({...maquinaForm, proprietario_id: e.target.value})} options={proprietarios.map(p => ({value: p.id, label: p.nome}))} />
                  <InputField label="Nome / Frota" value={maquinaForm.nome} onChange={e => setMaquinaForm({...maquinaForm, nome: e.target.value})} placeholder="Ex: Trator TR-01" />
                  <InputField label="Modelo" value={maquinaForm.modelo} onChange={e => setMaquinaForm({...maquinaForm, modelo: e.target.value})} placeholder="Ex: John Deere 8R" />
                  <InputField label="Placa / Chassi" value={maquinaForm.placa} onChange={e => setMaquinaForm({...maquinaForm, placa: e.target.value})} placeholder="Ex: ABC-1234" />
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all mt-6 cursor-pointer">Salvar</button>
                </form>
              )}

              {activeTab === 'funcionarios' && (
                <form onSubmit={handleFuncionarioSubmit} className="space-y-4">
                  <SelectField label="Proprietário" value={funcionarioForm.proprietario_id} onChange={e => setFuncionarioForm({...funcionarioForm, proprietario_id: e.target.value})} options={proprietarios.map(p => ({value: p.id, label: p.nome}))} />
                  <InputField label="Nome Completo" value={funcionarioForm.nome} onChange={e => setFuncionarioForm({...funcionarioForm, nome: e.target.value})} placeholder="Ex: João da Silva" />
                  <InputField label="Cargo / Função" value={funcionarioForm.cargo} onChange={e => setFuncionarioForm({...funcionarioForm, cargo: e.target.value})} placeholder="Ex: Operador" />
                  <InputField label="Taxa Horária (R$)" type="number" value={funcionarioForm.taxa_horaria} onChange={e => setFuncionarioForm({...funcionarioForm, taxa_horaria: e.target.value})} placeholder="Ex: 25.00" />
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all mt-6 cursor-pointer">Salvar</button>
                </form>
              )}

              {activeTab === 'terceirizados' && (
                <form onSubmit={handleTerceirizadoSubmit} className="space-y-4">
                  <SelectField label="Proprietário (Vinculo)" value={terceirizadoForm.proprietario_id} onChange={e => setTerceirizadoForm({...terceirizadoForm, proprietario_id: e.target.value})} options={proprietarios.map(p => ({value: p.id, label: p.nome}))} />
                  <InputField label="Nome / Contato" value={terceirizadoForm.nome} onChange={e => setTerceirizadoForm({...terceirizadoForm, nome: e.target.value})} placeholder="Ex: Carlos Mecânico" />
                  <InputField label="Empresa" value={terceirizadoForm.empresa} onChange={e => setTerceirizadoForm({...terceirizadoForm, empresa: e.target.value})} placeholder="Ex: AgroTech Serviços" />
                  <InputField label="Especialidade" value={terceirizadoForm.especialidade} onChange={e => setTerceirizadoForm({...terceirizadoForm, especialidade: e.target.value})} placeholder="Ex: Manutenção Mecânica" />
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all mt-6 cursor-pointer">Salvar</button>
                </form>
              )}

              {activeTab === 'turmas' && (
                <form onSubmit={handleTurmaSubmit} className="space-y-4">
                  <SelectField label="Proprietário" value={turmaForm.proprietario_id} onChange={e => setTurmaForm({...turmaForm, proprietario_id: e.target.value})} options={proprietarios.map(p => ({value: p.id, label: p.nome}))} />
                  <InputField label="Nome da Turma" value={turmaForm.nome} onChange={e => setTurmaForm({...turmaForm, nome: e.target.value})} placeholder="Ex: Turma de Colheita 01" />
                  <SelectField label="Líder (Funcionário)" value={turmaForm.lider_id} onChange={e => setTurmaForm({...turmaForm, lider_id: e.target.value})} options={funcionarios.map(f => ({value: f.id, label: f.nome}))} />
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all mt-6 cursor-pointer">Salvar</button>
                </form>
              )}

              {activeTab === 'produtos' && (
                <form onSubmit={handleProdutoSubmit} className="space-y-4">
                  <InputField label="Nome do Produto" value={produtoForm.nome} onChange={e => setProdutoForm({...produtoForm, nome: e.target.value})} placeholder="Ex: Ureia Agrícola" />
                  <SelectField label="Categoria" value={produtoForm.categoria} onChange={e => setProdutoForm({...produtoForm, categoria: e.target.value})} options={[{value:'Insumo',label:'Insumo'},{value:'Semente',label:'Semente'},{value:'Combustivel',label:'Combustível'},{value:'Peca',label:'Peça'}]} />
                  <SelectField label="Unidade de Medida" value={produtoForm.unidade} onChange={e => setProdutoForm({...produtoForm, unidade: e.target.value})} options={[{value:'Kg',label:'Quilograma (Kg)'},{value:'L',label:'Litro (L)'},{value:'Un',label:'Unidade (Un)'}]} />
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all mt-6 cursor-pointer">Salvar</button>
                </form>
              )}

              {activeTab === 'safras' && (
                <form onSubmit={handleSafraSubmit} className="space-y-4">
                  <SelectField label="Fazenda" value={safraForm.fazenda_id} onChange={e => setSafraForm({...safraForm, fazenda_id: e.target.value})} options={fazendas.map(f => ({value: f.id, label: f.nome}))} />
                  <InputField label="Nome da Safra" value={safraForm.nome} onChange={e => setSafraForm({...safraForm, nome: e.target.value})} placeholder="Ex: Safra 2025/2026" />
                  <InputField label="Data Início" type="date" value={safraForm.data_inicio} onChange={e => setSafraForm({...safraForm, data_inicio: e.target.value})} />
                  <InputField label="Data Término" type="date" value={safraForm.data_fim} onChange={e => setSafraForm({...safraForm, data_fim: e.target.value})} />
                  <InputField label="Orçamento (R$)" type="number" value={safraForm.custo_planejado} onChange={e => setSafraForm({...safraForm, custo_planejado: e.target.value})} />
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all mt-6 cursor-pointer">Salvar</button>
                </form>
              )}

              {activeTab === 'ordens_servico' && (
                <form onSubmit={handleOsSubmit} className="space-y-4">
                  <SelectField label="Safra" value={osForm.safra_id} onChange={e => setOsForm({...osForm, safra_id: e.target.value})} options={safras.map(s => ({value: s.id, label: s.nome}))} />
                  <SelectField label="Serviço" value={osForm.tipo} onChange={e => setOsForm({...osForm, tipo: e.target.value})} options={[{value:'Colheita Mecanizada',label:'Colheita'}, {value:'Pulverização e Tratos',label:'Pulverização'}, {value:'Adubação e Calagem',label:'Adubação'}]} />
                  <SelectField label="Responsável Executor" value={osForm.funcionario_id} onChange={e => setOsForm({...osForm, funcionario_id: e.target.value})} options={funcionarios.map(e => ({value: e.id, label: e.nome}))} />
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Talhões Alocados</label>
                    <div className="max-h-24 overflow-y-auto bg-slate-950/50 border border-white/[0.08] rounded-xl p-2 space-y-1.5 custom-scrollbar">
                      {talhoes.map(t => (
                        <label key={t.id} className="flex items-center space-x-2 text-xs text-slate-300 font-semibold cursor-pointer select-none">
                          <input type="checkbox" checked={osForm.talhoes.includes(t.nome)} onChange={() => toggleTalhaoInOS(t.nome)} className="w-3.5 h-3.5 rounded border-white/[0.08] bg-slate-950/50 text-emerald-500 focus:ring-emerald-500/30" />
                          <span>{t.nome}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <SelectField label="Status" value={osForm.status} onChange={e => setOsForm({...osForm, status: e.target.value})} options={[{value:'EM_ANDAMENTO',label:'Em Andamento'}, {value:'CONCLUIDA',label:'Concluída'}, {value:'CANCELADA',label:'Cancelada'}]} />
                  <InputField label="Horas Trabalhadas" type="number" value={osForm.horas_trabalhadas} onChange={e => setOsForm({...osForm, horas_trabalhadas: e.target.value})} />
                  
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold uppercase transition-all mt-6 cursor-pointer">Salvar OS</button>
                </form>
              )}
            </div>

            {/* List / Database Viewer Section */}
            <div className="md:col-span-8 space-y-4">
              
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar nesta tabela..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/[0.06] focus:border-emerald-500/40 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <div className="glass-panel border border-white/[0.06] bg-slate-900/40 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto custom-scrollbar">
                  
                  {activeTab === 'proprietarios' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-3 px-4">Nome / Razão Social</th>
                          <th className="py-3 px-4 text-right">CPF / CNPJ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {proprietarios.filter(p => p.nome.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                          <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4"><p className="text-xs font-black text-white">{p.nome}</p></td>
                            <td className="py-3.5 px-4 text-right"><p className="text-[10px] text-slate-400">{p.cpf_cnpj || 'Não informado'}</p></td>
                          </tr>
                        ))}
                        {proprietarios.length === 0 && <tr><td colSpan="2" className="py-8 text-center text-xs text-slate-500">Nenhum proprietário cadastrado.</td></tr>}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'fazendas' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-3 px-4">Nome da Fazenda</th>
                          <th className="py-3 px-4">Município</th>
                          <th className="py-3 px-4 text-right">Área Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {fazendas.filter(f => f.nome.toLowerCase().includes(searchQuery.toLowerCase())).map(f => (
                          <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="text-xs font-black text-white">{f.nome}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Prop: {proprietarios.find(p=>p.id===f.proprietario_id)?.nome || 'N/A'}</p>
                            </td>
                            <td className="py-3.5 px-4"><p className="text-[10px] text-slate-400">{f.municipio}</p></td>
                            <td className="py-3.5 px-4 text-right"><p className="text-xs font-bold text-emerald-400">{Number(f.area_total).toLocaleString('pt-BR')} Ha</p></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'talhoes' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-3 px-4">Talhão / Gleba</th>
                          <th className="py-3 px-4 text-center">Solo</th>
                          <th className="py-3 px-4 text-right">Área</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {talhoes.filter(t => t.nome.toLowerCase().includes(searchQuery.toLowerCase())).map(t => {
                          const farm = fazendas.find(f => f.id === t.fazenda_id);
                          return (
                            <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3.5 px-4">
                                <p className="text-xs font-black text-white">{t.nome}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{farm?.nome || 'Fazenda Indefinida'}</p>
                              </td>
                              <td className="py-3.5 px-4 text-center"><span className="inline-flex px-2 py-0.5 rounded bg-slate-950/40 text-slate-400 text-[10px] font-bold border border-white/[0.04]">Solo {t.solo}</span></td>
                              <td className="py-3.5 px-4 text-right"><p className="text-xs font-bold text-teal-400">{Number(t.area).toLocaleString('pt-BR')} Ha</p></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'maquinas' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-3 px-4">Máquina / Equipamento</th>
                          <th className="py-3 px-4">Placa / Chassi</th>
                          <th className="py-3 px-4 text-right">Proprietário</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {maquinas.filter(m => m.nome.toLowerCase().includes(searchQuery.toLowerCase())).map(m => (
                          <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="text-xs font-black text-white">{m.nome}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Mod: {m.modelo}</p>
                            </td>
                            <td className="py-3.5 px-4"><p className="text-[10px] text-slate-400">{m.placa || 'S/N'}</p></td>
                            <td className="py-3.5 px-4 text-right"><p className="text-[10px] text-slate-400">{proprietarios.find(p=>p.id==m.proprietario_id)?.nome || '-'}</p></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'funcionarios' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-3 px-4">Colaborador Próprio</th>
                          <th className="py-3 px-4 text-right">Taxa / Função</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {funcionarios.filter(e => e.nome.toLowerCase().includes(searchQuery.toLowerCase())).map(e => (
                          <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="text-xs font-black text-white">{e.nome}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Prop: {proprietarios.find(p=>p.id==e.proprietario_id)?.nome || '-'}</p>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <p className="text-xs font-bold text-slate-200">R$ {Number(e.taxa_horaria).toLocaleString('pt-BR')}/h</p>
                              <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold mt-1 bg-emerald-500/10 text-emerald-400">{e.cargo}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'terceirizados' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-3 px-4">Terceirizado</th>
                          <th className="py-3 px-4">Especialidade</th>
                          <th className="py-3 px-4 text-right">Empresa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {terceirizados.filter(t => t.nome.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                          <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4"><p className="text-xs font-black text-white">{t.nome}</p></td>
                            <td className="py-3.5 px-4"><p className="text-[10px] text-slate-400">{t.especialidade}</p></td>
                            <td className="py-3.5 px-4 text-right"><p className="text-[10px] text-amber-400">{t.empresa}</p></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'turmas' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-3 px-4">Nome da Turma</th>
                          <th className="py-3 px-4 text-right">Líder</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {turmas.filter(t => t.nome.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                          <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4"><p className="text-xs font-black text-white">{t.nome}</p></td>
                            <td className="py-3.5 px-4 text-right"><p className="text-[10px] text-emerald-400 font-bold">{funcionarios.find(f=>f.id==t.lider_id)?.nome || 'Sem Líder'}</p></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'produtos' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-3 px-4">Produto / Insumo</th>
                          <th className="py-3 px-4">Categoria</th>
                          <th className="py-3 px-4 text-right">U.M.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {produtos.filter(p => p.nome.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                          <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4"><p className="text-xs font-black text-white">{p.nome}</p></td>
                            <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px]">{p.categoria}</span></td>
                            <td className="py-3.5 px-4 text-right"><p className="text-[10px] text-slate-400">{p.unidade}</p></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'safras' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-3 px-4">Safra / Ciclo</th>
                          <th className="py-3 px-4 text-center">Período</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {safras.filter(s => s.nome.toLowerCase().includes(searchQuery.toLowerCase())).map(s => {
                          const farm = fazendas.find(f => f.id === s.fazenda_id);
                          return (
                            <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3.5 px-4">
                                <p className="text-xs font-black text-white">{s.nome}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{farm?.nome}</p>
                              </td>
                              <td className="py-3.5 px-4 text-center text-[10px] text-slate-400">{s.data_inicio} até {s.data_fim}</td>
                              <td className="py-3.5 px-4 text-right"><span className="text-[9px] text-slate-500">R$ {s.custo_planejado}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'ordens_servico' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-3 px-4">OS / Operação</th>
                          <th className="py-3 px-4 text-right">Status / Horas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {ordensServico.filter(o => o.tipo.toLowerCase().includes(searchQuery.toLowerCase())).map(o => (
                          <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="text-xs font-black text-white">{o.tipo}</p>
                              <p className="text-[9px] text-slate-500">Talhões: {o.talhoes.join(', ')}</p>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="text-[9px] font-bold text-amber-400">{o.status}</span>
                              <p className="text-[10px] text-slate-400 mt-1">{o.horas_trabalhadas}h</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
