# agents.md - ERP de Gestão Agrícola de Café

## Objetivo

Construir um ERP multi-fazenda para gestão agrícola de café, baseado na análise da planilha `planilha.xlsx` e nas regras de negócio levantadas com o usuário.

Stack principal:

- Backend: Python, Django, Django REST Framework, PostgreSQL
- Autenticação: JWT com `djangorestframework-simplejwt`
- Frontend: React, Vite, React Router, Axios
- Banco: PostgreSQL
- Infraestrutura & DevOps:
  - **Docker**: Uso de containers para isolamento do ambiente de backend e do banco de dados PostgreSQL.
  - **Swagger (OpenAPI)**: Documentação automatizada de endpoints para especificação e testes.
  - **Flyway**: Versionamento profissional e migração evolutiva do banco de dados PostgreSQL.
- Inicialização & Seed Automático:
  - Na inicialização, verificar se as tabelas estão criadas no banco de dados.
  - Caso não estejam, as tabelas devem ser criadas automaticamente via migrations/Flyway.
  - Após a criação das tabelas, realizar o seed do usuário administrador inicial (`admin@teste.com`, senha `12345`, `perfil_id = 1`).

O sistema sempre deve operar dentro do contexto obrigatório:

```text
Proprietario -> Fazenda -> Safra ativa
```

Toda consulta operacional deve respeitar fazenda e safra. Dados de uma safra não devem se misturar com outra.

---

## Regras Gerais Para Desenvolvimento

1. Sempre preservar o contexto de `proprietario`, `fazenda` e `safra`.
2. Não usar campos `enum` fixos quando o dado deve ser administrável pelo sistema. Preferir tabelas de referência.
3. Usar `ativo = models.BooleanField(default=True)` nas principais tabelas para soft delete.
4. Não remover registros operacionais importantes fisicamente. Desativar.
5. Valores monetários devem usar `DecimalField`, nunca `FloatField`.
6. Cálculos agrícolas e financeiros devem ser centralizados em services/selectors, evitando regra espalhada em views.
7. Relatórios devem ser derivados dos dados normalizados, não de tabelas duplicadas por fazenda.
8. Toda tela do frontend deve considerar a fazenda e a safra ativa.
9. O perfil `1` é o único que pode criar e editar planejamento de safra.
10. A planilha é referência de regra de negócio, não um modelo para copiar 1:1 no banco.

---

## Perfis de Usuário

| perfil_id | Nome | Permissões |
|---|---|---|
| 1 | Superusuário | Acesso total. Único que cria/edita planejamento da safra e tabelas de referência críticas. |
| 2 | Proprietário | Acessa todas as fazendas vinculadas ao seu proprietário. Pode operar cadastros, execuções e relatórios das próprias fazendas. |
| 3 | Operador | Acessa somente a fazenda vinculada. Visualiza e opera talhões, máquinas, produtos e ordens de serviço permitidas. |

No código, evitar números mágicos soltos. Criar constantes:

```python
PERFIL_SUPERUSUARIO = 1
PERFIL_PROPRIETARIO = 2
PERFIL_OPERADOR = 3
```

---

## Contexto de Safra

Backend:

- Criar middleware ou service de contexto para identificar `safra_ativa`.
- Aceitar `X-Safra-ID` no header.
- Validar se a safra pertence a uma fazenda acessível pelo usuário.
- Injetar no request:
  - `request.safra_ativa`
  - `request.fazendas_permitidas`
  - `request.fazenda_ativa`, quando aplicável
- Bloquear endpoints operacionais sem safra ativa.

Frontend:

- Criar contexto global de safra/fazenda.
- Manter `{ proprietario, fazenda_ativa, safra_ativa }`.
- Enviar `X-Safra-ID` automaticamente via Axios interceptor.
- Exibir o contexto ativo no header.

---

## Fazendas e Safra Identificadas na Planilha

Fazendas:

