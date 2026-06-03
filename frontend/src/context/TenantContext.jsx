import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { relatorioService } from '../services/api';
import { useAuth } from './AuthContext';

const TenantContext = createContext();

const normalizeId = (value) => {
  if (value === null || value === undefined) return null;
  return String(value);
};

const getFazendaIdFromSafra = (safra) => {
  const fazenda = safra?.fazenda_id ?? safra?.fazenda;
  if (fazenda && typeof fazenda === 'object') {
    return normalizeId(fazenda.id);
  }
  return normalizeId(fazenda);
};

export const TenantProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [fazendas, setFazendas] = useState([]);
  const [safras, setSafras] = useState([]);
  const [fazendaAtiva, setFazendaAtiva] = useState(null);
  const [safraAtiva, setSafraAtiva] = useState(null);
  const [tenantVersion, setTenantVersion] = useState(0);
  const [loading, setLoading] = useState(true);

  // Carregar fazendas e safras
  const loadTenantData = useCallback(async () => {
    setLoading(true);
    try {
      const [listaFazendas, listaSafras] = await Promise.all([
        relatorioService.getFazendas(),
        relatorioService.getSafras()
      ]);
      
      setFazendas(listaFazendas);
      setSafras(listaSafras);

      // Restaurar ou selecionar fazenda padrão
      const savedFazendaId = localStorage.getItem('fazenda_ativa_id');
      let selectedFazenda = null;

      if (savedFazendaId) {
        selectedFazenda = listaFazendas.find(f => normalizeId(f.id) === normalizeId(savedFazendaId));
      }
      if (!selectedFazenda && listaFazendas.length > 0) {
        selectedFazenda = listaFazendas[0];
      }

      setFazendaAtiva(selectedFazenda);

      if (selectedFazenda) {
        localStorage.setItem('fazenda_ativa_id', selectedFazenda.id.toString());
        
        // Filtrar safras dessa fazenda
        const selectedFazendaId = normalizeId(selectedFazenda.id);
        const safrasDaFazenda = listaSafras.filter(s => getFazendaIdFromSafra(s) === selectedFazendaId);
        
        // Restaurar ou selecionar safra ativa correspondente
        const savedSafraId = localStorage.getItem('safra_active_id') || localStorage.getItem('safra_ativa_id');
        let selectedSafra = null;

        if (savedSafraId) {
          selectedSafra = safrasDaFazenda.find(s => normalizeId(s.id) === normalizeId(savedSafraId));
        }
        if (!selectedSafra && safrasDaFazenda.length > 0) {
          // Tenta pegar a safra marcada como "ativa"
          selectedSafra = safrasDaFazenda.find(s => s.ativa) || safrasDaFazenda[0];
        }

        setSafraAtiva(selectedSafra);
        if (selectedSafra) {
          localStorage.setItem('safra_ativa_id', selectedSafra.id.toString());
        }
        setTenantVersion(version => version + 1);
      }
    } catch (error) {
      console.error("Falha ao carregar dados de tenant", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  // Handler para trocar de Fazenda
  const selecionarFazenda = (fazendaOrId) => {
    const fazendaId = normalizeId(typeof fazendaOrId === 'object' ? fazendaOrId?.id : fazendaOrId);
    if (!fazendaId) return;

    const fazendaSelecionada = fazendas.find(f => normalizeId(f.id) === fazendaId) || fazendaOrId;
    if (!fazendaSelecionada || typeof fazendaSelecionada !== 'object') return;

    setFazendaAtiva(fazendaSelecionada);
    localStorage.setItem('fazenda_ativa_id', fazendaId);

    // Auto-selecionar a safra ativa dessa nova fazenda
    const safrasDaFazenda = safras.filter(s => getFazendaIdFromSafra(s) === fazendaId);
    const safraDefault = safrasDaFazenda.find(s => s.ativa) || safrasDaFazenda[0];
    
    setSafraAtiva(safraDefault || null);
    if (safraDefault) {
      localStorage.setItem('safra_ativa_id', safraDefault.id.toString());
    } else {
      localStorage.removeItem('safra_ativa_id');
    }

    setTenantVersion(version => version + 1);
  };

  // Handler para trocar de Safra
  const selecionarSafra = (safra) => {
    if (!safra) return;
    setSafraAtiva(safra);
    localStorage.setItem('safra_ativa_id', safra.id.toString());
    setTenantVersion(version => version + 1);
  };

  // Filtrar safras disponíveis para a fazenda atualmente selecionada
  const safrasFiltradas = fazendaAtiva
    ? safras.filter(s => getFazendaIdFromSafra(s) === normalizeId(fazendaAtiva.id))
    : [];

  return (
    <TenantContext.Provider value={{
      fazendas,
      safras: safrasFiltradas,
      fazendaAtiva,
      safraAtiva,
      tenantVersion,
      selecionarFazenda,
      selecionarSafra,
      atualizarTenant: loadTenantData,
      loading
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant deve ser usado dentro de um TenantProvider");
  }
  return context;
};
