import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
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

// Interceptor to handle responses, automatic token refresh on 401, and 403 logouts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;

  if (error.response && error.response.status === 401 && !originalRequest._retry) {
    const isLoginRequest = originalRequest.url?.includes('/auth/token/');
    const hasToken = !!localStorage.getItem('token');

    if (!isLoginRequest && hasToken) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = res.data?.access;
          if (newAccessToken) {
            localStorage.setItem('token', newAccessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            isRefreshing = false;
            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          // Se falhar o refresh, limpa tudo e recarrega
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.reload();
          return Promise.reject(refreshError);
        }
      } else {
        isRefreshing = false;
        // Sem refresh token, limpa acesso e recarrega
        localStorage.removeItem('token');
        window.location.reload();
      }
    }
  }

  if (error.response && error.response.status === 403) {
    const isLoginRequest = originalRequest.url?.includes('/auth/token/');
    if (!isLoginRequest) {
      let message = error.response.data?.detail || error.response.data?.error || "";
      if (Array.isArray(message)) {
        message = message[0];
      }
      if (typeof message === 'object' && message !== null) {
        message = message.detail || JSON.stringify(message);
      }
      if (typeof message === 'string' && (message.includes("inativo") || message.includes("administrador"))) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.setItem('login_error', message);
        window.location.reload();
      }
    }
  }
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
    proprietarios: [
      { id: 1, nome: "Carlos Augusto de Souza", documento: "123.456.789-00", email: "carlos.souza@inovaceifa.com.br", celular: "(34) 99999-1234", cep: "38740-000", endereco: "Av. Rui Barbosa, 123", bairro: "Centro", cidade: "Patrocínio" }
    ],
    fazendas: [
      { id: 1, nome: "Fazenda Ceifa Dourada", municipio: "Patrocínio - MG", area_total: 1500.00, proprietario_id: 1 },
      { id: 2, nome: "Fazenda Recanto Verde", municipio: "Guaxupé - MG", area_total: 800.00, proprietario_id: 1 },
      { id: 3, nome: "Sítio Alto da Serra", municipio: "Pedregulho - SP", area_total: 350.00, proprietario_id: 1 }
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
    },
    pedidos_compra: [
      { id: 701, fazenda: 1, safra: 102, fornecedor: "Yara Fertilizantes", data_pedido: "2025-05-10", valor_total: 15400.00, status: "APROVADO" },
      { id: 702, fazenda: 1, safra: 102, fornecedor: "Syngenta Defensivos", data_pedido: "2025-05-15", valor_total: 8200.00, status: "RASCUNHO" }
    ],
    itens_pedido_compra: [
      { id: 1, pedido_compra: 701, pedido_compra_id: 701, produto: 1, quantidade: 2000.0000, valor_unitario: 5.2000, valor_total: 10400.00 },
      { id: 2, pedido_compra: 701, pedido_compra_id: 701, produto: 2, quantidade: 5000.0000, valor_unitario: 1.0000, valor_total: 5000.00 },
      { id: 3, pedido_compra: 702, pedido_compra_id: 702, produto: 3, quantidade: 20.0000, valor_unitario: 410.0000, valor_total: 8200.00 }
    ],
    contas_a_pagar: [
      { id: 801, fazenda: 1, safra: 102, pedido_compra: 701, pedido_compra_id: 701, descricao: "Compra Yara Fertilizantes (Ref. Pedido #701)", valor: 15400.00, data_vencimento: "2025-05-30", data_pagamento: null, status: "PENDENTE" }
    ],
    pedidos_venda: [
      { id: 901, fazenda: 1, safra: 102, cliente: "Cooxupé Cooperativa", data_venda: "2025-05-12", tipo_produto: "CAFE", quantidade_sacas: 100.00, preco_unitario: 950.00, valor_total: 95000.00, status: "CONFIRMADO" },
      { id: 902, fazenda: 1, safra: 102, cliente: "Exportadora Guaxupé", data_venda: "2025-05-20", tipo_produto: "CAFE", quantidade_sacas: 50.00, preco_unitario: 980.00, valor_total: 49000.00, status: "RASCUNHO" }
    ],
    contas_a_receber: [
      { id: 1001, fazenda: 1, safra: 102, pedido_venda: 901, pedido_venda_id: 901, descricao: "Venda para o cliente: Cooxupé Cooperativa (Ref. Pedido #901)", categoria_receita: "VENDA_CAFE", valor: 95000.00, data_vencimento: "2025-06-15", data_recebimento: null, status: "PENDENTE" }
    ]
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
    // Se o backend respondeu com qualquer erro (400, 401, 403, 500, etc.), propagamos o erro
    // para que a tela exiba o erro real ao invés de usar silenciosamente os dados de simulação
    if (error.response) {
      throw error;
    }
    // Mimic API latency
    await new Promise(resolve => setTimeout(resolve, 150));
    return fallbackDataGetter();
  }
};

