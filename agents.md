# Projeto ERP Agrícola - Gestão de Café (Task Breakdown)

> Este arquivo atua como o `{task-slug}.md` requerido pelas diretrizes do `GEMINI.md` para monitoramento de progresso e detalhamento de tarefas.
> *Baseado na arquitetura atualizada: `c:\workspace\inovaceifa\agentscodex.md`*

## Stack Tecnológica
- **Backend**: Python, Django, Django REST Framework, SimpleJWT (`djangorestframework-simplejwt`).
- **Banco de Dados**: PostgreSQL.
- **Frontend**: React, Vite, React Router, Axios, Zustand ou Context API, TailwindCSS.
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

### 🚀 Fase 1: Fundação do Backend e Autenticação (`accounts`)
- [ ] Inicializar repositório e configurar Django, PostgreSQL e variáveis de ambiente.
- [ ] Configurar containers **Docker** (`docker-compose.yml`) com a aplicação e o banco PostgreSQL.
- [ ] Integrar **Swagger** (OpenAPI) para documentação dinâmica dos endpoints da API.
- [ ] Configurar **Flyway** para controle estrutural e versionamento do PostgreSQL.
- [ ] Criar rotina/script de inicialização do banco: verificar tabelas na base, criá-las se ausentes e inserir o usuário administrador padrão (`admin@teste.com`, password `12345` e `perfil_id=1`).
- [ ] Implementar classe BaseModel com *Soft Delete* (`ativo = models.BooleanField(default=True)` e `created_at`/`updated_at`).
- [ ] Criar app `accounts` com model `Usuario` (herdando `AbstractUser`) e model `Perfil`.
- [ ] Configurar constantes de perfil: `1` (Superusuário), `2` (Proprietário), `3` (Operador).
- [ ] Modelar vínculo de usuários com fazendas permitidas.
- [ ] Configurar DRF e endpoints JWT (`/api/auth/token/`, `refresh`, `verify`).

### 🚜 Fase 2: Core e Contexto Multi-Tenant (`core`)
- [ ] Criar app `core` com models: `Proprietario`, `Fazenda`, `Safra`.
- [ ] Criar regra de negócio: Uma fazenda pode ter várias safras, apenas uma ativa por fazenda.
- [ ] Criar middleware/service de contexto para interceptar header `X-Safra-ID`.
- [ ] Injetar no request: `request.safra_ativa`, `request.fazendas_permitidas` e validar acesso à safra.
- [ ] Bloquear endpoints operacionais sem `safra_ativa`.

### 📚 Fase 3: Tabelas de Referência (`referencias`)
- [ ] Criar app `referencias` com todos os modelos auxiliares requeridos: `Cultura`, `TipoItem`, `StatusCultivo`, `TipoIrrigacao`, `ResistenciaFerrugem`, `StatusOrdemServico`, `Modalidade`, `TipoRateio`, `ContaGerencial`, `TipoDestinacao`, `GrupoTrabalhador`, `ClassificacaoProduto`, `GrupoQuimico`, `UnidadeMedida`, `AtividadeEducampo`, `CriterioRateio`, `TipoOperacao`.
- [ ] Negar acesso de escrita na API de referências para `perfil_id=3` (Operador) — somente `perfil_id=1` (Superusuário) possui permissão total de escrita em referências críticas.
- [ ] Criar scripts/seeds iniciais para popular todas as tabelas de referências (utilizando os dados normalizados da planilha).

### 📋 Fase 4: Cadastros Base e Estoque (`cadastros`)
- [ ] Criar app `cadastros` e API endpoints correspondentes.
- [ ] Modelar `Talhao` e `EstimativaProducaoTalhao`.
- [ ] Modelar `Maquina` e `CustoMensalMaquina` (separados).
- [ ] Modelar Mão de Obra (`Funcionario`, `SalarioMensal`, `Terceirizado`, `TurmaTerceirizada`).
- [ ] Modelar Insumos/Estoque (`Produto`, `EstoqueMovimento`).
- [ ] Implementar lógica de estoque em tabela única de movimentos com `fazenda_id` e `safra_id`, gerando saldo dinamicamente (saldo negativo gera alerta exibido dinamicamente, não bloqueio).
- [ ] Implementar operação dedicada de transferência interna para rastrear origem e destino de insumos entre fazendas.

### ⚙️ Fase 5: Planejamento (`planejamento`)
- [ ] Criar app `planejamento` e API endpoints (perfil `1` cria/edita/aprova).
- [ ] Modelar `PlanejamentoSafra`, `OrdemServicoPlanejada`, e `ItemInsumoOSPlanejado`.
- [ ] Modelar `ParametroOperacionalOS`, `PlanejamentoMaoObraTerceiros`, `PlanejamentoAdubo` e `PlanejamentoRateio`.
- [ ] Implementar Endpoint de geração: `POST /api/planejamentos/{id}/gerar-ordens-servico/`.

