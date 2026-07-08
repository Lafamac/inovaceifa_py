# Atualização do Codex - Ajustes de Transferência e Estrutura de Menus

Este documento registra as alterações de layout, formulários e estrutura de menus realizadas recentemente no projeto Inova Ceifa.

## Alterações Realizadas

### 💻 Frontend

#### 1. Filtragem da Fazenda de Origem
- No formulário de nova transferência no componente [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx), alteramos o SelectField de **Fazenda de Origem** para aceitar apenas a fazenda selecionada no contexto de operação (`fazendaAtiva`).
- O estado inicial já carrega a fazenda ativa por padrão, impedindo a seleção de qualquer outra fazenda de origem.

#### 2. Filtragem da Fazenda de Destino
- O SelectField de **Fazenda de Destino** foi filtrado dinamicamente para carregar apenas as fazendas que pertencem ao mesmo proprietário da fazenda ativa (`fazendaAtiva.proprietario`), excluindo a própria fazenda ativa.
- Isso previne erros de negócio ao tentar realizar transferências entre fazendas de proprietários diferentes ou tentar transferir um ativo para a própria fazenda de origem.

#### 3. Reorganização do Menu Lateral e Renomeação da Seção Financeira
- Movemos as abas **Funcionários**, **Terceirizados** e **Turmas** do grupo "Financeiro & RH" para o grupo **Cadastros** no menu do componente [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx).
- O grupo "Financeiro & RH" foi renomeado para **Financeiro**, com sua descrição de apoio alterada para **"Vendas e contas"**, focando estritamente em operações comerciais e financeiras (**Pedidos de Venda**, **Contas a Pagar** e **Contas a Receber**).

### 📝 Documentação

- Atualizado o histórico de tarefas recentes no arquivo [AGENTS.md](file:///c:/workspace/inovaceifa/AGENTS.md) registrando a conclusão destas melhorias.

## Validação

- Executados os testes de integridade do sistema no backend Django com `manage.py check`, sem erros identificados.
