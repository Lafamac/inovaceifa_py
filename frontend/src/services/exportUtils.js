/**
 * Utilitário universal para exportar dados tabulares para formato CSV.
 * Inclui o cabeçalho BOM UTF-8 (\uFEFF) para garantir compatibilidade total
 * de acentuações da língua portuguesa ao abrir diretamente no Excel no Windows.
 * 
 * @param {string} filename Nome do arquivo a ser baixado (sem extensão)
 * @param {string[]} headers Array contendo as colunas de cabeçalho ['Coluna 1', 'Coluna 2']
 * @param {any[]} data Lista de objetos/dados a serem exportados
 * @param {function} mapRowFn Função que mapeia cada item da lista para um array de valores correspondente
 */
export const exportToCSV = (filename, headers, data, mapRowFn) => {
  if (!data || !data.length) {
    console.warn("Nenhum dado fornecido para exportação.");
    return;
  }

  const csvRows = [];
  
  // Inclusão das colunas de cabeçalho
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
  
  // Inclusão das linhas de dados
  for (const item of data) {
    const values = mapRowFn(item).map(val => {
      if (val === null || val === undefined) {
        return '""';
      }
      
      // Converte para string e escapa aspas duplas
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  // Adiciona o caractere BOM para UTF-8 (\uFEFF) para forçar o Excel a reconhecer a codificação correta
  const csvContent = "\uFEFF" + csvRows.join("\n");
  
  // Criação do Blob e ativação do download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
