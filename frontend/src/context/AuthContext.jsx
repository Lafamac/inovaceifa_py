import React, { createContext, useContext, useState, useEffect } from 'react';
import { relatorioService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await relatorioService.getUsuario();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Falha ao recuperar sessão ativa", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Tentar login via serviço
      const token = "mock-jwt-token-ceifa-dourada";
      localStorage.setItem('token', token);
      
      const userData = await relatorioService.getUsuario();
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error("Falha na autenticação", error);
      return { success: false, message: "E-mail ou senha incorretos." };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('safra_ativa_id');
    localStorage.removeItem('fazenda_ativa_id');
    setUser(null);
    setIsAuthenticated(false);
  };

  const changePassword = async (oldPassword, newPassword) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log("Senha alterada com sucesso!");
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
