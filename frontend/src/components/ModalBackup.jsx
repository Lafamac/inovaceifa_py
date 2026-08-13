import React, { useState } from 'react';
import { relatorioService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Database, Download, Upload, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export const ModalBackup = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await relatorioService.exportBackup();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const ownerName = user?.nome ? user.nome.toLowerCase().replace(/\s+/g, '_') : 'proprietario';
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `backup_${ownerName}_${dateStr}.zip`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccessMsg('Backup exportado com sucesso!');
      
      // Request updated user profile to get new data_ultimo_backup
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao gerar/exportar o backup.');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Selecione um arquivo de backup (.zip ou .json) para restaurar.');
      return;
    }

    const confirmMsg = "ATENÇÃO!\n\nA restauração irá apagar permanentemente todos os dados atuais (fazendas, safras, talhões, máquinas, finanças) deste proprietário e substituí-los pelas informações do arquivo.\n\nDeseja realmente continuar?";
    if (!window.confirm(confirmMsg)) return;

    setImporting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await relatorioService.importBackup(selectedFile);
      setSuccessMsg('Backup restaurado com sucesso! A página será reiniciada.');
      setSelectedFile(null);
      
      // Reload page after a delay to refresh all states
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.error || 'Erro de conexão ao restaurar.';
      setErrorMsg(`Falha na restauração: ${detail}`);
    } finally {
      setImporting(false);
    }
  };

  const formatBackupDate = (dateStr) => {
    if (!dateStr) return 'Ainda não realizado';
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070b13]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-lg bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-in scale-in duration-200">
        
        {/* Header */}
        <div className="border-b border-white/[0.06] bg-slate-950/40 p-5 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Backup e Restauração</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all text-xs font-bold font-mono"
            disabled={exporting || importing}
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-left">
          
          {/* Status Alert Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl border border-rose-950/30 bg-rose-950/20 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-450 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-xl border border-emerald-950/30 bg-emerald-950/20 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-450 shrink-0" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* Last Backup Date Info */}
          <div className="bg-slate-950/30 p-4 rounded-xl border border-white/[0.04] space-y-1">
            <span className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Último Backup Realizado</span>
            <span className="block text-xs font-bold text-white">
              {formatBackupDate(user?.data_ultimo_backup)}
            </span>
          </div>

          {/* Export Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-350">1. Exportar Dados do Proprietário</h4>
            <p className="text-[11px] text-slate-400">
              Gere e baixe uma cópia completa e compactada em formato ZIP contendo todas as fazendas, talhões, máquinas, movimentações, planejamentos e transações financeiras sob sua conta.
            </p>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || importing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-bold py-2.5 text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Exportando dados...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo de Backup</span>
                </>
              )}
            </button>
          </div>

          <div className="border-t border-white/[0.04] my-2"></div>

          {/* Import Section */}
          <form onSubmit={handleImport} className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-350">2. Importar / Restaurar Banco de Dados</h4>
            
            {/* Warning Alert */}
            <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 text-amber-300 text-[11px] space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="uppercase tracking-wider">Atenção - Ação Crítica</span>
              </div>
              <p>
                Ao restaurar, todos os dados cadastrados atualmente neste proprietário serão **removidos permanentemente** e substituídos integralmente pelos registros contidos no arquivo JSON importado.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-slate-400">Selecionar arquivo de backup (.zip ou .json)</label>
              <input
                type="file"
                accept=".zip,.json"
                onChange={handleFileChange}
                disabled={exporting || importing}
                className="w-full bg-slate-950 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500/40 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={exporting || importing || !selectedFile}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold py-2.5 text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Restaurando dados...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-emerald-450" />
                  <span>Restaurar Backup Selecionado</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
