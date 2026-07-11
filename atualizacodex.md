# Atualização do Codex - Ajustes de Transferência e Estrutura de Menus

Este documento registra as alterações de layout, formulários e estrutura de menus realizadas recentemente no projeto Inova Ceifa.

## Alterações Realizadas

### 💻 Frontend

#### 8. Padronização de Contraste no Dark Mode
- No arquivo [index.css](file:///c:/workspace/inovaceifa/frontend/src/index.css), adicionamos uma cor base de texto para tema claro e escuro, garantindo que componentes sem classe explícita também mantenham leitura adequada.
- Foram mapeadas globalmente as classes customizadas `text-slate-350`, `text-slate-405`, `text-slate-450`, `text-slate-455`, `text-slate-550`, `text-slate-555`, `text-slate-650`, `text-slate-655` e `text-slate-850`, que já eram usadas nos componentes mas não pertencem à escala padrão do Tailwind.
- Tabelas, células e painéis `.glass-panel` dentro da página de cadastros passaram a receber cores padrão por tema, reduzindo casos de fonte clara sobre fundo claro no dark mode.
- Após revisão visual, a escala global foi recalibrada para evitar textos excessivamente escuros no tema claro e manter tons médios mais confortáveis em listas, tabelas e painéis.
- Foram adicionados estilos explícitos para labels dos formulários em modais no dark mode e para os botões/filtros **Ativos** e **Inativos**, evitando dependência de classes customizadas não geradas pelo Tailwind.
- A regra global `.dark input`, `.dark select` e `.dark textarea` foi corrigida para usar campos claros (`#f8fafc`) com texto escuro (`#0f172a`) no dark mode. Essa era a regra que mantinha os campos dos modais escuros e sem separação visual suficiente.
- Foi criada a classe `app-modal-panel` e aplicada aos modais de Cadastros, Planejamento e Locação para padronizar fundo, borda, sombra, labels, campos e botões secundários em formulários densos.
- A correção foi validada visualmente no modal **Novo Registro de Proprietários** em dark mode, confirmando campos claros, labels legíveis e contraste real entre modal e inputs.

#### 9. Correção Visual do Planejamento Selecionado
- No componente [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx), o card selecionado na coluna esquerda deixou de usar contraste fraco e passou a usar destaque Índigo suave, com texto, data e rodapé ajustados para tema claro e escuro.
- O painel de detalhes do planejamento selecionado foi revisado para usar fundos, bordas e textos adaptativos em tema claro e escuro, incluindo cabeçalho, observações, atividades planejadas, talhões e insumos.
- Também foram ajustados o cabeçalho da tela e o estado sem safra ativa para evitar dependência de textos brancos em contextos de fundo claro.
- Os labels dos modais de novo planejamento e nova atividade foram trocados para `dark:text-slate-200`, melhorando a leitura no dark mode sem estourar o contraste.
- Foi adicionada a classe `planning-selected-card` para sobrescrever a regra global de headings no dark mode, evitando que o título do card selecionado fique branco; o título, data, rodapé e ícone agora usam tons Índigo mais escuros.

#### 10. Ajustes de Fontes no Financeiro e Header
- No componente [Financeiro.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Financeiro.jsx), as abas **Pedidos de Compra**, **Contas a Pagar**, **Pedidos de Venda** e **Contas a Receber** passaram a usar as classes dedicadas `financial-tab-active` e `financial-tab-inactive`.
- No arquivo [index.css](file:///c:/workspace/inovaceifa/frontend/src/index.css), essas classes definem cores fixas no dark mode (`#94a3b8` para a aba selecionada e `#64748b` para abas inativas), evitando que regras globais de texto deixem as fontes claras demais.
- No componente [Header.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Header.jsx), a navegação principal, seletores de fazenda/safra, perfil e equivalentes mobile tiveram os tons dark reduzidos de brilho (`slate-400/300/200` para `slate-500/400/300` conforme o estado).

#### 1. Estabilidade, Destaques e Filtros na Tela de Planejamentos
- Corrigimos o ciclo de dependências de `fetchPlanejamentos` no componente [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx), removendo `selectedPlan` de suas dependências do React. Isso evitou que a coluna da direita ficasse sumindo e piscando de forma intermitente ao selecionar planejamentos na lista ou atualizar registros.
- Adicionamos uma barra de filtros por status no topo da listagem de planejamentos, permitindo alternar de forma responsiva entre exibir **Todos**, apenas os **Em Aberto** (rascunhos) ou apenas os **Aprovados**.
- Implementamos a auto-seleção automática do primeiro item da lista filtrada ao alternar de aba de status, mantendo o item anteriormente selecionado se ele ainda satisfizer as condições do novo filtro.
- Corrigimos o problema de especificidade CSS do card de planejamento selecionado: a classe `.glass-panel` (definida no CSS puro) estava sobrescrevendo os estilos do Tailwind. Agora a classe `.glass-panel` é removida condicionalmente quando o card está selecionado, garantindo a exibição perfeita da cor **Índigo / Azul** (`bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/20`).
- Renomeamos os termos de "OS Planejadas" para **"Atividades Planejadas"** e "Adicionar OS" para **"Adicionar Atividade"**, tornando o fluxo de planejamento muito mais intuitivo.
- Substituímos o botão discreto por um botão com destaque premium (`bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/10`).

#### 2. Contraste e Suporte a Temas nos Modais de Planejamento
- No componente [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx), reestruturamos os modais de **Novo Planejamento de Safra** e **Nova Atividade Planejada** para usar classes dinâmicas adaptáveis a temas claro e escuro.
- O fundo do modal foi alterado para `bg-white dark:bg-slate-900` e a borda para `border-slate-200 dark:border-white/[0.08]`.
- A cor das fontes dos labels foi aprimorada de um tom cinza fixo apagado para `text-slate-700 dark:text-slate-350` (alto contraste).
- O botão de fechar (X) teve sua cor ajustada para `text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white` para melhor legibilidade nos dois temas.
- Inputs, textareas e selects foram atualizados com bordas e fundos adaptativos para garantir visibilidade ideal em qualquer tema selecionado.

#### 3. Ocultação do Campo de Fazenda em Formulários Operacionais
- Nos formulários de cadastro de **Safra**, **Talhão**, **Máquina** e **Funcionário** do componente [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx), removemos a seleção manual do campo **Fazenda**.
- O sistema agora assume automaticamente a **fazenda ativa** do contexto global de operação (`fazendaAtiva`), preenchendo o valor no payload de criação/edição. Isso reduz cliques desnecessários e previne o cadastro de ativos em fazendas incorretas.

#### 4. Filtragem da Fazenda de Origem
- No formulário de nova transferência no componente [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx), alteramos o SelectField de **Fazenda de Origem** para aceitar apenas a fazenda selecionada no contexto de operação (`fazendaAtiva`).
- O estado inicial já carrega a fazenda ativa por padrão, impedindo a seleção de qualquer outra fazenda de origem.

#### 5. Filtragem da Fazenda de Destino
- O SelectField de **Fazenda de Destino** foi filtrado dinamicamente para carregar apenas as fazendas que pertencem ao mesmo proprietário da fazenda ativa (`fazendaAtiva.proprietario`), excluindo a própria fazenda ativa.
- Isso previne erros de negócio ao tentar realizar transferências entre fazendas de proprietários diferentes ou tentar transferir um ativo para a própria fazenda de origem.

#### 6. Filtragem da Listagem de Transferências pela Fazenda Ativa
- No componente [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx), a listagem de transferências foi corrigida para exibir apenas os registros que envolvem a fazenda ativa atual (`fazendaAtiva`) como origem ou destino.
- O filtro agora extrai os IDs das fazendas de origem e destino de forma robusta (mesmo que sejam retornados como objetos ou IDs numéricos brutos), comparando-os com o ID da fazenda ativa. Qualquer transferência que não envolva a fazenda ativa atual é ocultada da tabela.

#### 7. Reorganização do Menu Lateral e Renomeação da Seção Financeira
- Reordenamos os grupos de menu principais da barra lateral no componente [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx) para seguir o fluxo ideal de uso do sistema: **Cadastros** → **Suprimentos** (registro de insumos, fornecedores e estoques) → **Operacional** (planejamento de safras, ordens de serviço e apontamentos) → **Financeiro** (vendas, contas a pagar e receber).
- Movemos as abas **Funcionários**, **Terceirizados** e **Turmas** do grupo "Financeiro & RH" para o grupo **Cadastros**.
- O grupo "Financeiro & RH" foi renomeado para **Financeiro**, com sua descrição de apoio alterada para **"Vendas e contas"**, focando estritamente em operações comerciais e financeiras (**Pedidos de Venda**, **Contas a Pagar** e **Contas a Receber**).

### 🚜 Recursos Planejados no Planejamento e OSs Reais

#### 1. Backend (Models e Serializers)
- Adicionados os campos `funcionario`, `trator` e `implemento` (ForeignKeys opcionais) no modelo `OrdemServicoPlanejada`.
- Adicionados os campos `funcionario_planejado`, `trator_planejado` e `implemento_planejado` (ForeignKeys opcionais) no modelo `OrdemServico` (OS Real).
- Atualizado o serializer `OrdemServicoPlanejadaSerializer` e `OrdemServicoSerializer` para incluir estes novos campos, além de representações somente leitura (`funcionario_nome`/`funcionario_planejado_nome`, `trator_codigo`/`trator_planejado_codigo` e `implemento_codigo`/`implemento_planejado_codigo`).
- Atualizada a action `gerar_ordens_servico` para copiar os recursos indicados no planejamento diretamente para a OS Real no momento de sua criação.

#### 2. Frontend (Planejamentos e Apontamentos)
- No componente [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx), adicionados campos de seleção para Operador, Trator e Implemento no modal **Nova Atividade Planejada**.
- No mesmo arquivo, as listagens de funcionários e máquinas são buscadas e filtradas dinamicamente pela fazenda ativa atual.
- O card de detalhes de atividades planejadas agora exibe visualmente os recursos predefinidos para a operação.
- No componente [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx), a abertura do modal de Apontamento Operacional foi interceptada por meio da nova função helper `handleOpenAptModal`, pré-carregando automaticamente os operadores e máquinas predefinidos no formulário temporário de apontamento real.

### 📝 Documentação

- Atualizado o histórico de tarefas recentes no arquivo [agents.md](file:///c:/workspace/inovaceifa/agents.md) registrando a conclusão destas melhorias.
- Atualizado este arquivo [atualizacodex.md](file:///c:/workspace/inovaceifa/atualizacodex.md) com a documentação do recurso planejado.

## Validação

- Executados os testes de integridade do sistema no backend Django com `manage.py check`, sem erros identificados.
- Executado `npm run build` no frontend após os ajustes visuais, sem erros de compilação.