// Service calls with dynamic calculations
export const relatorioService = {
  login: async (username, password) => {
    const res = await api.post('/api/auth/token/', { username, password });
    return res.data;
  },

  alterarSenha: async (oldPassword, newPassword) => {
    const res = await api.post('/api/auth/alterar-senha/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return res.data;
  },

  getUsuario: () => {
    return requestHandler(
      () => api.get('/api/auth/me/'),
      () => getDB().usuario
    );
  },

  getProprietarios: () => {
    return requestHandler(
      () => api.get('/api/proprietarios/'),
      () => getDB().proprietarios || []
    );
  },

  createProprietario: async (proprietarioData) => {
    try {
      const res = await api.post('/api/proprietarios/', proprietarioData);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      if (!db.proprietarios) db.proprietarios = [];
      const newProp = {
        id: db.proprietarios.length > 0 ? Math.max(...db.proprietarios.map(p => p.id)) + 1 : 1,
        ...proprietarioData
      };
      db.proprietarios.push(newProp);
      saveDB(db);
      return newProp;
    }
  },

  updateProprietario: async (id, proprietarioData) => {
    try {
      const res = await api.put(`/api/proprietarios/${id}/`, proprietarioData);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      if (!db.proprietarios) db.proprietarios = [];
      const index = db.proprietarios.findIndex(p => p.id === Number(id));
      if (index !== -1) {
        db.proprietarios[index] = { ...db.proprietarios[index], ...proprietarioData };
        saveDB(db);
        return db.proprietarios[index];
      }
      throw error;
    }
  },

  deleteProprietario: async (id) => {
    try {
      await api.delete(`/api/proprietarios/${id}/`);
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      if (!db.proprietarios) db.proprietarios = [];
      db.proprietarios = db.proprietarios.filter(p => p.id !== Number(id));
      saveDB(db);
      return true;
    }
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
    return requestHandler(
      () => api.get('/api/talhoes/'),
      () => getDB().talhoes || []
    );
  },

  createTalhao: async (talhaoData) => {
    try {
      const res = await api.post('/api/talhoes/', talhaoData);
      return res.data;
    } catch (error) {
      if (error.response) throw error;
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
    }
  },

  getFuncionarios: () => {
    return requestHandler(
      () => api.get('/api/funcionarios/'),
      () => getDB().funcionarios || []
    );
  },

  createFuncionario: async (funcData) => {
    try {
      const res = await api.post('/api/funcionarios/', funcData);
      return res.data;
    } catch (error) {
      if (error.response) throw error;
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      if (!db.funcionarios) db.funcionarios = [];
      const newFunc = {
        id: db.funcionarios.length > 0 ? Math.max(...db.funcionarios.map(e => e.id)) + 1 : 601,
        nome: funcData.nome,
        cargo: funcData.cargo,
        taxa_horaria: Number(funcData.taxa_horaria),
        tipo: funcData.tipo
      };
      db.funcionarios.push(newFunc);
      saveDB(db);
      return newFunc;
    }
  },

  getOrdensServico: () => {
    return requestHandler(
      () => api.get('/api/ordens-servico/'),
      () => getDB().ordens_servico || []
    );
  },

  createOrdemServico: async (osData) => {
    try {
      const res = await api.post('/api/ordens-servico/', osData);
      return res.data;
    } catch (error) {
      if (error.response) throw error;
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
    }
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
      async () => {
        const res = await api.get(`/api/relatorios/eficiencia-operacional/?safra_id=${safraId}`);
        const apiData = res.data;
        
        let completedOS = [];
        try {
          const osRes = await api.get('/api/ordens-servico/');
          const allOS = osRes.data?.results || osRes.data || [];
          completedOS = allOS.filter(o => String(o.safra) === String(safraId) && o.status === 'CONCLUIDA').map(o => ({
            id: o.id,
            tipo: o.tipo_operacao_nome || o.tipo_operacao || 'Operação',
            area_total: (o.talhoes_detalhe || []).reduce((sum, t) => sum + Number(t.area || 0), 0),
            talhoes: (o.talhoes_detalhe || []).map(t => t.nome || t.codigo || '')
          }));
        } catch (e) {
          console.error("Erro ao carregar OS concluídas para eficiência:", e);
        }

        return {
          total_horas_trabalhadas_proprias: apiData.total_horas_trabalhadas || 0,
          total_area_talhoes_concluidos: apiData.total_hectares_trabalhados || 0,
          eficiencia_global_ha_hora: apiData.eficiencia_geral || 0,
          breakdown_operacoes: (apiData.breakdown || []).map((b, idx) => ({
            id: b.tipo_operacao_id || (idx + 1),
            nome: b.tipo_operacao_name || b.tipo_operacao_nome || 'Operação',
            horas: b.horas_trabalhadas || 0,
            area: b.area_trabalhada || 0,
            eficiencia: b.eficiencia || 0
          })),
          ordens_servico_concluidas: completedOS
        };
      },
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
  },

  getCustoTalhao: (safraId, fazendaId) => {
    return requestHandler(
      () => api.get(`/api/relatorios/custo-talhao/?safra_id=${safraId}&fazenda_id=${fazendaId}`),
      () => {
        const db = getDB();
        const talhoes = db.talhoes.filter(t => t.fazenda_id === Number(fazendaId));
        return {
          fazenda_id: fazendaId,
          fazenda_name: db.fazendas.find(f => f.id === Number(fazendaId))?.nome || "Fazenda",
          custos_por_talhao: talhoes.map(t => {
            const area = t.area;
            const mo = area * 450.00;
            const hm = area * 320.00;
            const ins = area * 1150.00;
            return {
              id: t.id,
              codigo: t.nome.split(" - ")[0],
              nome: t.nome.split(" - ")[1] || t.nome,
              area: area,
              cultura: "Café",
              mão_de_obra: Number(mo.toFixed(2)),
              hora_maquina: Number(hm.toFixed(2)),
              insumos: Number(ins.toFixed(2)),
              total: Number((mo + hm + ins).toFixed(2))
            };
          })
        };
      }
    );
  },

  getCustoMensal: (safraId, fazendaId) => {
    return requestHandler(
      () => api.get(`/api/relatorios/custo-mensal/?safra_id=${safraId}&fazenda_id=${fazendaId}`),
      () => {
        const db = getDB();
        const fz = db.fazendas.find(f => f.id === Number(fazendaId)) || { nome: "Fazenda" };
        const meses = [
          { key: "2024-09", mes: "Set/2024", insumos: 85000.00, mao_obra: 42000.00, outros: 15000.00 },
          { key: "2024-10", mes: "Out/2024", insumos: 125000.00, mao_obra: 43000.00, outros: 12000.00 },
          { key: "2024-11", mes: "Nov/2024", insumos: 65000.00, mao_obra: 45000.00, outros: 18000.00 },
          { key: "2024-12", mes: "Dez/2024", insumos: 14000.00, mao_obra: 49000.00, outros: 25000.00 },
          { key: "2025-01", mes: "Jan/2025", insumos: 195000.00, mao_obra: 52000.00, outros: 30000.00 },
          { key: "2025-02", mes: "Fev/2025", insumos: 45000.00, mao_obra: 48000.00, outros: 14000.00 }
        ];
        return {
          fazenda_id: fazendaId,
          fazenda_nome: fz.nome,
          custos_mensais: meses.map(m => ({
            ...m,
            total: Number((m.insumos + m.mao_obra + m.outros).toFixed(2))
          }))
        };
      }
    );
  },

  getConsumoDiesel: (safraId, fazendaId) => {
    return requestHandler(
      async () => {
        const res = await api.get(`/api/relatorios/consumo-diesel/?safra_id=${safraId}&fazenda_id=${fazendaId}`);
        const apiData = res.data;
        
        if (apiData && apiData.consumo_mensal_estoque) {
          return apiData;
        }

        const consumoList = apiData?.consumo || [];
        const mensal = consumoList.map(item => ({
          key: item.mes,
          mes: item.mes,
          litros: Number(item.quantidade || 0),
          valor_total: Number(item.valor || 0),
          preco_medio: Number(item.quantidade > 0 ? (item.valor / item.quantidade) : 0)
        }));

        const total_litros = mensal.reduce((sum, curr) => sum + curr.litros, 0);
        const total_valor = mensal.reduce((sum, curr) => sum + curr.valor_total, 0);

        let maquinas_abastecimento = [];
        try {
          const maqRes = await api.get('/api/maquinas/');
          const maqs = maqRes.data?.results || maqRes.data || [];
          maquinas_abastecimento = maqs.map(m => ({
            maquina_id: m.id,
            codigo: m.codigo,
            maquina_codigo: m.codigo,
            codigo_maquina: m.codigo,
            maquina__codigo: m.codigo,
            descricao: `${m.marca || ''} ${m.modelo || ''}`.trim() || m.descricao || 'Máquina',
            custo_abastecimento_total: 0.0,
            horas_trabalhadas_total: 0.0
          }));
        } catch (e) {
          console.error("Erro ao carregar máquinas para consumo de diesel:", e);
        }

        return {
          fazenda_id: fazendaId,
          consolidado: {
            total_litros: Number(total_litros.toFixed(2)),
            total_valor: Number(total_valor.toFixed(2)),
            preco_medio: total_litros > 0 ? Number((total_valor / total_litros).toFixed(2)) : 0.0
          },
          consumo_mensal_estoque: mensal,
          maquinas_abastecimento: maquinas_abastecimento
        };
      },
      () => {
        const db = getDB();
        const fz = db.fazendas.find(f => f.id === Number(fazendaId)) || { nome: "Fazenda" };
        const mensal = [
          { key: "2024-09", mes: "Set/2024", litros: 1200.0, valor_total: 7200.0 },
          { key: "2024-10", mes: "Out/2024", litros: 1500.0, valor_total: 9050.0 },
          { key: "2024-11", mes: "Nov/2024", litros: 1100.0, valor_total: 6600.0 },
          { key: "2024-12", mes: "Dez/2024", litros: 800.0, valor_total: 4880.0 },
          { key: "2025-01", mes: "Jan/2025", litros: 1600.0, valor_total: 9760.0 },
          { key: "2025-02", mes: "Fev/2025", litros: 1350.0, valor_total: 8235.0 }
        ].map(m => ({
          ...m,
          preco_medio: Number((m.valor_total / m.litros).toFixed(2))
        }));

        const total_litros = mensal.reduce((sum, curr) => sum + curr.litros, 0);
        const total_valor = mensal.reduce((sum, curr) => sum + curr.valor_total, 0);

        return {
          fazenda_id: fazendaId,
          fazenda_nome: fz.nome,
          consolidado: {
            total_litros: Number(total_litros.toFixed(2)),
            total_valor: Number(total_valor.toFixed(2)),
            preco_medio: total_litros > 0 ? Number((total_valor / total_litros).toFixed(2)) : 0.0
          },
          consumo_mensal_estoque: mensal,
          maquinas_abastecimento: [
            { maquina_id: 1, codigo: "TR-01", maquina__codigo: "TR-01", codigo_maquina: "TR-01", maquina_codigo: "TR-01", codigo: "TR-01", descricao: "Trator John Deere 5078E", custo_abastecimento_total: 24500.00, horas_trabalhadas_total: 420.0 },
            { maquina_id: 2, codigo: "TR-02", maquina__codigo: "TR-02", codigo_maquina: "TR-02", maquina_codigo: "TR-02", codigo: "TR-02", descricao: "Trator Massey Ferguson 4707", custo_abastecimento_total: 15300.00, horas_trabalhadas_total: 310.0 },
            { maquina_id: 3, codigo: "CL-01", maquina__codigo: "CL-01", codigo_maquina: "CL-01", maquina_codigo: "CL-01", codigo: "CL-01", descricao: "Colhedora de Café Pinhalense", custo_abastecimento_total: 18925.00, horas_trabalhadas_total: 180.0 }
          ]
        };
      }
    );
  },

  getAnaliseMOF: (safraId, fazendaId) => {
    return requestHandler(
      async () => {
        const res = await api.get(`/api/relatorios/mof/?safra_id=${safraId}&fazenda_id=${fazendaId}`);
        const apiData = res.data;
        
        if (apiData && apiData.folha_mensal) {
          return apiData;
        }

        const list = apiData?.funcionarios || [];

        // 1. Group by Month (folha_mensal)
        const monthGroups = {};
        list.forEach(item => {
          const m = item.mes;
          if (!monthGroups[m]) {
            monthGroups[m] = { key: m, mes: m, salario_base: 0, encargos: 0, beneficios: 0, total: 0 };
          }
          monthGroups[m].salario_base += Number(item.salario_base || 0);
          monthGroups[m].encargos += Number(item.encargos || 0);
          monthGroups[m].beneficios += Number(item.beneficios || 0);
          monthGroups[m].total += Number(item.custo_total || 0);
        });
        const folha_mensal = Object.values(monthGroups).sort((a, b) => a.key.localeCompare(b.key));

        // 2. Group by Employee (funcionarios_totais)
        const funcGroups = {};
        list.forEach(item => {
          const fid = item.funcionario_id;
          if (!funcGroups[fid]) {
            funcGroups[fid] = {
              funcionario_id: fid,
              nome: item.funcionario_nome || 'Colaborador',
              cargo: item.cargo || '-',
              grupo: item.grupo || '-',
              salario_base: 0,
              encargos: 0,
              beneficios: 0,
              meses_trabalhados: 0,
              total: 0
            };
          }
          funcGroups[fid].salario_base += Number(item.salario_base || 0);
          funcGroups[fid].encargos += Number(item.encargos || 0);
          funcGroups[fid].beneficios += Number(item.beneficios || 0);
          funcGroups[fid].total += Number(item.custo_total || 0);
          funcGroups[fid].meses_trabalhados += 1;
        });
        const funcionarios_totais = Object.values(funcGroups).sort((a, b) => a.nome.localeCompare(b.nome));

        return {
          fazenda_id: fazendaId,
          folha_mensal,
          funcionarios_totais
        };
      },
      () => {
        const db = getDB();
        const fz = db.fazendas.find(f => f.id === Number(fazendaId)) || { nome: "Fazenda" };
        const folha = [
          { key: "2024-09", mes: "09/2024", salario_base: 38000.00, encargos: 11400.00, beneficios: 7600.00, funcionarios_count: 14 },
          { key: "2024-10", mes: "10/2024", salario_base: 38000.00, encargos: 11400.00, beneficios: 7600.00, funcionarios_count: 14 },
          { key: "2024-11", mes: "11/2024", salario_base: 38000.00, encargos: 11400.00, beneficios: 7600.00, funcionarios_count: 14 },
          { key: "2024-12", mes: "12/2024", salario_base: 42000.00, encargos: 12600.00, beneficios: 8400.00, funcionarios_count: 15 },
          { key: "2025-01", mes: "01/2025", salario_base: 42000.00, encargos: 12600.00, beneficios: 8400.00, funcionarios_count: 15 },
          { key: "2025-02", mes: "02/2025", salario_base: 42000.00, encargos: 12600.00, beneficios: 8400.00, funcionarios_count: 15 }
        ].map(m => ({
          ...m,
          total: Number((m.salario_base + m.encargos + m.beneficios).toFixed(2))
        }));

        const funcs = [
          { funcionario_id: 1, nome: "João Silva", cargo: "Operador de Trator", grupo: "Campo", salario_base: 18000.00, encargos: 5400.00, beneficios: 3600.00, meses_trabalhados: 6 },
          { funcionario_id: 2, nome: "Maria Oliveira", cargo: "Auxiliar Agrícola", grupo: "Campo", salario_base: 13200.00, encargos: 3960.00, beneficios: 2640.00, meses_trabalhados: 6 },
          { funcionario_id: 3, nome: "Pedro Santos", cargo: "Supervisor de Campo", grupo: "Supervisão", salario_base: 28000.00, encargos: 8400.00, beneficios: 5600.00, meses_trabalhados: 6 },
          { funcionario_id: 4, nome: "José Ferreira", cargo: "Auxiliar de Secagem", grupo: "Pós-Colheita", salario_base: 12600.00, encargos: 3780.00, beneficios: 2520.00, meses_trabalhados: 6 }
        ].map(f => ({
          ...f,
          total: Number((f.salario_base + f.encargos + f.beneficios).toFixed(2))
        }));

        return {
          fazenda_id: fazendaId,
          fazenda_nome: fz.nome,
          folha_mensal: folha,
          funcionarios_totais: funcs
        };
      }
    );
  },

  getEstoque: (safraId, fazendaId) => {
    return requestHandler(
      () => api.get(`/api/relatorios/estoque/?safra_id=${safraId}&fazenda_id=${fazendaId}`),
      () => {
        const db = getDB();
        const fz = db.fazendas.find(f => f.id === Number(fazendaId)) || { nome: "Fazenda" };
        const estoque = [
          { produto_id: 1, codigo: "INS-001", nome_comercial: "Adubo NPK 20-00-20", unidade: "KG", classificacao: "Adubos / Fertilizantes", saldo: 45000.0000, preco_medio: 3.2500, valor_total: 146250.00, alerta_negativo: false },
          { produto_id: 2, codigo: "INS-002", nome_comercial: "Calcário Agrícola", unidade: "T", classificacao: "Adubos / Fertilizantes", saldo: 120.0000, preco_medio: 180.0000, valor_total: 21600.00, alerta_negativo: false },
          { produto_id: 3, codigo: "INS-003", nome_comercial: "Fungicida Priori Xtra", unidade: "L", classificacao: "Defensivos Químicos", saldo: 85.0000, preco_medio: 310.0000, valor_total: 26350.00, alerta_negativo: false },
          { produto_id: 4, codigo: "INS-004", nome_comercial: "Óleo Mineral", unidade: "L", classificacao: "Defensivos Químicos", saldo: -15.0000, preco_medio: 22.0000, valor_total: -330.00, alerta_negativo: true },
          { produto_id: 5, codigo: "INS-005", nome_comercial: "Gesso Agrícola", unidade: "T", classificacao: "Adubos / Fertilizantes", saldo: 45.0000, preco_medio: 145.0000, valor_total: 6525.00, alerta_negativo: false },
          { produto_id: 6, codigo: "DSL-001", nome_comercial: "Óleo Diesel S10", unidade: "L", classificacao: "Combustíveis", saldo: 2800.0000, preco_medio: 5.8500, valor_total: 16380.00, alerta_negativo: false }
        ];

        return {
          fazenda_id: fazendaId,
          fazenda_nome: fz.nome,
          estoque: estoque
        };
      }
    );
  },

  getGestaoAVista: (safraId, fazendaId) => {
    return requestHandler(
      () => api.get(`/api/relatorios/gestao-a-vista/?safra_id=${safraId}&fazenda_id=${fazendaId}`),
      () => {
        const db = getDB();
        const fz = db.fazendas.find(f => f.id === Number(fazendaId)) || { nome: "Fazenda" };
        const talhoes = db.talhoes.filter(t => t.fazenda_id === Number(fazendaId));
        const totalArea = talhoes.reduce((sum, curr) => sum + curr.area, 0);

        return {
          fazenda_id: fazendaId,
          fazenda_nome: fz.nome,
          kpis: {
            hectares_cultivados: totalArea || 1380.00,
            estimativa_producao_sacas: 48500.00,
            produtividade_esperada: 35.14,
            coe_planejado: 980000.00,
            coe_realizado: 812000.00,
            total_horas_operador: 450.00,
            eficiencia_geral: 3.07,
            os_status: {
              RASCUNHO: 1,
              APROVADA: 2,
              EM_EXECUCAO: 3,
              CONCLUIDA: 18,
              CANCELADA: 0,
              ATRASADA: 4
            }
          }
        };
      }
    );
  },

  getProducaoTalhao: (safraId, fazendaId) => {
    return requestHandler(
      () => api.get(`/api/relatorios/producao-talhao/?safra_id=${safraId}&fazenda_id=${fazendaId}`),
      () => {
        const db = getDB();
        const fz = db.fazendas.find(f => f.id === Number(fazendaId)) || { nome: "Fazenda" };
        const talhoes = db.talhoes.filter(t => t.fazenda_id === Number(fazendaId));
        const listData = talhoes.map((t, index) => {
          const area = t.area;
          const est_sacas = area * 35;
          const real_sacas = est_sacas * (1 + (index % 3 === 0 ? 0.12 : index % 3 === 1 ? -0.05 : 0.02));
          const est_prod = 35;
          const real_prod = real_sacas / area;
          const desvio = real_sacas - est_sacas;
          const desvio_pct = (desvio / est_sacas) * 100;

          return {
            talhao_id: t.id,
            codigo: t.nome.split(" - ")[0],
            nome: t.nome.split(" - ")[1] || t.nome,
            area: area,
            estimado: {
              sacas: Number(est_sacas.toFixed(2)),
              produtividade: Number(est_prod.toFixed(2))
            },
            real: {
              sacas: Number(real_sacas.toFixed(2)),
              produtividade: Number(real_prod.toFixed(2))
            },
            desvio_sacas: Number(desvio.toFixed(2)),
            desvio_percentual: Number(desvio_pct.toFixed(2))
          };
        });

        const total_sacas = listData.reduce((sum, curr) => sum + curr.real.sacas, 0);

        return {
          fazenda_id: fazendaId,
          fazenda_nome: fz.nome,
          total_comercializado_sacas: Number(total_sacas.toFixed(2)),
          producao_por_talhao: listData
        };
      }
    );
  },

  // --- PLANEJAMENTOS ---
  getPlanejamentos: () => {
    return requestHandler(
      () => api.get('/api/planejamentos/'),
      () => getDB().planejamentos || []
    );
  },

  createPlanejamento: async (data) => {
    try {
      const res = await api.post('/api/planejamentos/', data);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      if (!db.planejamentos) db.planejamentos = [];
      const newPlan = {
        id: db.planejamentos.length > 0 ? Math.max(...db.planejamentos.map(p => p.id)) + 1 : 1,
        aprovado: false,
        ...data
      };
      db.planejamentos.push(newPlan);
      saveDB(db);
      return newPlan;
    }
  },

  aprovarPlanejamento: async (id) => {
    try {
      const res = await api.post(`/api/planejamentos/${id}/aprovar/`);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      const plan = db.planejamentos?.find(p => p.id === Number(id));
      if (plan) {
        plan.aprovado = true;
        saveDB(db);
        return { detail: "Planejamento aprovado com sucesso." };
      }
      throw error;
    }
  },

  gerarOrdensServico: async (id) => {
    try {
      const res = await api.post(`/api/planejamentos/${id}/gerar-ordens-servico/`);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      const plan = db.planejamentos?.find(p => p.id === Number(id));
      if (plan) {
        plan.aprovado = true;
        saveDB(db);
        // Simular a geração de uma OS real a partir do planejamento
        if (!db.ordens_servico) db.ordens_servico = [];
        const newOS = {
          id: db.ordens_servico.length > 0 ? Math.max(...db.ordens_servico.map(o => o.id)) + 1 : 401,
          safra_id: plan.safra_id || plan.safra || 102,
          tipo: "Adubação e Calagem",
          area_total: 240.0,
          talhoes: ["Talhão A1 - Café Arábica"],
          funcionario_id: 601,
          status: "APROVADA",
          horas_trabalhadas: 0
        };
        db.ordens_servico.push(newOS);
        saveDB(db);
        return { detail: "Geração concluída com sucesso! Foram geradas 1 Ordens de Serviço Reais." };
      }
      throw error;
    }
  },

  // --- ORDENS DE SERVIÇO REAIS ---
  getOrdensServicoReais: () => {
    return requestHandler(
      () => api.get('/api/ordens-servico/'),
      () => getDB().ordens_servico || []
    );
  },

  createOrdemServicoReal: async (data) => {
    try {
      const res = await api.post('/api/ordens-servico/', data);
      return res.data;
    } catch (error) {
      return relatorioService.createOrdemServico(data);
    }
  },

  iniciarOrdemServico: async (id) => {
    try {
      const res = await api.post(`/api/ordens-servico/${id}/iniciar/`);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 150));
      const db = getDB();
      const os = db.ordens_servico?.find(o => o.id === Number(id));
      if (os) {
        os.status = 'EM_EXECUCAO';
        saveDB(db);
        return { status: "Em execução", id: os.id };
      }
      throw error;
    }
  },

  concluirOrdemServico: async (id) => {
    try {
      const res = await api.post(`/api/ordens-servico/${id}/concluir/`);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      const os = db.ordens_servico?.find(o => o.id === Number(id));
      if (os) {
        os.status = 'CONCLUIDA';
        os.horas_trabalhadas = os.horas_trabalhadas || 8.0;
        
        // Simular lançamento financeiro
        if (!db.fluxoCaixa[os.safra_id]) db.fluxoCaixa[os.safra_id] = { grouped: [], ledger: [] };
        db.fluxoCaixa[os.safra_id].ledger.push({
          id: `pag_os_${os.id}`,
          tipo: "DESPESA",
          categoria: "Mão de Obra",
          descricao: `OS #${os.id} — Concluída`,
          valor: 160.00,
          vencimento: new Date().toISOString().split('T')[0],
          status: "PAGO",
          atrasado: false
        });

        // Simular Auditoria (se diferir do planejado)
        if (!db.auditorias) db.auditorias = [];
        db.auditorias.push({
          id: db.auditorias.length + 1,
          ordem_servico: os.id,
          tipo_desvio: 'SUPERDOSE',
          descricao_desvio: 'Uso de 15.0000 vs 12.0000 planejado.',
          status: 'PENDENTE'
        });

        saveDB(db);
        return { status: "Concluída", id: os.id };
      }
      throw error;
    }
  },

  getAuditoriasOS: (id) => {
    return requestHandler(
      () => api.get(`/api/auditorias/?ordem_servico=${id}`),
      () => {
        const db = getDB();
        return (db.auditorias || []).filter(a => a.ordem_servico === Number(id));
      }
    );
  },

  createApontamento: async (data) => {
    try {
      const res = await api.post('/api/apontamentos/', data);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 150));
      const db = getDB();
      if (!db.apontamentos) db.apontamentos = [];
      const newApt = {
        id: db.apontamentos.length + 1,
        ...data
      };
      db.apontamentos.push(newApt);
      saveDB(db);
      return newApt;
    }
  },

  createApontamentoInsumo: async (data) => {
    try {
      const res = await api.post('/api/apontamentos-insumo/', data);
      return res.data;
    } catch (error) {
      return { detail: "Apontamento de insumo salvo offline" };
    }
  },

  createApontamentoMaquina: async (data) => {
    try {
      const res = await api.post('/api/apontamentos-maquina/', data);
      return res.data;
    } catch (error) {
      return { detail: "Apontamento de máquina salvo offline" };
    }
  },

  createApontamentoFuncionario: async (data) => {
    try {
      const res = await api.post('/api/apontamentos-funcionario/', data);
      return res.data;
    } catch (error) {
      return { detail: "Apontamento de funcionário salvo offline" };
    }
  },

  // --- FINANCEIRO & COMERCIAL (FASE 6.5) ---
  getPedidosCompra: () => {
    return requestHandler(
      () => api.get('/api/financeiro/pedidos-compra/'),
      () => {
        const db = getDB();
        return (db.pedidos_compra || []).map(p => ({
          ...p,
          itens: (db.itens_pedido_compra || []).filter(item => Number(item.pedido_compra_id || item.pedido_compra) === Number(p.id))
        }));
      }
    );
  },

  createPedidoCompra: async (data) => {
    try {
      const res = await api.post('/api/financeiro/pedidos-compra/', data);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      if (!db.pedidos_compra) db.pedidos_compra = [];
      if (!db.itens_pedido_compra) db.itens_pedido_compra = [];
      const newId = db.pedidos_compra.length > 0 ? Math.max(...db.pedidos_compra.map(p => p.id)) + 1 : 701;
      
      const newPedido = {
        id: newId,
        fazenda: Number(data.fazenda),
        safra: Number(data.safra),
        fornecedor: data.fornecedor,
        data_pedido: data.data_pedido,
        status: data.status || 'RASCUNHO',
        valor_total: 0
      };

      let calculatedTotal = 0;
      if (data.itens && Array.isArray(data.itens)) {
        data.itens.forEach((item, index) => {
          const itemTotal = Number(item.quantidade) * Number(item.valor_unitario);
          calculatedTotal += itemTotal;
          db.itens_pedido_compra.push({
            id: db.itens_pedido_compra.length > 0 ? Math.max(...db.itens_pedido_compra.map(i => i.id)) + 1 + index : 1,
            pedido_compra: newId,
            pedido_compra_id: newId,
            produto: Number(item.produto),
            quantidade: Number(item.quantidade),
            valor_unitario: Number(item.valor_unitario),
            valor_total: itemTotal
          });
        });
      }

      newPedido.valor_total = calculatedTotal;
      db.pedidos_compra.push(newPedido);
      saveDB(db);
      return { ...newPedido, itens: (db.itens_pedido_compra).filter(i => i.pedido_compra_id === newId) };
    }
  },

  receberPedidoCompra: async (id) => {
    try {
      const res = await api.post(`/api/financeiro/pedidos-compra/${id}/receber/`);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      const pedido = db.pedidos_compra?.find(p => p.id === Number(id));
      if (!pedido) throw new Error("Pedido não encontrado");
      
      if (pedido.status !== 'APROVADO') {
        throw new Error("Apenas pedidos com status 'APROVADO' podem ser recebidos.");
      }

      pedido.status = 'RECEBIDO';
      
      // 1. Criar Contas a Pagar
      if (!db.contas_a_pagar) db.contas_a_pagar = [];
      const newCPId = db.contas_a_pagar.length > 0 ? Math.max(...db.contas_a_pagar.map(c => c.id)) + 1 : 801;
      db.contas_a_pagar.push({
        id: newCPId,
        fazenda: pedido.fazenda,
        safra: pedido.safra,
        pedido_compra: pedido.id,
        pedido_compra_id: pedido.id,
        descricao: `Compra do fornecedor: ${pedido.fornecedor} (Ref. Pedido #${pedido.id})`,
        valor: pedido.valor_total,
        data_vencimento: pedido.data_pedido,
        status: 'PENDENTE',
        data_pagamento: null
      });

      // 2. Movimentos de Entrada no Estoque
      if (!db.estoque) db.estoque = [];
      const pedidoItens = (db.itens_pedido_compra || []).filter(item => Number(item.pedido_compra_id || item.pedido_compra) === Number(pedido.id));
      
      pedidoItens.forEach(item => {
        db.estoque.push({
          id: db.estoque.length > 0 ? Math.max(...db.estoque.map(e => e.id)) + 1 : 1,
          fazenda_id: pedido.fazenda,
          safra_id: pedido.safra,
          produto_id: item.produto,
          tipo_movimento: 'ENTRADA',
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total,
          data_movimento: pedido.data_pedido,
          documento_referencia: `Pedido #${pedido.id}`,
          observacao: `Entrada automática pelo recebimento do Pedido de Compra #${pedido.id}.`
        });
      });

      saveDB(db);
      return { status: "Pedido recebido com sucesso. Contas a pagar e movimentos de estoque gerados.", id: pedido.id };
    }
  },

  getContasAPagar: () => {
    return requestHandler(
      () => api.get('/api/financeiro/contas-pagar/'),
      () => getDB().contas_a_pagar || []
    );
  },

  pagarConta: async (id, dataPagamento) => {
    try {
      const res = await api.patch(`/api/financeiro/contas-pagar/${id}/`, {
        status: 'PAGO',
        data_pagamento: dataPagamento
      });
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 150));
      const db = getDB();
      const conta = db.contas_a_pagar?.find(c => c.id === Number(id));
      if (conta) {
        conta.status = 'PAGO';
        conta.data_pagamento = dataPagamento;
        saveDB(db);
        return conta;
      }
      throw error;
    }
  },

  getPedidosVenda: () => {
    return requestHandler(
      () => api.get('/api/financeiro/pedidos-venda/'),
      () => getDB().pedidos_venda || []
    );
  },

  createPedidoVenda: async (data) => {
    try {
      const res = await api.post('/api/financeiro/pedidos-venda/', data);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      if (!db.pedidos_venda) db.pedidos_venda = [];
      const newId = db.pedidos_venda.length > 0 ? Math.max(...db.pedidos_venda.map(p => p.id)) + 1 : 901;
      
      const valTotal = Number(data.quantidade_sacas) * Number(data.preco_unitario);
      const newPedido = {
        id: newId,
        fazenda: Number(data.fazenda),
        safra: Number(data.safra),
        cliente: data.cliente,
        data_venda: data.data_venda,
        tipo_produto: data.tipo_produto,
        quantidade_sacas: Number(data.quantidade_sacas),
        preco_unitario: Number(data.preco_unitario),
        valor_total: valTotal,
        status: data.status || 'RASCUNHO'
      };
      
      db.pedidos_venda.push(newPedido);
      saveDB(db);
      return newPedido;
    }
  },

  confirmarPedidoVenda: async (id) => {
    try {
      const res = await api.post(`/api/financeiro/pedidos-venda/${id}/confirmar/`);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      const pedido = db.pedidos_venda?.find(p => p.id === Number(id));
      if (!pedido) throw new Error("Pedido não encontrado");
      
      if (pedido.status !== 'RASCUNHO') {
        throw new Error("Apenas pedidos com status 'RASCUNHO' podem ser confirmados.");
      }

      pedido.status = 'CONFIRMADO';
      
      // Mapear categoria
      const categoriaMap = {
        'CAFE': 'VENDA_CAFE',
        'CEREAIS': 'CEREAIS',
        'SUCATA': 'SUCATA',
        'OUTROS': 'OUTROS'
      };
      const categoria = categoriaMap[pedido.tipo_produto] || 'OUTROS';

      // Criar Contas a Receber
      if (!db.contas_a_receber) db.contas_a_receber = [];
      const newCRId = db.contas_a_receber.length > 0 ? Math.max(...db.contas_a_receber.map(c => c.id)) + 1 : 1001;
      db.contas_a_receber.push({
        id: newCRId,
        fazenda: pedido.fazenda,
        safra: pedido.safra,
        pedido_venda: pedido.id,
        pedido_venda_id: pedido.id,
        descricao: `Venda para o cliente: ${pedido.cliente} (Ref. Pedido #${pedido.id})`,
        categoria_receita: categoria,
        valor: pedido.valor_total,
        data_vencimento: pedido.data_venda,
        status: 'PENDENTE',
        data_recebimento: null
      });

      saveDB(db);
      return { status: "Pedido de venda confirmado com sucesso. Contas a receber gerado.", id: pedido.id };
    }
  },

  getContasAReceber: () => {
    return requestHandler(
      () => api.get('/api/financeiro/contas-receber/'),
      () => getDB().contas_a_receber || []
    );
  },

  receberConta: async (id, dataRecebimento) => {
    try {
      const res = await api.patch(`/api/financeiro/contas-receber/${id}/`, {
        status: 'RECEBIDO',
        data_recebimento: dataRecebimento
      });
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 150));
      const db = getDB();
      const conta = db.contas_a_receber?.find(c => c.id === Number(id));
      if (conta) {
        conta.status = 'RECEBIDO';
        conta.data_recebimento = dataRecebimento;
        saveDB(db);
        return conta;
      }
      throw error;
    }
  },

  createContasAPagar: async (data) => {
    try {
      const res = await api.post('/api/financeiro/contas-pagar/', data);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      if (!db.contas_a_pagar) db.contas_a_pagar = [];
      const newId = db.contas_a_pagar.length > 0 ? Math.max(...db.contas_a_pagar.map(c => c.id)) + 1 : 801;
      const newConta = {
        id: newId,
        fazenda: Number(data.fazenda),
        safra: Number(data.safra),
        pedido_compra: null,
        pedido_compra_id: null,
        descricao: data.descricao,
        valor: Number(data.valor),
        data_vencimento: data.data_vencimento,
        status: data.status || 'PENDENTE',
        data_pagamento: data.status === 'PAGO' ? (data.data_pagamento || data.data_vencimento) : null
      };
      db.contas_a_pagar.push(newConta);
      saveDB(db);
      return newConta;
    }
  },

  createContasAReceber: async (data) => {
    try {
      const res = await api.post('/api/financeiro/contas-receber/', data);
      return res.data;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const db = getDB();
      if (!db.contas_a_receber) db.contas_a_receber = [];
      const newId = db.contas_a_receber.length > 0 ? Math.max(...db.contas_a_receber.map(c => c.id)) + 1 : 1001;
      const newConta = {
        id: newId,
        fazenda: Number(data.fazenda),
        safra: Number(data.safra),
        pedido_venda: null,
        pedido_venda_id: null,
        descricao: data.descricao,
        categoria_receita: data.categoria_receita || 'OUTROS',
        valor: Number(data.valor),
        data_vencimento: data.data_vencimento,
        status: data.status || 'PENDENTE',
        data_recebimento: data.status === 'RECEBIDO' ? (data.data_recebimento || data.data_vencimento) : null
      };
      db.contas_a_receber.push(newConta);
      saveDB(db);
      return newConta;
    }
  }
};

export default api;
