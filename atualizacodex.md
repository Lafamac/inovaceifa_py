# Atualização do Codex - Ajustes de Transferência e Estrutura de Menus

Este documento registra as alterações de layout, formulários e estrutura de menus realizadas recentemente no projeto Inova Ceifa.
*Última Atualização: 13/08/2026*

## Alterações Realizadas

### 💾 Módulo de Backup de Dados e Alertas Inteligentes (13/08/2026)

#### 1. Backend (Lógica de Backup e Importação)
- **Estruturação de Schema (Proprietario)**:
  - Adicionado o campo `data_ultimo_backup` (DateTimeField) ao modelo `Proprietario` para controle do histórico de backups.
  - Criada e executada a migração Django `core.0006_proprietario_data_ultimo_backup`.
- **Lógica Utility (backup.py)**:
  - Criado o arquivo [backup.py](file:///c:/workspace/inovaceifa/backend/core/backup.py) encapsulando os relacionamentos e dependências de todos os modelos do sistema.
  - Implementada a deleção em cascata segura em ordem reversa para ignorar conflitos de chaves protegidas (`on_delete=models.PROTECT`).
  - Utilizado o deserializador nativo de fixtures do Django para restaurar dados preservando as chaves primárias (`pk`) e relacionamentos ManyToMany.
- **Roteamento e Login**:
  - Registrada a rota `/api/backup/` com suporte a `GET` (download do backup atualizando data) e `POST` (upload do arquivo JSON e restauração).
  - Atualizada a API `/api/auth/me/` para incluir a `data_ultimo_backup` na resposta do perfil.

#### 2. Frontend (Modais e Alertas no Dashboard)
- **Modal de Backup (ModalBackup.jsx)**:
  - Desenvolvido modal premium escuro glassmorphism em [ModalBackup.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/ModalBackup.jsx).
  - Inclui botões para download do arquivo JSON (`relatorioService.exportBackup`) e restauração com aviso proeminente confirmando a sobrescrita definitiva.
- **Destaque Visual e Acesso (Header.jsx)**:
  - Inserida opção "Backup de Dados" no menu do perfil de usuário em [Header.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Header.jsx).
- **Aviso Inteligente de Segurança (Dashboard.jsx)**:
  - Incluído um banner de alerta no topo do [Dashboard.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Dashboard.jsx) caso não haja backups ou o último tenha mais de 7 dias, induzindo o usuário a manter seus dados salvos.

### 🔄 Busca de Preços de Insumos e Ajustes de Volume Planejado (13/08/2026)

#### 1. Cálculo de Insumo por Hectare no Planejamento de Safra
- **Cálculo Automático por Área (Frontend)**:
  - No componente [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx), a quantidade total planejada (`quantidade_planejada`) de cada insumo passou a ser calculada automaticamente multiplicando a dose por hectare pela área combinada de todos os talhões selecionados na atividade planejada.
  - A lógica foi adicionada ao manipulador de seleção de talhões (`handleToggleTalhaoSelection`) para atualizar em tempo real a quantidade de todos os insumos já listados e do insumo temporário na tela.
  - Adicionado cálculo automático no campo **Dose** para recalcular a **Qtd Total Planejada** instantaneamente enquanto o usuário digita.

#### 2. Busca Automática de Preço Unitário de Insumos e Combustíveis
- **Pedidos de Compra (Financeiro)**:
  - No modal de Novo/Editar Pedido de Compra em [Financeiro.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Financeiro.jsx), configuramos a ação `onChange` do dropdown de insumos/produtos. Ao selecionar um produto, o sistema recupera o valor correspondente no cadastro de produtos e preenche automaticamente o campo **Preço Unitário (R$)**.
- **Abastecimento de Máquina (Operacional)**:
  - No modal de Registrar Abastecimento em [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx), a seleção de combustível preenche automaticamente o campo **Valor Unitário (R$)** com a propriedade `valor_unitario` do combustível cadastrado.
  - Corrigido o bug do manipulador de digitação do formulário (`handleAbtQtyOrPriceChange`), que não estava declarado e causava erros ao alterar quantidade ou preço.
- **Rateios Operacionais (Operacional)**:
  - No formulário de Rateio Operacional em [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx), a seleção de combustível planejado (`combustivel_plan`) ou realizado (`combustivel_real`) preenche automaticamente o respectivo preço unitário do diesel (`valor_diesel_plan` / `valor_diesel_real`) cadastrado na tabela de produtos.

### 🪟 Ajuste de Posicionamento do Modal de Cadastros

- No componente [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx), o modal principal de cadastro/edição deixou de ser centralizado verticalmente e passou a abrir ancorado próximo ao topo da tela.
- O painel do modal agora possui altura máxima baseada na viewport (`max-h`) e `overflow-hidden`, enquanto o formulário interno mantém rolagem própria. Isso evita que formulários longos, como a edição de **Talhões**, abram muito abaixo da área visível após a inclusão de novos campos agronômicos.
- A alteração melhora a ergonomia em telas menores sem afetar o layout em duas colunas dos formulários.

### 🎨 Ajuste de Contraste do Dropdown de Referências no Dark Mode e Melhoria de Conectividade API

- **Ajuste Visual de Contraste (Frontend)**:
  - Removemos as classes utilitárias `dark:bg-slate-950/50` e `dark:text-white` do componente `<select>` de seleção de tabelas de referência em [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx).
  - Com isso, o elemento herda perfeitamente a regra global de estilo para campos `.dark select` em [index.css](file:///c:/workspace/inovaceifa/frontend/src/index.css) (fundo claro com fonte escura no dark mode), eliminando o contraste inadequado de texto claro sobre fundo branco.
  - Removemos também as classes `dark:bg-slate-900` e `dark:text-white` das tags `<option>` internas, forçando-as a usar `bg-white text-slate-800` para garantir legibilidade impecável independente do tema ou navegador.
- **Melhoria na URL da API (Frontend)**:
  - Alteramos a definição da variável `API_BASE_URL` em [api.js](file:///c:/workspace/inovaceifa/frontend/src/services/api.js) para usar dinamicamente o hostname de carregamento do frontend (`window.location.hostname`) em vez do IP fixo `127.0.0.1`.
  - Isso soluciona problemas onde o usuário acessa o frontend por `localhost` ou `[::1]`, mas as requisições API eram direcionadas para `127.0.0.1`, o que causava bloqueio silencioso por CORS ou falhas de rede no loopback local dependendo da resolução IPv4/IPv6 do sistema.
- **Logs de Diagnóstico em Requisições GET**:
  - Adicionamos um log explícito de erro (`console.error`) no bloco `catch` do método `fetchList` em [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx) para registrar qualquer falha de requisição GET, evitando que falhas de rede passem desapercebidas devido ao fallback automático dos mocks offline.

### 🗑️ Inativação e Reativação em Cascata (Soft Delete) e Ocultação de Órfãos

- **Inativação Recursiva (Backend)**:
  - Sobrescrevemos o método `save` nos modelos `Proprietario` e `Fazenda` em [models.py](file:///c:/workspace/inovaceifa/backend/core/models.py) para garantir que, quando desativados (`ativo = False`), todos os seus registros filhos dependentes também sejam desativados automaticamente em cascata (`ativo = False`).
  - Proprietário desativa: todas as suas Fazendas.
  - Fazenda desativa: Safras, Talhões, Máquinas, Funcionários, Terceirizados, Turmas Terceirizadas, Produtos, Fornecedores, Locações, Planejamentos, Ordens de Serviço Reais, Gastos de Rateio Realizados, Abastecimentos, Rateios Operacionais, Pedidos de Compra, Contas a Pagar, Pedidos de Venda, Contas a Receber e Movimentações de Estoque, além de Transferências de Ativos relacionadas.
  - Talhão desativa: suas Estimativas de Produção em [models.py](file:///c:/workspace/inovaceifa/backend/cadastros/models.py).
  - Máquina desativa: suas Manutenções em [models.py](file:///c:/workspace/inovaceifa/backend/cadastros/models.py).
  - Funcionário desativa: seus Salários Mensais em [models.py](file:///c:/workspace/inovaceifa/backend/cadastros/models.py).
- **Reativação Recursiva (Backend)**:
  - Implementamos a lógica inversa nos métodos `save` dos modelos `Proprietario` e `Fazenda` em [models.py](file:///c:/workspace/inovaceifa/backend/core/models.py) e de `Talhao`, `Maquina` e `Funcionario` em [models.py](file:///c:/workspace/inovaceifa/backend/cadastros/models.py) para detectar a alteração de `ativo` de `False` para `True`.
  - Quando um Proprietário é reativado, todas as suas Fazendas inativas são reativadas.
  - Quando uma Fazenda é reativada, todas as suas safras, talhões, máquinas, funcionários e outros dados vinculados são reativados automaticamente em cascata.
  - Quando um Talhão, Máquina ou Funcionário é reativado, suas respectivas tabelas filhas (estimativas, manutenções, salários) são igualmente reativadas.
- **Filtro de Órfãos**:
  - Atualizamos os métodos `get_queryset` em `BaseTenantViewSet` em [views.py](file:///c:/workspace/inovaceifa/backend/cadastros/views.py), `BaseTenantPlanejamentoViewSet` em [views.py](file:///c:/workspace/inovaceifa/backend/planejamento/views.py), `FazendaViewSet` e `SafraViewSet` em [views.py](file:///c:/workspace/inovaceifa/backend/core/views.py) para filtrar recursivamente e ocultar qualquer registro cujo pai Fazenda ou Proprietário esteja inativo, mesmo se a query parameter pedir registros inativos.


### 🚜 Precisão do Talhão, Espaçamento e Mês/Ano Cultivo

- **Ajuste de Precisão do Campo de Área (Backend e Banco de Dados)**:
  - Alteramos a precisão da coluna `area` no modelo `Talhao` em [models.py](file:///c:/workspace/inovaceifa/backend/cadastros/models.py) para `DecimalField(max_digits=12, decimal_places=5)` a fim de suportar até 5 casas decimais de precisão.
  - Adicionamos o novo campo `mes_ano_cultivo` em [models.py](file:///c:/workspace/inovaceifa/backend/cadastros/models.py) (`CharField(max_length=7, null=True, blank=True)`) com formato de preenchimento `MM/AAAA`.
  - Criamos e executamos as migrações Django (`makemigrations` e `migrate`) para aplicar essas alterações estruturais no banco de dados.
- **Aprimoramento do Formulário e Listagem de Talhões (Frontend)**:
  - Adicionamos no formulário modal de Talhões em [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx) os inputs para os campos de **Espaçamento Rua**, **Espaçamento Planta**, **Estande (plantas/ha)**, **Número de Plantas** e o novo **Mês/Ano Cultivo**.
  - Aumentamos o `step` do campo de `Área` para `"0.00001"` permitindo a digitação precisa de até 5 casas decimais.
  - Atualizamos a listagem da tabela de talhões para exibir e formatar todas essas informações de forma estruturada: área com precisão de até 5 casas decimais, Espaçamento formatado como `Rua x Planta` e Mês/Ano Cultivo ao lado da fazenda.
- **Painel Geral (Gestão à Vista)**:
  - Em [GestaoAVista.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/GestaoAVista.jsx), atualizamos a formatação da área total de Hectares Cultivados no KPI geral de `kpis.hectares_cultivados` para utilizar a formatação pt-BR com precisão de até 5 casas decimais (`minimumFractionDigits: 2, maximumFractionDigits: 5`).


### 📚 Correção do Salvamento e Inclusão de Tabelas de Referência

- **Inicialização de Campos (Frontend)**:
  - Atualizamos a estrutura de `emptyForms.referencias` em [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx) para conter todas as chaves utilizadas pelas 19 tabelas de referências (`nome`, `sigla`, `codigo`, `descricao`, `valor`), evitando inputs descontrolados no React e permitindo o correto reset de todos os campos.
- **Filtragem de Atributos do Payload**:
  - Ajustamos o método `handleSubmit` em [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx) para que, ao salvar dados de tabelas de referência, filtre dinamicamente o payload mantendo apenas os atributos declarados na especificação daquela referência em `ALL_REFERENCES`, prevenindo o envio de campos excedentes ou vazios herdados de formulários anteriores que causavam rejeição/erros no backend.


### ⚡ Cache-Control Adicional no Backend

- **Remoção de Cache em Todos os ViewSets**:
  - Introduzimos a classe `BaseCoreViewSet` em [views.py](file:///c:/workspace/inovaceifa/backend/core/views.py) herdando `ModelViewSet` e implementando a injeção do header de `Cache-Control` estrito (`no-cache, no-store, must-revalidate, max-age=0`) nas respostas de requisições `GET` e `HEAD`. Fizemos com que `ProprietarioViewSet`, `FazendaViewSet` e `SafraViewSet` herdem desta base.
  - Implementamos a injeção do mesmo header de `Cache-Control` no método `finalize_response` da classe `BaseTenantPlanejamentoViewSet` em [views.py](file:///c:/workspace/inovaceifa/backend/planejamento/views.py), estendendo automaticamente essa proteção anti-cache para todas as requisições GET/HEAD de planejamentos, ordens de serviço (operacional) e pedidos de compra/venda/contas (financeiro).


### 🎨 Padronização de Formulários Modais e Botão Cancelar

#### 1. Padronização Visual dos Modais para o Tema Escuro Premium (Glassmorphism)
- Todos os formulários modais de planejamento e operacionais foram unificados visualmente para seguir o mesmo design escuro glassmorphism introduzido no modal de Pedidos de Compra.
- Isso inclui a aplicação de um fundo escuro glassmorphism (`glass-panel bg-slate-900 border-white/[0.08]`), cabeçalho escuro contrastante (`bg-slate-950/40 border-b border-white/[0.06]`), títulos em caixa alta na cor branca e o botão de fechar "X" padronizado.
- As labels foram convertidas para caixa alta com fonte pequena e cor suave de alto contraste (`text-[10px] font-black uppercase text-slate-400 mb-1.5`).
- Os campos de input, select e textarea foram ajustados para fundo escuro (`bg-slate-950 border-white/[0.06] text-white`) com bordas sutis e comportamento de focus/disabled adaptado para o novo padrão.
- Esta alteração foi aplicada nos seguintes modais:
  - **Novo Planejamento de Safra** em [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx)
  - **Adicionar/Editar Atividade Planejada** em [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx)
  - **Nova OS Real Avulsa** em [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx)
  - **Apontar Atividade Operacional** em [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx)
  - **Registrar Abastecimento** em [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx)
  - **Lançar Gasto e Rateio Realizado** em [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx)
  - **Lançar Rateio Operacional** em [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx)

#### 2. Botão Cancelar e Ações no Rodapé
- Adicionado o botão de ação **Cancelar** no rodapé do formulário de **Novo Planejamento de Safra** (que antes possuía apenas o botão de salvar abrangendo toda a largura).
- Todas as ações de rodapé desses modais foram reestruturadas para exibir os botões **Cancelar** (secundário, borda suave) e **Salvar/Criar** (primário, gradiente esmeralda) alinhados à direita de forma consistente.


### 🔄 Edição de Atividades Planejadas e Ajustes Visuais

#### 1. Edição e Exclusão de Atividades Planejadas no Frontend e Backend
- No backend, o método `update` de [OrdemServicoPlanejadaSerializer](file:///c:/workspace/inovaceifa/backend/planejamento/serializers.py) agora extrai, valida e persiste os insumos planejados (`ItemInsumoOSPlanejado`), permitindo a alteração dinâmica de insumos e doses sem que o payload seja ignorado.
- No frontend, o componente [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx) foi atualizado para gerenciar o estado `editingOS`. Substituímos o botão de texto "Editar" por botões de ícones no cabeçalho de cada card de atividade: um ícone de lápis (`Edit2`) para edição e um ícone de lixeira (`Trash2`) para a remoção da atividade planejada.
- Adicionada a função `handleDeleteOS` para enviar a requisição HTTP `DELETE` e atualizar dinamicamente a listagem de atividades após a confirmação.
- Ao salvar a edição, a requisição é feita via método HTTP `PUT` para a rota `/api/ordens-servico-planejadas/{id}/`.

#### 2. Inteligência no Cadastro de Insumos Planejados
- Implementamos uma lógica na submissão do formulário em [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx) para verificar se o usuário preencheu os inputs de insumo temporário (`tempInsumo`) mas esqueceu de clicar no botão de somar `+`. O sistema agora anexa automaticamente este insumo ao payload antes do envio.

#### 3. Compactação de Espaçamento e Acordeão Colapsável
- O visual do card das atividades planejadas em [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx) foi otimizado: as atividades agora utilizam um layout de **Acordeão Colapsável** (fechadas por padrão) com rotação suave de ícone indicador.
- Adicionamos um botão global **Expandir Todas / Recolher Todas** ao lado do título da seção, visível quando houver múltiplas atividades, melhorando significativamente a navegação em planejamentos densos.
- Reduzimos o espaçamento interno do card para as seções detalhadas.

#### 4. Exibição de Nomes Descritivos nos Recursos Planejados
- Adicionamos os campos de leitura `trator_nome` (descrição da máquina) e `implemento_nome` (descrição do implemento) no serializer do backend.
- O componente frontend [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx) foi atualizado para exibir essas descrições amigáveis no painel de recursos em vez do código numérico puro da base de dados.

#### 5. Correção de Contraste e Tamanho de Fonte das Doses e Totais Planejados
- Alteramos a linha inteira de informação de doses ("Dose: X | Total: Y kg") para utilizar a cor `text-emerald-700` (light mode) e `text-emerald-400` (dark mode) com peso de fonte extra negrito (`font-black`) e tamanho de fonte aumentado de `text-[9px]` para `text-[10px]`, garantindo visibilidade e destaque completo desse bloco de informação crítica.


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

#### 11. Validação de Datas do Planejamento e Ordens de Serviço
- No formulário de **Adicionar Atividade** (Nova OS Planejada) no componente [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx), adicionamos uma validação no frontend para impedir que a data de "Término Planejado" seja menor que a data de "Início Planejado".
- No formulário de **Criar OS Real** no componente [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx), adicionamos a mesma validação para a janela técnica planejada.
- No backend, no serializer [OrdemServicoPlanejadaSerializer](file:///c:/workspace/inovaceifa/backend/planejamento/serializers.py), implementamos o método `validate` para rejeitar requisições cuja data de término seja menor que a data de início planejado.
- No backend, no serializer [OrdemServicoSerializer](file:///c:/workspace/inovaceifa/backend/operacoes/serializers.py), estendemos o método `validate` para rejeitar termos de data menores que o início, tanto para a janela técnica planejada quanto para a execução real.
- Adicionamos um teste de integração automatizado (`test_planned_end_date_cannot_be_before_start_date`) em [tests.py](file:///c:/workspace/inovaceifa/backend/planejamento/tests.py) para certificar a consistência dessa regra de validação do backend.

#### 12. Planejamento de Terceirizados e Turmas (Panha de Café)
- Adicionados os campos `terceirizado` (Foreign Key para `Terceirizado`) e `usar_turma` (BooleanField) no modelo de backend [OrdemServicoPlanejada](file:///c:/workspace/inovaceifa/backend/planejamento/models.py). O campo `turma` (ForeignKey) continua existindo de forma opcional, mas no fluxo padrão do planejamento especificamos apenas se usaremos ou não turma (via flag booleana) e qual o orçamento previsto.
- Adicionados os campos `terceirizado_planejado`, `usar_turma` (BooleanField) e `valor_planejado_turma` (DecimalField) no modelo de backend [OrdemServico](file:///c:/workspace/inovaceifa/backend/operacoes/models.py) para registrar o orçamento orçado de mão de obra de colheita.
- Atualizados os serializers de backend [OrdemServicoPlanejadaSerializer](file:///c:/workspace/inovaceifa/backend/planejamento/serializers.py) e [OrdemServicoSerializer](file:///c:/workspace/inovaceifa/backend/operacoes/serializers.py) para incluir essas novas flags e orçamentos.
- Atualizada a action `gerar_ordens_servico` em [views.py](file:///c:/workspace/inovaceifa/backend/planejamento/views.py) para copiar automaticamente a flag `usar_turma` e o `valor_planejado_turma` da atividade planejada para a OS real correspondente.
- Atualizado o frontend no componente [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx): o modal de **Adicionar Atividade** foi modificado para substituir o dropdown de turmas por uma opção Sim/Não **"Usar Turma para Panha (Colheita)"**, habilitando a digitação do valor planejado caso ativado. O card de detalhamento exibe a label **Turma (Panha): Sim** com o respectivo valor orçado.
- Atualizado o frontend no componente [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx): exibe os presets de operador, máquina, implemento, terceirizado e turma planejada com seu valor histórico de panha. O preenchimento da turma executora no apontamento operacional permanece manual a partir do cadastro de turmas no momento em que a OS é executada.
- Estendidos os testes automatizados do backend em [tests.py](file:///c:/workspace/inovaceifa/backend/planejamento/tests.py) para validar a persistência e cópia correta de `usar_turma` e `valor_planejado_turma`.

#### 13. Correção de Contraste e Suporte a Tema Escuro no Tailwind CSS v4
- No arquivo [index.css](file:///c:/workspace/inovaceifa/frontend/src/index.css), adicionamos a diretiva `@variant dark (&:where(.dark, .dark *));` logo após a importação do `@import "tailwindcss";`.
- Por padrão no Tailwind CSS v4, as utilitárias pré-fixadas com `dark:` usam a media query `@media (prefers-color-scheme: dark)`. Como o sistema alterna temas aplicando a classe `.dark` no elemento `<html>` (`document.documentElement.classList.add('dark')`), os utilitários de classe do Tailwind não eram aplicados, enquanto as regras globais de CSS forçavam os textos a ficarem brancos/claros.
- Com a inclusão do seletor da variante `@variant dark`, todas as classes `dark:bg-*`, `dark:text-*`, `dark:border-*` passam a responder perfeitamente ao toggle de classe do cabeçalho.
- A correção resolveu definitivamente a falta de contraste e legibilidade das atividades planejadas e dos modais no Planejamento de Safra e em toda a plataforma.


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

### 🚜 Ajustes de Máquinas, Implementos e Desativação (Soft Delete)

#### 1. Backend & Banco de Dados (Tabelas de Referência e Cadastros)
- Adicionado o registro `"Implemento"` na tabela auxiliar de tipos de máquinas (`referencias_tipomaquina`) via comando de seed para suportar a classificação.
- Criada e injetada uma regra de cabeçalhos de resposta `Cache-Control` estrita (`no-cache, no-store, must-revalidate, max-age=0`) em `BaseReferenciaViewSet` e `BaseTenantViewSet`. Isso obriga o navegador a sempre buscar o status real de atividade do registro direto no banco de dados nas consultas `GET` e `HEAD`.
- Corrigida a validação em `EstoqueMovimentoSerializer` no backend para dar suporte correto a atualizações parciais (`PATCH`) como a inativação de registros de estoque sem exigir indevidamente a fazenda e a safra, utilizando dados pré-existentes da instância no banco de dados.
- Convertido o arquivo de serializers `backend/cadastros/serializers.py` de codificação mista (Latin-1/UTF-8) para UTF-8 puro, eliminando problemas de `SyntaxError` sob o Python 3.

#### 2. Frontend (Filtros e Conectividade Local)
- No componente [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx) e [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx), aplicamos `.toLowerCase() === 'implemento'` nos filtros de Máquinas e Implementos. Isso torna a comparação completamente insensível a maiúsculas e minúsculas, cobrindo tanto `"Implemento"` quanto `"IMPLEMENTO"`.
- Em [api.js](file:///c:/workspace/inovaceifa/frontend/src/services/api.js), aprimoramos o resolvedor de URL base `API_BASE_URL` para contemplar rotas de desenvolvimento locais em IPv6 (`[::1]`) ou portas locais customizadas, eliminando redirecionamentos incorretos para fallbacks estáticos.
- No componente [Cadastros.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Cadastros.jsx), revisamos a lógica de desativação (`handleToggleAtivo`) para estimar dinamicamente o status ativo e inativo de referências que não possuam estado explícito inicializado no fallback local.

### 🖨️ Ficha de Impressão de Ordem de Serviço (Informe de Operação)

#### 1. Folha de Estilos de Impressão
- No arquivo [index.css](file:///c:/workspace/inovaceifa/frontend/src/index.css), adicionamos classes CSS no bloco `@media print` para definir a largura máxima da página A4 (`210mm`) e forçar bordas pretas sólidas (`#000000`) nas tabelas, garantindo nitidez nas grades impressas ou exportadas em PDF.

#### 2. Template e Visualização de Impressão no Frontend
- No componente [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx), adicionamos a div `.print-only` para renderizar a ficha "Informe de Operação" idêntica ao modelo físico `exemploos.pdf`.
- Os logotipos do cabeçalho foram removidos a pedido, exibindo o título do relatório e o nome do grupo centralizados em largura cheia.
- Adicionada fórmula de estimativa de horas e combustível planejado baseada na área física dos talhões alvos (horas = área × 0,8 e diesel = horas × 6,0).
- Estruturada a tabela de produtos para exibir os insumos planejados da OS, completando o grid até conter exatamente 11 linhas com espaços vazios para manter a integridade visual da folha de campo.
- Inserido diário com exatamente 16 linhas vazias para logs de pontas, RPM e marcha (com colunas de Data, Horímetro Inicial e Final).
- Campos de execução física, anotações de dosagem por bomba e assinaturas do operador e responsável foram desenhados na parte inferior da página.

### 📝 Documentação

- Atualizado o histórico de tarefas recentes no arquivo [agents.md](file:///c:/workspace/inovaceifa/agents.md) registrando a conclusão destas melhorias.
- Atualizado este arquivo [atualizacodex.md](file:///c:/workspace/inovaceifa/atualizacodex.md) com a documentação da ficha de impressão.

### 🚜 Insumos Ad-hoc e Consolidação de Pedido de Compra no Planejamento

- **Ajustes no Modelo (Backend)**:
  - Adicionado o campo `de_planejamento` no modelo `PedidoCompra` em [models.py](file:///c:/workspace/inovaceifa/backend/financeiro/models.py).
- **Consolidação por Safra/Fazenda**:
  - Criada a lógica de cálculo de déficit de insumos na safra atual. Se a demanda planejada exceder o estoque físico e as compras já aprovadas, gera/atualiza um `PedidoCompra` do tipo rascunho com a flag `de_planejamento=True`. Se o estoque for suficiente, remove o item do pedido de compras automático.
  - Sinais Django sincronizam esse cálculo no `post_save` e `post_delete` de insumos planejados, planejamentos, OSs planejadas (com suporte a soft-deletes em cascata), movimentos de estoque e pedidos de compra.
- **Insumos Ad-hoc no Frontend e Backend**:
  - Ajustados os serializers para aceitar `produto_nome_novo` e `unidade_sigla`, criando dinamicamente os produtos não cadastrados no banco durante o salvamento da atividade planejada.
  - Modificado o formulário de Nova OS em [Planejamentos.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Planejamentos.jsx) com um checkbox `"Não Cadastrado?"`, alternando para campos de digitação de nome e seleção de unidades de medida.
- **Correção dos Dropdowns Vazios e Normalização de Tipagem**:
  - Ajustado o hook `loadReferences` para incluir `safraAtiva` e `fazendaAtiva` nas dependências e não efetuar requisições se forem nulos, prevenindo erros HTTP 400 da middleware de Multi-Tenant do Django e travamentos.
  - Mapeamento e comparação local de IDs de fazenda normalizados para `String` a fim de garantir consistência e evitar que dropdowns (Operador, Máquinas, Operação) fiquem em branco por conflito de tipos (Number vs String).
  - Atualizado o seletor de Talhões no modal para exibir o **Nome do Talhão** (`t.nome`) ao invés do código.

## Validação

- Executados os testes de integridade do sistema no backend Django com `manage.py check`, sem erros identificados.
- Executado `npm run build` no frontend após os ajustes visuais, sem erros de compilação.

---

### 🔄 Rateios Operacionais e Correção Visual do Header (11/08/2026)

#### 1. Módulo de Rateios Operacionais
- **Backend (Modelos & Lógica)**:
  - Criado o modelo [RateioOperacional](file:///c:/workspace/inovaceifa/backend/operacoes/models.py) contendo campos para horas homem, horas máquina, combustível (diesel) e outros gastos, com herança de `BaseModel` (soft delete) e relacionamento opcional com fazenda.
  - Implementado service em [services.py](file:///c:/workspace/inovaceifa/backend/operacoes/services.py) para ratear dinamicamente os valores orçados/realizados proporcionalmente à área física (ha) de cada talhão ativo.
  - Adicionado sinal (Signal) para baixa automática de estoque de diesel (`EstoqueMovimento` de saída) ao lançar combustível realizado no rateio.
  - Registrado o endpoint `/api/rateios-operacionais/` e integrado seus custos nos relatórios analíticos (`custo-talhao`, `custo-mensal` e `mof`).
- **Frontend (Telas & Formulários)**:
  - Desenvolvida a aba **Rateios Operacionais** dentro do menu de Ordens de Serviço.
  - Criada listagem dinâmica de rateios e modal de cadastro de duas colunas, com caixa alta obrigatória, suporte à navegação por teclado e preenchimento otimizado.

#### 2. Correção de Contraste e Hover nos Comboboxes do Header
- **Ajuste de Hover nos Botões do Header**:
  - Atualizado [Header.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Header.jsx) para aplicar `hover:bg-slate-200` (Light Mode) e `dark:hover:bg-slate-800` (Dark Mode) com texto contrastante nos botões seletores de Fazenda, Safra e alternador de tema.
- **Destaque Visual nas Listas Suspensas**:
  - Implementadas cores de hover consistentes e nítidas nas opções dos menus suspensos em ambos os temas:
    - Itens selecionados: `hover:bg-emerald-100` / `dark:hover:bg-emerald-900/50`.
    - Itens comuns: `hover:bg-slate-100 hover:text-slate-950` / `dark:hover:bg-slate-800 dark:hover:text-white`.
  - Isso resolveu a invisibilidade das letras ao passar o mouse ou selecionar itens.

---

### 🔄 Permissão de Produtos Globais, Inicialização de Horímetro e Nomes nos Pedidos de Compra (12/08/2026)

#### 1. Backend (Views & Serializers)
- **Filtro de Produtos Globais**:
  - Ajustamos o método `get_queryset` em [views.py](file:///c:/workspace/inovaceifa/backend/cadastros/views.py) (`ProdutoViewSet`) para incluir produtos que possuam `fazenda__isnull=True` ou `safra__isnull=True`.
  - Isso garante que produtos globais cadastrados sem uma fazenda/safra específica (insumos universais) continuem visíveis e selecionáveis pelas fazendas ativas.
- **Nome do Produto no Item do Pedido de Compra**:
  - Adicionamos o campo `produto_nome` (como `ReadOnlyField(source='produto.nome_comercial')`) no serializer [ItemPedidoCompraSerializer](file:///c:/workspace/inovaceifa/backend/financeiro/serializers.py). Isso expõe diretamente o nome comercial do produto no payload da API de pedidos de compra.

#### 2. Frontend (Formulários & Visualização)
- **Inicialização Automática de Horímetro**:
  - No componente [OrdensServico.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/OrdensServico.jsx), no formulário de abastecimento de máquinas (`abtForm`), configuramos a ação `onChange` do seletor de máquinas para buscar a máquina correspondente na lista de máquinas cadastradas.
  - Caso a máquina seja encontrada, o campo de `horimetro` é automaticamente inicializado com o valor de `horimetro_inicial` dela (ou vazio se não definido), otimizando o fluxo de preenchimento.
- **Exibição do Nome Comercial nos Itens de Compra**:
  - No componente [Financeiro.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Financeiro.jsx), na listagem de Pedidos de Compra, atualizamos a exibição dos itens e quantidades para renderizar o nome comercial (`item.produto_nome`) em vez do código numérico genérico.
  - Como camada de resiliência, adicionamos uma busca local de fallback no estado de produtos (`produtos.find`) para garantir que o nome seja exibido mesmo se a API ainda não tiver processado o campo.
- **Edição Individual de Itens no Pedido de Compra**:
  - No formulário modal de Novo/Editar Pedido de Compra no componente [Financeiro.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Financeiro.jsx), implementamos a funcionalidade de editar itens já inseridos na lista temporária.
  - Adicionamos um ícone de lápis (`Pencil`) ao lado do botão de lixeira para cada item. Ao clicar, o item correspondente tem seus valores (produto, quantidade e preço unitário) carregados de volta para os campos de entrada superiores, e o índice é armazenado no estado `editingItemIndex`.
  - A linha que está sendo editada ganha um destaque visual dinâmico no tema escuro (borda amarela/amber e fundo translúcido suave). O botão de adição `+` muda dinamicamente para o ícone de confirmação (`Check`) para salvar as alterações do registro no mesmo índice correspondente.

