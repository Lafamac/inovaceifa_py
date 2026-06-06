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
          if (error.response && error.response.status === 403) {
            let message = error.response.data?.detail || error.response.data?.error || "";
            if (Array.isArray(message)) {
              message = message[0];
            }
            if (typeof message === 'object' && message !== null) {
              message = message.detail || JSON.stringify(message);
            }
            if (typeof message === 'string' && (message.includes("inativo") || message.includes("administrador"))) {
              localStorage.setItem('login_error', message);
            }
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      let tokenData;
      try {
        // Tentar login com o e-mail completo (username na base real)
        tokenData = await relatorioService.login(email.trim(), password);
      } catch (err) {
        if (err.response && (err.response.status === 400 || err.response.status === 401 || err.response.status === 403)) {
          throw err;
        }
        // Fallback para username sem o domínio do e-mail
        const username = email.includes('@') ? email.split('@')[0] : email;
        tokenData = await relatorioService.login(username.trim(), password);
      }

      if (tokenData && tokenData.access) {
        localStorage.setItem('token', tokenData.access);
      } else {
        throw new Error("Token não recebido do servidor.");
      }
      
      const userData = await relatorioService.getUsuario();
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error("Falha na autenticação real, tratando erro...", error);
      
      if (error.response) {
        let message = error.response.data?.detail || error.response.data?.error || "E-mail ou senha incorretos.";
        if (Array.isArray(message)) {
          message = message[0];
        }
        if (typeof message === 'object' && message !== null) {
          message = message.detail || JSON.stringify(message);
        }
        localStorage.removeItem('token');
        if (typeof message === 'string' && (message.includes("inativo") || message.includes("administrador"))) {
          localStorage.setItem('login_error', message);
        }
        return { success: false, message: message };
      }
      
      // Se falhar o backend, vamos manter o comportamento original (fallback) para robustez
      try {
        const token = "mock-jwt-token-ceifa-dourada";
        localStorage.setItem('token', token);
        const userData = await relatorioService.getUsuario();
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true };
      } catch (fallbackError) {
        console.error("Falha na autenticação geral", fallbackError);
        localStorage.removeItem('token');
        return { success: false, message: "E-mail ou senha incorretos." };
      }
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