- Bragas, abreviação `BR`
- Congonhas, abreviação `CG` ou `CO`
- São Francisco, abreviação `SF`
- Sumatra, abreviação `ST`

Safra identificada:

- `2024/2025`
- Período operacional observado: setembro a agosto

Na implementação, não fixar essas fazendas no código. Elas devem entrar como seeds iniciais ou dados cadastráveis.

---

## Apps Django Recomendados

```text
backend/
  config/
  apps/
    accounts/
    core/
    referencias/
    cadastros/
    planejamento/
    operacoes/
    relatorios/
```

### `accounts`

Responsável por usuários, perfis e autenticação.

Modelos principais:

- `Perfil`
- `Usuario`, herdando de `AbstractUser`
- vínculo do usuário com fazendas permitidas

### `core`

Responsável pelo eixo principal do sistema.

Modelos:

- `Proprietario`
- `Fazenda`
- `Safra`

Regra importante:

- Uma fazenda pode ter várias safras.
- Apenas uma safra deve estar ativa por fazenda.
- Dados operacionais devem apontar para `safra` e, quando fizer sentido, também para `fazenda`.

### `referencias`

Tabelas auxiliares para evitar enums fixos.

Referências recomendadas:

- `Cultura`
- `TipoItem`
- `StatusCultivo`
- `TipoIrrigacao`
- `ResistenciaFerrugem`
- `StatusOrdemServico`
- `Modalidade`
- `TipoRateio`
- `ContaGerencial`
- `TipoDestinacao`
- `GrupoTrabalhador`
- `ClassificacaoProduto`
- `GrupoQuimico`
- `UnidadeMedida`
- `AtividadeEducampo`
- `CriterioRateio`
- `TipoOperacao`

Somente perfil `1` deve criar/editar referências críticas.

### `cadastros`

Cadastros base do ERP.

Modelos principais:

- `Talhao`
- `EstimativaProducaoTalhao`
- `Maquina`
- `CustoMensalMaquina`
- `Funcionario`
- `SalarioMensal`
- `Terceirizado`
- `TurmaTerceirizada`
- `Produto`
- `EstoqueMovimento`

Não criar uma tabela de estoque por fazenda. Usar uma tabela única de movimentos com `fazenda_id` e `safra_id`.

### `planejamento`

Criação do planejamento da safra.

Somente perfil `1` pode criar, editar, aprovar ou gerar OSs a partir do planejamento.

Modelos principais:

- `PlanejamentoSafra`
- `OrdemServicoPlanejada`
- `ItemInsumoOSPlanejado`
- `ParametroOperacionalOS`
- `PlanejamentoMaoObraTerceiros`
- `PlanejamentoAdubo`
- `PlanejamentoRateio`

### `operacoes`

Execução real da safra.

Modelos principais:

- `OrdemServico`
- `ItemInsumoOSReal`
- `CustoOperacionalOS`
- `ExecucaoMaoObraTerceiros`
- `GastoRateioRealizado`
- `RateioTalhao`
- `AbastecimentoMaquina`

### `relatorios`

Endpoints somente leitura.

Não criar modelos próprios se os relatórios puderem ser calculados por query/service.

Relatórios esperados:

- comparativo planejado x realizado
- custo por talhão
- custo mensal por fazenda
- fluxo de caixa
- eficiência operacional
- consumo de diesel
- análise de mão de obra fixa
- estoque por produto/fazenda
- gestão à vista
- produção por talhão

---

## Lições da Planilha

Abas principais analisadas:

- `Cadastro de talhões`: base de talhões por fazenda e safra.
- `Maquinas`: máquinas, implementos, custo mensal, horas e consumo.
- `Salários`: mão de obra própria planejada e realizada.
- `Cadastro de Operações`: parâmetros técnicos de operações agrícolas.
- `Entrada dos Produtos`: entrada de insumos, nota, valor, fazenda e vencimento.
- `Estoque *`: saldos por fazenda, que no sistema devem ser calculados.
- `Mão de Obra Terceiros`: planejamento e execução de terceiros.
- `Aba Rateios`: gastos planejados/realizados e distribuição por talhão.
- `Seg. Atividades e insumos`: coração operacional do sistema.
- `Impressão OS`, `Gestão a vista`, `Fluxo de Caixa`, `Custos_Talhão`: relatórios e saídas.

