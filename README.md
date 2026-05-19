# InovaCeifa - ERP Agrícola para Gestão de Café ☕🚜

**InovaCeifa** é um sistema ERP de alta performance projetado especificamente para a gestão cafeeira de precisão. O ecossistema unifica o controle operacional das fazendas, o planejamento agrícola, a execução de ordens de serviço (OS) em tempo real, além do gerenciamento robusto de estoque de insumos e do fluxo financeiro corporativo.

---

## 🛠️ Stack Tecnológica

### Backend (API)
- **Framework**: Python 3.11+, Django 5.x & Django REST Framework (DRF)
- **Autenticação**: JSON Web Tokens (JWT) via `django-rest-framework-simplejwt`
- **Documentação**: Swagger / OpenAPI 3.0 via `drf-spectacular`
- **Banco de Dados**: PostgreSQL com modelagem avançada e controle estrito de Multi-Tenant

### Frontend (SPA)
- **Framework**: React 18+ com Vite
- **Roteamento**: React Router
- **Estilização**: TailwindCSS
- **Gerenciamento de Estado**: Zustand

### Infraestrutura & DevOps
- **Docker**: Ambiente conteinerizado completo (`docker-compose.yml`)
- **Flyway / Migrations**: Versionamento evolutivo do banco de dados

---

## 📐 Arquitetura do Sistema

### 1. Isolamento Multi-Tenant Lógico
Todos os dados transacionais e de planejamento são isolados sob um contexto corporativo estrito de **Proprietário ➔ Fazenda ➔ Safra Ativa**.
Os headers `X-Fazenda-ID` e `X-Safra-ID` são interceptados pelo middleware e validados contra as fazendas permitidas do usuário logado (`Usuario.fazendas_permitidas`), garantindo segurança contra vazamento de dados corporativos.

### 2. Soft Delete Global
Todas as entidades estendem a classe `BaseModel`, que implementa exclusão lógica (`ativo = models.BooleanField(default=True)`) com auditoria automática dos campos `created_at` e `updated_at`.

### 3. Sincronização e Fluxo do Estoque
- **Entradas**: Movimentações automáticas de `ENTRADA` no estoque físico ao receber um **Pedido de Compra** no módulo financeiro.
- **Saídas**: Lançamentos automáticos e idempotentes de `SAIDA` gerados no estoque a partir das quantidades reais aplicadas e apontadas nas **Ordens de Serviço (OS)** ao serem concluídas.

---

## 🚀 Fases Desenvolvidas e Prontas

* **Fase 1: Fundação do Backend e Autenticação (`accounts`)**
  - Usuários customizados, Perfis com diferentes níveis de acesso (`Superusuário`, `Proprietário`, `Operador`) e Autenticação JWT.
* **Fase 2: Core e Contexto Multi-Tenant (`core`)**
  - Cadastro de Proprietários, Fazendas e Safras com checagem de safra ativa única por fazenda.
* **Fase 3: Tabelas de Referências Auxiliares (`referencias`)**
  - Carga inicial robusta de dados normalizados de Culturas, Tipo de Itens, Resistências, Conta Gerencial, etc.
* **Fase 4: Cadastros Base e Estoque (`cadastros`)**
  - Mapeamento completo de Talhões, Máquinas, Funcionários e movimentações transacionais de Estoque.
* **Fase 5: Planejamento Agrícola (`planejamento`)**
  - Modelagem do Planejamento de Safra e geração em lote de Ordens de Serviço a partir das programadas.
* **Fase 6: Operações e Execução Real (`operacoes`)**
  - Fluxo completo da Ordem de Serviço (`RASCUNHO`, `APROVADA`, `EM_EXECUCAO`, `CONCLUIDA`, `CANCELADA`) com auditorias rigorosas de superdose/subdose/desvio de produto em tempo real e rateio de custos.
* **Fase 6.5: Compras, Contas a Pagar e Estoque Integrado (`financeiro`)**
  - Gestão de Compras, recebimento de mercadorias, geração automática de Contas a Pagar e integração automática bidirecional do Estoque (Entradas e Saídas).

---

## 🏃 Como Executar o Projeto Localmente

### Pré-requisitos
- Python 3.11 ou superior
- Docker & Docker Compose
- PostgreSQL (opcional, se rodar fora do Docker)

### Passo a Passo

1. **Clonar o Repositório**:
   ```bash
   git clone https://github.com/Lafamac/inovaceifa_py.git
   cd inovaceifa_py
   ```

2. **Configurar as Variáveis de Ambiente**:
   Crie um arquivo `.env` na raiz do projeto contendo as credenciais do banco e configurações Django:
   ```env
   DJANGO_SECRET_KEY=sua_chave_secreta_aqui
   DEBUG=True
   DB_NAME=inovaceifa
   DB_USER=postgres
   DB_PASSWORD=suasenha
   DB_HOST=127.0.0.1
   DB_PORT=5432
   ```

3. **Subir os Containers (PostgreSQL & PGAdmin)**:
   ```bash
   docker-compose up -d
   ```

4. **Instalar Dependências e Executar o Servidor**:
   ```bash
   # Ative seu ambiente virtual (exemplo Windows Powershell)
   .\venv\Scripts\activate
   
   # Instalar dependências
   pip install -r requirements.txt
   
   # Rodar Migrations
   cd backend
   python manage.py makemigrations
   python manage.py migrate
   
   # Iniciar Servidor de Desenvolvimento
   python manage.py runserver
   ```

5. **Acessar a Documentação Interativa**:
   Com o servidor rodando, abra o navegador em:
   - **Swagger UI**: `http://127.0.0.1:8000/api/docs/`
   - **Admin Django**: `http://127.0.0.1:8000/admin/`

---

## 🧪 Rodando os Testes Unitários

O projeto conta com uma suíte de testes de integração e unitários que validam desde a autenticação, auditoria de OSs até as integrações de recebimento de compras com estoque e financeiro:
```bash
cd backend
python manage.py test
```