### 🚜 Fase 6: Operações e Execução Real (`operacoes`)
- [ ] Criar app `operacoes` e API endpoints.
- [ ] Modelar `OrdemServico` (OS Real, com campos de controle: datas reais, horímetros, diesel, etc.).
- [ ] Implementar cálculo de status dinâmico de OS (Rascunho, Aprovada, Em Execução, Concluída, Cancelada) - status `ATRASADA` deve ser calculado on-the-fly (`data_fim_planejada < hoje`).
- [ ] Modelar `ItemInsumoOSReal`, `CustoOperacionalOS`, `ExecucaoMaoObraTerceiros`.
- [ ] Modelar `GastoRateioRealizado`, `RateioTalhao` e `AbastecimentoMaquina`.
- [ ] Implementar Services de Rateio (por área, produção, fazenda ou talhão específico) de forma síncrona e bem testada inicialmente.
- [ ] Implementar cálculo de Valor Hora Máquina no mês e COE.
- [ ] Implementar regra bloqueante: fechamento do custo mensal das máquinas (`CustoMensalMaquina`) obrigatório antes da consolidação financeira das OSs daquele mês.

### 💰 Fase 6.5: Compras, Contas a Pagar e Estoque (`compras_financeiro`)
- [ ] Criar app `compras_financeiro` (ou estender `cadastros` e criar `financeiro`) para gerenciar as aquisições da fazenda.
- [ ] Modelar `PedidoCompra` (campos: fornecedor, data_pedido, valor_total, safra, fazenda, status: RASCUNHO, APROVADO, RECEBIDO, CANCELADO).
- [ ] Modelar `ItemPedidoCompra` (campos: produto, quantidade, valor_unitario, valor_total).
- [ ] Modelar `ContasAPagar` (campos: descricao, valor, data_vencimento, data_pagamento, status: PENDENTE, PAGO, CANCELADO, fazenda, safra, pedido_compra (opcional)).
- [ ] Implementar Regra de Negócio / Service de Recebimento de Compra:
  - Ao marcar `PedidoCompra` como **RECEBIDO**:
    1. Criar automaticamente lançamento de `ContasAPagar` no valor total do pedido.
    2. Criar automaticamente registro de `EstoqueMovimento` do tipo **'ENTRADA'** para cada produto do pedido, atualizando o estoque real.
- [ ] Integrar no app `cadastros` (`EstoqueMovimento`):
  - Lançamentos de **'SAIDA'** automáticos gerados a partir do consumo real de insumos apontado nas Ordens de Serviço (Fase 6).
  - Lançamentos de **'ENTRADA'** automáticos gerados a partir do recebimento dos Pedidos de Compra (Fase 6.5).

### 📊 Fase 7: Relatórios (`relatorios`)
- [ ] Criar app `relatorios` apenas com views analíticas (somente leitura - cálculos via query/service).
- [ ] Implementar endpoints analíticos:
  - [ ] `/comparativo-safra/` (Comparativo planejado x realizado)
  - [ ] `/custo-talhao/` (Custo por talhão)
  - [ ] `/custo-mensal/` (Custo mensal por fazenda)
  - [ ] `/fluxo-caixa/` (Fluxo de caixa)
  - [ ] `/eficiencia-operacional/` (Eficiência operacional)
  - [ ] `/consumo-diesel/` (Consumo de diesel)
  - [ ] `/mof/` (Análise de mão de obra fixa)
  - [ ] `/estoque/` (Estoque por produto/fazenda)
  - [ ] `/gestao-a-vista/` (Gestão à vista)
  - [ ] `/producao-talhao/` (Produção por talhão)

### 💻 Fase 8: Frontend (React)
- [ ] Setup do Projeto React (Vite, React Router, TailwindCSS, Zustand ou Context).
- [ ] Configurar Axios Interceptor para enviar `X-Safra-ID` automaticamente no header.
- [ ] Implementar `SafraContext` global mantendo estado de `{ proprietario, fazenda_ativa, safra_ativa }`.
- [ ] Criar Seletor de Safra/Fazenda no Topo (Header).
- [ ] Desenvolver Telas respeitando permissões de Perfil:
  - [ ] Dashboard / Gestão à Vista.
  - [ ] Cadastros Base.
  - [ ] Planejamento (Apenas perfil 1).
  - [ ] Operações / Apontamentos.
  - [ ] Relatórios Analíticos.

---

## 🔌 Checklist de Endpoints API (Verificação e Conclusão)

### Autenticação & Perfil
- [ ] `POST /api/auth/token/` (Obter tokens JWT)
- [ ] `POST /api/auth/token/refresh/` (Atualizar token)
- [ ] `POST /api/auth/token/verify/` (Validar token)

