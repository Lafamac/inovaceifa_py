# Projeto ERP Agrícola - Gestão de Café (Task Breakdown)

> Este arquivo atua como o `{task-slug}.md` requerido pelas diretrizes do `GEMINI.md` para monitoramento de progresso e detalhamento de tarefas.
> *Baseado na arquitetura atualizada: `c:\workspace\inovaceifa\agentscodex.md`*

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

### Atualizações recentes de ambiente e acesso
- [x] Banco preparado para início limpo de operação: proprietários, fazendas, safras, máquinas, talhões, produtos e transações zerados, mantendo apenas `admin@teste.com`, perfis e tabelas de referência populadas.
- [x] Criado comando de manutenção `python manage.py reset_operational_data` para reproduzir esse estado inicial com segurança.
- [x] Configurado envio de e-mail real via SMTP por variáveis de ambiente (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL`).
- [x] Ao cadastrar um `Proprietario`, o backend cria automaticamente um `Usuario` com perfil `2` (Proprietário), gera senha temporária e envia os dados de acesso por e-mail.
- [x] O cadastro de proprietário falha com erro claro caso o SMTP real não esteja configurado ou o envio do e-mail não seja concluído, evitando criar usuário sem entregar senha.
- [x] Ao entrar como superusuário, o acesso a dados de fazendas, safras, talhões, máquinas, funcionários e transações é restrito ao proprietário da fazenda selecionada no cabeçalho (top bar).

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
