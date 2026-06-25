import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { relatorioService } from '../services/api';
import { Sprout, Lock, Mail, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const { login, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(() => {
    const savedError = localStorage.getItem('login_error');
    if (savedError) {
      localStorage.removeItem('login_error');
      return savedError;
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Estados de recuperação de senha
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (authError) {
      setError(authError);
      if (clearAuthError) {
        clearAuthError();
      }
    }
  }, [authError, clearAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    setError('');

    const res = await login(email, password);
    if (!res.success) {
      setError(res.message || 'Falha ao autenticar. Verifique seus dados.');
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    if (!recoveryEmail) return;

    setRecoveryLoading(true);
    setRecoveryError('');
    setRecoverySuccess('');

    try {
      const response = await relatorioService.recuperarSenha(recoveryEmail);
      setRecoverySuccess(response.detail || 'Uma nova senha temporária foi enviada para o seu e-mail.');
      setRecoveryEmail('');
    } catch (err) {
      console.error(err);
      let msg = 'Erro ao solicitar nova senha.';
      if (err.response && err.response.data && err.response.data.detail) {
        msg = err.response.data.detail;
      }
      setRecoveryError(msg);
    } finally {
      setRecoveryLoading(false);
    }
  };


  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#090d16] overflow-hidden font-sans">
      
      {/* Decorative Harmonious Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none animate-pulse duration-[6000ms]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none animate-pulse duration-[4000ms]"></div>

      {/* Login Card Container */}
      <div className="relative w-full max-w-[450px] p-8 mx-4 rounded-3xl border border-white/[0.06] bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-black/50 z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo and Greeting */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20">
            <Sprout className="h-8 w-8 animate-bounce-slow" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white font-display">
              Inova Ceifa
            </h2>
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest mt-1">
              Agro Analytics Platform
            </p>
          </div>
        </div>

        {/* Validation Errors */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl border border-rose-900/30 bg-rose-950/20 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 block shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email input field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={emailRef}
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    passwordRef.current?.focus();
                  }
                }}
                placeholder="nome@empresa.com.br"
                style={{ paddingLeft: '3.75rem', paddingRight: '1rem' }}
                className="login-input-with-left-icon w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 focus:bg-slate-950 rounded-xl py-3 pl-14 pr-4 text-sm text-white placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="••••••••"
                style={{ paddingLeft: '3.75rem', paddingRight: '3.75rem' }}
                className="login-input-with-both-icons w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 focus:bg-slate-950 rounded-xl py-3 pl-14 pr-14 text-sm text-white placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-emerald-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-transparent border-none cursor-pointer focus:outline-none"
              >
                Esqueceu a senha?
              </button>
            </div>
          </div>

          {/* Remember me toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="w-4 h-4 rounded border-white/[0.08] bg-slate-950/50 text-emerald-500 focus:ring-emerald-500/30"
              />
              <span className="text-xs text-slate-200 font-semibold">Lembrar-me neste aparelho</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm py-3 px-4 shadow-lg shadow-emerald-500/10 transition-all hover:shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>


      </div>

      {/* Modal de Recuperação de Senha */}
      {showForgotModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50 animate-in fade-in duration-200">
          <div className="relative w-full max-w-[420px] p-8 mx-4 rounded-3xl border border-white/[0.08] bg-slate-900 shadow-2xl shadow-black/80 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Recuperar Senha</h3>
                <p className="text-xs text-slate-200 mt-1">
                  Digite seu e-mail cadastrado. Enviaremos uma nova senha temporária para você.
                </p>
              </div>
            </div>

            {recoveryError && (
              <div className="mb-4 p-3 rounded-xl border border-rose-900/30 bg-rose-950/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 block shrink-0" />
                <p>{recoveryError}</p>
              </div>
            )}

            {recoverySuccess && (
              <div className="mb-4 p-3 rounded-xl border border-emerald-900/30 bg-emerald-950/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block shrink-0" />
                <p>{recoverySuccess}</p>
              </div>
            )}

            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  E-mail do Usuário
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="nome@empresa.com.br"
                    style={{ paddingLeft: '3.75rem', paddingRight: '1rem' }}
                    className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 focus:bg-slate-950 rounded-xl py-3 pl-14 pr-4 text-sm text-white placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setRecoveryEmail('');
                    setRecoverySuccess('');
                    setRecoveryError('');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-white/[0.08] text-slate-200 hover:text-white hover:bg-white/[0.02] font-semibold text-xs transition-colors cursor-pointer focus:outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={recoveryLoading || !recoveryEmail}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs py-2.5 px-4 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer focus:outline-none"
                >
                  {recoveryLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Enviar E-mail</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
