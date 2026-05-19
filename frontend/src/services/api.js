import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Interceptor to add auth and tenant headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const safraId = localStorage.getItem('safra_ativa_id');
  if (safraId) {
    config.headers['X-Safra-ID'] = safraId;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// LOCAL STORAGE PERSISTENCE ENGINE FOR DEMONSTRATION & HYBRID FALLBACK
const DB_KEY = 'inovaceifa_db';

const getInitialDB = () => {
  return {
    usuario: {
      nome: "Carlos Augusto de Souza",
      email: "carlos.souza@inovaceifa.com.br",
      cargo: "Gerente Geral de Operações",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
      fazenda_padrao: 1
    },
    fazendas: [
      { id: 1, nome: "Fazenda Ceifa Dourada", municipio: "Patrocínio - MG", area_total: 1500.00 },
      { id: 2, nome: "Fazenda Recanto Verde", municipio: "Guaxupé - MG", area_total: 800.00 },
      { id: 3, nome: "Sítio Alto da Serra", municipio: "Pedregulho - SP", area_total: 350.00 }
    ],
    safras: [
      { id: 101, fazenda_id: 1, nome: "Safra 2023/2024", data_inicio: "2023-09-01", data_fim: "2024-06-30", ativa: false },
      { id: 102, fazenda_id: 1, nome: "Safra 2024/2025", data_inicio: "2024-09-01", data_fim: "2025-06-30", ativa: true },
      { id: 103, fazenda_id: 1, nome: "Safra 2025/2026", data_inicio: "2025-09-01", data_fim: "2026-06-30", ativa: false },
      
      { id: 201, fazenda_id: 2, nome: "Safra 2024/2025", data_inicio: "2024-10-01", data_fim: "2025-07-31", ativa: true },
      { id: 301, fazenda_id: 3, nome: "Safra 2024/2025", data_inicio: "2024-09-15", data_fim: "2025-08-15", ativa: true }
    ],
    talhoes: [
      { id: 501, fazenda_id: 1, nome: "Talhão A1 - Café Arábica", area: 240.00, solo: "Argiloso" },
      { id: 502, fazenda_id: 1, nome: "Talhão A2 - Café Bourbon", area: 240.00, solo: "Misto" },
      { id: 503, fazenda_id: 1, nome: "Talhão B1 - Café Catuaí", area: 180.00, solo: "Arenoso" },
      { id: 504, fazenda_id: 1, nome: "Talhão B2 - Novo Plantio", area: 360.00, solo: "Argiloso" },
      { id: 505, fazenda_id: 1, nome: "Talhão C1 - Reserva", area: 250.00, solo: "Misto" },
      { id: 506, fazenda_id: 1, nome: "Talhão D1 - Café Conilon", area: 80.00, solo: "Argiloso" }
    ],
    funcionarios: [
      { id: 601, nome: "João Silva", cargo: "Operador de Trator", taxa_horaria: 25.00, tipo: "PROPRIO" },
      { id: 602, nome: "Maria Oliveira", cargo: "Auxiliar Agrícola", taxa_horaria: 18.00, tipo: "PROPRIO" },
      { id: 603, nome: "Pedro Santos", cargo: "Supervisor de Campo", taxa_horaria: 35.00, tipo: "PROPRIO" },
      { id: 604, nome: "José Ferreira", cargo: "Colhedor Temporário", taxa_horaria: 15.00, tipo: "TERCEIRIZADO" }
    ],
    ordens_servico: [
      { id: 401, safra_id: 102, tipo: "Colheita Mecanizada", area_total: 480.0, talhoes: ["Talhão A1 - Café Arábica", "Talhão A2 - Café Bourbon"], funcionario_id: 601, status: "CONCLUIDA", horas_trabalhadas: 120.0 },
      { id: 402, safra_id: 102, tipo: "Pulverização e Tratos", area_total: 540.0, talhoes: ["Talhão B1 - Café Catuaí", "Talhão B2 - Novo Plantio"], funcionario_id: 602, status: "CONCLUIDA", horas_trabalhadas: 180.0 },
      { id: 403, safra_id: 102, tipo: "Adubação e Calagem", area_total: 250.0, talhoes: ["Talhão C1 - Reserva"], funcionario_id: 603, status: "CONCLUIDA", horas_trabalhadas: 100.0 },
      { id: 404, safra_id: 102, tipo: "Roçagem e Trincha", area_total: 80.0, talhoes: ["Talhão D1 - Café Conilon"], funcionario_id: 601, status: "CONCLUIDA", horas_trabalhadas: 50.0 }
    ],
    comparativoSafra: {
      101: { safra_id: 101, safra_nome: "Safra 2023/2024", safra_ano: "2023/24", custo_planejado: 845000.00, custo_realizado: 892000.00, economia: -47000.00, atingimento_orcamento: 105.5 },
      102: { safra_id: 102, safra_nome: "Safra 2024/2025", safra_ano: "2024/25", custo_planejado: 980000.00, custo_realizado: 812000.00, economia: 168000.00, atingimento_orcamento: 82.8 },
      103: { safra_id: 103, safra_nome: "Safra 2025/2026", safra_ano: "2025/26", custo_planejado: 1120000.00, custo_realizado: 0.00, economia: 1120000.00, atingimento_orcamento: 0 },
      201: { safra_id: 201, safra_nome: "Safra 2024/2025", safra_ano: "2024/25", custo_planejado: 520000.00, custo_realizado: 489000.00, economia: 31000.00, atingimento_orcamento: 94.0 },
      301: { safra_id: 301, safra_nome: "Safra 2024/2025", safra_ano: "2024/25", custo_planejado: 340000.00, custo_realizado: 312000.00, economia: 28000.00, atingimento_orcamento: 91.7 }
    },
    fluxoCaixa: {
      102: {
        grouped: [
          { periodo: "Set/24", saldo_realizado: 20000, saldo_previsto: 20000 },
          { periodo: "Out/24", saldo_realizado: -15000, saldo_previsto: -15000 },
          { periodo: "Nov/24", saldo_realizado: 20000, saldo_previsto: 20000 },
          { periodo: "Dez/24", saldo_realizado: 110000, saldo_previsto: 110000 },
          { periodo: "Jan/25", saldo_realizado: 220000, saldo_previsto: 220000 },
          { periodo: "Fev/25", saldo_realizado: 288000, saldo_previsto: 288000 },
          { periodo: "Mar/25", saldo_realizado: 288000, saldo_previsto: 353000 },
          { periodo: "Abr/25", saldo_realizado: 288000, saldo_previsto: 368000 },
          { periodo: "Mai/25", saldo_realizado: 288000, saldo_previsto: 383000 }
        ],
        ledger: [
          { id: "pag_real_1", tipo: "DESPESA", categoria: "Insumos", descricao: "Adubação nitrogenada NPK Yara", valor: 80000.00, vencimento: "2024-09-10", status: "PAGO", atrasado: false },
          { id: "rec_real_1", tipo: "RECEITA", categoria: "Vendas", descricao: "Adiantamento venda Cooperativa", valor: 100000.00, vencimento: "2024-09-20", status: "RECEBIDO", atrasado: false },
          { id: "pag_real_2", tipo: "DESPESA", categoria: "Insumos", descricao: "Defensivos químicos Syngenta", valor: 120000.00, vencimento: "2024-10-05", status: "PAGO", atrasado: false },
          { id: "rec_real_2", tipo: "RECEITA", categoria: "Vendas", descricao: "Receita de milho safrinha", valor: 85000.00, vencimento: "2024-10-15", status: "RECEBIDO", atrasado: false },
          { id: "pag_real_3", tipo: "DESPESA", categoria: "Manutenção", descricao: "Manutenção Tratores John Deere", valor: 60000.00, vencimento: "2024-11-10", status: "PAGO", atrasado: false },
          { id: "rec_real_3", tipo: "RECEITA", categoria: "Vendas", descricao: "Venda parcial 50 sacas café", valor: 95000.00, vencimento: "2024-11-25", status: "RECEBIDO", atrasado: false },
          { id: "pag_real_4", tipo: "DESPESA", categoria: "Mão de Obra", descricao: "Folha de Pagamento - Dezembro", valor: 50000.00, vencimento: "2024-12-05", status: "PAGO", atrasado: false },
          { id: "rec_real_4", tipo: "RECEITA", categoria: "Vendas", descricao: "Bônus Safra Cooperativa", valor: 140000.00, vencimento: "2024-12-20", status: "RECEBIDO", atrasado: false },
          { id: "pag_real_5", tipo: "DESPESA", categoria: "Combustível", descricao: "Combustível Diesel e Lubrificantes", valor: 70000.00, vencimento: "2025-01-15", status: "PAGO", atrasado: false },
          { id: "rec_real_5", tipo: "RECEITA", categoria: "Vendas", descricao: "Venda 120 sacas café especial", valor: 180000.00, vencimento: "2025-01-25", status: "RECEBIDO", atrasado: false },
          { id: "pag_real_6", tipo: "DESPESA", categoria: "Manutenção", descricao: "Reparo Secador de Café Pinhalense", valor: 52000.00, vencimento: "2025-02-10", status: "PAGO", atrasado: false },
          { id: "rec_real_6", tipo: "RECEITA", categoria: "Vendas", descricao: "Venda de lenha e eucalipto", valor: 120000.00, vencimento: "2025-02-20", status: "RECEBIDO", atrasado: false },
          { id: "pag_prev_1", tipo: "DESPESA", categoria: "Financiamento", descricao: "Parcela Trator John Deere (Atrasada)", valor: 25000.00, vencimento: "2025-03-05", status: "PENDENTE", atrasado: true },
          { id: "rec_prev_1", tipo: "RECEITA", categoria: "Vendas", descricao: "Recebimento Venda Futura Cafe (Atrasada)", valor: 90000.00, vencimento: "2025-03-10", status: "PENDENTE", atrasado: true },
          { id: "pag_prev_2", tipo: "DESPESA", categoria: "Insumos", descricao: "Embalagens e Sacaria Café 2025", valor: 15000.00, vencimento: "2026-06-15", status: "PENDENTE", atrasado: false },
          { id: "pag_prev_3", tipo: "DESPESA", categoria: "Mão de Obra", descricao: "Comissão de Colheita 2025", valor: 40000.00, vencimento: "2026-06-25", status: "PENDENTE", atrasado: false },
          { id: "rec_prev_2", tipo: "RECEITA", categoria: "Vendas", descricao: "Entrega física de café Safra Nova", valor: 160000.00, vencimento: "2026-06-30", status: "PENDENTE", atrasado: false }
        ]
      },
      101: { grouped: [{ periodo: "Jun/24", saldo_realizado: 60000, saldo_previsto: 60000 }], ledger: [] },
      103: { grouped: [{ periodo: "Jun/26", saldo_realizado: 0, saldo_previsto: 200000 }], ledger: [] }
    }
  };
};

const getDB = () => {
  let dbStr = localStorage.getItem(DB_KEY);
  if (!dbStr) {
    const initial = getInitialDB();
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(dbStr);
};

const saveDB = (db) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// Fallback logic wrapper
export const requestHandler = async (apiCall, fallbackDataGetter) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    // Mimic API latency
    await new Promise(resolve => setTimeout(resolve, 150));
    return fallbackDataGetter();
  }
};

