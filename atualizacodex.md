# Atualização do Codex - Ajustes de Transferência e Estrutura de Menus

Este documento registra as alterações de layout, formulários e estrutura de menus realizadas recentemente no projeto Inova Ceifa.

## Alterações Realizadas

### 💻 Frontend

#### 1. Ocultação do Campo de Fazenda em Formulários Operacionais
- Nos formulários de cadastro de **Safra**, **Talhão**, **Máquina** e **Funcionário** do componente [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx), removemos a seleção manual do campo **Fazenda**.
- O sistema agora assume automaticamente a **fazenda ativa** do contexto global de operação (`fazendaAtiva`), preenchendo o valor no payload de criação/edição. Isso reduz cliques desnecessários e previne o cadastro de ativos em fazendas incorretas.

#### 2. Filtragem da Fazenda de Origem
- No formulário de nova transferência no componente [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx), alteramos o SelectField de **Fazenda de Origem** para aceitar apenas a fazenda selecionada no contexto de operação (`fazendaAtiva`).
- O estado inicial já carrega a fazenda ativa por padrão, impedindo a seleção de qualquer outra fazenda de origem.

#### 3. Filtragem da Fazenda de Destino
- O SelectField de **Fazenda de Destino** foi filtrado dinamicamente para carregar apenas as fazendas que pertencem ao mesmo proprietário da fazenda ativa (`fazendaAtiva.proprietario`), excluindo a própria fazenda ativa.
- Isso previne erros de negócio ao tentar realizar transferências entre fazendas de proprietários diferentes ou tentar transferir um ativo para a própria fazenda de origem.

#### 4. Filtragem da Listagem de Transferências pela Fazenda Ativa
- No componente [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx), a listagem de transferências foi corrigida para exibir apenas os registros que envolvem a fazenda ativa atual (`fazendaAtiva`) como origem ou destino.
- O filtro agora extrai os IDs das fazendas de origem e destino de forma robusta (mesmo que sejam retornados como objetos ou IDs numéricos brutos), comparando-os com o ID da fazenda ativa. Qualquer transferência que não envolva a fazenda ativa atual é ocultada da tabela.

#### 5. Reorganização do Menu Lateral e Renomeação da Seção Financeira
- Reordenamos os grupos de menu principais da barra lateral no componente [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx) para seguir o fluxo ideal de uso do sistema: **Cadastros** → **Suprimentos** (registro de insumos, fornecedores e estoques) → **Operacional** (planejamento de safras, ordens de serviço e apontamentos) → **Financeiro** (vendas, contas a pagar e receber).
- Movemos as abas **Funcionários**, **Terceirizados** e **Turmas** do grupo "Financeiro & RH" para o grupo **Cadastros**.
- O grupo "Financeiro & RH" foi renomeado para **Financeiro**, com sua descrição de apoio alterada para **"Vendas e contas"**, focando estritamente em operações comerciais e financeiras (**Pedidos de Venda**, **Contas a Pagar** e **Contas a Receber**).

### 📝 Documentação

- Atualizado o histórico de tarefas recentes no arquivo [AGENTS.md](file:///c:/workspace/inovaceifa/AGENTS.md) registrando a conclusão destas melhorias.

## Validação

- Executados os testes de integridade do sistema no backend Django com `manage.py check`, sem erros identificados.
