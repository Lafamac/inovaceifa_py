# Mudanças Realizadas

Este documento registra as alterações realizadas pelo Codex no projeto Inova Ceifa durante esta sequência de trabalho.

## 1. Revisão das diretrizes

- Analisados os arquivos `agents.md` e `agentscodex.md` para alinhar as alterações à arquitetura do ERP.
- Consideradas as regras de multi-tenancy lógico no contexto `Proprietário → Fazenda → Safra Ativa`.
- Preservadas as regras de soft delete, tabelas de referência, permissões por perfil e responsividade.

## 2. Correção inicial de `Cadastros.jsx`

- Corrigido o erro de JSX que impedia o build do frontend.
- Reorganizada a carga de proprietários, fazendas, safras, talhões, máquinas, funcionários, terceirizados, turmas, produtos e estoque.
- Alinhados os nomes dos campos dos formulários aos serializers e models reais do backend.
- Adicionado carregamento das tabelas de referência usadas pelos cadastros.
- Adicionado suporte a respostas paginadas do Django REST Framework.
- Mantido fallback de leitura dos dados locais de demonstração quando a API não estiver disponível.
- Removidos fallbacks silenciosos que simulavam gravações bem-sucedidas sem persistência real no backend.
- Adicionadas validações dos campos obrigatórios antes do envio.
- Corrigido o envio automático da safra ativa nas movimentações de estoque.
- Mantidas as ações de edição e desativação de proprietário existentes naquele estágio.

## 3. Layout e contraste da página de cadastros

- Criada a classe escopada `.cadastros-page` para controlar o visual sem afetar o restante do sistema.
- Corrigido o contraste entre fundos claros e textos originalmente configurados para tema escuro.
- Ajustadas as cores de:
  - painéis;
  - títulos e textos auxiliares;
  - inputs e selects;
  - cabeçalhos e linhas de tabelas;
  - estados de hover;
  - itens ativos do menu.
- Adicionada uma superfície visual própria para a página de cadastros.
- Compactado o menu em grade em telas menores para reduzir a rolagem antes do formulário.

## 4. Correção do dark mode

- Removido o comportamento que forçava a página de cadastros a permanecer no tema claro.
- Adicionadas variantes `.dark .cadastros-page` para todos os elementos que haviam recebido estilos claros forçados.
- Corrigidas as cores no tema escuro para:
  - fundo principal;
  - cards e painéis;
  - títulos e textos;
  - inputs, selects e options;
  - tabelas;
  - linhas em hover;
  - itens ativos e inativos do menu.
- Validada a alternância entre os temas claro e escuro pelo botão do cabeçalho.

## 5. Menu lateral por módulos

- Substituída a lista única de cadastros por grupos expansíveis na lateral esquerda.
- Organizado o menu na ordem:
  1. `Cadastros`
  2. `Operacional`
  3. `Suprimentos`
  4. `Financeiro & RH`
- Mantidos no grupo `Cadastros`:
  - Proprietários;
  - Fazendas;
  - Safras;
  - Talhões;
  - Máquinas;
  - Transferências;
  - Locação de Máquinas;
  - Tabelas de Referência.
- Organizados no grupo `Operacional`:
  - Planejamentos;
  - Ordens de Serviço;
  - Abastecimentos;
  - Rateios Realizados;
  - Rateios Operacionais.
- Organizados no grupo `Suprimentos`:
  - Produtos e Insumos;
  - Fornecedores;
  - Movimentações;
  - Pedidos de Compra.
- Organizados no grupo `Financeiro & RH`:
  - Funcionários;
  - Terceirizados;
  - Turmas;
  - Pedidos de Venda;
  - Contas a Pagar;
  - Contas a Receber.

## 6. Conexão da navegação existente

- Substituídas as condicionais específicas por item pelos metadados `targetView` e `targetSubTab`.
- Atualizado `App.jsx` para manter separadamente a subaba financeira e a subaba operacional solicitadas.
- Atualizado `OrdensServico.jsx` para aceitar a propriedade `defaultSubTab`.
- Conectadas diretamente as seguintes rotas:
  - Planejamentos → componente `Planejamentos`;
  - Ordens de Serviço → subaba `os`;
  - Abastecimentos → subaba `abastecimento`;
  - Rateios Realizados → subaba `rateio`;
  - Rateios Operacionais → subaba `rateio_operacional`;
  - Pedidos de Compra → subaba financeira `compras`;
  - Pedidos de Venda → subaba financeira `vendas`;
  - Contas a Pagar → subaba financeira `pagar`;
  - Contas a Receber → subaba financeira `receber`.

## 7. Ambiente e validações executadas

