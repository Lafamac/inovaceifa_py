import React from 'react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-950/40 py-6 mt-12 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
        
        <div className="flex items-center space-x-1.5">
          <span className="text-emerald-500 dark:text-emerald-600">●</span>
          <span>© {currentYear} Inova Ceifa Agronegócios S.A.</span>
        </div>

        <div className="flex items-center space-x-4">
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Termos de Uso</a>
          <span className="text-slate-200 dark:text-slate-800">|</span>
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Suporte</a>
          <span className="text-slate-200 dark:text-slate-800">|</span>
          <div className="rounded-full bg-slate-100 dark:bg-slate-900 px-2.5 py-0.5 font-bold text-slate-500 dark:text-slate-400">
            Versão v2.4.0
          </div>
        </div>

      </div>
    </footer>
  );
};
