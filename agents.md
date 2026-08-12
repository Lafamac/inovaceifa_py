# Projeto ERP Agrícola - Gestão de Café (Task Breakdown)

> Este arquivo atua como o `{task-slug}.md` requerido pelas diretrizes do `GEMINI.md` para monitoramento de progresso e detalhamento de tarefas.
> *Baseado na arquitetura atualizada: `c:\workspace\inovaceifa\agentscodex.md`*
> *Última Atualização: 11/08/2026*

## Stack Tecnológica
- **Backend**: Python, Django, Django REST Framework, SimpleJWT (`djangorestframework-simplejwt`).
- **Banco de Dados**: PostgreSQL.
- **Frontend**: React, Vite, React Router, Axios, Zustand ou Context API, TailwindCSS.
- **Responsividade & Design**: Layout adaptável móvel-tablet-notebook (Mobile-First / Touch-First), menus colapsáveis, formulários otimizados para toque e grids flexíveis.
- **Infraestrutura & DevOps**:
  - **Docker**: Ambiente conteinerizado para garantir isolamento e execução uniforme entre desenvolvimento e produção.
  - **Swagger (OpenAPI)**: Documentação interativa de endpoints para fácil integração e testes da API.
  - **Flyway**: Controle profissional de versionamento e evolução estrutural do banco de dados PostgreSQL.
- **Padrão Arquitetural**: Soft Delete (`ativo=True`) e Multi-Tenant Lógico (Contexto: `Proprietário → Fazenda → Safra Ativa`).
- **Valores Monetários**: Sempre `DecimalField`. Cálculos centralizados em services/selectors.
- **Inicialização & Seed Automático**:
  - Na inicialização da aplicação, o sistema deve verificar automaticamente se as tabelas necessárias existem na base PostgreSQL.
  - Caso as tabelas não estejam criadas, o sistema deve criá-las automaticamente (utilizando Flyway/migrations).
  - Após a criação das tabelas, o sistema deve automaticamente popular a base realizando o seed do usuário administrador inicial com os dados:
    - **E-mail/User**: `admin@teste.com`
    - **Senha**: `12345`
    - **perfil_id**: `1` (Superusuário).

---

## Fases de Implementação (Ordem Recomendada)

### Atualizações recentes de ambiente e acesso (12/08/2026)
- [x] Ajustada a listagem de produtos no backend para retornar também produtos globais e sem safra definida (`fazenda__isnull=True` ou `safra__isnull=True`) para garantir acesso a insumos universais.
- [x] Implementada a inicialização automática do horímetro no formulário de abastecimento ao selecionar uma máquina no frontend, buscando o `horimetro_inicial` do cadastro de máquinas.
- [x] Ajustada a visualização dos itens de pedidos de compra no módulo financeiro para exibir o nome comercial do produto em vez de "Produto #id".
- [x] Adicionado suporte à edição individual de itens no formulário modal de Novo/Editar Pedido de Compra, com carregamento nos inputs e destaque visual da linha ativa.

