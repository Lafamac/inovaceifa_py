import React, { createContext, useContext, useState, useEffect } from 'react';
import { relatorioService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await relatorioService.getUsuario();
        setUser(userData);
      } catch (error) {
        console.error("Falha ao buscar perfil de usuário", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const changePassword = async (oldPassword, newPassword) => {
    // Simular chamada de API com atraso
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log("Senha alterada com sucesso!");
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, changePassword }}>
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