- Subido o PostgreSQL pelo Docker Compose.
- Verificadas as migrations existentes.
- Executados os comandos `seed_referencias` e `seed_cadastros`.
- Garantido o usuário administrativo padrão `admin@teste.com` com perfil de superusuário.
- Iniciados o backend Django e o frontend Vite durante os testes.
- Testados o login JWT e endpoints autenticados.
- Executado `npm run build` após as alterações de frontend.
- Executado ESLint isolado durante as etapas de correção.
- Testadas visualmente as páginas nos temas claro e escuro.
- Testada no navegador a navegação direta para Abastecimentos e Pedidos de Venda.
- Executado `git diff --check` para conferir problemas de formatação no diff.

## 8. Documentação do projeto

- Atualizado `agents.md` com o registro da reorganização do menu e do roteamento direto para as telas e subabas existentes.

## 9. Novo fluxo de locação de máquinas

- Alterado o cadastro inicial da locação para representar uma previsão, sem criar imediatamente uma conta a pagar.
- Adicionado status operacional à locação:
  - `ABERTA`;
  - `ENCERRADA`;
  - `CANCELADA`.
- Tornada opcional a quantidade prevista no cadastro inicial.
- Adicionados os campos:
  - quantidade efetiva/final;
  - valor final do aluguel;
  - data de encerramento;
  - data prevista para pagamento;
  - quantidade de prorrogações;
  - vínculo idempotente com a conta a pagar.
- Para cobrança por hora, o formulário inicial agora identifica explicitamente `Horas Previstas` e o encerramento exige `Horas Trabalhadas`.
- A tarifa cadastrada inicialmente é tratada como estimativa; o valor definitivo é informado ou calculado no encerramento.
- Criada a ação `POST /api/locacoes-maquinas/{id}/encerrar/`.
- Criada a ação `POST /api/locacoes-maquinas/{id}/prorrogar/`.
- O encerramento gera uma única conta a pagar com o valor final e vencimento informados.
- Tentativas de encerrar novamente uma locação já encerrada são bloqueadas, evitando duplicidade financeira.
- A prorrogação exige uma nova data posterior ao prazo atual e incrementa o contador de prorrogações.
- Adicionados ao serializer os indicadores calculados `em_atraso` e `dias_atraso`.
- Criado alerta visual para locações abertas cujo prazo terminou, oferecendo diretamente as ações `Encerrar` e `Prorrogar`.
- Atualizada a listagem para mostrar status, prazo vencido, valor estimado ou final e quantidade de prorrogações.
- Criados modais de encerramento e prorrogação no frontend.
- Criada a migration `0016_locacaomaquina_data_encerramento_and_more.py`, incluindo conversão segura das locações antigas que já possuíam conta a pagar para o status `ENCERRADA`.
- Criado `backend/cadastros/services.py` para centralizar encerramento, cálculo financeiro, criação da conta e prorrogação.
- Atualizados os testes para validar:
  - ausência de conta antes do encerramento;
  - geração da conta no encerramento;
  - bloqueio de duplicidade;
  - obrigatoriedade das horas efetivas;
  - prorrogação de prazo.
- Migration aplicada no banco configurado.
- Executados cinco testes de integração com sucesso.
- Executados `manage.py check` e `npm run build` com sucesso.

### Cálculo automático do término previsto

- Quando o tipo de cobrança é `DIÁRIA`, o formulário calcula automaticamente o término previsto usando `Data Início + Dias Previstos`.
- O cálculo é atualizado ao alterar a data inicial, a quantidade de dias ou ao trocar o tipo de cobrança para diária.
- Para diárias, a quantidade passa a aceitar somente passos inteiros no formulário.
- O término previsto continua editável para permitir ajustes contratuais manuais.

## Arquivos alterados

- `frontend/src/components/Cadastros.jsx`
- `frontend/src/index.css`
- `frontend/src/App.jsx`
- `frontend/src/components/OrdensServico.jsx`
- `backend/cadastros/models.py`
- `backend/cadastros/serializers.py`
- `backend/cadastros/views.py`
- `backend/cadastros/services.py`
- `backend/cadastros/tests.py`
- `backend/cadastros/migrations/0016_locacaomaquina_data_encerramento_and_more.py`
- `agents.md`
- `mudancas.md`

## Observações

- O build do frontend está funcional.
- O ESLint global ainda aponta dívidas técnicas preexistentes em componentes grandes, incluindo imports não utilizados, hooks antigos e referências indefinidas. Esses problemas não foram todos corrigidos porque estavam fora do escopo da reorganização da navegação.
- O bundle principal do Vite continua gerando aviso de tamanho superior a 500 kB, indicando oportunidade futura de divisão por rotas ou imports dinâmicos.
