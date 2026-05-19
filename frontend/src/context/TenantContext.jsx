import React, { createContext, useContext, useState, useEffect } from 'react';
import { relatorioService } from '../services/api';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [fazendas, setFazendas] = useState([]);
  const [safras, setSafras] = useState([]);
  const [fazendaAtiva, setFazendaAtiva] = useState(null);
  const [safraAtiva, setSafraAtiva] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar fazendas e safras
  useEffect(() => {
    const loadTenantData = async () => {
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
          selectedFazenda = listaFazendas.find(f => f.id === parseInt(savedFazendaId));
        }
        if (!selectedFazenda && listaFazendas.length > 0) {
          selectedFazenda = listaFazendas[0];
        }

        setFazendaAtiva(selectedFazenda);

        if (selectedFazenda) {
          localStorage.setItem('fazenda_ativa_id', selectedFazenda.id.toString());
          
          // Filtrar safras dessa fazenda
          const safrasDaFazenda = listaSafras.filter(s => s.fazenda_id === selectedFazenda.id);
          
          // Restaurar ou selecionar safra ativa correspondente
          const savedSafraId = localStorage.getItem('safra_ativa_id');
          let selectedSafra = null;

          if (savedSafraId) {
            selectedSafra = safrasDaFazenda.find(s => s.id === parseInt(savedSafraId));
          }
          if (!selectedSafra && safrasDaFazenda.length > 0) {
            // Tenta pegar a safra marcada como "ativa"
            selectedSafra = safrasDaFazenda.find(s => s.ativa) || safrasDaFazenda[0];
          }

          setSafraAtiva(selectedSafra);
          if (selectedSafra) {
            localStorage.setItem('safra_ativa_id', selectedSafra.id.toString());
          }
        }
      } catch (error) {
        console.error("Falha ao carregar dados de tenant", error);
      } finally {
        setLoading(false);
      }
    };

    loadTenantData();
  }, []);

  // Handler para trocar de Fazenda
  const selecionarFazenda = (fazenda) => {
    if (!fazenda) return;
    setFazendaAtiva(fazenda);
    localStorage.setItem('fazenda_ativa_id', fazenda.id.toString());

    // Auto-selecionar a safra ativa dessa nova fazenda
    const safrasDaFazenda = safras.filter(s => s.fazenda_id === fazenda.id);
    const safraDefault = safrasDaFazenda.find(s => s.ativa) || safrasDaFazenda[0];
    
    setSafraAtiva(safraDefault || null);
    if (safraDefault) {
      localStorage.setItem('safra_ativa_id', safraDefault.id.toString());
    } else {
      localStorage.removeItem('safra_ativa_id');
    }
  };

  // Handler para trocar de Safra
  const selecionarSafra = (safra) => {
    if (!safra) return;
    setSafraAtiva(safra);
    localStorage.setItem('safra_ativa_id', safra.id.toString());
  };

  // Filtrar safras disponíveis para a fazenda atualmente selecionada
  const safrasFiltradas = fazendaAtiva ? safras.filter(s => s.fazenda_id === fazendaAtiva.id) : [];

  return (
    <TenantContext.Provider value={{
      fazendas,
      safras: safrasFiltradas,
      fazendaAtiva,
      safraAtiva,
      selecionarFazenda,
      selecionarSafra,
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
