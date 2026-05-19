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

// HIGH-FIDELITY MOCK DATABASE FOR INOVACEIFA ALIGNED WITH DJANGO API SCHEMAS
const MOCK_DATA = {
  usuario: {
    nome: "Carlos Augusto de Souza",
    email: "carlos.souza@inovaceifa.com.br",
    cargo: "Gerente Geral de Operações",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
    fazenda_padrao: 1
  },
  fazendas: [
    { id: 1, nome: "Fazenda Ceifa Dourada", Municipio: "Patrocínio - MG" },
    { id: 2, nome: "Fazenda Recanto Verde", Municipio: "Guaxupé - MG" },
    { id: 3, nome: "Sítio Alto da Serra", Municipio: "Pedregulho - SP" }
  ],
  safras: [
    { id: 101, fazenda_id: 1, nome: "Safra 2023/2024", data_inicio: "2023-09-01", data_fim: "2024-06-30", ativa: false },
    { id: 102, fazenda_id: 1, nome: "Safra 2024/2025", data_inicio: "2024-09-01", data_fim: "2025-06-30", ativa: true },
    { id: 103, fazenda_id: 1, nome: "Safra 2025/2026", data_inicio: "2025-09-01", data_fim: "2026-06-30", ativa: false },
    
    { id: 201, fazenda_id: 2, nome: "Safra 2024/2025", data_inicio: "2024-10-01", data_fim: "2025-07-31", ativa: true },
    { id: 301, fazenda_id: 3, nome: "Safra 2024/2025", data_inicio: "2024-09-15", data_fim: "2025-08-15", ativa: true }
  ],
  
  // 1. COMPARATIVO DE SAFRAS (CROP COMPARISON) - Alinhado com Django relatorios/views.py
  comparativoSafra: {
    101: {
      safra_id: 101,
      safra_nome: "Safra 2023/2024",
      safra_ano: "2023/24",
      custo_planejado: 845000.00,
      custo_realizado: 892000.00,
      economia: -47000.00,
      atingimento_orcamento: 105.5
    },
    102: {
      safra_id: 102,
      safra_nome: "Safra 2024/2025",
      safra_ano: "2024/25",
      custo_planejado: 980000.00,
      custo_realizado: 812000.00,
      economia: 168000.00,
      atingimento_orcamento: 82.8
    },
    103: {
      safra_id: 103,
      safra_nome: "Safra 2025/2026",
      safra_ano: "2025/26",
      custo_planejado: 1120000.00,
      custo_realizado: 0.00,
      economia: 1120000.00,
      atingimento_orcamento: 0
    },
    201: {
      safra_id: 201,
      safra_nome: "Safra 2024/2025",
      safra_ano: "2024/25",
      custo_planejado: 520000.00,
      custo_realizado: 489000.00,
      economia: 31000.00,
      atingimento_orcamento: 94.0
    },
    301: {
      safra_id: 301,
      safra_nome: "Safra 2024/2025",
      safra_ano: "2024/25",
      custo_planejado: 340000.00,
      custo_realizado: 312000.00,
      economia: 28000.00,
      atingimento_orcamento: 91.7
    }
  },

  // 2. FLUXO DE CAIXA (CASH FLOW) - Alinhado com Django relatorios/views.py
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
        
        // PENDENTES ATRASADOS (Destaque visual!)
        { id: "pag_prev_1", tipo: "DESPESA", categoria: "Financiamento", descricao: "Parcela Trator John Deere (Atrasada)", valor: 25000.00, vencimento: "2025-03-05", status: "PENDENTE", atrasado: true },
        { id: "rec_prev_1", tipo: "RECEITA", categoria: "Vendas", descricao: "Recebimento Venda Futura Cafe (Atrasada)", valor: 90000.00, vencimento: "2025-03-10", status: "PENDENTE", atrasado: true },
        
        // PENDENTES NORMAIS
        { id: "pag_prev_2", tipo: "DESPESA", categoria: "Insumos", descricao: "Embalagens e Sacaria Café 2025", valor: 15000.00, vencimento: "2026-06-15", status: "PENDENTE", atrasado: false },
        { id: "pag_prev_3", tipo: "DESPESA", categoria: "Mão de Obra", descricao: "Comissão de Colheita 2025", valor: 40000.00, vencimento: "2026-06-25", status: "PENDENTE", atrasado: false },
        { id: "rec_prev_2", tipo: "RECEITA", categoria: "Vendas", descricao: "Entrega física de café Safra Nova", valor: 160000.00, vencimento: "2026-06-30", status: "PENDENTE", atrasado: false }
      ]
    },
    101: {
      grouped: [{ periodo: "Jun/24", saldo_realizado: 60000, saldo_previsto: 60000 }],
      ledger: []
    },
    103: {
      grouped: [{ periodo: "Jun/26", saldo_realizado: 0, saldo_previsto: 200000 }],
      ledger: []
    }
  },

  // 3. EFICIÊNCIA OPERACIONAL (OPERATIONAL EFFICIENCY) - Alinhado com Django relatorios/views.py
  eficienciaOperacional: {
    102: {
      total_horas_trabalhadas_proprias: 450.00,
      total_area_talhoes_concluidos: 1350.00,
      eficiencia_global_ha_hora: 3.00,
      breakdown_operacoes: [
        { id: 1, nome: "Colheita Mecanizada", horas: 120.0, area: 480.0, eficiencia: 4.0 },
        { id: 2, nome: "Pulverização e Tratos", horas: 180.0, area: 540.0, eficiencia: 3.0 },
        { id: 3, nome: "Adubação e Calagem", horas: 100.0, area: 250.0, eficiencia: 2.5 },
        { id: 4, nome: "Roçagem e Trincha", horas: 50.0, area: 80.0, eficiencia: 1.6 }
      ],
      ordens_servico_concluidas: [
        { id: 401, tipo: "Colheita Mecanizada", area_total: 480.0, talhoes: ["Talhão A1", "Talhão A2"] },
        { id: 402, tipo: "Pulverização e Tratos", area_total: 540.0, talhoes: ["Talhão B1", "Talhão B2", "Talhão B3"] },
        { id: 403, tipo: "Adubação e Calagem", area_total: 250.0, talhoes: ["Talhão C1"] },
        { id: 404, tipo: "Roçagem e Trincha", area_total: 80.0, talhoes: ["Talhão D1", "Talhão D2"] }
      ]
    },
    101: {
      total_horas_trabalhadas_proprias: 380.00,
      total_area_talhoes_concluidos: 950.00,
      eficiencia_global_ha_hora: 2.50,
      breakdown_operacoes: [
        { id: 1, nome: "Colheita Mecanizada", horas: 100.0, area: 350.0, eficiencia: 3.5 },
        { id: 2, nome: "Pulverização e Tratos", horas: 150.0, area: 400.0, eficiencia: 2.67 },
        { id: 3, nome: "Adubação e Calagem", horas: 130.0, area: 200.0, eficiencia: 1.54 }
      ],
      ordens_servico_concluidas: [
        { id: 301, tipo: "Colheita Mecanizada", area_total: 350.0, talhoes: ["Talhão A1"] },
        { id: 302, tipo: "Pulverização e Tratos", area_total: 400.0, talhoes: ["Talhão B1"] },
        { id: 303, tipo: "Adubação e Calagem", area_total: 200.0, talhoes: ["Talhão C1"] }
      ]
    },
    103: {
      total_horas_trabalhadas_proprias: 0.00,
      total_area_talhoes_concluidos: 0.00,
      eficiencia_global_ha_hora: 0.00,
      breakdown_operacoes: [],
      ordens_servico_concluidas: []
    }
  }
};