A aba `Seg. Atividades e insumos` mistura:

- OS
- operação
- produto
- planejamento
- execução
- diesel
- máquina
- funcionário
- custo
- status

No banco, isso deve ser separado em entidades normalizadas.

---

## Modelagem Essencial

### Talhão

Campos importantes:

- fazenda
- safra
- código
- nome
- área
- irrigação
- espaçamento de rua
- espaçamento de planta
- estande
- número de plantas
- material genético
- resistência à ferrugem
- status de cultivo
- estimativas e produção
- ativo

### Máquina

Campos importantes:

- fazenda
- safra, se o custo for controlado por safra
- código
- descrição
- marca
- modelo
- ano de fabricação
- tipo
- ativo

Custos mensais devem ficar em tabela separada.

### Produto/Insumo

Campos importantes:

- código
- nome comercial
- unidade
- classificação
- grupo químico
- ativos
- concentração
- período de carência
- alvo
- recomendações técnicas
- ativo

### Estoque

Usar movimentos:

- entrada
- saída
- ajuste
- transferência interna (operação dedicada para rastrear a origem e o destino de insumos entre fazendas do mesmo proprietário)

Saídas podem vir de OS executada ou lançamento manual.

Saldo negativo deve gerar alerta (aviso exibido dinamicamente no frontend), não bloqueio.

### Planejamento e OS

Planejamento gera ordens de serviço.

Uma OS pode conter:

- operação principal
- talhão
- datas planejadas
- operador
- trator
- implemento
- produtos planejados
- parâmetros operacionais
- custos planejados

Execução da OS registra:

- datas reais
- horímetro inicial/final
- diesel gasto
- produtos utilizados
- horas realizadas
- eficiência real
- custos reais
- status

---

## Status de Ordem de Serviço

Status persistidos recomendados:

- `RASCUNHO`
- `APROVADA`
- `EM_EXECUCAO`
- `CONCLUIDA`
- `CANCELADA`

Status calculado:

- `ATRASADA`

`ATRASADA` não deve ser salvo como estado definitivo. Deve ser calculado quando:

```text
data_fim_planejada < hoje
e status não está em CONCLUIDA/CANCELADA
```

---

## Regras de Cálculo

### Valor Hora Máquina

```text
valor_hora = (custo_oficina_mes + custo_abastecimento_mes) / horas_trabalhadas_mes
```

O COE da OS deve usar o valor do mês da execução, não o valor atual. O fechamento e a consolidação do custo mensal das máquinas (`CustoMensalMaquina`) de um determinado mês é um pré-requisito bloqueante para consolidar financeiramente todas as OSs executadas naquele mês.

### COE

```text
COE = mão de obra + hora máquina + diesel + insumos
```

Guardar ou calcular:

- COE R$/talhão
- COE R$/ha

### Rateio por Talhão

Critérios:

- por área
- por produção
- por fazenda específica
- por talhão específico

Rateio por área:

```text
valor_talhao = valor_total * (area_talhao / area_total)
```

Rateios podem ser processados por tarefa assíncrona no futuro, mas no início podem ser services síncronos bem testados.

---

## Frontend

Estrutura recomendada:

```text
frontend/src/
  api/
  context/
  hooks/
  components/
  pages/
    Dashboard/
    Cadastros/
    Planejamento/
    Operacoes/
    Relatorios/
```

Regras:

- Usar React Query para dados vindos da API.
- Usar Zustand ou Context para contexto ativo.
- Toda tela operacional precisa saber a safra ativa.
- Exibir seletor de fazenda/safra no topo.
- Não carregar relatórios sem contexto ativo.
- Formularios devem respeitar permissões por perfil.