// Service calls with dynamic calculations
export const relatorioService = {
  getUsuario: () => {
    return requestHandler(
      () => api.get('/api/auth/me/'),
      () => getDB().usuario
    );
  },
  
  getFazendas: () => {
    return requestHandler(
      () => api.get('/api/fazendas/'),
      () => getDB().fazendas
    );
  },

  createFazenda: async (fazendaData) => {
    try {
      const res = await api.post('/api/fazendas/', fazendaData);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      const newFazenda = {
        id: db.fazendas.length > 0 ? Math.max(...db.fazendas.map(f => f.id)) + 1 : 1,
        nome: fazendaData.nome,
        municipio: fazendaData.municipio,
        area_total: Number(fazendaData.area_total || 0)
      };
      db.fazendas.push(newFazenda);
      saveDB(db);
      return newFazenda;
    }
  },

  getSafras: () => {
    return requestHandler(
      () => api.get('/api/safras/'),
      () => getDB().safras
    );
  },

  createSafra: async (safraData) => {
    try {
      const res = await api.post('/api/safras/', safraData);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      const newSafra = {
        id: db.safras.length > 0 ? Math.max(...db.safras.map(s => s.id)) + 1 : 101,
        fazenda_id: Number(safraData.fazenda_id),
        nome: safraData.nome,
        data_inicio: safraData.data_inicio,
        data_fim: safraData.data_fim,
        ativa: safraData.ativa || false
      };
      
      // Se for ativa, desativar outras safras da mesma fazenda
      if (newSafra.ativa) {
        db.safras.forEach(s => {
          if (s.fazenda_id === newSafra.fazenda_id) {
            s.ativa = false;
          }
        });
      }
      
      db.safras.push(newSafra);
      
      // Inicializar comparativo, fluxo de caixa e eficiencia operacional vazios para esta nova safra
      db.comparativoSafra[newSafra.id] = {
        safra_id: newSafra.id,
        safra_nome: newSafra.nome,
        safra_ano: newSafra.nome.replace("Safra ", ""),
        custo_planejado: Number(safraData.custo_planejado || 0),
        custo_realizado: 0,
        economia: Number(safraData.custo_planejado || 0),
        atingimento_orcamento: 0
      };
      
      db.fluxoCaixa[newSafra.id] = {
        grouped: [],
        ledger: []
      };
      
      saveDB(db);
      return newSafra;
    }
  },

  getTalhoes: () => {
    const db = getDB();
    return db.talhoes || [];
  },

  createTalhao: async (talhaoData) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const db = getDB();
    if (!db.talhoes) db.talhoes = [];
    const newTalhao = {
      id: db.talhoes.length > 0 ? Math.max(...db.talhoes.map(t => t.id)) + 1 : 501,
      fazenda_id: Number(talhaoData.fazenda_id),
      nome: talhaoData.nome,
      area: Number(talhaoData.area),
      solo: talhaoData.solo
    };
    db.talhoes.push(newTalhao);
    saveDB(db);
    return newTalhao;
  },

  getFuncionarios: () => {
    const db = getDB();
    return db.funcionarios || [];
  },

  createFuncionario: async (funcData) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const db = getDB();
    if (!db.funcionarios) db.funcionarios = [];
    const newFunc = {
      id: db.funcionarios.length > 0 ? Math.max(...db.funcionarios.map(e => e.id)) + 1 : 601,
      nome: funcData.nome,
      cargo: funcData.cargo,
      taxa_horaria: Number(funcData.taxa_horaria),
      tipo: funcData.tipo // "PROPRIO" ou "TERCEIRIZADO"
    };
    db.funcionarios.push(newFunc);
    saveDB(db);
    return newFunc;
  },

  getOrdensServico: () => {
    const db = getDB();
    return db.ordens_servico || [];
  },

  createOrdemServico: async (osData) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const db = getDB();
    if (!db.ordens_servico) db.ordens_servico = [];
    
    // Obter áreas dos talhões selecionados para somar
    const talhoesInfo = db.talhoes || [];
    let areaTotal = 0;
    osData.talhoes.forEach(tNome => {
      const found = talhoesInfo.find(t => t.nome === tNome);
      if (found) {
        areaTotal += found.area;
      }
    });

    const newOS = {
      id: db.ordens_servico.length > 0 ? Math.max(...db.ordens_servico.map(o => o.id)) + 1 : 401,
      safra_id: Number(osData.safra_id),
      tipo: osData.tipo,
      area_total: areaTotal || Number(osData.area_total || 0),
      talhoes: osData.talhoes,
      funcionario_id: Number(osData.funcionario_id),
      status: osData.status || "EM_ANDAMENTO",
      horas_trabalhadas: Number(osData.horas_trabalhadas || 0)
    };
    
    db.ordens_servico.push(newOS);

    // Se estiver concluída, atualizar custos realizados no orçamentário
    if (newOS.status === 'CONCLUIDA') {
      const funcionario = db.funcionarios.find(e => e.id === newOS.funcionario_id);
      const taxa = funcionario ? funcionario.taxa_horaria : 20.00;
      const custoOS = newOS.horas_trabalhadas * taxa;
      
      // Lançar despesa no livro do Fluxo de Caixa da safra
      if (!db.fluxoCaixa[newOS.safra_id]) {
        db.fluxoCaixa[newOS.safra_id] = { grouped: [], ledger: [] };
      }
      db.fluxoCaixa[newOS.safra_id].ledger.push({
        id: `pag_os_${newOS.id}`,
        tipo: "DESPESA",
        categoria: "Mão de Obra",
        descricao: `OS #${newOS.id} — ${newOS.tipo}`,
        valor: custoOS,
        vencimento: new Date().toISOString().split('T')[0],
        status: "PAGO",
        atrasado: false
      });

      // Atualizar no Comparativo de Safra
      if (db.comparativoSafra[newOS.safra_id]) {
        db.comparativoSafra[newOS.safra_id].custo_realizado += custoOS;
        db.comparativoSafra[newOS.safra_id].economia = db.comparativoSafra[newOS.safra_id].custo_planejado - db.comparativoSafra[newOS.safra_id].custo_realizado;
        db.comparativoSafra[newOS.safra_id].atingimento_orcamento = db.comparativoSafra[newOS.safra_id].custo_planejado > 0 
          ? (db.comparativoSafra[newOS.safra_id].custo_realizado / db.comparativoSafra[newOS.safra_id].custo_planejado) * 100 
          : 0;
      }
    }

    saveDB(db);
    return newOS;
  },

  getComparativoSafra: (safraId) => {
    return requestHandler(
      () => api.get(`/api/relatorios/comparativo-safra/?safra_id=${safraId}`),
      () => {
        const db = getDB();
        return db.comparativoSafra[safraId] || {
          safra_id: safraId,
          safra_nome: "Safra Selecionada",
          safra_ano: "-",
          custo_planejado: 0,
          custo_realizado: 0,
          economia: 0,
          atingimento_orcamento: 0
        };
      }
    );
  },

  getFluxoCaixa: (safraId, dataInicio = '', dataFim = '') => {
    const url = `/api/relatorios/fluxo-caixa/?safra_id=${safraId}&data_inicio=${dataInicio}&data_fim=${dataFim}`;
    return requestHandler(
      () => api.get(url),
      () => {
        const db = getDB();
        return db.fluxoCaixa[safraId] || { grouped: [], ledger: [] };
      }
    );
  },

  createFluxoCaixaLancamento: async (safraId, data) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const db = getDB();
    if (!db.fluxoCaixa[safraId]) {
      db.fluxoCaixa[safraId] = { grouped: [], ledger: [] };
    }
    const newRecord = {
      id: `lanc_${Date.now()}`,
      tipo: data.tipo, // DESPESA ou RECEITA
      categoria: data.categoria,
      descricao: data.descricao,
      valor: Number(data.valor),
      vencimento: data.vencimento,
      status: data.status || "PENDENTE",
      atrasado: data.atrasado || false
    };

    db.fluxoCaixa[safraId].ledger.push(newRecord);

    // Se for PAGO/RECEBIDO, atualizar no Comparativo de Safra também
    if (newRecord.status === 'PAGO' || newRecord.status === 'RECEBIDO') {
      if (newRecord.tipo === 'DESPESA' && db.comparativoSafra[safraId]) {
        db.comparativoSafra[safraId].custo_realizado += newRecord.valor;
        db.comparativoSafra[safraId].economia = db.comparativoSafra[safraId].custo_planejado - db.comparativoSafra[safraId].custo_realizado;
        db.comparativoSafra[safraId].atingimento_orcamento = db.comparativoSafra[safraId].custo_planejado > 0 
          ? (db.comparativoSafra[safraId].custo_realizado / db.comparativoSafra[safraId].custo_planejado) * 100 
          : 0;
      }
    }

    saveDB(db);
    return newRecord;
  },

  getEficienciaOperacional: (safraId) => {
    return requestHandler(
      () => api.get(`/api/relatorios/eficiencia-operacional/?safra_id=${safraId}`),
      () => {
        const db = getDB();
        
        // Agregar dinamicamente a eficiência das ordens de serviço
        const allOS = db.ordens_servico || [];
        const filteredOS = allOS.filter(o => o.safra_id === Number(safraId));
        const completedOS = filteredOS.filter(o => o.status === 'CONCLUIDA');
        
        // Sum total area of completed OS
        const totalArea = completedOS.reduce((acc, curr) => acc + curr.area_total, 0);
        
        // Sum employee hours for own employees
        const ownEmployees = (db.funcionarios || []).filter(e => e.tipo === 'PROPRIO').map(e => e.id);
        const completedOwnOS = completedOS.filter(o => ownEmployees.includes(o.funcionario_id));
        const totalOwnHours = completedOwnOS.reduce((acc, curr) => acc + curr.horas_trabalhadas, 0);

        const efficiency = totalOwnHours > 0 ? (totalArea / totalOwnHours) : 0;

        // Breakdown operations
        const opsBreakdown = {};
        completedOS.forEach(o => {
          if (!opsBreakdown[o.tipo]) {
            opsBreakdown[o.tipo] = { horas: 0, area: 0 };
          }
          opsBreakdown[o.tipo].area += o.area_total;
          if (ownEmployees.includes(o.funcionario_id)) {
            opsBreakdown[o.tipo].horas += o.horas_trabalhadas;
          }
        });

        const breakdownList = Object.entries(opsBreakdown).map(([tipo, val], idx) => ({
          id: idx + 1,
          nome: tipo,
          horas: val.horas,
          area: val.area,
          eficiencia: val.horas > 0 ? (val.area / val.horas) : 0
        }));

        return {
          total_horas_trabalhadas_proprias: totalOwnHours,
          total_area_talhoes_concluidos: totalArea,
          eficiencia_global_ha_hora: efficiency,
          breakdown_operacoes: breakdownList,
          ordens_servico_concluidas: completedOS
        };
      }
    );
  }
};

export default api;