// Fallback logic wrapper
export const requestHandler = async (apiCall, fallbackData) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.warn("Django backend is offline or returned an error. Using high-fidelity mock data fallback.", error);
    // Mimic API latency
    await new Promise(resolve => setTimeout(resolve, 300));
    return fallbackData;
  }
};

// Service calls
export const relatorioService = {
  getUsuario: () => {
    return requestHandler(
      () => api.get('/api/auth/me/'),
      MOCK_DATA.usuario
    );
  },
  
  getFazendas: () => {
    return requestHandler(
      () => api.get('/api/fazendas/'),
      MOCK_DATA.fazendas
    );
  },

  getSafras: () => {
    return requestHandler(
      () => api.get('/api/safras/'),
      MOCK_DATA.safras
    );
  },

  getComparativoSafra: (safraId) => {
    return requestHandler(
      () => api.get(`/api/relatorios/comparativo-safra/?safra_id=${safraId}`),
      MOCK_DATA.comparativoSafra[safraId] || { safra_id: safraId, safra_nome: "Safra Selecionada", safra_ano: "-", custo_planejado: 0, custo_realizado: 0, economia: 0, atingimento_orcamento: 0 }
    );
  },

  getFluxoCaixa: (safraId, dataInicio = '', dataFim = '') => {
    const url = `/api/relatorios/fluxo-caixa/?safra_id=${safraId}&data_inicio=${dataInicio}&data_fim=${dataFim}`;
    return requestHandler(
      () => api.get(url),
      MOCK_DATA.fluxoCaixa[safraId] || { grouped: [], ledger: [] }
    );
  },

  getEficienciaOperacional: (safraId) => {
    return requestHandler(
      () => api.get(`/api/relatorios/eficiencia-operacional/?safra_id=${safraId}`),
      MOCK_DATA.eficienciaOperacional[safraId] || { total_horas_trabalhadas_proprias: 0, total_area_talhoes_concluidos: 0, eficiencia_global_ha_hora: 0, breakdown_operacoes: [], ordens_servico_concluidas: [] }
    );
  }
};

export default api;
