import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, Lock, Mail, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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

  const handleDemoAccess = async () => {
    setLoading(true);
    setError('');
    // Automático para o demo
    const res = await login('carlos.souza@inovaceifa.com.br', 'admin123');
    if (!res.success) {
      setError('Erro ao carregar demonstração.');
      setLoading(false);
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
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
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
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com.br"
                className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 focus:bg-slate-950 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Senha de Acesso
              </label>
              <a href="#recuperar" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/50 border border-white/[0.08] focus:border-emerald-500/60 focus:bg-slate-950 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-emerald-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
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
              <span className="text-xs text-slate-400 font-semibold">Lembrar-me neste aparelho</span>
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

        {/* Quick Demo Access Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.05]"></div>
          </div>
          <span className="relative bg-[#111827] px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Ou teste agora
          </span>
        </div>

        {/* Fast Demo Access Button */}
        <button
          onClick={handleDemoAccess}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] hover:border-emerald-500/40 hover:bg-emerald-950/15 text-slate-300 hover:text-white font-bold text-xs py-3 px-4 transition-all focus:outline-none"
        >
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
          <span>Acesso Rápido (Demonstração)</span>
        </button>

      </div>
    </div>
  );
};