### Core
- [ ] `GET/POST /api/proprietarios/`
- [ ] `GET/POST /api/fazendas/`
- [ ] `GET/POST /api/safras/`

### Referências
- [ ] `GET/POST /api/ref/culturas/`
- [ ] `GET/POST /api/ref/tipos-operacao/`
- [ ] `GET/POST /api/ref/contas-gerenciais/`
- [ ] `GET/POST /api/ref/tipos-rateio/`
- [ ] `GET/POST /api/ref/criterios-rateio/`
- [ ] `GET/POST /api/ref/atividades-educampo/`
- [ ] `GET/POST /api/ref/classificacoes-produto/`
- [ ] `GET/POST /api/ref/unidades-medida/`
- [ ] `GET/POST /api/ref/status-os/`

### Cadastros Base
- [ ] `GET/POST /api/talhoes/`
- [ ] `GET/POST /api/maquinas/`
- [ ] `GET/POST /api/funcionarios/`
- [ ] `GET/POST /api/terceirizados/`
- [ ] `GET/POST /api/turmas-terceirizadas/`
- [ ] `GET/POST /api/produtos/`
- [ ] `GET/POST /api/estoque/movimentos/` (Entradas, Saídas, Ajustes, Transferências)
- [ ] `GET /api/estoque/saldos/`

### Planejamento
- [ ] `GET/POST /api/planejamentos/`
- [ ] `POST /api/planejamentos/{id}/aprovar/`
- [ ] `GET/POST /api/planejamentos/{id}/ordens-servico/`
- [ ] `GET/POST /api/planejamentos/{id}/mao-obra-terceiros/`
- [ ] `GET/POST /api/planejamentos/{id}/adubacao/`
- [ ] `GET/POST /api/planejamentos/{id}/rateios/`
- [ ] `POST /api/planejamentos/{id}/gerar-ordens-servico/`

### Operações & Execução
- [ ] `GET/POST /api/ordens-servico/`
- [ ] `POST /api/ordens-servico/{id}/executar/`
- [ ] `POST /api/ordens-servico/{id}/cancelar/`
- [ ] `POST /api/ordens-servico/{id}/concluir/`
- [ ] `GET/POST /api/gastos-rateio/`
- [ ] `GET/POST /api/abastecimentos/`

### Relatórios Analíticos
- [ ] `GET /api/relatorios/comparativo-safra/`
- [ ] `GET /api/relatorios/custo-talhao/`
- [ ] `GET /api/relatorios/custo-mensal/`
- [ ] `GET /api/relatorios/fluxo-caixa/`
- [ ] `GET /api/relatorios/eficiencia-operacional/`
- [ ] `GET /api/relatorios/consumo-diesel/`
- [ ] `GET /api/relatorios/mof/`
- [ ] `GET /api/relatorios/estoque/`
- [ ] `GET /api/relatorios/gestao-a-vista/`
- [ ] `GET /api/relatorios/producao-talhao/`

---

## 📐 Regras Gerais e Cuidados de Desenvolvimento

### Regras Gerais de Engenharia:
1. **Preservação de Contexto**: Sempre garantir que as consultas e operações respeitem as relações `Proprietário → Fazenda → Safra Ativa`.
2. **Sem Enums Rígidos**: Não usar enums fixos no código quando o dado precisar ser administrável (ex: usar tabelas de referências cadastradas).
3. **Soft Delete Mandatório**: Sempre implementar soft delete (`ativo=True`) em tabelas de cadastros e tabelas transacionais principais. Nunca apagar dados fisicamente.
4. **Valores Monetários**: Sempre utilizar `DecimalField` (nunca `FloatField`) com duas casas decimais no banco de dados.
5. **Cálculos Centralizados**: Todas as regras e fórmulas agrícolas/financeiras (COE, valor hora máquina, rateios) devem ficar em services ou selectors no backend.
6. **Controle de Perfil**: Respeitar estritamente as regras de perfil: `1` (Superusuário), `2` (Proprietário), `3` (Operador).

### Cuidados Importantes (Anti-patterns a Evitar):
1. **Não duplicar tabelas por fazenda**: A base PostgreSQL deve ser unificada e usar multi-tenancy lógico (`fazenda_id`).
2. **Evitar Colunas por Mês**: Não criar colunas temporais fixas (ex: `set`, `out`, `nov`) em tabelas transacionais. Usar um campo `mes` e `ano`.
3. **Evitar Colunas por Talhão**: Na tabela de rateio, usar tabelas filhas normalizadas (`RateioTalhao`), nunca colunas dinâmicas.
4. **Fechamento de Custos Bloqueante**: A consolidação mensal financeira das OSs exige o fechamento prévio e obrigatório dos custos das máquinas no respectivo mês (`CustoMensalMaquina`).
5. **Filtros e Permissões**: Testar rigorosamente filtros por `safra` e validações de acesso a endpoints desde o primeiro dia de implementação de cada fase.