---

## Endpoints Base Esperados

Autenticação:

```text
POST /api/auth/token/
POST /api/auth/token/refresh/
POST /api/auth/token/verify/
```

Core:

```text
/api/proprietarios/
/api/fazendas/
/api/safras/
```

Referências:

```text
/api/ref/culturas/
/api/ref/tipos-operacao/
/api/ref/contas-gerenciais/
/api/ref/tipos-rateio/
/api/ref/criterios-rateio/
/api/ref/atividades-educampo/
/api/ref/classificacoes-produto/
/api/ref/unidades-medida/
/api/ref/status-os/
```

Cadastros:

```text
/api/talhoes/
/api/maquinas/
/api/funcionarios/
/api/terceirizados/
/api/turmas-terceirizadas/
/api/produtos/
/api/estoque/movimentos/
/api/estoque/saldos/
```

Planejamento:

```text
/api/planejamentos/
/api/planejamentos/{id}/aprovar/
/api/planejamentos/{id}/ordens-servico/
/api/planejamentos/{id}/mao-obra-terceiros/
/api/planejamentos/{id}/adubacao/
/api/planejamentos/{id}/rateios/
/api/planejamentos/{id}/gerar-ordens-servico/
```

Operações:

```text
/api/ordens-servico/
/api/ordens-servico/{id}/executar/
/api/ordens-servico/{id}/cancelar/
/api/ordens-servico/{id}/concluir/
/api/gastos-rateio/
/api/abastecimentos/
```

Relatórios:

```text
/api/relatorios/comparativo-safra/
/api/relatorios/custo-talhao/
/api/relatorios/custo-mensal/
/api/relatorios/fluxo-caixa/
/api/relatorios/eficiencia-operacional/
/api/relatorios/consumo-diesel/
/api/relatorios/mof/
/api/relatorios/estoque/
/api/relatorios/gestao-a-vista/
/api/relatorios/producao-talhao/
```

---

## Ordem de Desenvolvimento Recomendada

1. Criar projeto Django e projeto React/Vite.
2. Configurar Docker, PostgreSQL, Flyway, Swagger (OpenAPI), DRF, JWT, CORS e variáveis de ambiente.
3. Criar rotina/script de inicialização do banco: verificar tabelas na base, criá-las se ausentes e realizar seed do usuário administrador inicial (`admin@teste.com`, password `12345` e `perfil_id=1`).
4. Criar `accounts`: usuário, perfil e permissões.
5. Criar `core`: proprietário, fazenda, safra e contexto ativo.
6. Criar `referencias`: tabelas auxiliares e seeds iniciais.
6. Criar `cadastros`: talhões, máquinas, funcionários, produtos e estoque.
7. Criar `planejamento`: planejamento de safra e OS planejada.
8. Criar `operacoes`: OS real, execução, consumo, custos e rateios.
9. Criar `relatorios`: endpoints analíticos.
10. Criar frontend na mesma ordem: contexto, cadastros, planejamento, execução e relatórios.

---

## Cuidados Importantes

1. Não duplicar tabelas por fazenda.
2. Não criar colunas repetidas por mês como `set`, `out`, `nov` em tabelas transacionais. Usar campo `mes`/`ano`.
3. Não criar colunas repetidas por talhão como na planilha de rateio. Usar tabela filha `RateioTalhao`.
4. Não salvar cálculos que podem ficar inconsistentes sem necessidade. Quando salvar, definir claramente quando recalcular.
5. Testar permissões por perfil desde o início.
6. Testar filtros por safra desde o início.
7. Toda tabela operacional deve ter `created_at`, `updated_at` e `ativo`.
8. Importações da planilha devem passar por validação antes de gravar.
9. Nomes vindos da planilha possuem variações e erros de digitação. Normalizar por tabelas de referência.
10. O sistema deve permitir novas safras com novos dados sem apagar ou sobrescrever a safra anterior.