### Atualizações recentes de ambiente e acesso (11/08/2026)
- [x] Implementado o modelo, endpoints e serviços de **Rateios Operacionais** ("Aba Rateios") para lançar custos indivisíveis da fazenda, com rateio dinâmico proporcional à área dos talhões e baixa automática do diesel do estoque.
- [x] Unificados os hovers e contrastes dos botões seletores (Fazenda, Safra e tema) e seus dropdowns em [Header.jsx](file:///c:/workspace/inovaceifa/frontend/src/components/Header.jsx) para ambos os temas (Claro e Escuro).

### Atualizações recentes de ambiente e acesso (10/08/2026)
- [x] Ajustado o posicionamento do modal principal de Cadastros para abrir ancorado no topo da tela com altura máxima e rolagem interna, corrigindo o formulário de edição de Talhões que abria baixo demais após a inclusão de novos campos.
- [x] Corrigido o contraste do dropdown/select de tabelas de referência no dark mode para evitar texto claro sobre fundo branco, e ajustada a inicialização dinâmica de `API_BASE_URL` no frontend para herdar o mesmo hostname da URL de acesso (`window.location.hostname`), prevenindo falhas silenciosas de rede ou CORS em ambientes locais mistos.
- [x] Adicionado cabeçalho HTTP Cache-Control estrito (no-cache) em todos os ViewSets do backend (Core, Cadastros, Referências, Planejamento, Operações, Financeiro) para evitar que o navegador armazene cache local das listagens.
- [x] Corrigido o salvamento e a inclusão de registros nas tabelas de referência no frontend, inicializando corretamente os campos descricao/valor e filtrando o payload no submit para evitar o envio de propriedades indesejadas.
- [x] Ajustada a precisão do campo de área do Talhão para 5 casas decimais no banco de dados e no frontend (com step="0.00001" e exibição formatada), e adicionados os novos campos de espaçamento, estande, número de plantas e mês/ano de cultivo no formulário e listagem do Talhão, além do suporte de precisão decimal no painel de Gestão à Vista.
- [x] Implementada a inativação em cascata (soft delete) no backend para inativar recursivamente registros dependentes de proprietários, fazendas, talhões, máquinas e funcionários desativados, e adicionado filtro nos viewsets para ocultar qualquer item vinculado a pais desativados.
- [x] Corrigido o suporte ao tema escuro (dark mode) no Tailwind CSS v4 adicionando a variante `@variant dark (&:where(.dark, .dark *));` em `index.css`, resolvendo o problem de contraste de texto claro sobre fundo claro na página de Planejamento de Safra e garantindo legibilidade perfeita de atividades planejadas, cards e modais.
- [x] Padronizados todos os formulários modais operacionais e de planejamento (Novo Planejamento de Safra, Nova OS Avulsa, Adicionar Atividade, Apontamento Operacional, Registrar Abastecimento, Gasto/Rateio e Rateio Operacional) para utilizarem o mesmo padrão visual escuro glassmorphism com tipografia de alta legibilidade do modal de Pedido de Compra, e adicionado botão "Cancelar" ao formulário de Novo Planejamento de Safra.
- [x] Criada a ficha de impressão em PDF para Ordem de Serviço (OS) em formato de folha de campo A4 ("Informe de Operação"), com layout de alta fidelidade sem logotipos no cabeçalho e contendo tabela estruturada de 11 linhas para insumos, grade de logs de 16 linhas (pontas, RPM, marcha) e campos de anotação de campo.
- [x] Adicionado suporte à edição e exclusão de atividades planejadas (`OrdemServicoPlanejada`) no Planejamento de Safra no frontend (através de botões com ícones dedicados de lápis e lixeira), com atualização completa e em cascata dos insumos associados via PUT e deleção lógica/física via DELETE no backend.
- [x] Implementada inteligência na modal de atividades planejadas para incluir automaticamente na submissão os dados de insumos atualmente preenchidos no formulário temporário de rodapé caso o usuário não tenha clicado no botão `+`.
- [x] Ajustado o design do card de atividades planejadas no Planejamento de Safra para diminuir o espaçamento entre linhas e elementos (operação, talhão, recursos e insumos), tornando a exibição mais compacta.
- [x] Reestruturado o card de atividades planejadas no formato de acordeão colapsável/expansível (com botão global de Expandir/Recolher Todas), otimizando a visualização de longas listas.
- [x] Ajustada a cor da dose no card detalhado para `text-emerald-700` (light mode) e `text-emerald-400` (dark mode) em negrito, resolvendo a baixa legibilidade da cor anterior.
- [x] Atualizado o serializer de atividades planejadas para retornar o nome/descrição das máquinas e implementos (`trator_nome` e `implemento_nome`), exibindo-os amigavelmente no painel de recursos.
- [x] Ajustados os filtros de listagem e dropdown de Máquina e Implemento no Planejamento de Safra e Ordens de Serviço para realizar comparações insensíveis a maiúsculas e minúsculas (ex: "Implemento" e "IMPLEMENTO"), garantindo a filtragem correta em todos os cenários de cadastro.
- [x] Adicionado suporte a cabeçalhos HTTP `Cache-Control` estritos no Django (`BaseReferenciaViewSet` e `BaseTenantViewSet`) para evitar cache local de requisições GET no navegador, resolvendo o problema de registros inativados continuarem aparecendo como ativos no frontend.
- [x] Corrigida a validação em `EstoqueMovimentoSerializer` no backend para dar suporte correto a atualizações parciais (`PATCH`) como a inativação de registros de estoque sem exigir indevidamente a fazenda e a safra, utilizando dados pré-existentes da instância no banco.
- [x] Convertido o arquivo `cadastros/serializers.py` inteiramente para UTF-8 limpo para sanar `SyntaxError` de caracteres especiais em tempo de execução no Python 3.
- [x] Ajustada a configuração de `API_BASE_URL` em `api.js` para suportar de forma mais flexível loops locais em IPv6 (`[::1]`) e acessos por portas alternativas de desenvolvimento, evitando falhas de fallback silencioso.
- [x] Corrigido o bug de desativação (soft delete) de referências de tabelas em Cadastros.
- [x] Adicionado suporte ao planejamento de Terceirizados e Turmas (Panha) na Atividade Planejada (com valor planejado de colheita para as turmas via flag booleana, sem seleção prévia da turma), mapeamento automático para a OS real e consolidação no Comparativo de Safra.
- [x] Adicionada regra de validação de datas no Planejamento e Ordens de Serviço: a data do término (planejado ou real) não pode ser menor que a correspondente data de início.
- [x] Adicionado suporte à definição de Operador (funcionário), Trator e Implemento planejados no Planejamento de Safra, com cópia automática para a OS real no momento da geração e sugestão automática no modal de Apontamento Operacional.
- [x] Ajustada a cor da fonte do card de planejamento selecionado no dark mode, substituindo o branco forçado do título por tom Índigo menos brilhante e corrigindo também data, rodapé e ícone de expansão.
- [x] Escurecidas as fontes das abas do módulo Financeiro (`Pedidos de Compra`, `Contas a Pagar`, `Pedidos de Venda`, `Contas a Receber`) no dark mode com classes dedicadas para estado ativo/inativo, reduzindo brilho excessivo mesmo com regras globais de texto.
- [x] Escurecida levemente a tipografia do Header no dark mode, incluindo navegação principal, seletores de fazenda/safra e itens de perfil/mobile.
- [x] Corrigida de forma efetiva a leitura dos formulários no dark mode: a regra global `.dark input/select/textarea` foi ajustada para usar campos claros com texto escuro, eliminando o problema de campos e modal em tons escuros quase iguais.
- [x] Aplicada a classe `app-modal-panel` aos modais de Cadastros, Planejamento e Locação, com borda e fundo específicos para separar melhor o formulário do restante da tela no dark mode.
- [x] Recalibradas as cores do dark mode após revisão visual: o destaque do planejamento selecionado foi suavizado, os textos deixaram de usar tons excessivamente escuros no tema claro e os labels dos modais de cadastro/planejamento ganharam contraste consistente no tema escuro.
- [x] Corrigida a leitura dos botões/filtros `Ativos` e `Inativos` em Cadastros no dark mode, removendo dependência de classes customizadas não geradas pelo Tailwind e adicionando estilos explícitos para estados selecionados e não selecionados.
- [x] Corrigido o padrão de contraste de fontes no dark mode para Cadastros e Planejamento, adicionando suporte global às classes `text-slate-*` customizadas usadas no JSX e padronizando texto base, tabelas e painéis para leitura consistente em tema claro e escuro.
- [x] Ajustado o card de planejamento selecionado na coluna esquerda para usar destaque Índigo suave com texto legível nos dois temas, além de revisar o painel de detalhes das atividades planejadas para evitar textos claros sobre fundos claros.
- [x] Adicionado destaque na cor Índigo aos cards de planejamento selecionados na coluna esquerda, filtro de visualização por status (Todos, Em Aberto, Aprovados), e corrigido bug em que a seleção sumia ao clicar ou atualizar a lista, renomeando "Adicionar OS" para "Adicionar Atividade" com maior destaque visual.
- [x] Corrigido contraste e legibilidade das fontes dos labels e do botão de fechar (X) nos modais de Novo Planejamento de Safra e Nova OS Planejada, adicionando suporte adaptável a temas claro e escuro.
- [x] Ocultada a seleção manual de Fazenda nos formulários de Safra, Talhão, Máquina e Funcionário, assumindo automaticamente a fazenda ativa global no contexto de operação.
- [x] Corrigido o formulário de Transferências para restringir a Fazenda de Origem à fazenda ativa (`fazendaAtiva`), filtrar a Fazenda de Destino com as outras fazendas do mesmo proprietário, e filtrar a listagem de transferências no frontend para exibir apenas os registros pertencentes à fazenda ativa.
- [x] No cadastro de locação com cobrança por diária, o campo `Término Previsto` agora é calculado automaticamente somando `Data Início + Dias Previstos`, permanecendo editável para ajustes manuais.
- [x] Reestruturado o fluxo de Locação de Máquinas: o cadastro inicial permanece com status `ABERTA` e registra apenas período, tipo de cobrança, quantidade prevista e tarifa estimada, sem gerar contas a pagar prematuramente.
- [x] Implementadas ações `POST /api/locacoes-maquinas/{id}/encerrar/` e `POST /api/locacoes-maquinas/{id}/prorrogar/`; o encerramento exige horas efetivas para cobranças por hora, valor final e data prevista de pagamento, gerando uma única conta a pagar de forma idempotente.
- [x] Adicionados status, quantidade/valor finais, data de encerramento, contador de prorrogações e indicadores dinâmicos de atraso às locações, com alerta no frontend para aluguéis abertos que ultrapassaram o período informado e opções de encerrar ou prorrogar.
- [x] Reorganizado o menu lateral na ordem `Cadastros → Suprimentos → Operacional → Financeiro`, conectando os submenus diretamente às telas e subabas já existentes: Planejamentos, Ordens de Serviço, Abastecimentos, Rateios Realizados, Rateios Operacionais, Pedidos de Compra, Pedidos de Venda, Contas a Pagar e Contas a Receber.
- [x] Centralizado o roteamento dos submenus por metadados (`targetView` e `targetSubTab`), removendo condicionais específicas por item e permitindo que `OrdensServico` abra diretamente na subaba operacional solicitada.
- [x] Banco preparado para início limpo de operação: proprietários, fazendas, safras, máquinas, talhões, produtos e transações zerados, mantendo apenas `admin@teste.com`, perfis e tabelas de referência populadas.
- [x] Criado comando de manutenção `python manage.py reset_operational_data` para reproduzir esse estado inicial com segurança.
- [x] Configurado envio de e-mail real via SMTP por variáveis de ambiente (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL`).
- [x] Ao cadastrar um `Proprietario`, o backend cria automaticamente um `Usuario` com perfil `2` (Proprietário), gera senha temporária e envia os dados de acesso por e-mail.
- [x] O cadastro de proprietário falha com erro claro caso o SMTP real não esteja configurado ou o envio do e-mail não seja concluído, evitando criar usuário sem entregar senha.
- [x] Ao entrar como superusuário, o acesso a dados de fazendas, safras, talhões, máquinas, funcionários e transações é restrito ao proprietário da fazenda selecionada no cabeçalho (top bar).
- [x] Corrigido crash no endpoint do relatório de Fluxo de Caixa ao receber datas vazias nos filtros (`?data_inicio=&data_fim=`), restabelecendo a exibição de lançamentos financeiros no painel.
- [x] Ao registrar novas movimentações de estoque, a fazenda ativa global é assumida automaticamente e a seleção manual de fazenda é ocultada no formulário.
- [x] No formulário de transferência de ativos, a fazenda de origem agora exibe apenas a fazenda ativa do contexto, e o campo de destino exibe as outras fazendas pertencentes ao mesmo proprietário (exceto a fazenda ativa).
- [x] A listagem de produtos selecionáveis no modal de estoque é filtrada dinamicamente exibindo apenas itens da fazenda ativa atual (ou produtos globais).
- [x] O cadastro de produtos agora exibe a quantidade atual em estoque na listagem e na edição (como campo somente leitura e desabilitado, atualizado apenas via transações reais).
- [x] O modal de edição de produtos e de estoque foi ajustado para `max-w-2xl` para exibição ideal em grid de duas colunas.
- [x] No formulário de terceirizados, a fazenda ativa global é assumida automaticamente (ocultando a seleção manual) e foi adicionado o campo "Cargo / Função" na ficha e na listagem.
- [x] No formulário de turmas, a fazenda ativa global é assumida automaticamente, ocultando a seleção manual de fazenda no cadastro. A coluna "Informações / Valor" agora exibe o total de pessoas na panha de forma destacada.
- [x] Implementado apontamento de Turmas Terceirizadas no registro de execução da OS, informando valor total pago e vencimento, com criação automática do Contas a Pagar correspondente no financeiro.
- [x] Removido bloco informativo de Contexto Obrigatório das telas de cadastro.
- [x] Reestruturada a barra de navegação/menu para mover "Locação de Máquinas", "Funcionários", "Terceirizados" e "Turmas" do grupo "Financeiro & RH" para o grupo "Cadastros", renomeando a seção para "Financeiro" e a descrição para "Vendas e contas".
- [x] Atualizado o model e endpoint de `LocacaoMaquina` no backend para referenciar `TipoMaquina` (tabela de referências) in vez de `Maquina` (máquina física própria), ajustando também o formulário no frontend para puxar as referências corretas.
- [x] Adicionado suporte à consolidação automática de Pedido de Compra de planejamento (`de_planejamento=True`) no backend baseado no déficit de estoque físico e compras aprovadas para a mesma safra e fazenda, com recálculos reativos disparados via Django Signals.
- [x] Implementado cadastro ad-hoc (dinâmico) de novos produtos informados textualmente no planejamento de safra, com suporte no frontend a um toggle "Não Cadastrado?" e inputs de nome e unidade de medida.
- [x] Corrigido o carregamento de referências operacionais no frontend (`loadReferences`) adicionando `safraAtiva` e `fazendaAtiva` como dependências e impedindo requisições quando nulos, sanando erros HTTP 400 da middleware de Multi-Tenant do Django e dropdowns em branco.
- [x] Padronizadas as comparações de IDs de fazenda com conversão para String para evitar conflitos de tipos (Number vs String) no filtro do frontend, e alterado o seletor de Talhões para mostrar o nome do talhão (`t.nome`) ao invés do código.


### 🚀 Fase 1: Fundação do Backend e Autenticação (`accounts`)
- [x] Inicializar repositório e configurar Django, PostgreSQL e variáveis de ambiente.
- [x] Configurar containers **Docker** (`docker-compose.yml`) com a aplicação e o banco PostgreSQL.
- [x] Integrar **Swagger** (OpenAPI) para documentação dinâmica dos endpoints da API.
- [x] Configurar **Flyway** para controle estrutural e versionamento do PostgreSQL.
- [x] Criar rotina/script de inicialização do banco: verificar tabelas na base, criá-las se ausentes e inserir o usuário administrador padrão (`admin@teste.com`, password `12345` e `perfil_id=1`).
- [x] Implementar classe BaseModel com *Soft Delete* (`ativo = models.BooleanField(default=True)` e `created_at`/`updated_at`).
- [x] Criar app `accounts` com model `Usuario` (herdando `AbstractUser`) e model `Perfil`.
- [x] Configurar constantes de perfil: `1` (Superusuário), `2` (Proprietário), `3` (Operador).
- [x] Modelar vínculo de usuários com fazendas permitidas.
- [x] Configurar DRF e endpoints JWT (`/api/auth/token/`, `refresh`, `verify`).

### 🚜 Fase 2: Core e Contexto Multi-Tenant (`core`)
- [x] Criar app `core` com models: `Proprietario`, `Fazenda`, `Safra`.
- [x] Criar regra de negócio: Uma fazenda pode ter várias safras, apenas uma ativa por fazenda.
- [x] Criar middleware/service de contexto para interceptar header `X-Safra-ID`.
- [x] Injetar no request: `request.safra_ativa`, `request.fazendas_permitidas` e validar acesso à safra.
- [x] Bloquear endpoints operacionais sem `safra_ativa`.

### 📚 Fase 3: Tabelas de Referência (`referencias`)
- [x] Criar app `referencias` com todos os modelos auxiliares requeridos: `Cultura`, `TipoItem`, `StatusCultivo`, `TipoIrrigacao`, `ResistenciaFerrugem`, `StatusOrdemServico`, `Modalidade`, `TipoRateio`, `ContaGerencial`, `TipoDestinacao`, `GrupoTrabalhador`, `ClassificacaoProduto`, `GrupoQuimico`, `UnidadeMedida`, `AtividadeEducampo`, `CriterioRateio`, `TipoOperacao`.
- [x] Negar acesso de escrita na API de referências para `perfil_id=3` (Operador) — somente `perfil_id=1` (Superusuário) possui permissão total de escrita em referências críticas.
- [x] Criar scripts/seeds iniciais para popular todas as tabelas de referências (utilizando os dados normalizados da planilha).

### 📋 Fase 4: Cadastros Base e Estoque (`cadastros`)
- [x] Criar app `cadastros` e API endpoints correspondentes.
- [x] Modelar `Talhao` e `EstimativaProducaoTalhao`.
- [x] Modelar `Maquina` e `CustoMensalMaquina` (separados).
- [x] Modelar Mão de Obra (`Funcionario`, `SalarioMensal`, `Terceirizado`, `TurmaTerceirizada`).
- [x] Modelar Insumos/Estoque (`Produto`, `EstoqueMovimento`).
- [x] Implementar lógica de estoque em tabela única de movimentos com `fazenda_id` e `safra_id`, gerando saldo dinamicamente (saldo negativo gera alerta exibido dinamicamente, não bloqueio).
- [x] Implementar operação dedicada de transferência interna para rastrear origem e destino de insumos entre fazendas.

### ⚙️ Fase 5: Planejamento (`planejamento`)
- [x] Criar app `planejamento` e API endpoints (perfil `1` cria/edita/aprova).
- [x] Modelar `PlanejamentoSafra`, `OrdemServicoPlanejada`, e `ItemInsumoOSPlanejado`.
- [x] Modelar `ParametroOperacionalOS`, `PlanejamentoMaoObraTerceiros`, `PlanejamentoAdubo` e `PlanejamentoRateio`.
- [x] Implementar Endpoint de geração: `POST /api/planejamentos/{id}/gerar-ordens-servico/`.

### 🚜 Fase 6: Operações e Execução Real (`operacoes`)
- [x] Criar app `operacoes` e API endpoints.
- [x] Modelar `OrdemServico` (OS Real, com campos de controle: datas reais, horímetros, diesel, etc.).
- [x] Implementar cálculo de status dinâmico de OS (Rascunho, Aprovada, Em Execução, Concluída, Cancelada) - status `ATRASADA` deve ser calculado on-the-fly (`data_fim_planejada < hoje`).
- [x] Modelar `ItemInsumoOSReal`, `CustoOperacionalOS`, `ExecucaoMaoObraTerceiros`.
- [x] Modelar `GastoRateioRealizado`, `RateioTalhao` e `AbastecimentoMaquina`.
- [x] Implementar Services de Rateio (por área, produção, fazenda ou talhão específico) de forma síncrona e bem testada inicialmente.
- [x] Implementar cálculo de Valor Hora Máquina no mês e COE.
- [x] Implementar regra bloqueante: fechamento do custo mensal das máquinas (`CustoMensalMaquina`) obrigatório antes da consolidação financeira das OSs daquele mês.

### 💰 Fase 6.5: Compras, Vendas, Financeiro e Estoque (`financeiro`)
- [x] Criar app `financeiro` (ou estender `cadastros`) para gerenciar as aquisições e vendas da fazenda.
- [x] **Módulo de Compras (Insumos/Produtos)**:
  - [x] Modelar `PedidoCompra` (fornecedor, data_pedido, valor_total, safra, fazenda, status: RASCUNHO, APROVADO, RECEBIDO, CANCELADO).
  - [x] Modelar `ItemPedidoCompra` (produto, quantidade, valor_unitario, valor_total).
  - [x] Modelar `ContasAPagar` (descricao, valor, data_vencimento, data_pagamento, status: PENDENTE, PAGO, CANCELADO, fazenda, safra, pedido_compra).
  - [x] Implementar Regra de Negócio de Recebimento de Compra: ao marcar como **RECEBIDO**, gera automaticamente um lançamento em `ContasAPagar` e registra movimentos de **'ENTRADA'** no estoque (`EstoqueMovimento`).
- [x] **Módulo de Vendas (Receitas e Comercialização)**:
  - [x] Modelar `PedidoVenda` (cliente, data_venda, tipo_produto [Café, Cereais, Sucata, Outros], quantidade_sacas, preco_unitario, valor_total, safra, fazenda, status: RASCUNHO, CONFIRMADO, ENTREGUE, CANCELADO).
  - [x] Modelar `ContasAReceber` (descricao, categoria_receita [Venda Café, Cereais, Sucata, Custeio Agrícola, Outros], valor, data_vencimento, data_recebimento, status: PENDENTE, RECEBIDO, CANCELADO, fazenda, safra, pedido_venda).
  - [x] Implementar Regra de Negócio de Confirmação de Venda: ao confirmar o `PedidoVenda`, gera automaticamente o respectivo `ContasAReceber`.
- [x] **Controle de Estoque integrado**:
  - [x] Lançamentos de **'SAIDA'** automáticos gerados a partir do consumo real apontado nas OSs (Fase 6).
  - [x] Lançamentos de **'ENTRADA'** automáticos gerados a partir do recebimento dos Pedidos de Compra (Fase 6.5).


### 🔄 Fase 6.6: Entrada de Dados de Rateios Operacionais ("Aba Rateios")
- [x] Criar o modelo `RateioOperacional` no app `operacoes` contendo todos os campos de planejado e realizado (horas homem, horas máquina, diesel, e outros custos) herdando de `BaseModel`.
- [x] Implementar a lógica de propagação de custos em `operacoes/services.py` distribuindo os custos proporcionalmente à área física (ha) dos talhões ativos (da fazenda especificada ou compartilhada globalmente caso nula).
- [x] Implementar a baixa automática de estoque de diesel (`EstoqueMovimento` de saída) ao registrar combustível realizado no rateio.
- [x] Criar endpoints `/api/rateios-operacionais/` com serializers e views associados.
- [x] Integrar o rateio operacional nos relatórios analíticos (`custo-talhao`, `custo-mensal` e `mof`).
- [x] Desenvolver no frontend a aba **Rateios Operacionais** dentro do módulo de ordens de serviço, contendo listagem e modal de cadastro de duas colunas, com caixa alta e navegação otimizada por Enter/Tab.


### 📊 Fase 7: Relatórios (`relatorios`)
- [x] Criar app `relatorios` apenas com views analíticas (somente leitura - cálculos via query/service).
- [x] Implementar endpoints analíticos:
  - [x] `/comparativo-safra/` (Comparativo planejado x realizado)
  - [x] `/custo-talhao/` (Custo por talhão)
  - [x] `/custo-mensal/` (Custo mensal por fazenda)
  - [x] `/fluxo-caixa/` (Fluxo de caixa)
  - [x] `/eficiencia-operacional/` (Eficiência operacional)
  - [x] `/consumo-diesel/` (Consumo de diesel)
  - [x] `/mof/` (Análise de mão de obra fixa)
  - [x] `/estoque/` (Estoque por produto/fazenda)
  - [x] `/gestao-a-vista/` (Gestão à vista)
  - [x] `/producao-talhao/` (Produção por talhão)

### 💻 Fase 8: Frontend (React) - Totalmente Responsivo (Mobile, Tablet, Notebook)
- [x] Setup do Projeto React (Vite, React Router, TailwindCSS, Zustand ou Context).
- [x] Configurar layout base responsivo com barra de navegação/sidebar colapsável para mobile e gestos otimizados.
- [x] Configurar Axios Interceptor para enviar `X-Safra-ID` automaticamente no header.
- [x] Implementar `SafraContext` global mantendo estado de `{ proprietario, fazenda_ativa, safra_ativa }`.
- [x] Criar Seletor de Safra/Fazenda responsivo no Topo (Header).
- [x] Desenvolver Telas respeitando permissões de Perfil e adaptadas para mobile/tablet/notebook:
  - [x] **Dashboard / Gestão à Vista**: Gráficos e resumos otimizados para telas menores.
  - [x] **Módulo Completo de Cadastros (CRUDs responsivos)**:
    - [x] Proprietário
    - [x] Fazenda
    - [x] Safra
    - [x] Talhão
    - [x] Funcionários
    - [x] Terceirizados
    - [x] Turmas de Trabalho
    - [x] Produtos e Insumos
    - [x] Fornecedores (com layout de duas colunas, navegação Enter/Tab, máscara de CPF/CNPJ, histórico da última compra e seleção integrada no Pedido de Compra com listagem dinâmica de produtos carregada da API)
    - [x] Pedido de Compra editável (suporte a gravação de itens aninhados/writable nested serializer no backend, edição restrita a status "RASCUNHO", botão para "APROVAR" rascunhos, navegação facilitada com Enter nos campos e nome do produto com fonte de alto contraste no modal)
    - [x] Recebimento parcelado de Pedidos de Compra (modal interativo de parcelamento antes da criação do contas a pagar, com definição do vencimento inicial, geração automática distribuída em até 12x, edição de datas/valores individuais e validação de soma total)
    - [x] Movimentações de Estoque (Lançamentos de Entrada/Saída e Ajustes de Produtos com alertas visuais de saldo negativo e filtro de safras pela fazenda ativa no modal; consulta reestruturada por seleção de produto com filtros de período de datas e safra)
    - [x] Contas a Pagar (Gestão financeira integrada, com botão de edição habilitado para lançamentos com status "PENDENTE" tanto no fluxo de pagar quanto de receber)
    - [x] Ordens de Serviço (Cadastro, listagem e apontamentos operacionais em campo)
    - [x] Correção de alinhamento no campo de busca/pesquisa (jogando texto para a direita e centralizando ícone da lupa verticalmente)
    - [x] Ajuste do texto institucional do rodapé (Footer) para "Inova Ceifa"
  - [x] **Planejamento de Safra (Apenas perfil 1)**:
    - [x] Interface intuitiva para criação, edição e aprovação de planejamentos (talhões, adubação, insumos, mão de obra terceirizada, rateios).
    - [x] Fluxo e botão para **Geração de Ordens de Serviço Reais** (`POST /api/planejamentos/{id}/gerar-ordens-servico/`).
  - [x] **Impressão e Gestão de Ordens de Serviço**:
    - [x] Tela de impressão amigável (CSS `@media print` customizado para folha A4 e PDFs bem estruturados para operadores de campo).
  - [x] **Relatórios Analíticos**: Visualização responsiva de tabelas e fluxos.

### 🔄 Fase 9: Transferências de Ativos e Locação de Máquinas (Novo Requisito)
- [x] Criar modelos `TransferenciaAtivo` (Máquina/Funcionário) e `LocacaoMaquina` no backend (`cadastros`).
- [x] Adicionar campo `propria` em `Maquina` e `transferencia_vinculada` em `EstoqueMovimento`.
- [x] Implementar fluxo de transferência de produtos em duas vias no `EstoqueMovimentoViewSet` (com autocriação de produto no destino se necessário).
- [x] Implementar integração de contas a pagar automática para locações de máquinas.
- [x] Ratear valor de locação de máquinas proporcionalmente à área no relatório de custo por talhão.
- [x] Desenvolver no frontend interfaces completas para transferências e locação de máquinas (com teclado Enter/Tab, caixa alta e duas colunas).

---

## 🔌 Checklist de Endpoints API (Verificação e Conclusão)

### Autenticação & Perfil
- [x] `POST /api/auth/token/` (Obter tokens JWT)
- [x] `POST /api/auth/token/refresh/` (Atualizar token)
- [x] `POST /api/auth/token/verify/` (Validar token)

### Core
- [x] `GET/POST /api/proprietarios/`
- [x] `GET/POST /api/fazendas/`
- [x] `GET/POST /api/safras/`

### Referências
- [x] `GET/POST /api/ref/culturas/`
- [x] `GET/POST /api/ref/tipos-operacao/`
- [x] `GET/POST /api/ref/contas-gerenciais/`
- [x] `GET/POST /api/ref/tipos-rateio/`
- [x] `GET/POST /api/ref/criterios-rateio/`
- [x] `GET/POST /api/ref/atividades-educampo/`
- [x] `GET/POST /api/ref/classificacoes-produto/`
- [x] `GET/POST /api/ref/unidades-medida/`
- [x] `GET/POST /api/ref/status-os/`

### Cadastros Base
- [x] `GET/POST /api/talhoes/`
- [x] `GET/POST /api/maquinas/`
- [x] `GET/POST /api/funcionarios/`
- [x] `GET/POST /api/terceirizados/`
- [x] `GET/POST /api/turmas-terceirizadas/`
- [x] `GET/POST /api/produtos/`
- [x] `GET/POST /api/fornecedores/`
- [x] `GET/POST /api/estoque/movimentos/` (Entradas, Saídas, Ajustes, Transferências)
- [x] `GET /api/estoque/saldos/`

### Planejamento
- [x] `GET/POST /api/planejamentos/`
- [x] `POST /api/planejamentos/{id}/aprovar/`
- [x] `GET/POST /api/planejamentos/{id}/ordens-servico/`
- [x] `GET/POST /api/planejamentos/{id}/mao-obra-terceiros/`
- [x] `GET/POST /api/planejamentos/{id}/adubacao/`
- [x] `GET/POST /api/planejamentos/{id}/rateios/`
- [x] `POST /api/planejamentos/{id}/gerar-ordens-servico/`

### Operações & Execução
- [x] `GET/POST /api/ordens-servico/`
- [x] `POST /api/ordens-servico/{id}/executar/`
- [x] `POST /api/ordens-servico/{id}/cancelar/`
- [x] `POST /api/ordens-servico/{id}/concluir/`
- [x] `GET/POST /api/gastos-rateio/`
- [x] `GET/POST /api/abastecimentos/`
- [x] `GET/POST /api/rateios-operacionais/`

### Compras, Vendas & Financeiro (Fase 6.5)
- [x] `GET/POST /api/financeiro/pedidos-compra/`
- [x] `POST /api/financeiro/pedidos-compra/{id}/receber/`
- [x] `GET/POST /api/financeiro/pedidos-venda/`
- [x] `POST /api/financeiro/pedidos-venda/{id}/confirmar/`
- [x] `GET/POST /api/financeiro/contas-pagar/`
- [x] `GET/POST /api/financeiro/contas-receber/`

### Relatórios Analíticos
- [x] `GET /api/relatorios/comparativo-safra/`
- [x] `GET /api/relatorios/custo-talhao/`
- [x] `GET /api/relatorios/custo-mensal/`
- [x] `GET /api/relatorios/fluxo-caixa/`
- [x] `GET /api/relatorios/eficiencia-operacional/`
- [x] `GET /api/relatorios/consumo-diesel/`
- [x] `GET /api/relatorios/mof/`
- [x] `GET /api/relatorios/estoque/`
- [x] `GET /api/relatorios/gestao-a-vista/`
- [x] `GET /api/relatorios/producao-talhao/`

### Transferências e Locações de Máquinas (Fase 9)
- [x] `GET/POST /api/transferencias-ativos/`
- [x] `GET/POST /api/locacoes-maquinas/`

---

## 📐 Regras Gerais e Cuidados de Desenvolvimento

### Regras Gerais de Engenharia:
1. **Preservação de Contexto**: Sempre garantir que as consultas e operações respeitem as relações `Proprietário → Fazenda → Safra Ativa`.
2. **Sem Enums Rígidos**: Não usar enums fixos no código quando o dado precisar ser administrável (ex: usar tabelas de referências cadastradas).
3. **Soft Delete Mandatório**: Sempre implementar soft delete (`ativo=True`) em tabelas de cadastros e tabelas transacionais principais. Nunca apagar dados fisicamente.
4. **Valores Monetários**: Sempre utilizar `DecimalField` (nunca `FloatField`) com duas casas decimais no banco de dados.
5. **Cálculos Centralizados**: Todas as regras e fórmulas agrícolas/financeiras (COE, valor hora máquina, rateios) devem ficar em services ou selectors no backend.
6. **Controle de Perfil**: Respeitar estritamente as regras de perfil: `1` (Superusuário), `2` (Proprietário), `3` (Operador).

### Padrões de Interface (Formulários):
1. **Navegação Fluida (Enter/Tab)**: Todos os formulários devem permitir alternar de campo usando as teclas **Enter** e **Tab**, pulando automaticamente botões secundários de ação (como Cancelar) e focando o próximo input ou o botão de confirmação final.
2. **Letras Maiúsculas (Uppercase)**: Todos os campos de edição de texto comuns (excluindo e-mail, senha e datas) devem converter e armazenar o texto em **letras maiúsculas** (`value.toUpperCase()`), tanto no estado do React quanto visualmente por CSS.
3. **Layout em Duas Colunas**: Os formulários em modais ou páginas inteiras devem adotar uma estrutura de **duas colunas** (usando `grid grid-cols-1 md:grid-cols-2 gap-4`) para melhor ergonomia visual em telas maiores, mantendo a responsividade mobile.

### Cuidados Importantes (Anti-patterns a Evitar):
1. **Não duplicar tabelas por fazenda**: A base PostgreSQL deve ser unificada e usar multi-tenancy lógico (`fazenda_id`).
2. **Evitar Colunas por Mês**: Não criar colunas temporais fixas (ex: `set`, `out`, `nov`) em tabelas transacionais. Usar um campo `mes` e `ano`.
3. **Evitar Colunas por Talhão**: Na tabela de rateio, usar tabelas filhas normalizadas (`RateioTalhao`), nunca colunas dinâmicas.
4. **Fechamento de Custos Bloqueante**: A consolidação mensal financeira das OSs exige o fechamento prévio e obrigatório dos custos das máquinas no respectivo mês (`CustoMensalMaquina`).
5. **Filtros e Permissões**: Testar rigorosamente filtros por `safra` e validações de acesso a endpoints desde o primeiro dia de implementação de cada fase.
