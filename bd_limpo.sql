-- --------------------------------------------------------
-- Servidor:                     localhost
-- Versão do servidor:           PostgreSQL 18.4 on x86_64-windows, compiled by msvc-19.44.35226, 64-bit
-- OS do Servidor:               
-- HeidiSQL Versão:              12.14.0.7165
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES  */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Copiando estrutura para tabela public.accounts_perfil
CREATE TABLE IF NOT EXISTS "accounts_perfil" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(50) NOT NULL,
	"nivel" INTEGER NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nivel")
);

-- Copiando dados para a tabela public.accounts_perfil: -1 rows
/*!40000 ALTER TABLE "accounts_perfil" DISABLE KEYS */;
INSERT INTO "accounts_perfil" ("id", "created_at", "updated_at", "ativo", "nome", "nivel") VALUES
	(1, '2026-05-19 15:33:35.796586-03', '2026-05-19 15:33:35.796598-03', 'true', 'Superusuário', 1),
	(2, '2026-05-19 15:33:35.798108-03', '2026-05-19 15:33:35.798116-03', 'true', 'Proprietário', 2),
	(3, '2026-05-19 15:33:35.799051-03', '2026-05-19 15:33:35.799058-03', 'true', 'Operador', 3);
/*!40000 ALTER TABLE "accounts_perfil" ENABLE KEYS */;

-- Copiando estrutura para tabela public.accounts_usuario
CREATE TABLE IF NOT EXISTS "accounts_usuario" (
	"id" BIGINT NOT NULL,
	"password" VARCHAR(128) NOT NULL,
	"last_login" TIMESTAMPTZ NULL DEFAULT NULL,
	"is_superuser" BOOLEAN NOT NULL,
	"username" VARCHAR(150) NOT NULL,
	"first_name" VARCHAR(150) NOT NULL,
	"last_name" VARCHAR(150) NOT NULL,
	"email" VARCHAR(254) NOT NULL,
	"is_staff" BOOLEAN NOT NULL,
	"is_active" BOOLEAN NOT NULL,
	"date_joined" TIMESTAMPTZ NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"perfil_id" BIGINT NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("username"),
	CONSTRAINT "accounts_usuario_perfil_id_e9959ae0_fk_accounts_perfil_id" FOREIGN KEY ("perfil_id") REFERENCES "accounts_perfil" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "accounts_usuario_username_c366c69f_like" ON "" ("username");
CREATE INDEX "accounts_usuario_perfil_id_e9959ae0" ON "" ("perfil_id");;

-- Copiando dados para a tabela public.accounts_usuario: 2 rows
/*!40000 ALTER TABLE "accounts_usuario" DISABLE KEYS */;
INSERT INTO "accounts_usuario" ("id", "password", "last_login", "is_superuser", "username", "first_name", "last_name", "email", "is_staff", "is_active", "date_joined", "created_at", "updated_at", "ativo", "perfil_id") VALUES
	(1, 'pbkdf2_sha256$1000000$yFTLDB4PA0NlwOYryiqsca$UtLjFrAOwSPzC8neuqUMLscfZ6kQIqSaxiFsQX4uajE=', '2026-06-19 09:12:22.818942-03', 'true', 'admin', '', '', 'admin@teste.com', 'true', 'true', '2026-05-19 15:33:35.801082-03', '2026-05-19 15:33:36.174943-03', '2026-06-18 07:56:52.972199-03', 'true', 1),


-- Copiando estrutura para tabela public.accounts_usuario_fazendas_permitidas
CREATE TABLE IF NOT EXISTS "accounts_usuario_fazendas_permitidas" (
	"id" INTEGER NOT NULL,
	"usuario_id" BIGINT NOT NULL,
	"fazenda_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("usuario_id", "fazenda_id"),
	CONSTRAINT "accounts_usuario_faz_fazenda_id_59b0eaf8_fk_core_faze" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "accounts_usuario_faz_usuario_id_de7f9297_fk_accounts_" FOREIGN KEY ("usuario_id") REFERENCES "accounts_usuario" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "accounts_usuario_fazendas_permitidas_usuario_id_de7f9297" ON "" ("usuario_id");
CREATE INDEX "accounts_usuario_fazendas_permitidas_fazenda_id_59b0eaf8" ON "" ("fazenda_id");;

-- Copiando dados para a tabela public.accounts_usuario_fazendas_permitidas: -1 rows
/*!40000 ALTER TABLE "accounts_usuario_fazendas_permitidas" DISABLE KEYS */;
/*!40000 ALTER TABLE "accounts_usuario_fazendas_permitidas" ENABLE KEYS */;

-- Copiando estrutura para tabela public.accounts_usuario_groups
CREATE TABLE IF NOT EXISTS "accounts_usuario_groups" (
	"id" INTEGER NOT NULL,
	"usuario_id" BIGINT NOT NULL,
	"group_id" INTEGER NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("usuario_id", "group_id"),
	CONSTRAINT "accounts_usuario_gro_usuario_id_8eb16911_fk_accounts_" FOREIGN KEY ("usuario_id") REFERENCES "accounts_usuario" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "accounts_usuario_groups_group_id_81d91a41_fk_auth_group_id" FOREIGN KEY ("group_id") REFERENCES "auth_group" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "accounts_usuario_groups_usuario_id_8eb16911" ON "" ("usuario_id");
CREATE INDEX "accounts_usuario_groups_group_id_81d91a41" ON "" ("group_id");;

-- Copiando dados para a tabela public.accounts_usuario_groups: 0 rows
/*!40000 ALTER TABLE "accounts_usuario_groups" DISABLE KEYS */;
/*!40000 ALTER TABLE "accounts_usuario_groups" ENABLE KEYS */;

-- Copiando estrutura para tabela public.accounts_usuario_user_permissions
CREATE TABLE IF NOT EXISTS "accounts_usuario_user_permissions" (
	"id" INTEGER NOT NULL,
	"usuario_id" BIGINT NOT NULL,
	"permission_id" INTEGER NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("usuario_id", "permission_id"),
	CONSTRAINT "accounts_usuario_use_permission_id_3de42c14_fk_auth_perm" FOREIGN KEY ("permission_id") REFERENCES "auth_permission" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "accounts_usuario_use_usuario_id_d048ad71_fk_accounts_" FOREIGN KEY ("usuario_id") REFERENCES "accounts_usuario" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "accounts_usuario_user_permissions_usuario_id_d048ad71" ON "" ("usuario_id");
CREATE INDEX "accounts_usuario_user_permissions_permission_id_3de42c14" ON "" ("permission_id");;

-- Copiando dados para a tabela public.accounts_usuario_user_permissions: -1 rows
/*!40000 ALTER TABLE "accounts_usuario_user_permissions" DISABLE KEYS */;
/*!40000 ALTER TABLE "accounts_usuario_user_permissions" ENABLE KEYS */;

-- Copiando estrutura para tabela public.auth_group
CREATE TABLE IF NOT EXISTS "auth_group" (
	"id" INTEGER NOT NULL,
	"name" VARCHAR(150) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("name")
)
CREATE INDEX "auth_group_name_a6ea08ec_like" ON "" ("name");;

-- Copiando dados para a tabela public.auth_group: -1 rows
/*!40000 ALTER TABLE "auth_group" DISABLE KEYS */;
/*!40000 ALTER TABLE "auth_group" ENABLE KEYS */;

-- Copiando estrutura para tabela public.auth_group_permissions
CREATE TABLE IF NOT EXISTS "auth_group_permissions" (
	"id" INTEGER NOT NULL,
	"group_id" INTEGER NOT NULL,
	"permission_id" INTEGER NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("group_id", "permission_id"),
	CONSTRAINT "auth_group_permissio_permission_id_84c5c92e_fk_auth_perm" FOREIGN KEY ("permission_id") REFERENCES "auth_permission" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "auth_group_permissions_group_id_b120cbf9_fk_auth_group_id" FOREIGN KEY ("group_id") REFERENCES "auth_group" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "auth_group_permissions_group_id_b120cbf9" ON "" ("group_id");
CREATE INDEX "auth_group_permissions_permission_id_84c5c92e" ON "" ("permission_id");;

-- Copiando dados para a tabela public.auth_group_permissions: -1 rows
/*!40000 ALTER TABLE "auth_group_permissions" DISABLE KEYS */;
/*!40000 ALTER TABLE "auth_group_permissions" ENABLE KEYS */;

-- Copiando estrutura para tabela public.auth_permission
CREATE TABLE IF NOT EXISTS "auth_permission" (
	"id" INTEGER NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"content_type_id" INTEGER NOT NULL,
	"codename" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("content_type_id", "codename"),
	CONSTRAINT "auth_permission_content_type_id_2f476e4b_fk_django_co" FOREIGN KEY ("content_type_id") REFERENCES "django_content_type" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "auth_permission_content_type_id_2f476e4b" ON "" ("content_type_id");;

-- Copiando dados para a tabela public.auth_permission: 232 rows
/*!40000 ALTER TABLE "auth_permission" DISABLE KEYS */;
INSERT INTO "auth_permission" ("id", "name", "content_type_id", "codename") VALUES
	(1, 'Can add log entry', 1, 'add_logentry'),
	(2, 'Can change log entry', 1, 'change_logentry'),
	(3, 'Can delete log entry', 1, 'delete_logentry'),
	(4, 'Can view log entry', 1, 'view_logentry'),
	(5, 'Can add permission', 2, 'add_permission'),
	(6, 'Can change permission', 2, 'change_permission'),
	(7, 'Can delete permission', 2, 'delete_permission'),
	(8, 'Can view permission', 2, 'view_permission'),
	(9, 'Can add group', 3, 'add_group'),
	(10, 'Can change group', 3, 'change_group'),
	(11, 'Can delete group', 3, 'delete_group'),
	(12, 'Can view group', 3, 'view_group'),
	(13, 'Can add content type', 4, 'add_contenttype'),
	(14, 'Can change content type', 4, 'change_contenttype'),
	(15, 'Can delete content type', 4, 'delete_contenttype'),
	(16, 'Can view content type', 4, 'view_contenttype'),
	(17, 'Can add session', 5, 'add_session'),
	(18, 'Can change session', 5, 'change_session'),
	(19, 'Can delete session', 5, 'delete_session'),
	(20, 'Can view session', 5, 'view_session'),
	(21, 'Can add perfil', 6, 'add_perfil'),
	(22, 'Can change perfil', 6, 'change_perfil'),
	(23, 'Can delete perfil', 6, 'delete_perfil'),
	(24, 'Can view perfil', 6, 'view_perfil'),
	(25, 'Can add user', 7, 'add_usuario'),
	(26, 'Can change user', 7, 'change_usuario'),
	(27, 'Can delete user', 7, 'delete_usuario'),
	(28, 'Can view user', 7, 'view_usuario'),
	(29, 'Can add proprietario', 8, 'add_proprietario'),
	(30, 'Can change proprietario', 8, 'change_proprietario'),
	(31, 'Can delete proprietario', 8, 'delete_proprietario'),
	(32, 'Can view proprietario', 8, 'view_proprietario'),
	(33, 'Can add fazenda', 9, 'add_fazenda'),
	(34, 'Can change fazenda', 9, 'change_fazenda'),
	(35, 'Can delete fazenda', 9, 'delete_fazenda'),
	(36, 'Can view fazenda', 9, 'view_fazenda'),
	(37, 'Can add safra', 10, 'add_safra'),
	(38, 'Can change safra', 10, 'change_safra'),
	(39, 'Can delete safra', 10, 'delete_safra'),
	(40, 'Can view safra', 10, 'view_safra'),
	(41, 'Can add atividade educampo', 11, 'add_atividadeeducampo'),
	(42, 'Can change atividade educampo', 11, 'change_atividadeeducampo'),
	(43, 'Can delete atividade educampo', 11, 'delete_atividadeeducampo'),
	(44, 'Can view atividade educampo', 11, 'view_atividadeeducampo'),
	(45, 'Can add classificacao produto', 12, 'add_classificacaoproduto'),
	(46, 'Can change classificacao produto', 12, 'change_classificacaoproduto'),
	(47, 'Can delete classificacao produto', 12, 'delete_classificacaoproduto'),
	(48, 'Can view classificacao produto', 12, 'view_classificacaoproduto'),
	(49, 'Can add conta gerencial', 13, 'add_contagerencial'),
	(50, 'Can change conta gerencial', 13, 'change_contagerencial'),
	(51, 'Can delete conta gerencial', 13, 'delete_contagerencial'),
	(52, 'Can view conta gerencial', 13, 'view_contagerencial'),
	(53, 'Can add criterio rateio', 14, 'add_criteriorateio'),
	(54, 'Can change criterio rateio', 14, 'change_criteriorateio'),
	(55, 'Can delete criterio rateio', 14, 'delete_criteriorateio'),
	(56, 'Can view criterio rateio', 14, 'view_criteriorateio'),
	(57, 'Can add cultura', 15, 'add_cultura'),
	(58, 'Can change cultura', 15, 'change_cultura'),
	(59, 'Can delete cultura', 15, 'delete_cultura'),
	(60, 'Can view cultura', 15, 'view_cultura'),
	(61, 'Can add grupo quimico', 16, 'add_grupoquimico'),
	(62, 'Can change grupo quimico', 16, 'change_grupoquimico'),
	(63, 'Can delete grupo quimico', 16, 'delete_grupoquimico'),
	(64, 'Can view grupo quimico', 16, 'view_grupoquimico'),
	(65, 'Can add grupo trabalhador', 17, 'add_grupotrabalhador'),
	(66, 'Can change grupo trabalhador', 17, 'change_grupotrabalhador'),
	(67, 'Can delete grupo trabalhador', 17, 'delete_grupotrabalhador'),
	(68, 'Can view grupo trabalhador', 17, 'view_grupotrabalhador'),
	(69, 'Can add modalidade', 18, 'add_modalidade'),
	(70, 'Can change modalidade', 18, 'change_modalidade'),
	(71, 'Can delete modalidade', 18, 'delete_modalidade'),
	(72, 'Can view modalidade', 18, 'view_modalidade'),
	(73, 'Can add resistencia ferrugem', 19, 'add_resistenciaferrugem'),
	(74, 'Can change resistencia ferrugem', 19, 'change_resistenciaferrugem'),
	(75, 'Can delete resistencia ferrugem', 19, 'delete_resistenciaferrugem'),
	(76, 'Can view resistencia ferrugem', 19, 'view_resistenciaferrugem'),
	(77, 'Can add status cultivo', 20, 'add_statuscultivo'),
	(78, 'Can change status cultivo', 20, 'change_statuscultivo'),
	(79, 'Can delete status cultivo', 20, 'delete_statuscultivo'),
	(80, 'Can view status cultivo', 20, 'view_statuscultivo'),
	(81, 'Can add status ordem servico', 21, 'add_statusordemservico'),
	(82, 'Can change status ordem servico', 21, 'change_statusordemservico'),
	(83, 'Can delete status ordem servico', 21, 'delete_statusordemservico'),
	(84, 'Can view status ordem servico', 21, 'view_statusordemservico'),
	(85, 'Can add tipo destinacao', 22, 'add_tipodestinacao'),
	(86, 'Can change tipo destinacao', 22, 'change_tipodestinacao'),
	(87, 'Can delete tipo destinacao', 22, 'delete_tipodestinacao'),
	(88, 'Can view tipo destinacao', 22, 'view_tipodestinacao'),
	(89, 'Can add tipo irrigacao', 23, 'add_tipoirrigacao'),
	(90, 'Can change tipo irrigacao', 23, 'change_tipoirrigacao'),
	(91, 'Can delete tipo irrigacao', 23, 'delete_tipoirrigacao'),
	(92, 'Can view tipo irrigacao', 23, 'view_tipoirrigacao'),
	(93, 'Can add tipo item', 24, 'add_tipoitem'),
	(94, 'Can change tipo item', 24, 'change_tipoitem'),
	(95, 'Can delete tipo item', 24, 'delete_tipoitem'),
	(96, 'Can view tipo item', 24, 'view_tipoitem'),
	(97, 'Can add tipo operacao', 25, 'add_tipooperacao'),
	(98, 'Can change tipo operacao', 25, 'change_tipooperacao'),
	(99, 'Can delete tipo operacao', 25, 'delete_tipooperacao'),
	(100, 'Can view tipo operacao', 25, 'view_tipooperacao'),
	(101, 'Can add tipo rateio', 26, 'add_tiporateio'),
	(102, 'Can change tipo rateio', 26, 'change_tiporateio'),
	(103, 'Can delete tipo rateio', 26, 'delete_tiporateio'),
	(104, 'Can view tipo rateio', 26, 'view_tiporateio'),
	(105, 'Can add unidade medida', 27, 'add_unidademedida'),
	(106, 'Can change unidade medida', 27, 'change_unidademedida'),
	(107, 'Can delete unidade medida', 27, 'delete_unidademedida'),
	(108, 'Can view unidade medida', 27, 'view_unidademedida'),
	(109, 'Can add Funcionário', 28, 'add_funcionario'),
	(110, 'Can change Funcionário', 28, 'change_funcionario'),
	(111, 'Can delete Funcionário', 28, 'delete_funcionario'),
	(112, 'Can view Funcionário', 28, 'view_funcionario'),
	(113, 'Can add Máquina', 29, 'add_maquina'),
	(114, 'Can change Máquina', 29, 'change_maquina'),
	(115, 'Can delete Máquina', 29, 'delete_maquina'),
	(116, 'Can view Máquina', 29, 'view_maquina'),
	(117, 'Can add Produto/Insumo', 30, 'add_produto'),
	(118, 'Can change Produto/Insumo', 30, 'change_produto'),
	(119, 'Can delete Produto/Insumo', 30, 'delete_produto'),
	(120, 'Can view Produto/Insumo', 30, 'view_produto'),
	(121, 'Can add Movimentação de Estoque', 31, 'add_estoquemovimento'),
	(122, 'Can change Movimentação de Estoque', 31, 'change_estoquemovimento'),
	(123, 'Can delete Movimentação de Estoque', 31, 'delete_estoquemovimento'),
	(124, 'Can view Movimentação de Estoque', 31, 'view_estoquemovimento'),
	(125, 'Can add Talhão', 32, 'add_talhao'),
	(126, 'Can change Talhão', 32, 'change_talhao'),
	(127, 'Can delete Talhão', 32, 'delete_talhao'),
	(128, 'Can view Talhão', 32, 'view_talhao'),
	(129, 'Can add Terceirizado', 33, 'add_terceirizado'),
	(130, 'Can change Terceirizado', 33, 'change_terceirizado'),
	(131, 'Can delete Terceirizado', 33, 'delete_terceirizado'),
	(132, 'Can view Terceirizado', 33, 'view_terceirizado'),
	(133, 'Can add Turma Terceirizada', 34, 'add_turmaterceirizada'),
	(134, 'Can change Turma Terceirizada', 34, 'change_turmaterceirizada'),
	(135, 'Can delete Turma Terceirizada', 34, 'delete_turmaterceirizada'),
	(136, 'Can view Turma Terceirizada', 34, 'view_turmaterceirizada'),
	(137, 'Can add Custo Mensal de Máquina', 35, 'add_customensalmaquina'),
	(138, 'Can change Custo Mensal de Máquina', 35, 'change_customensalmaquina'),
	(139, 'Can delete Custo Mensal de Máquina', 35, 'delete_customensalmaquina'),
	(140, 'Can view Custo Mensal de Máquina', 35, 'view_customensalmaquina'),
	(141, 'Can add Salário Mensal', 36, 'add_salariomensal'),
	(142, 'Can change Salário Mensal', 36, 'change_salariomensal'),
	(143, 'Can delete Salário Mensal', 36, 'delete_salariomensal'),
	(144, 'Can view Salário Mensal', 36, 'view_salariomensal'),
	(145, 'Can add Estimativa de Produção', 37, 'add_estimativaproducaotalhao'),
	(146, 'Can change Estimativa de Produção', 37, 'change_estimativaproducaotalhao'),
	(147, 'Can delete Estimativa de Produção', 37, 'delete_estimativaproducaotalhao'),
	(148, 'Can view Estimativa de Produção', 37, 'view_estimativaproducaotalhao'),
	(149, 'Can add Ordem de Serviço Planejada', 38, 'add_ordemservicoplanejada'),
	(150, 'Can change Ordem de Serviço Planejada', 38, 'change_ordemservicoplanejada'),
	(151, 'Can delete Ordem de Serviço Planejada', 38, 'delete_ordemservicoplanejada'),
	(152, 'Can view Ordem de Serviço Planejada', 38, 'view_ordemservicoplanejada'),
	(153, 'Can add Insumo da OS Planejada', 39, 'add_iteminsumoosplanejado'),
	(154, 'Can change Insumo da OS Planejada', 39, 'change_iteminsumoosplanejado'),
	(155, 'Can delete Insumo da OS Planejada', 39, 'delete_iteminsumoosplanejado'),
	(156, 'Can view Insumo da OS Planejada', 39, 'view_iteminsumoosplanejado'),
	(157, 'Can add Parâmetro Operacional de OS', 40, 'add_parametrooperacionalos'),
	(158, 'Can change Parâmetro Operacional de OS', 40, 'change_parametrooperacionalos'),
	(159, 'Can delete Parâmetro Operacional de OS', 40, 'delete_parametrooperacionalos'),
	(160, 'Can view Parâmetro Operacional de OS', 40, 'view_parametrooperacionalos'),
	(161, 'Can add Planejamento de Mão de Obra de Terceiros', 41, 'add_planejamentomaoobraterceiros'),
	(162, 'Can change Planejamento de Mão de Obra de Terceiros', 41, 'change_planejamentomaoobraterceiros'),
	(163, 'Can delete Planejamento de Mão de Obra de Terceiros', 41, 'delete_planejamentomaoobraterceiros'),
	(164, 'Can view Planejamento de Mão de Obra de Terceiros', 41, 'view_planejamentomaoobraterceiros'),
	(165, 'Can add Planejamento de Safra', 42, 'add_planejamentosafra'),
	(166, 'Can change Planejamento de Safra', 42, 'change_planejamentosafra'),
	(167, 'Can delete Planejamento de Safra', 42, 'delete_planejamentosafra'),
	(168, 'Can view Planejamento de Safra', 42, 'view_planejamentosafra'),
	(169, 'Can add Planejamento de Rateio', 43, 'add_planejamentorateio'),
	(170, 'Can change Planejamento de Rateio', 43, 'change_planejamentorateio'),
	(171, 'Can delete Planejamento de Rateio', 43, 'delete_planejamentorateio'),
	(172, 'Can view Planejamento de Rateio', 43, 'view_planejamentorateio'),
	(173, 'Can add Planejamento de Adubação', 44, 'add_planejamentoadubo'),
	(174, 'Can change Planejamento de Adubação', 44, 'change_planejamentoadubo'),
	(175, 'Can delete Planejamento de Adubação', 44, 'delete_planejamentoadubo'),
	(176, 'Can view Planejamento de Adubação', 44, 'view_planejamentoadubo'),
	(177, 'Can add Talhão da OS Planejada', 45, 'add_ordemservicoplanejadatalhao'),
	(178, 'Can change Talhão da OS Planejada', 45, 'change_ordemservicoplanejadatalhao'),
	(179, 'Can delete Talhão da OS Planejada', 45, 'delete_ordemservicoplanejadatalhao'),
	(180, 'Can view Talhão da OS Planejada', 45, 'view_ordemservicoplanejadatalhao'),
	(181, 'Can add Talhão da OS Real', 46, 'add_ordemservicotalhao'),
	(182, 'Can change Talhão da OS Real', 46, 'change_ordemservicotalhao'),
	(183, 'Can delete Talhão da OS Real', 46, 'delete_ordemservicotalhao'),
	(184, 'Can view Talhão da OS Real', 46, 'view_ordemservicotalhao'),
	(185, 'Can add Insumo da OS Real', 47, 'add_iteminsumoosreal'),
	(186, 'Can change Insumo da OS Real', 47, 'change_iteminsumoosreal'),
	(187, 'Can delete Insumo da OS Real', 47, 'delete_iteminsumoosreal'),
	(188, 'Can view Insumo da OS Real', 47, 'view_iteminsumoosreal'),
	(189, 'Can add Ordem de Serviço', 48, 'add_ordemservico'),
	(190, 'Can change Ordem de Serviço', 48, 'change_ordemservico'),
	(191, 'Can delete Ordem de Serviço', 48, 'delete_ordemservico'),
	(192, 'Can view Ordem de Serviço', 48, 'view_ordemservico'),
	(193, 'Can add Apontamento de Operação', 49, 'add_apontamentooperacao'),
	(194, 'Can change Apontamento de Operação', 49, 'change_apontamentooperacao'),
	(195, 'Can delete Apontamento de Operação', 49, 'delete_apontamentooperacao'),
	(196, 'Can view Apontamento de Operação', 49, 'view_apontamentooperacao'),
	(197, 'Can add Apontamento de Máquina', 50, 'add_apontamentomaquina'),
	(198, 'Can change Apontamento de Máquina', 50, 'change_apontamentomaquina'),
	(199, 'Can delete Apontamento de Máquina', 50, 'delete_apontamentomaquina'),
	(200, 'Can view Apontamento de Máquina', 50, 'view_apontamentomaquina'),
	(201, 'Can add Apontamento de Insumo', 51, 'add_apontamentoinsumo'),
	(202, 'Can change Apontamento de Insumo', 51, 'change_apontamentoinsumo'),
	(203, 'Can delete Apontamento de Insumo', 51, 'delete_apontamentoinsumo'),
	(204, 'Can view Apontamento de Insumo', 51, 'view_apontamentoinsumo'),
	(205, 'Can add Apontamento de Funcionário', 52, 'add_apontamentofuncionario'),
	(206, 'Can change Apontamento de Funcionário', 52, 'change_apontamentofuncionario'),
	(207, 'Can delete Apontamento de Funcionário', 52, 'delete_apontamentofuncionario'),
	(208, 'Can view Apontamento de Funcionário', 52, 'view_apontamentofuncionario'),
	(209, 'Can add Auditoria de Ordem de Serviço', 53, 'add_auditoriaordemservico'),
	(210, 'Can change Auditoria de Ordem de Serviço', 53, 'change_auditoriaordemservico'),
	(211, 'Can delete Auditoria de Ordem de Serviço', 53, 'delete_auditoriaordemservico'),
	(212, 'Can view Auditoria de Ordem de Serviço', 53, 'view_auditoriaordemservico'),
	(213, 'Can add Pedido de Compra', 54, 'add_pedidocompra'),
	(214, 'Can change Pedido de Compra', 54, 'change_pedidocompra'),
	(215, 'Can delete Pedido de Compra', 54, 'delete_pedidocompra'),
	(216, 'Can view Pedido de Compra', 54, 'view_pedidocompra'),
	(217, 'Can add Item do Pedido de Compra', 55, 'add_itempedidocompra'),
	(218, 'Can change Item do Pedido de Compra', 55, 'change_itempedidocompra'),
	(219, 'Can delete Item do Pedido de Compra', 55, 'delete_itempedidocompra'),
	(220, 'Can view Item do Pedido de Compra', 55, 'view_itempedidocompra'),
	(221, 'Can add Contas a Pagar', 56, 'add_contasapagar'),
	(222, 'Can change Contas a Pagar', 56, 'change_contasapagar'),
	(223, 'Can delete Contas a Pagar', 56, 'delete_contasapagar'),
	(224, 'Can view Contas a Pagar', 56, 'view_contasapagar'),
	(225, 'Can add Pedido de Venda', 57, 'add_pedidovenda'),
	(226, 'Can change Pedido de Venda', 57, 'change_pedidovenda'),
	(227, 'Can delete Pedido de Venda', 57, 'delete_pedidovenda'),
	(228, 'Can view Pedido de Venda', 57, 'view_pedidovenda'),
	(229, 'Can add Contas a Receber', 58, 'add_contasareceber'),
	(230, 'Can change Contas a Receber', 58, 'change_contasareceber'),
	(231, 'Can delete Contas a Receber', 58, 'delete_contasareceber'),
	(232, 'Can view Contas a Receber', 58, 'view_contasareceber'),
	(233, 'Can add tipo maquina', 59, 'add_tipomaquina'),
	(234, 'Can change tipo maquina', 59, 'change_tipomaquina'),
	(235, 'Can delete tipo maquina', 59, 'delete_tipomaquina'),
	(236, 'Can view tipo maquina', 59, 'view_tipomaquina'),
	(237, 'Can add Gasto de Rateio Realizado', 60, 'add_gastorateiorealizado'),
	(238, 'Can change Gasto de Rateio Realizado', 60, 'change_gastorateiorealizado'),
	(239, 'Can delete Gasto de Rateio Realizado', 60, 'delete_gastorateiorealizado'),
	(240, 'Can view Gasto de Rateio Realizado', 60, 'view_gastorateiorealizado'),
	(241, 'Can add Rateio por Talhão', 61, 'add_rateiotalhao'),
	(242, 'Can change Rateio por Talhão', 61, 'change_rateiotalhao'),
	(243, 'Can delete Rateio por Talhão', 61, 'delete_rateiotalhao'),
	(244, 'Can view Rateio por Talhão', 61, 'view_rateiotalhao'),
	(245, 'Can add Abastecimento de Máquina', 62, 'add_abastecimentomaquina'),
	(246, 'Can change Abastecimento de Máquina', 62, 'change_abastecimentomaquina'),
	(247, 'Can delete Abastecimento de Máquina', 62, 'delete_abastecimentomaquina'),
	(248, 'Can view Abastecimento de Máquina', 62, 'view_abastecimentomaquina'),
	(249, 'Can add Rateio Operacional', 63, 'add_rateiooperacional'),
	(250, 'Can change Rateio Operacional', 63, 'change_rateiooperacional'),
	(251, 'Can delete Rateio Operacional', 63, 'delete_rateiooperacional'),
	(252, 'Can view Rateio Operacional', 63, 'view_rateiooperacional'),
	(253, 'Can add Locação de Máquina', 64, 'add_locacaomaquina'),
	(254, 'Can change Locação de Máquina', 64, 'change_locacaomaquina'),
	(255, 'Can delete Locação de Máquina', 64, 'delete_locacaomaquina'),
	(256, 'Can view Locação de Máquina', 64, 'view_locacaomaquina'),
	(257, 'Can add Transferência de Ativo', 65, 'add_transferenciaativo'),
	(258, 'Can change Transferência de Ativo', 65, 'change_transferenciaativo'),
	(259, 'Can delete Transferência de Ativo', 65, 'delete_transferenciaativo'),
	(260, 'Can view Transferência de Ativo', 65, 'view_transferenciaativo');
/*!40000 ALTER TABLE "auth_permission" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_customensalmaquina
CREATE TABLE IF NOT EXISTS "cadastros_customensalmaquina" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"mes" INTEGER NOT NULL,
	"ano" INTEGER NOT NULL,
	"custo_oficina" NUMERIC(12,2) NOT NULL,
	"custo_abastecimento" NUMERIC(12,2) NOT NULL,
	"horas_trabalhadas" NUMERIC(10,2) NOT NULL,
	"safra_id" BIGINT NOT NULL,
	"maquina_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("maquina_id", "safra_id", "mes", "ano", "ativo"),
	CONSTRAINT "cadastros_customensa_maquina_id_4abf59e9_fk_cadastros" FOREIGN KEY ("maquina_id") REFERENCES "cadastros_maquina" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_customensalmaquina_safra_id_67a663af_fk_core_safra_id" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_customensalmaquina_safra_id_67a663af" ON "" ("safra_id");
CREATE INDEX "cadastros_customensalmaquina_maquina_id_4abf59e9" ON "" ("maquina_id");;

-- Copiando dados para a tabela public.cadastros_customensalmaquina: -1 rows
/*!40000 ALTER TABLE "cadastros_customensalmaquina" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_customensalmaquina" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_estimativaproducaotalhao
CREATE TABLE IF NOT EXISTS "cadastros_estimativaproducaotalhao" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"estimativa_sacas" NUMERIC(10,2) NOT NULL,
	"produtividade_esperada" NUMERIC(10,2) NOT NULL,
	"safra_id" BIGINT NOT NULL,
	"talhao_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("talhao_id", "safra_id", "ativo"),
	CONSTRAINT "cadastros_estimativa_safra_id_9c77400e_fk_core_safr" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_estimativa_talhao_id_c180754a_fk_cadastros" FOREIGN KEY ("talhao_id") REFERENCES "cadastros_talhao" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_estimativaproducaotalhao_safra_id_9c77400e" ON "" ("safra_id");
CREATE INDEX "cadastros_estimativaproducaotalhao_talhao_id_c180754a" ON "" ("talhao_id");;

-- Copiando dados para a tabela public.cadastros_estimativaproducaotalhao: -1 rows
/*!40000 ALTER TABLE "cadastros_estimativaproducaotalhao" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_estimativaproducaotalhao" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_estoquemovimento
CREATE TABLE IF NOT EXISTS "cadastros_estoquemovimento" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"tipo_movimento" VARCHAR(20) NOT NULL,
	"quantidade" NUMERIC(12,4) NOT NULL,
	"valor_unitario" NUMERIC(12,4) NOT NULL,
	"valor_total" NUMERIC(15,2) NOT NULL,
	"data_movimento" DATE NOT NULL,
	"documento_referencia" VARCHAR(100) NULL DEFAULT NULL,
	"observacao" TEXT NULL DEFAULT NULL,
	"destino_transferencia_id" BIGINT NULL DEFAULT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"origem_transferencia_id" BIGINT NULL DEFAULT NULL,
	"safra_id" BIGINT NOT NULL,
	"produto_id" BIGINT NOT NULL,
	"transferencia_vinculada_id" BIGINT NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "cadastros_estoquemov_destino_transferenci_b871f7b4_fk_core_faze" FOREIGN KEY ("destino_transferencia_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_estoquemov_fazenda_id_9c37c5c7_fk_core_faze" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_estoquemov_origem_transferencia_23d9d9c8_fk_core_faze" FOREIGN KEY ("origem_transferencia_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_estoquemov_produto_id_2967c2ca_fk_cadastros" FOREIGN KEY ("produto_id") REFERENCES "cadastros_produto" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_estoquemov_transferencia_vincul_5a5a6b7d_fk_cadastros" FOREIGN KEY ("transferencia_vinculada_id") REFERENCES "cadastros_estoquemovimento" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_estoquemovimento_safra_id_60819d63_fk_core_safra_id" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_estoquemovimento_destino_transferencia_id_b871f7b4" ON "" ("destino_transferencia_id");
CREATE INDEX "cadastros_estoquemovimento_fazenda_id_9c37c5c7" ON "" ("fazenda_id");
CREATE INDEX "cadastros_estoquemovimento_origem_transferencia_id_23d9d9c8" ON "" ("origem_transferencia_id");
CREATE INDEX "cadastros_estoquemovimento_safra_id_60819d63" ON "" ("safra_id");
CREATE INDEX "cadastros_estoquemovimento_produto_id_2967c2ca" ON "" ("produto_id");
CREATE INDEX "cadastros_estoquemovimento_transferencia_vinculada_id_5a5a6b7d" ON "" ("transferencia_vinculada_id");;

-- Copiando dados para a tabela public.cadastros_estoquemovimento: 0 rows
/*!40000 ALTER TABLE "cadastros_estoquemovimento" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_estoquemovimento" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_funcionario
CREATE TABLE IF NOT EXISTS "cadastros_funcionario" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(255) NOT NULL,
	"cpf" VARCHAR(20) NULL DEFAULT NULL,
	"cargo" VARCHAR(100) NULL DEFAULT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"grupo_trabalhador_id" BIGINT NOT NULL,
	"criar_usuario" BOOLEAN NOT NULL,
	"email" VARCHAR(255) NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "cadastros_funcionari_grupo_trabalhador_id_efbdb6c3_fk_referenci" FOREIGN KEY ("grupo_trabalhador_id") REFERENCES "referencias_grupotrabalhador" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_funcionario_fazenda_id_34e06d75_fk_core_fazenda_id" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_funcionario_fazenda_id_34e06d75" ON "" ("fazenda_id");
CREATE INDEX "cadastros_funcionario_grupo_trabalhador_id_efbdb6c3" ON "" ("grupo_trabalhador_id");;

-- Copiando dados para a tabela public.cadastros_funcionario: 0 rows
/*!40000 ALTER TABLE "cadastros_funcionario" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_funcionario" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_locacaomaquina
CREATE TABLE IF NOT EXISTS "cadastros_locacaomaquina" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"tipo_cobranca" VARCHAR(20) NOT NULL,
	"quantidade" NUMERIC(10,2) NOT NULL,
	"valor_unitario" NUMERIC(12,2) NOT NULL,
	"valor_total" NUMERIC(12,2) NOT NULL,
	"data_inicio" DATE NOT NULL,
	"data_fim" DATE NOT NULL,
	"data_vencimento" DATE NOT NULL,
	"observacao" TEXT NULL DEFAULT NULL,
	"contas_a_pagar_id" BIGINT NULL DEFAULT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"maquina_id" BIGINT NOT NULL,
	"safra_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "cadastros_locacaomaq_contas_a_pagar_id_6fce8ddb_fk_financeir" FOREIGN KEY ("contas_a_pagar_id") REFERENCES "financeiro_contasapagar" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_locacaomaq_maquina_id_c3cb5daa_fk_cadastros" FOREIGN KEY ("maquina_id") REFERENCES "cadastros_maquina" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_locacaomaquina_fazenda_id_1f398768_fk_core_fazenda_id" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_locacaomaquina_safra_id_534d51bb_fk_core_safra_id" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_locacaomaquina_contas_a_pagar_id_6fce8ddb" ON "" ("contas_a_pagar_id");
CREATE INDEX "cadastros_locacaomaquina_fazenda_id_1f398768" ON "" ("fazenda_id");
CREATE INDEX "cadastros_locacaomaquina_maquina_id_c3cb5daa" ON "" ("maquina_id");
CREATE INDEX "cadastros_locacaomaquina_safra_id_534d51bb" ON "" ("safra_id");;

-- Copiando dados para a tabela public.cadastros_locacaomaquina: -1 rows
/*!40000 ALTER TABLE "cadastros_locacaomaquina" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_locacaomaquina" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_maquina
CREATE TABLE IF NOT EXISTS "cadastros_maquina" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"codigo" VARCHAR(50) NOT NULL,
	"descricao" VARCHAR(150) NOT NULL,
	"marca" VARCHAR(100) NULL DEFAULT NULL,
	"modelo" VARCHAR(100) NULL DEFAULT NULL,
	"ano_fabricacao" INTEGER NULL DEFAULT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"tipo_id" BIGINT NOT NULL,
	"propria" BOOLEAN NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("fazenda_id", "codigo", "ativo"),
	CONSTRAINT "cadastros_maquina_fazenda_id_b4c5cd01_fk_core_fazenda_id" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_maquina_tipo_id_6505d386_fk_referenci" FOREIGN KEY ("tipo_id") REFERENCES "referencias_tipomaquina" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_maquina_fazenda_id_b4c5cd01" ON "" ("fazenda_id");
CREATE INDEX "cadastros_maquina_tipo_id_6505d386" ON "" ("tipo_id");;

-- Copiando dados para a tabela public.cadastros_maquina: 0 rows
/*!40000 ALTER TABLE "cadastros_maquina" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_maquina" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_produto
CREATE TABLE IF NOT EXISTS "cadastros_produto" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"codigo" VARCHAR(50) NULL DEFAULT NULL,
	"nome_comercial" VARCHAR(150) NOT NULL,
	"concentracao" VARCHAR(100) NULL DEFAULT NULL,
	"periodo_carencia" INTEGER NULL DEFAULT NULL,
	"alvo" VARCHAR(255) NULL DEFAULT NULL,
	"recomendacoes_tecnicas" TEXT NULL DEFAULT NULL,
	"classificacao_id" BIGINT NOT NULL,
	"grupo_quimico_id" BIGINT NULL DEFAULT NULL,
	"unidade_id" BIGINT NOT NULL,
	"fazenda_id" BIGINT NULL DEFAULT NULL,
	"safra_id" BIGINT NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("fazenda_id", "safra_id", "codigo", "ativo"),
	CONSTRAINT "cadastros_produto_classificacao_id_cf235458_fk_referenci" FOREIGN KEY ("classificacao_id") REFERENCES "referencias_classificacaoproduto" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_produto_fazenda_id_732b0976_fk_core_fazenda_id" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_produto_grupo_quimico_id_7cf881a0_fk_referenci" FOREIGN KEY ("grupo_quimico_id") REFERENCES "referencias_grupoquimico" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_produto_safra_id_aff5dffa_fk_core_safra_id" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_produto_unidade_id_135c5540_fk_referenci" FOREIGN KEY ("unidade_id") REFERENCES "referencias_unidademedida" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_produto_classificacao_id_cf235458" ON "" ("classificacao_id");
CREATE INDEX "cadastros_produto_grupo_quimico_id_7cf881a0" ON "" ("grupo_quimico_id");
CREATE INDEX "cadastros_produto_unidade_id_135c5540" ON "" ("unidade_id");
CREATE INDEX "cadastros_produto_fazenda_id_732b0976" ON "" ("fazenda_id");
CREATE INDEX "cadastros_produto_safra_id_aff5dffa" ON "" ("safra_id");;

-- Copiando dados para a tabela public.cadastros_produto: 0 rows
/*!40000 ALTER TABLE "cadastros_produto" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_produto" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_salariomensal
CREATE TABLE IF NOT EXISTS "cadastros_salariomensal" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"mes" INTEGER NOT NULL,
	"ano" INTEGER NOT NULL,
	"salario_base" NUMERIC(10,2) NOT NULL,
	"encargos" NUMERIC(10,2) NOT NULL,
	"beneficios" NUMERIC(10,2) NOT NULL,
	"funcionario_id" BIGINT NOT NULL,
	"safra_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("funcionario_id", "safra_id", "mes", "ano", "ativo"),
	CONSTRAINT "cadastros_salariomen_funcionario_id_6a8345f1_fk_cadastros" FOREIGN KEY ("funcionario_id") REFERENCES "cadastros_funcionario" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_salariomensal_safra_id_3fb37d19_fk_core_safra_id" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_salariomensal_funcionario_id_6a8345f1" ON "" ("funcionario_id");
CREATE INDEX "cadastros_salariomensal_safra_id_3fb37d19" ON "" ("safra_id");;

-- Copiando dados para a tabela public.cadastros_salariomensal: -1 rows
/*!40000 ALTER TABLE "cadastros_salariomensal" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_salariomensal" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_talhao
CREATE TABLE IF NOT EXISTS "cadastros_talhao" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"codigo" VARCHAR(50) NOT NULL,
	"nome" VARCHAR(150) NOT NULL,
	"area" NUMERIC(10,2) NOT NULL,
	"espacamento_rua" NUMERIC(5,2) NULL DEFAULT NULL,
	"espacamento_planta" NUMERIC(5,2) NULL DEFAULT NULL,
	"estande" INTEGER NULL DEFAULT NULL,
	"numero_plantas" INTEGER NULL DEFAULT NULL,
	"material_genetico" VARCHAR(150) NULL DEFAULT NULL,
	"cultura_id" BIGINT NOT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"resistencia_ferrugem_id" BIGINT NULL DEFAULT NULL,
	"status_cultivo_id" BIGINT NULL DEFAULT NULL,
	"tipo_irrigacao_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("fazenda_id", "codigo", "ativo"),
	CONSTRAINT "cadastros_talhao_cultura_id_99fea2ba_fk_referencias_cultura_id" FOREIGN KEY ("cultura_id") REFERENCES "referencias_cultura" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_talhao_fazenda_id_fafcc3f0_fk_core_fazenda_id" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_talhao_resistencia_ferrugem_98a1dc46_fk_referenci" FOREIGN KEY ("resistencia_ferrugem_id") REFERENCES "referencias_resistenciaferrugem" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_talhao_status_cultivo_id_4f0db640_fk_referenci" FOREIGN KEY ("status_cultivo_id") REFERENCES "referencias_statuscultivo" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_talhao_tipo_irrigacao_id_7b5f253e_fk_referenci" FOREIGN KEY ("tipo_irrigacao_id") REFERENCES "referencias_tipoirrigacao" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_talhao_cultura_id_99fea2ba" ON "" ("cultura_id");
CREATE INDEX "cadastros_talhao_fazenda_id_fafcc3f0" ON "" ("fazenda_id");
CREATE INDEX "cadastros_talhao_resistencia_ferrugem_id_98a1dc46" ON "" ("resistencia_ferrugem_id");
CREATE INDEX "cadastros_talhao_status_cultivo_id_4f0db640" ON "" ("status_cultivo_id");
CREATE INDEX "cadastros_talhao_tipo_irrigacao_id_7b5f253e" ON "" ("tipo_irrigacao_id");;

-- Copiando dados para a tabela public.cadastros_talhao: 0 rows
/*!40000 ALTER TABLE "cadastros_talhao" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_talhao" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_terceirizado
CREATE TABLE IF NOT EXISTS "cadastros_terceirizado" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(255) NOT NULL,
	"documento" VARCHAR(20) NULL DEFAULT NULL,
	"fazenda_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "cadastros_terceirizado_fazenda_id_f5185062_fk_core_fazenda_id" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_terceirizado_fazenda_id_f5185062" ON "" ("fazenda_id");;

-- Copiando dados para a tabela public.cadastros_terceirizado: -1 rows
/*!40000 ALTER TABLE "cadastros_terceirizado" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_terceirizado" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_transferenciaativo
CREATE TABLE IF NOT EXISTS "cadastros_transferenciaativo" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"tipo_ativo" VARCHAR(20) NOT NULL,
	"data_transferencia" DATE NOT NULL,
	"observacao" TEXT NULL DEFAULT NULL,
	"destino_id" BIGINT NOT NULL,
	"funcionario_id" BIGINT NULL DEFAULT NULL,
	"maquina_id" BIGINT NULL DEFAULT NULL,
	"origem_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "cadastros_transferen_destino_id_f0d777b8_fk_core_faze" FOREIGN KEY ("destino_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_transferen_funcionario_id_9b92625a_fk_cadastros" FOREIGN KEY ("funcionario_id") REFERENCES "cadastros_funcionario" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_transferen_maquina_id_997a5ab4_fk_cadastros" FOREIGN KEY ("maquina_id") REFERENCES "cadastros_maquina" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_transferen_origem_id_a6c06766_fk_core_faze" FOREIGN KEY ("origem_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_transferenciaativo_destino_id_f0d777b8" ON "" ("destino_id");
CREATE INDEX "cadastros_transferenciaativo_funcionario_id_9b92625a" ON "" ("funcionario_id");
CREATE INDEX "cadastros_transferenciaativo_maquina_id_997a5ab4" ON "" ("maquina_id");
CREATE INDEX "cadastros_transferenciaativo_origem_id_a6c06766" ON "" ("origem_id");;

-- Copiando dados para a tabela public.cadastros_transferenciaativo: -1 rows
/*!40000 ALTER TABLE "cadastros_transferenciaativo" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_transferenciaativo" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_turmaterceirizada
CREATE TABLE IF NOT EXISTS "cadastros_turmaterceirizada" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	"responsavel" VARCHAR(255) NULL DEFAULT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"qtd_pessoas" INTEGER NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "cadastros_turmaterce_fazenda_id_b3fb12ac_fk_core_faze" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_turmaterceirizada_fazenda_id_b3fb12ac" ON "" ("fazenda_id");;

-- Copiando dados para a tabela public.cadastros_turmaterceirizada: -1 rows
/*!40000 ALTER TABLE "cadastros_turmaterceirizada" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_turmaterceirizada" ENABLE KEYS */;

-- Copiando estrutura para tabela public.cadastros_turmaterceirizada_integrantes
CREATE TABLE IF NOT EXISTS "cadastros_turmaterceirizada_integrantes" (
	"id" INTEGER NOT NULL,
	"turmaterceirizada_id" BIGINT NOT NULL,
	"terceirizado_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("turmaterceirizada_id", "terceirizado_id"),
	CONSTRAINT "cadastros_turmaterce_terceirizado_id_d1638384_fk_cadastros" FOREIGN KEY ("terceirizado_id") REFERENCES "cadastros_terceirizado" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "cadastros_turmaterce_turmaterceirizada_id_bc2d1c58_fk_cadastros" FOREIGN KEY ("turmaterceirizada_id") REFERENCES "cadastros_turmaterceirizada" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "cadastros_turmaterceirizad_turmaterceirizada_id_bc2d1c58" ON "" ("turmaterceirizada_id");
CREATE INDEX "cadastros_turmaterceirizad_terceirizado_id_d1638384" ON "" ("terceirizado_id");;

-- Copiando dados para a tabela public.cadastros_turmaterceirizada_integrantes: -1 rows
/*!40000 ALTER TABLE "cadastros_turmaterceirizada_integrantes" DISABLE KEYS */;
/*!40000 ALTER TABLE "cadastros_turmaterceirizada_integrantes" ENABLE KEYS */;

-- Copiando estrutura para tabela public.core_fazenda
CREATE TABLE IF NOT EXISTS "core_fazenda" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(255) NOT NULL,
	"sigla" VARCHAR(10) NOT NULL,
	"proprietario_id" BIGINT NOT NULL,
	"cidade" VARCHAR(100) NULL DEFAULT NULL,
	"cnpj_ou_produtor" VARCHAR(50) NULL DEFAULT NULL,
	"endereco" VARCHAR(255) NULL DEFAULT NULL,
	"estado" VARCHAR(50) NULL DEFAULT NULL,
	"telefone" VARCHAR(20) NULL DEFAULT NULL,
	"cep" VARCHAR(10) NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "core_fazenda_proprietario_id_6acc8673_fk_core_proprietario_id" FOREIGN KEY ("proprietario_id") REFERENCES "core_proprietario" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "core_fazenda_proprietario_id_6acc8673" ON "" ("proprietario_id");;

-- Copiando dados para a tabela public.core_fazenda: 0 rows
/*!40000 ALTER TABLE "core_fazenda" DISABLE KEYS */;
/*!40000 ALTER TABLE "core_fazenda" ENABLE KEYS */;

-- Copiando estrutura para tabela public.core_proprietario
CREATE TABLE IF NOT EXISTS "core_proprietario" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(255) NOT NULL,
	"documento" VARCHAR(20) NULL DEFAULT NULL,
	"bairro" VARCHAR(100) NULL DEFAULT NULL,
	"celular" VARCHAR(20) NULL DEFAULT NULL,
	"cep" VARCHAR(10) NULL DEFAULT NULL,
	"cidade" VARCHAR(100) NULL DEFAULT NULL,
	"email" VARCHAR(255) NOT NULL,
	"endereco" VARCHAR(255) NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("documento"),
	UNIQUE ("email")
)
CREATE INDEX "core_proprietario_documento_97393a5e_like" ON "" ("documento");
CREATE INDEX "core_proprietario_email_243c8f4e_like" ON "" ("email");;

-- Copiando dados para a tabela public.core_proprietario: 0 rows
/*!40000 ALTER TABLE "core_proprietario" DISABLE KEYS */;
/*!40000 ALTER TABLE "core_proprietario" ENABLE KEYS */;

-- Copiando estrutura para tabela public.core_safra
CREATE TABLE IF NOT EXISTS "core_safra" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(50) NOT NULL,
	"data_inicio" DATE NOT NULL,
	"data_fim" DATE NOT NULL,
	"ativa" BOOLEAN NOT NULL,
	"fazenda_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "core_safra_fazenda_id_ab5ef5e1_fk_core_fazenda_id" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "core_safra_fazenda_id_ab5ef5e1" ON "" ("fazenda_id");;

-- Copiando dados para a tabela public.core_safra: 0 rows
/*!40000 ALTER TABLE "core_safra" DISABLE KEYS */;
/*!40000 ALTER TABLE "core_safra" ENABLE KEYS */;

-- Copiando estrutura para tabela public.django_admin_log
CREATE TABLE IF NOT EXISTS "django_admin_log" (
	"id" INTEGER NOT NULL,
	"action_time" TIMESTAMPTZ NOT NULL,
	"object_id" TEXT NULL DEFAULT NULL,
	"object_repr" VARCHAR(200) NOT NULL,
	"action_flag" SMALLINT NOT NULL,
	"change_message" TEXT NOT NULL,
	"content_type_id" INTEGER NULL DEFAULT NULL,
	"user_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "django_admin_log_content_type_id_c4bce8eb_fk_django_co" FOREIGN KEY ("content_type_id") REFERENCES "django_content_type" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "django_admin_log_user_id_c564eba6_fk_accounts_usuario_id" FOREIGN KEY ("user_id") REFERENCES "accounts_usuario" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "django_admin_log_action_flag_check" CHECK ((action_flag >= 0))
)
CREATE INDEX "django_admin_log_content_type_id_c4bce8eb" ON "" ("content_type_id");
CREATE INDEX "django_admin_log_user_id_c564eba6" ON "" ("user_id");;

-- Copiando dados para a tabela public.django_admin_log: 0 rows
/*!40000 ALTER TABLE "django_admin_log" DISABLE KEYS */;
/*!40000 ALTER TABLE "django_admin_log" ENABLE KEYS */;

-- Copiando estrutura para tabela public.django_content_type
CREATE TABLE IF NOT EXISTS "django_content_type" (
	"id" INTEGER NOT NULL,
	"app_label" VARCHAR(100) NOT NULL,
	"model" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("app_label", "model")
);

-- Copiando dados para a tabela public.django_content_type: 58 rows
/*!40000 ALTER TABLE "django_content_type" DISABLE KEYS */;
INSERT INTO "django_content_type" ("id", "app_label", "model") VALUES
	(1, 'admin', 'logentry'),
	(2, 'auth', 'permission'),
	(3, 'auth', 'group'),
	(4, 'contenttypes', 'contenttype'),
	(5, 'sessions', 'session'),
	(6, 'accounts', 'perfil'),
	(7, 'accounts', 'usuario'),
	(8, 'core', 'proprietario'),
	(9, 'core', 'fazenda'),
	(10, 'core', 'safra'),
	(11, 'referencias', 'atividadeeducampo'),
	(12, 'referencias', 'classificacaoproduto'),
	(13, 'referencias', 'contagerencial'),
	(14, 'referencias', 'criteriorateio'),
	(15, 'referencias', 'cultura'),
	(16, 'referencias', 'grupoquimico'),
	(17, 'referencias', 'grupotrabalhador'),
	(18, 'referencias', 'modalidade'),
	(19, 'referencias', 'resistenciaferrugem'),
	(20, 'referencias', 'statuscultivo'),
	(21, 'referencias', 'statusordemservico'),
	(22, 'referencias', 'tipodestinacao'),
	(23, 'referencias', 'tipoirrigacao'),
	(24, 'referencias', 'tipoitem'),
	(25, 'referencias', 'tipooperacao'),
	(26, 'referencias', 'tiporateio'),
	(27, 'referencias', 'unidademedida'),
	(28, 'cadastros', 'funcionario'),
	(29, 'cadastros', 'maquina'),
	(30, 'cadastros', 'produto'),
	(31, 'cadastros', 'estoquemovimento'),
	(32, 'cadastros', 'talhao'),
	(33, 'cadastros', 'terceirizado'),
	(34, 'cadastros', 'turmaterceirizada'),
	(35, 'cadastros', 'customensalmaquina'),
	(36, 'cadastros', 'salariomensal'),
	(37, 'cadastros', 'estimativaproducaotalhao'),
	(38, 'planejamento', 'ordemservicoplanejada'),
	(39, 'planejamento', 'iteminsumoosplanejado'),
	(40, 'planejamento', 'parametrooperacionalos'),
	(41, 'planejamento', 'planejamentomaoobraterceiros'),
	(42, 'planejamento', 'planejamentosafra'),
	(43, 'planejamento', 'planejamentorateio'),
	(44, 'planejamento', 'planejamentoadubo'),
	(45, 'planejamento', 'ordemservicoplanejadatalhao'),
	(46, 'operacoes', 'ordemservicotalhao'),
	(47, 'operacoes', 'iteminsumoosreal'),
	(48, 'operacoes', 'ordemservico'),
	(49, 'operacoes', 'apontamentooperacao'),
	(50, 'operacoes', 'apontamentomaquina'),
	(51, 'operacoes', 'apontamentoinsumo'),
	(52, 'operacoes', 'apontamentofuncionario'),
	(53, 'operacoes', 'auditoriaordemservico'),
	(54, 'financeiro', 'pedidocompra'),
	(55, 'financeiro', 'itempedidocompra'),
	(56, 'financeiro', 'contasapagar'),
	(57, 'financeiro', 'pedidovenda'),
	(58, 'financeiro', 'contasareceber'),
	(59, 'referencias', 'tipomaquina'),
	(60, 'operacoes', 'gastorateiorealizado'),
	(61, 'operacoes', 'rateiotalhao'),
	(62, 'operacoes', 'abastecimentomaquina'),
	(63, 'operacoes', 'rateiooperacional'),
	(64, 'cadastros', 'locacaomaquina'),
	(65, 'cadastros', 'transferenciaativo');
/*!40000 ALTER TABLE "django_content_type" ENABLE KEYS */;

-- Copiando estrutura para tabela public.django_migrations
CREATE TABLE IF NOT EXISTS "django_migrations" (
	"id" INTEGER NOT NULL,
	"app" VARCHAR(255) NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"applied" TIMESTAMPTZ NOT NULL,
	PRIMARY KEY ("id")
);

-- Copiando dados para a tabela public.django_migrations: -1 rows
/*!40000 ALTER TABLE "django_migrations" DISABLE KEYS */;
INSERT INTO "django_migrations" ("id", "app", "name", "applied") VALUES
	(1, 'core', '0001_initial', '2026-05-19 15:33:34.254571-03'),
	(2, 'contenttypes', '0001_initial', '2026-05-19 15:33:34.262339-03'),
	(3, 'contenttypes', '0002_remove_content_type_name', '2026-05-19 15:33:34.270153-03'),
	(4, 'auth', '0001_initial', '2026-05-19 15:33:34.295716-03'),
	(5, 'auth', '0002_alter_permission_name_max_length', '2026-05-19 15:33:34.300429-03'),
	(6, 'auth', '0003_alter_user_email_max_length', '2026-05-19 15:33:34.303573-03'),
	(7, 'auth', '0004_alter_user_username_opts', '2026-05-19 15:33:34.306689-03'),
	(8, 'auth', '0005_alter_user_last_login_null', '2026-05-19 15:33:34.309499-03'),
	(9, 'auth', '0006_require_contenttypes_0002', '2026-05-19 15:33:34.310249-03'),
	(10, 'auth', '0007_alter_validators_add_error_messages', '2026-05-19 15:33:34.313-03'),
	(11, 'auth', '0008_alter_user_username_max_length', '2026-05-19 15:33:34.31957-03'),
	(12, 'auth', '0009_alter_user_last_name_max_length', '2026-05-19 15:33:34.322815-03'),
	(13, 'auth', '0010_alter_group_name_max_length', '2026-05-19 15:33:34.335985-03'),
	(14, 'auth', '0011_update_proxy_permissions', '2026-05-19 15:33:34.340568-03'),
	(15, 'auth', '0012_alter_user_first_name_max_length', '2026-05-19 15:33:34.343902-03'),
	(16, 'accounts', '0001_initial', '2026-05-19 15:33:34.377777-03'),
	(17, 'accounts', '0002_usuario_fazendas_permitidas', '2026-05-19 15:33:34.395589-03'),
	(18, 'admin', '0001_initial', '2026-05-19 15:33:34.412608-03'),
	(19, 'admin', '0002_logentry_remove_auto_add', '2026-05-19 15:33:34.418923-03'),
	(20, 'admin', '0003_logentry_add_action_flag_choices', '2026-05-19 15:33:34.424859-03'),
	(21, 'referencias', '0001_initial', '2026-05-19 15:33:34.50483-03'),
	(22, 'core', '0002_proprietario_bairro_proprietario_celular_and_more', '2026-05-19 15:33:34.520295-03'),
	(23, 'cadastros', '0001_initial', '2026-05-19 15:33:34.7401-03'),
	(24, 'financeiro', '0001_initial', '2026-05-19 15:33:34.817315-03'),
	(25, 'financeiro', '0002_pedidovenda_contasareceber', '2026-05-19 15:33:34.87033-03'),
	(26, 'planejamento', '0001_initial', '2026-05-19 15:33:35.113192-03'),
	(27, 'operacoes', '0001_initial', '2026-05-19 15:33:35.185731-03'),
	(28, 'operacoes', '0002_initial', '2026-05-19 15:33:35.428127-03'),
	(29, 'operacoes', '0003_apontamentooperacao_apontamentomaquina_and_more', '2026-05-19 15:33:35.667744-03'),
	(30, 'sessions', '0001_initial', '2026-05-19 15:33:35.701078-03'),
	(31, 'cadastros', '0002_funcionario_criar_usuario_funcionario_email', '2026-06-02 09:23:02.141053-03'),
	(32, 'core', '0003_fazenda_cidade_fazenda_cnpj_ou_produtor_and_more', '2026-06-02 09:23:02.219872-03'),
	(33, 'cadastros', '0003_turmaterceirizada_qtd_pessoas', '2026-06-09 08:05:53.223658-03'),
	(34, 'core', '0004_fazenda_cep', '2026-06-09 08:05:53.249933-03'),
	(35, 'core', '0005_alter_proprietario_email', '2026-06-09 08:05:53.295611-03'),
	(36, 'referencias', '0002_tipomaquina', '2026-06-12 08:36:13.158537-03'),
	(37, 'cadastros', '0004_alter_maquina_tipo', '2026-06-12 08:36:13.274648-03'),
	(38, 'operacoes', '0004_abastecimentomaquina_gastorateiorealizado_and_more', '2026-06-17 10:01:32.649249-03'),
	(39, 'operacoes', '0005_rateiooperacional', '2026-06-18 07:56:41.290629-03'),
	(40, 'cadastros', '0005_produto_fazenda_produto_safra_alter_produto_codigo_and_more', '2026-06-19 09:25:14.237951-03'),
	(41, 'cadastros', '0006_estoquemovimento_transferencia_vinculada_and_more', '2026-06-22 07:55:21.294038-03');
/*!40000 ALTER TABLE "django_migrations" ENABLE KEYS */;

-- Copiando estrutura para tabela public.django_session
CREATE TABLE IF NOT EXISTS "django_session" (
	"session_key" VARCHAR(40) NOT NULL,
	"session_data" TEXT NOT NULL,
	"expire_date" TIMESTAMPTZ NOT NULL,
	PRIMARY KEY ("session_key")
)
CREATE INDEX "django_session_session_key_c0390e0f_like" ON "" ("session_key");
CREATE INDEX "django_session_expire_date_a5c62663" ON "" ("expire_date");;

-- Copiando dados para a tabela public.django_session: -1 rows
/*!40000 ALTER TABLE "django_session" DISABLE KEYS */;
INSERT INTO "django_session" ("session_key", "session_data", "expire_date") VALUES
	('jhlb0jvc8uhg8uqd1g3ilqish3b777ub', '.eJxVjMsKwjAQAP9lz1LyamJ7FDyKJ89ld7MhxT6gaU7iv4vQg15nhnnBgHXPQy2yDWOEHjScfhkhP2X5CmRe67KX5kCluc44TvftUWRbcJbbGmW6HP3fJGPJ0IM5O8YYiKLT5DhJy4aN04qUEasC6c5bq4N05JNl07pEKiQ0rdc-RQ_vDxOIOcA:1wZozh:3e6hmnf-xmMeG0GQuNnxjfceHSXBpDDbZRnvRyqNJ1A', '2026-07-01 09:03:45.474122-03'),
	('ktry3du9z6r4yclk0rkl4toyhq2j4m60', '.eJxVjMsKwjAQAP9lz1LyamJ7FDyKJ89ld7MhxT6gaU7iv4vQg15nhnnBgHXPQy2yDWOEHjScfhkhP2X5CmRe67KX5kCluc44TvftUWRbcJbbGmW6HP3fJGPJ0IM5O8YYiKLT5DhJy4aN04qUEasC6c5bq4N05JNl07pEKiQ0rdc-RQ_vDxOIOcA:1wZp0C:R7-yauQKfJmfbtUiRsKioAPMpOC3fTPY7fhAM70UGLE', '2026-07-01 09:04:16.314554-03'),
	('q0olguvs48ko2o3oddzmd1oaaw9f5589', '.eJxVjLsKwkAQAP9lawm3d7lLTCmkFCvrsC9JMA_IJZX47yKk0HZmmBd0tG99t2dbu0GhAYTTL2OSp81fQSLLPm-5OFAu2omG8bbes60zTXZd1MbL0f9Neso9NOBcJERMmErPzpPU5gOncA6sHKWUFMRhCExV8skwxurh1dVOVZEjwvsD3H844w:1waY4Z:xSNzHORkuVx9yO25QAMkH3Ze4Lmzbbv5infj3yAWC6Y', '2026-07-03 09:11:47.199522-03'),
	('qw9lxvthpb4rq7z4rtea52gyh7c1sdag', '.eJxVjMsKwjAQAP9lz1LyamJ7FDyKJ89ld7MhxT6gaU7iv4vQg15nhnnBgHXPQy2yDWOEHjScfhkhP2X5CmRe67KX5kCluc44TvftUWRbcJbbGmW6HP3fJGPJ0IM5O8YYiKLT5DhJy4aN04qUEasC6c5bq4N05JNl07pEKiQ0rdc-RQ_vDxOIOcA:1wZp1m:vIZdes0lC_vQH-jTP2TCRgGl7-QCXXddjzFjiofo1jM', '2026-07-01 09:05:54.774921-03'),
	('rc55psba56480i89lbykniqo7pfc53dl', '.eJxVjLsKwkAQAP9lawm3d7lLTCmkFCvrsC9JMA_IJZX47yKk0HZmmBd0tG99t2dbu0GhAYTTL2OSp81fQSLLPm-5OFAu2omG8bbes60zTXZd1MbL0f9Neso9NOBcJERMmErPzpPU5gOncA6sHKWUFMRhCExV8skwxurh1dVOVZEjwvsD3H844w:1waY58:ZB19h4nuA4QizSHm390LhAxD_CnYgNJYyIQnmdCY17U', '2026-07-03 09:12:22.819877-03');
/*!40000 ALTER TABLE "django_session" ENABLE KEYS */;

-- Copiando estrutura para tabela public.financeiro_contasapagar
CREATE TABLE IF NOT EXISTS "financeiro_contasapagar" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"descricao" VARCHAR(255) NOT NULL,
	"valor" NUMERIC(12,2) NOT NULL,
	"data_vencimento" DATE NOT NULL,
	"data_pagamento" DATE NULL DEFAULT NULL,
	"status" VARCHAR(30) NOT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"safra_id" BIGINT NOT NULL,
	"pedido_compra_id" BIGINT NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "financeiro_contasapa_pedido_compra_id_549f9191_fk_financeir" FOREIGN KEY ("pedido_compra_id") REFERENCES "financeiro_pedidocompra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "financeiro_contasapagar_fazenda_id_5bfc94c5_fk_core_fazenda_id" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "financeiro_contasapagar_safra_id_301e8eb2_fk_core_safra_id" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "financeiro_contasapagar_fazenda_id_5bfc94c5" ON "" ("fazenda_id");
CREATE INDEX "financeiro_contasapagar_safra_id_301e8eb2" ON "" ("safra_id");
CREATE INDEX "financeiro_contasapagar_pedido_compra_id_549f9191" ON "" ("pedido_compra_id");;

-- Copiando dados para a tabela public.financeiro_contasapagar: -1 rows
/*!40000 ALTER TABLE "financeiro_contasapagar" DISABLE KEYS */;
/*!40000 ALTER TABLE "financeiro_contasapagar" ENABLE KEYS */;

-- Copiando estrutura para tabela public.financeiro_contasareceber
CREATE TABLE IF NOT EXISTS "financeiro_contasareceber" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"descricao" VARCHAR(255) NOT NULL,
	"categoria_receita" VARCHAR(50) NOT NULL,
	"valor" NUMERIC(12,2) NOT NULL,
	"data_vencimento" DATE NOT NULL,
	"data_recebimento" DATE NULL DEFAULT NULL,
	"status" VARCHAR(30) NOT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"safra_id" BIGINT NOT NULL,
	"pedido_venda_id" BIGINT NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "financeiro_contasare_fazenda_id_6efa9b46_fk_core_faze" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "financeiro_contasare_pedido_venda_id_5baf87bc_fk_financeir" FOREIGN KEY ("pedido_venda_id") REFERENCES "financeiro_pedidovenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "financeiro_contasareceber_safra_id_d7e7e53d_fk_core_safra_id" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "financeiro_contasareceber_fazenda_id_6efa9b46" ON "" ("fazenda_id");
CREATE INDEX "financeiro_contasareceber_safra_id_d7e7e53d" ON "" ("safra_id");
CREATE INDEX "financeiro_contasareceber_pedido_venda_id_5baf87bc" ON "" ("pedido_venda_id");;

-- Copiando dados para a tabela public.financeiro_contasareceber: -1 rows
/*!40000 ALTER TABLE "financeiro_contasareceber" DISABLE KEYS */;
/*!40000 ALTER TABLE "financeiro_contasareceber" ENABLE KEYS */;

-- Copiando estrutura para tabela public.financeiro_itempedidocompra
CREATE TABLE IF NOT EXISTS "financeiro_itempedidocompra" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"quantidade" NUMERIC(12,4) NOT NULL,
	"valor_unitario" NUMERIC(12,4) NOT NULL,
	"valor_total" NUMERIC(15,2) NOT NULL,
	"produto_id" BIGINT NOT NULL,
	"pedido_compra_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "financeiro_itempedid_pedido_compra_id_b757909e_fk_financeir" FOREIGN KEY ("pedido_compra_id") REFERENCES "financeiro_pedidocompra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "financeiro_itempedid_produto_id_0eed8b67_fk_cadastros" FOREIGN KEY ("produto_id") REFERENCES "cadastros_produto" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "financeiro_itempedidocompra_produto_id_0eed8b67" ON "" ("produto_id");
CREATE INDEX "financeiro_itempedidocompra_pedido_compra_id_b757909e" ON "" ("pedido_compra_id");;

-- Copiando dados para a tabela public.financeiro_itempedidocompra: -1 rows
/*!40000 ALTER TABLE "financeiro_itempedidocompra" DISABLE KEYS */;
/*!40000 ALTER TABLE "financeiro_itempedidocompra" ENABLE KEYS */;

-- Copiando estrutura para tabela public.financeiro_pedidocompra
CREATE TABLE IF NOT EXISTS "financeiro_pedidocompra" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"fornecedor" VARCHAR(255) NOT NULL,
	"data_pedido" DATE NOT NULL,
	"valor_total" NUMERIC(12,2) NOT NULL,
	"status" VARCHAR(30) NOT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"safra_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "financeiro_pedidocompra_fazenda_id_147f37bf_fk_core_fazenda_id" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "financeiro_pedidocompra_safra_id_a52cafcf_fk_core_safra_id" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "financeiro_pedidocompra_fazenda_id_147f37bf" ON "" ("fazenda_id");
CREATE INDEX "financeiro_pedidocompra_safra_id_a52cafcf" ON "" ("safra_id");;

-- Copiando dados para a tabela public.financeiro_pedidocompra: -1 rows
/*!40000 ALTER TABLE "financeiro_pedidocompra" DISABLE KEYS */;
/*!40000 ALTER TABLE "financeiro_pedidocompra" ENABLE KEYS */;

-- Copiando estrutura para tabela public.financeiro_pedidovenda
CREATE TABLE IF NOT EXISTS "financeiro_pedidovenda" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"cliente" VARCHAR(255) NOT NULL,
	"data_venda" DATE NOT NULL,
	"tipo_produto" VARCHAR(50) NOT NULL,
	"quantidade_sacas" NUMERIC(12,2) NOT NULL,
	"preco_unitario" NUMERIC(12,2) NOT NULL,
	"valor_total" NUMERIC(15,2) NOT NULL,
	"status" VARCHAR(30) NOT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"safra_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "financeiro_pedidovenda_fazenda_id_ebd53fd6_fk_core_fazenda_id" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "financeiro_pedidovenda_safra_id_ba2e0afe_fk_core_safra_id" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "financeiro_pedidovenda_fazenda_id_ebd53fd6" ON "" ("fazenda_id");
CREATE INDEX "financeiro_pedidovenda_safra_id_ba2e0afe" ON "" ("safra_id");;

-- Copiando dados para a tabela public.financeiro_pedidovenda: -1 rows
/*!40000 ALTER TABLE "financeiro_pedidovenda" DISABLE KEYS */;
/*!40000 ALTER TABLE "financeiro_pedidovenda" ENABLE KEYS */;

-- Copiando estrutura para tabela public.operacoes_abastecimentomaquina
CREATE TABLE IF NOT EXISTS "operacoes_abastecimentomaquina" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"data_abastecimento" DATE NOT NULL,
	"quantidade" NUMERIC(10,2) NOT NULL,
	"valor_unitario" NUMERIC(10,4) NOT NULL,
	"valor_total" NUMERIC(12,2) NOT NULL,
	"horimetro" NUMERIC(10,2) NULL DEFAULT NULL,
	"observacao" TEXT NULL DEFAULT NULL,
	"combustivel_id" BIGINT NOT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"maquina_id" BIGINT NOT NULL,
	"safra_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "operacoes_abastecime_combustivel_id_f47b6abe_fk_cadastros" FOREIGN KEY ("combustivel_id") REFERENCES "cadastros_produto" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_abastecime_fazenda_id_7de39864_fk_core_faze" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_abastecime_maquina_id_cfd9c219_fk_cadastros" FOREIGN KEY ("maquina_id") REFERENCES "cadastros_maquina" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_abastecime_safra_id_ded8c5eb_fk_core_safr" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "operacoes_abastecimentomaquina_combustivel_id_f47b6abe" ON "" ("combustivel_id");
CREATE INDEX "operacoes_abastecimentomaquina_fazenda_id_7de39864" ON "" ("fazenda_id");
CREATE INDEX "operacoes_abastecimentomaquina_maquina_id_cfd9c219" ON "" ("maquina_id");
CREATE INDEX "operacoes_abastecimentomaquina_safra_id_ded8c5eb" ON "" ("safra_id");;

-- Copiando dados para a tabela public.operacoes_abastecimentomaquina: -1 rows
/*!40000 ALTER TABLE "operacoes_abastecimentomaquina" DISABLE KEYS */;
/*!40000 ALTER TABLE "operacoes_abastecimentomaquina" ENABLE KEYS */;

-- Copiando estrutura para tabela public.operacoes_apontamentofuncionario
CREATE TABLE IF NOT EXISTS "operacoes_apontamentofuncionario" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"horas_trabalhadas" NUMERIC(5,2) NULL DEFAULT NULL,
	"funcionario_id" BIGINT NOT NULL,
	"apontamento_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "operacoes_apontament_apontamento_id_7b919fcb_fk_operacoes" FOREIGN KEY ("apontamento_id") REFERENCES "operacoes_apontamentooperacao" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_apontament_funcionario_id_5b9abb05_fk_cadastros" FOREIGN KEY ("funcionario_id") REFERENCES "cadastros_funcionario" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "operacoes_apontamentofuncionario_funcionario_id_5b9abb05" ON "" ("funcionario_id");
CREATE INDEX "operacoes_apontamentofuncionario_apontamento_id_7b919fcb" ON "" ("apontamento_id");;

-- Copiando dados para a tabela public.operacoes_apontamentofuncionario: -1 rows
/*!40000 ALTER TABLE "operacoes_apontamentofuncionario" DISABLE KEYS */;
/*!40000 ALTER TABLE "operacoes_apontamentofuncionario" ENABLE KEYS */;

-- Copiando estrutura para tabela public.operacoes_apontamentoinsumo
CREATE TABLE IF NOT EXISTS "operacoes_apontamentoinsumo" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"quantidade_total" NUMERIC(12,4) NOT NULL,
	"dose_realizada" NUMERIC(10,4) NULL DEFAULT NULL,
	"produto_id" BIGINT NOT NULL,
	"apontamento_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "operacoes_apontament_apontamento_id_a9663195_fk_operacoes" FOREIGN KEY ("apontamento_id") REFERENCES "operacoes_apontamentooperacao" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_apontament_produto_id_6e28b5e7_fk_cadastros" FOREIGN KEY ("produto_id") REFERENCES "cadastros_produto" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "operacoes_apontamentoinsumo_produto_id_6e28b5e7" ON "" ("produto_id");
CREATE INDEX "operacoes_apontamentoinsumo_apontamento_id_a9663195" ON "" ("apontamento_id");;

-- Copiando dados para a tabela public.operacoes_apontamentoinsumo: -1 rows
/*!40000 ALTER TABLE "operacoes_apontamentoinsumo" DISABLE KEYS */;
/*!40000 ALTER TABLE "operacoes_apontamentoinsumo" ENABLE KEYS */;

-- Copiando estrutura para tabela public.operacoes_apontamentomaquina
CREATE TABLE IF NOT EXISTS "operacoes_apontamentomaquina" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"horimetro_inicial" NUMERIC(10,2) NULL DEFAULT NULL,
	"horimetro_final" NUMERIC(10,2) NULL DEFAULT NULL,
	"maquina_id" BIGINT NOT NULL,
	"apontamento_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "operacoes_apontament_apontamento_id_7128c1db_fk_operacoes" FOREIGN KEY ("apontamento_id") REFERENCES "operacoes_apontamentooperacao" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_apontament_maquina_id_1723e497_fk_cadastros" FOREIGN KEY ("maquina_id") REFERENCES "cadastros_maquina" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "operacoes_apontamentomaquina_maquina_id_1723e497" ON "" ("maquina_id");
CREATE INDEX "operacoes_apontamentomaquina_apontamento_id_7128c1db" ON "" ("apontamento_id");;

-- Copiando dados para a tabela public.operacoes_apontamentomaquina: -1 rows
/*!40000 ALTER TABLE "operacoes_apontamentomaquina" DISABLE KEYS */;
/*!40000 ALTER TABLE "operacoes_apontamentomaquina" ENABLE KEYS */;

-- Copiando estrutura para tabela public.operacoes_apontamentooperacao
CREATE TABLE IF NOT EXISTS "operacoes_apontamentooperacao" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"data_apontamento" DATE NOT NULL,
	"clima" VARCHAR(50) NULL DEFAULT NULL,
	"observacao" TEXT NULL DEFAULT NULL,
	"ordem_servico_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "operacoes_apontament_ordem_servico_id_ba985a65_fk_operacoes" FOREIGN KEY ("ordem_servico_id") REFERENCES "operacoes_ordemservico" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "operacoes_apontamentooperacao_ordem_servico_id_ba985a65" ON "" ("ordem_servico_id");;

-- Copiando dados para a tabela public.operacoes_apontamentooperacao: -1 rows
/*!40000 ALTER TABLE "operacoes_apontamentooperacao" DISABLE KEYS */;
/*!40000 ALTER TABLE "operacoes_apontamentooperacao" ENABLE KEYS */;

-- Copiando estrutura para tabela public.operacoes_auditoriaordemservico
CREATE TABLE IF NOT EXISTS "operacoes_auditoriaordemservico" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"tipo_desvio" VARCHAR(50) NOT NULL,
	"descricao_desvio" TEXT NOT NULL,
	"status" VARCHAR(30) NOT NULL,
	"ordem_servico_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "operacoes_auditoriao_ordem_servico_id_2f4351de_fk_operacoes" FOREIGN KEY ("ordem_servico_id") REFERENCES "operacoes_ordemservico" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "operacoes_auditoriaordemservico_ordem_servico_id_2f4351de" ON "" ("ordem_servico_id");;

-- Copiando dados para a tabela public.operacoes_auditoriaordemservico: -1 rows
/*!40000 ALTER TABLE "operacoes_auditoriaordemservico" DISABLE KEYS */;
/*!40000 ALTER TABLE "operacoes_auditoriaordemservico" ENABLE KEYS */;

-- Copiando estrutura para tabela public.operacoes_gastorateiorealizado
CREATE TABLE IF NOT EXISTS "operacoes_gastorateiorealizado" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"valor" NUMERIC(12,2) NOT NULL,
	"data_gasto" DATE NOT NULL,
	"observacao" TEXT NULL DEFAULT NULL,
	"conta_gerencial_id" BIGINT NOT NULL,
	"criterio_rateio_id" BIGINT NOT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"safra_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "operacoes_gastoratei_conta_gerencial_id_51c7b451_fk_referenci" FOREIGN KEY ("conta_gerencial_id") REFERENCES "referencias_contagerencial" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_gastoratei_criterio_rateio_id_c38da0cf_fk_referenci" FOREIGN KEY ("criterio_rateio_id") REFERENCES "referencias_criteriorateio" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_gastoratei_fazenda_id_5ff22c10_fk_core_faze" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_gastoratei_safra_id_64b074d1_fk_core_safr" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "operacoes_gastorateiorealizado_conta_gerencial_id_51c7b451" ON "" ("conta_gerencial_id");
CREATE INDEX "operacoes_gastorateiorealizado_criterio_rateio_id_c38da0cf" ON "" ("criterio_rateio_id");
CREATE INDEX "operacoes_gastorateiorealizado_fazenda_id_5ff22c10" ON "" ("fazenda_id");
CREATE INDEX "operacoes_gastorateiorealizado_safra_id_64b074d1" ON "" ("safra_id");;

-- Copiando dados para a tabela public.operacoes_gastorateiorealizado: -1 rows
/*!40000 ALTER TABLE "operacoes_gastorateiorealizado" DISABLE KEYS */;
/*!40000 ALTER TABLE "operacoes_gastorateiorealizado" ENABLE KEYS */;

-- Copiando estrutura para tabela public.operacoes_iteminsumoosreal
CREATE TABLE IF NOT EXISTS "operacoes_iteminsumoosreal" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"dose_planejada" NUMERIC(10,4) NULL DEFAULT NULL,
	"quantidade_planejada" NUMERIC(12,4) NULL DEFAULT NULL,
	"dose_real" NUMERIC(10,4) NULL DEFAULT NULL,
	"quantidade_real" NUMERIC(12,4) NULL DEFAULT NULL,
	"produto_id" BIGINT NOT NULL,
	"ordem_servico_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "operacoes_iteminsumo_ordem_servico_id_3e74d312_fk_operacoes" FOREIGN KEY ("ordem_servico_id") REFERENCES "operacoes_ordemservico" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_iteminsumo_produto_id_417b0681_fk_cadastros" FOREIGN KEY ("produto_id") REFERENCES "cadastros_produto" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "operacoes_iteminsumoosreal_produto_id_417b0681" ON "" ("produto_id");
CREATE INDEX "operacoes_iteminsumoosreal_ordem_servico_id_3e74d312" ON "" ("ordem_servico_id");;

-- Copiando dados para a tabela public.operacoes_iteminsumoosreal: -1 rows
/*!40000 ALTER TABLE "operacoes_iteminsumoosreal" DISABLE KEYS */;
/*!40000 ALTER TABLE "operacoes_iteminsumoosreal" ENABLE KEYS */;

-- Copiando estrutura para tabela public.operacoes_ordemservico
CREATE TABLE IF NOT EXISTS "operacoes_ordemservico" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"data_inicio_real" DATE NULL DEFAULT NULL,
	"data_fim_real" DATE NULL DEFAULT NULL,
	"data_inicio_planejada" DATE NOT NULL,
	"data_fim_planejada" DATE NOT NULL,
	"status" VARCHAR(30) NOT NULL,
	"observacao" TEXT NULL DEFAULT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"origem_planejada_id" BIGINT NULL DEFAULT NULL,
	"safra_id" BIGINT NOT NULL,
	"tipo_operacao_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "operacoes_ordemservi_origem_planejada_id_0757aa17_fk_planejame" FOREIGN KEY ("origem_planejada_id") REFERENCES "planejamento_ordemservicoplanejada" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_ordemservi_tipo_operacao_id_43bef32b_fk_referenci" FOREIGN KEY ("tipo_operacao_id") REFERENCES "referencias_tipooperacao" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_ordemservico_fazenda_id_18792fc3_fk_core_fazenda_id" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_ordemservico_safra_id_8f6539da_fk_core_safra_id" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "operacoes_ordemservico_fazenda_id_18792fc3" ON "" ("fazenda_id");
CREATE INDEX "operacoes_ordemservico_origem_planejada_id_0757aa17" ON "" ("origem_planejada_id");
CREATE INDEX "operacoes_ordemservico_safra_id_8f6539da" ON "" ("safra_id");
CREATE INDEX "operacoes_ordemservico_tipo_operacao_id_43bef32b" ON "" ("tipo_operacao_id");;

-- Copiando dados para a tabela public.operacoes_ordemservico: -1 rows
/*!40000 ALTER TABLE "operacoes_ordemservico" DISABLE KEYS */;
/*!40000 ALTER TABLE "operacoes_ordemservico" ENABLE KEYS */;

-- Copiando estrutura para tabela public.operacoes_ordemservicotalhao
CREATE TABLE IF NOT EXISTS "operacoes_ordemservicotalhao" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"ordem_servico_id" BIGINT NOT NULL,
	"talhao_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("ordem_servico_id", "talhao_id", "ativo"),
	CONSTRAINT "operacoes_ordemservi_ordem_servico_id_7a5d27d5_fk_operacoes" FOREIGN KEY ("ordem_servico_id") REFERENCES "operacoes_ordemservico" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_ordemservi_talhao_id_d1a9faea_fk_cadastros" FOREIGN KEY ("talhao_id") REFERENCES "cadastros_talhao" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "operacoes_ordemservicotalhao_ordem_servico_id_7a5d27d5" ON "" ("ordem_servico_id");
CREATE INDEX "operacoes_ordemservicotalhao_talhao_id_d1a9faea" ON "" ("talhao_id");;

-- Copiando dados para a tabela public.operacoes_ordemservicotalhao: -1 rows
/*!40000 ALTER TABLE "operacoes_ordemservicotalhao" DISABLE KEYS */;
/*!40000 ALTER TABLE "operacoes_ordemservicotalhao" ENABLE KEYS */;

-- Copiando estrutura para tabela public.operacoes_rateiooperacional
CREATE TABLE IF NOT EXISTS "operacoes_rateiooperacional" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"data" DATE NOT NULL,
	"descricao_plan" VARCHAR(255) NULL DEFAULT NULL,
	"horas_homem_plan" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_hora_homem_plan" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_total_homem_plan" NUMERIC(15,2) NULL DEFAULT NULL,
	"horas_maq_plan" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_hora_maq_plan" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_total_maq_plan" NUMERIC(15,2) NULL DEFAULT NULL,
	"diesel_gasto_plan" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_diesel_plan" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_total_diesel_plan" NUMERIC(15,2) NULL DEFAULT NULL,
	"qtd_plan" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_unitario_plan" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_total_plan" NUMERIC(15,2) NULL DEFAULT NULL,
	"descricao_real" VARCHAR(255) NULL DEFAULT NULL,
	"horas_homem_real" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_hora_homem_real" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_total_homem_real" NUMERIC(15,2) NULL DEFAULT NULL,
	"horas_maq_real" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_hora_trator_real" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_hora_implemento_real" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_total_maq_real" NUMERIC(15,2) NULL DEFAULT NULL,
	"diesel_gasto_real" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_diesel_real" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_total_diesel_real" NUMERIC(15,2) NULL DEFAULT NULL,
	"qtd_real" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_unitario_real" NUMERIC(12,2) NULL DEFAULT NULL,
	"valor_total_real" NUMERIC(15,2) NULL DEFAULT NULL,
	"atividade_educampo_id" BIGINT NOT NULL,
	"combustivel_plan_id" BIGINT NULL DEFAULT NULL,
	"combustivel_real_id" BIGINT NULL DEFAULT NULL,
	"fazenda_rateio_id" BIGINT NULL DEFAULT NULL,
	"funcionario_plan_id" BIGINT NULL DEFAULT NULL,
	"funcionario_real_id" BIGINT NULL DEFAULT NULL,
	"implemento_plan_id" BIGINT NULL DEFAULT NULL,
	"implemento_real_id" BIGINT NULL DEFAULT NULL,
	"safra_id" BIGINT NOT NULL,
	"trator_plan_id" BIGINT NULL DEFAULT NULL,
	"trator_real_id" BIGINT NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "operacoes_rateiooper_atividade_educampo_i_98e7f19c_fk_referenci" FOREIGN KEY ("atividade_educampo_id") REFERENCES "referencias_atividadeeducampo" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_rateiooper_combustivel_plan_id_17104984_fk_cadastros" FOREIGN KEY ("combustivel_plan_id") REFERENCES "cadastros_produto" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_rateiooper_combustivel_real_id_5a02b034_fk_cadastros" FOREIGN KEY ("combustivel_real_id") REFERENCES "cadastros_produto" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_rateiooper_fazenda_rateio_id_fb6f9034_fk_core_faze" FOREIGN KEY ("fazenda_rateio_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_rateiooper_funcionario_plan_id_1abb4d0a_fk_cadastros" FOREIGN KEY ("funcionario_plan_id") REFERENCES "cadastros_funcionario" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_rateiooper_funcionario_real_id_057a6af1_fk_cadastros" FOREIGN KEY ("funcionario_real_id") REFERENCES "cadastros_funcionario" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_rateiooper_implemento_plan_id_68656252_fk_cadastros" FOREIGN KEY ("implemento_plan_id") REFERENCES "cadastros_maquina" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_rateiooper_implemento_real_id_fec062ba_fk_cadastros" FOREIGN KEY ("implemento_real_id") REFERENCES "cadastros_maquina" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_rateiooper_trator_plan_id_9e70d4d0_fk_cadastros" FOREIGN KEY ("trator_plan_id") REFERENCES "cadastros_maquina" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_rateiooper_trator_real_id_79f91322_fk_cadastros" FOREIGN KEY ("trator_real_id") REFERENCES "cadastros_maquina" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_rateiooperacional_safra_id_d83e043a_fk_core_safra_id" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "operacoes_rateiooperacional_atividade_educampo_id_98e7f19c" ON "" ("atividade_educampo_id");
CREATE INDEX "operacoes_rateiooperacional_combustivel_plan_id_17104984" ON "" ("combustivel_plan_id");
CREATE INDEX "operacoes_rateiooperacional_combustivel_real_id_5a02b034" ON "" ("combustivel_real_id");
CREATE INDEX "operacoes_rateiooperacional_fazenda_rateio_id_fb6f9034" ON "" ("fazenda_rateio_id");
CREATE INDEX "operacoes_rateiooperacional_funcionario_plan_id_1abb4d0a" ON "" ("funcionario_plan_id");
CREATE INDEX "operacoes_rateiooperacional_funcionario_real_id_057a6af1" ON "" ("funcionario_real_id");
CREATE INDEX "operacoes_rateiooperacional_implemento_plan_id_68656252" ON "" ("implemento_plan_id");
CREATE INDEX "operacoes_rateiooperacional_implemento_real_id_fec062ba" ON "" ("implemento_real_id");
CREATE INDEX "operacoes_rateiooperacional_safra_id_d83e043a" ON "" ("safra_id");
CREATE INDEX "operacoes_rateiooperacional_trator_plan_id_9e70d4d0" ON "" ("trator_plan_id");
CREATE INDEX "operacoes_rateiooperacional_trator_real_id_79f91322" ON "" ("trator_real_id");;

-- Copiando dados para a tabela public.operacoes_rateiooperacional: -1 rows
/*!40000 ALTER TABLE "operacoes_rateiooperacional" DISABLE KEYS */;
/*!40000 ALTER TABLE "operacoes_rateiooperacional" ENABLE KEYS */;

-- Copiando estrutura para tabela public.operacoes_rateiotalhao
CREATE TABLE IF NOT EXISTS "operacoes_rateiotalhao" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"valor" NUMERIC(12,2) NOT NULL,
	"percentual" NUMERIC(5,2) NOT NULL,
	"gasto_rateio_id" BIGINT NOT NULL,
	"talhao_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("gasto_rateio_id", "talhao_id", "ativo"),
	CONSTRAINT "operacoes_rateiotalh_gasto_rateio_id_58ea5079_fk_operacoes" FOREIGN KEY ("gasto_rateio_id") REFERENCES "operacoes_gastorateiorealizado" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "operacoes_rateiotalh_talhao_id_be750efd_fk_cadastros" FOREIGN KEY ("talhao_id") REFERENCES "cadastros_talhao" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "operacoes_rateiotalhao_gasto_rateio_id_58ea5079" ON "" ("gasto_rateio_id");
CREATE INDEX "operacoes_rateiotalhao_talhao_id_be750efd" ON "" ("talhao_id");;

-- Copiando dados para a tabela public.operacoes_rateiotalhao: -1 rows
/*!40000 ALTER TABLE "operacoes_rateiotalhao" DISABLE KEYS */;
/*!40000 ALTER TABLE "operacoes_rateiotalhao" ENABLE KEYS */;

-- Copiando estrutura para tabela public.planejamento_iteminsumoosplanejado
CREATE TABLE IF NOT EXISTS "planejamento_iteminsumoosplanejado" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"dose_planejada" NUMERIC(10,4) NOT NULL,
	"quantidade_planejada" NUMERIC(12,4) NOT NULL,
	"produto_id" BIGINT NOT NULL,
	"ordem_servico_planejada_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "planejamento_itemins_ordem_servico_planej_4d1ff757_fk_planejame" FOREIGN KEY ("ordem_servico_planejada_id") REFERENCES "planejamento_ordemservicoplanejada" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "planejamento_itemins_produto_id_cb502970_fk_cadastros" FOREIGN KEY ("produto_id") REFERENCES "cadastros_produto" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "planejamento_iteminsumoosplanejado_produto_id_cb502970" ON "" ("produto_id");
CREATE INDEX "planejamento_iteminsumoosp_ordem_servico_planejada_id_4d1ff757" ON "" ("ordem_servico_planejada_id");;

-- Copiando dados para a tabela public.planejamento_iteminsumoosplanejado: -1 rows
/*!40000 ALTER TABLE "planejamento_iteminsumoosplanejado" DISABLE KEYS */;
/*!40000 ALTER TABLE "planejamento_iteminsumoosplanejado" ENABLE KEYS */;

-- Copiando estrutura para tabela public.planejamento_ordemservicoplanejada
CREATE TABLE IF NOT EXISTS "planejamento_ordemservicoplanejada" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"data_inicio_planejada" DATE NOT NULL,
	"data_fim_planejada" DATE NOT NULL,
	"observacao" TEXT NULL DEFAULT NULL,
	"tipo_operacao_id" BIGINT NOT NULL,
	"planejamento_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "planejamento_ordemse_planejamento_id_672bf666_fk_planejame" FOREIGN KEY ("planejamento_id") REFERENCES "planejamento_planejamentosafra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "planejamento_ordemse_tipo_operacao_id_57ddc69e_fk_referenci" FOREIGN KEY ("tipo_operacao_id") REFERENCES "referencias_tipooperacao" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "planejamento_ordemservicoplanejada_tipo_operacao_id_57ddc69e" ON "" ("tipo_operacao_id");
CREATE INDEX "planejamento_ordemservicoplanejada_planejamento_id_672bf666" ON "" ("planejamento_id");;

-- Copiando dados para a tabela public.planejamento_ordemservicoplanejada: -1 rows
/*!40000 ALTER TABLE "planejamento_ordemservicoplanejada" DISABLE KEYS */;
/*!40000 ALTER TABLE "planejamento_ordemservicoplanejada" ENABLE KEYS */;

-- Copiando estrutura para tabela public.planejamento_ordemservicoplanejadatalhao
CREATE TABLE IF NOT EXISTS "planejamento_ordemservicoplanejadatalhao" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"ordem_servico_planejada_id" BIGINT NOT NULL,
	"talhao_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("ordem_servico_planejada_id", "talhao_id", "ativo"),
	CONSTRAINT "planejamento_ordemse_ordem_servico_planej_8ddd38ee_fk_planejame" FOREIGN KEY ("ordem_servico_planejada_id") REFERENCES "planejamento_ordemservicoplanejada" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "planejamento_ordemse_talhao_id_d44b2a76_fk_cadastros" FOREIGN KEY ("talhao_id") REFERENCES "cadastros_talhao" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "planejamento_ordemservicop_ordem_servico_planejada_id_8ddd38ee" ON "" ("ordem_servico_planejada_id");
CREATE INDEX "planejamento_ordemservicoplanejadatalhao_talhao_id_d44b2a76" ON "" ("talhao_id");;

-- Copiando dados para a tabela public.planejamento_ordemservicoplanejadatalhao: -1 rows
/*!40000 ALTER TABLE "planejamento_ordemservicoplanejadatalhao" DISABLE KEYS */;
/*!40000 ALTER TABLE "planejamento_ordemservicoplanejadatalhao" ENABLE KEYS */;

-- Copiando estrutura para tabela public.planejamento_parametrooperacionalos
CREATE TABLE IF NOT EXISTS "planejamento_parametrooperacionalos" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"velocidade_planejada" NUMERIC(5,2) NULL DEFAULT NULL,
	"pressao_planejada" NUMERIC(5,2) NULL DEFAULT NULL,
	"vazao_planejada" NUMERIC(5,2) NULL DEFAULT NULL,
	"tipo_bico" VARCHAR(100) NULL DEFAULT NULL,
	"ordem_servico_planejada_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "planejamento_paramet_ordem_servico_planej_fbd8aa46_fk_planejame" FOREIGN KEY ("ordem_servico_planejada_id") REFERENCES "planejamento_ordemservicoplanejada" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "planejamento_parametrooper_ordem_servico_planejada_id_fbd8aa46" ON "" ("ordem_servico_planejada_id");;

-- Copiando dados para a tabela public.planejamento_parametrooperacionalos: -1 rows
/*!40000 ALTER TABLE "planejamento_parametrooperacionalos" DISABLE KEYS */;
/*!40000 ALTER TABLE "planejamento_parametrooperacionalos" ENABLE KEYS */;

-- Copiando estrutura para tabela public.planejamento_planejamentoadubo
CREATE TABLE IF NOT EXISTS "planejamento_planejamentoadubo" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"cobertura" INTEGER NOT NULL,
	"data_planejada" DATE NOT NULL,
	"dose_planejada" NUMERIC(10,4) NOT NULL,
	"quantidade_planejada" NUMERIC(12,4) NOT NULL,
	"produto_id" BIGINT NOT NULL,
	"talhao_id" BIGINT NOT NULL,
	"planejamento_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "planejamento_planeja_planejamento_id_0c8bde55_fk_planejame" FOREIGN KEY ("planejamento_id") REFERENCES "planejamento_planejamentosafra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "planejamento_planeja_produto_id_11b37930_fk_cadastros" FOREIGN KEY ("produto_id") REFERENCES "cadastros_produto" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "planejamento_planeja_talhao_id_f575d0cb_fk_cadastros" FOREIGN KEY ("talhao_id") REFERENCES "cadastros_talhao" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "planejamento_planejamentoadubo_produto_id_11b37930" ON "" ("produto_id");
CREATE INDEX "planejamento_planejamentoadubo_talhao_id_f575d0cb" ON "" ("talhao_id");
CREATE INDEX "planejamento_planejamentoadubo_planejamento_id_0c8bde55" ON "" ("planejamento_id");;

-- Copiando dados para a tabela public.planejamento_planejamentoadubo: -1 rows
/*!40000 ALTER TABLE "planejamento_planejamentoadubo" DISABLE KEYS */;
/*!40000 ALTER TABLE "planejamento_planejamentoadubo" ENABLE KEYS */;

-- Copiando estrutura para tabela public.planejamento_planejamentomaoobraterceiros
CREATE TABLE IF NOT EXISTS "planejamento_planejamentomaoobraterceiros" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"valor_planejado" NUMERIC(12,2) NOT NULL,
	"observacao" TEXT NULL DEFAULT NULL,
	"grupo_trabalhador_id" BIGINT NOT NULL,
	"ordem_servico_planejada_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "planejamento_planeja_grupo_trabalhador_id_bcb56c81_fk_referenci" FOREIGN KEY ("grupo_trabalhador_id") REFERENCES "referencias_grupotrabalhador" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "planejamento_planeja_ordem_servico_planej_e73ceb59_fk_planejame" FOREIGN KEY ("ordem_servico_planejada_id") REFERENCES "planejamento_ordemservicoplanejada" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "planejamento_planejamentom_grupo_trabalhador_id_bcb56c81" ON "" ("grupo_trabalhador_id");
CREATE INDEX "planejamento_planejamentom_ordem_servico_planejada_id_e73ceb59" ON "" ("ordem_servico_planejada_id");;

-- Copiando dados para a tabela public.planejamento_planejamentomaoobraterceiros: -1 rows
/*!40000 ALTER TABLE "planejamento_planejamentomaoobraterceiros" DISABLE KEYS */;
/*!40000 ALTER TABLE "planejamento_planejamentomaoobraterceiros" ENABLE KEYS */;

-- Copiando estrutura para tabela public.planejamento_planejamentorateio
CREATE TABLE IF NOT EXISTS "planejamento_planejamentorateio" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"valor_planejado" NUMERIC(12,2) NOT NULL,
	"observacao" TEXT NULL DEFAULT NULL,
	"conta_gerencial_id" BIGINT NOT NULL,
	"criterio_rateio_id" BIGINT NOT NULL,
	"planejamento_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "planejamento_planeja_conta_gerencial_id_85b0d579_fk_referenci" FOREIGN KEY ("conta_gerencial_id") REFERENCES "referencias_contagerencial" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "planejamento_planeja_criterio_rateio_id_011e7a8a_fk_referenci" FOREIGN KEY ("criterio_rateio_id") REFERENCES "referencias_criteriorateio" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "planejamento_planeja_planejamento_id_c01c59f2_fk_planejame" FOREIGN KEY ("planejamento_id") REFERENCES "planejamento_planejamentosafra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "planejamento_planejamentorateio_conta_gerencial_id_85b0d579" ON "" ("conta_gerencial_id");
CREATE INDEX "planejamento_planejamentorateio_criterio_rateio_id_011e7a8a" ON "" ("criterio_rateio_id");
CREATE INDEX "planejamento_planejamentorateio_planejamento_id_c01c59f2" ON "" ("planejamento_id");;

-- Copiando dados para a tabela public.planejamento_planejamentorateio: -1 rows
/*!40000 ALTER TABLE "planejamento_planejamentorateio" DISABLE KEYS */;
/*!40000 ALTER TABLE "planejamento_planejamentorateio" ENABLE KEYS */;

-- Copiando estrutura para tabela public.planejamento_planejamentosafra
CREATE TABLE IF NOT EXISTS "planejamento_planejamentosafra" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"descricao" VARCHAR(250) NOT NULL,
	"aprovado" BOOLEAN NOT NULL,
	"data_planejamento" DATE NOT NULL,
	"observacao" TEXT NULL DEFAULT NULL,
	"fazenda_id" BIGINT NOT NULL,
	"safra_id" BIGINT NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "planejamento_planeja_fazenda_id_bfef4f53_fk_core_faze" FOREIGN KEY ("fazenda_id") REFERENCES "core_fazenda" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "planejamento_planeja_safra_id_79e3298c_fk_core_safr" FOREIGN KEY ("safra_id") REFERENCES "core_safra" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "planejamento_planejamentosafra_fazenda_id_bfef4f53" ON "" ("fazenda_id");
CREATE INDEX "planejamento_planejamentosafra_safra_id_79e3298c" ON "" ("safra_id");;

-- Copiando dados para a tabela public.planejamento_planejamentosafra: -1 rows
/*!40000 ALTER TABLE "planejamento_planejamentosafra" DISABLE KEYS */;
/*!40000 ALTER TABLE "planejamento_planejamentosafra" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_atividadeeducampo
CREATE TABLE IF NOT EXISTS "referencias_atividadeeducampo" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(150) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_atividadeeducampo_nome_e9299435_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_atividadeeducampo: 10 rows
/*!40000 ALTER TABLE "referencias_atividadeeducampo" DISABLE KEYS */;
INSERT INTO "referencias_atividadeeducampo" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:51.073945-03', '2026-05-20 08:22:51.073969-03', 'true', 'Pulverização'),
	(2, '2026-05-20 08:22:51.076236-03', '2026-05-20 08:22:51.07625-03', 'true', 'Adubação'),
	(3, '2026-05-20 08:22:51.077789-03', '2026-05-20 08:22:51.077802-03', 'true', 'Colheita'),
	(4, '2026-05-20 08:22:51.078907-03', '2026-05-20 08:22:51.078916-03', 'true', 'Secagem'),
	(5, '2026-05-20 08:22:51.080042-03', '2026-05-20 08:22:51.080052-03', 'true', 'Trincha'),
	(6, '2026-05-20 08:22:51.081078-03', '2026-05-20 08:22:51.081086-03', 'true', 'Capina'),
	(7, '2026-05-20 08:22:51.082036-03', '2026-05-20 08:22:51.082043-03', 'true', 'Podas'),
	(8, '2026-05-20 08:22:51.082964-03', '2026-05-20 08:22:51.08297-03', 'true', 'Arruação'),
	(9, '2026-05-20 08:22:51.083887-03', '2026-05-20 08:22:51.083893-03', 'true', 'Rastreamento'),
	(10, '2026-05-20 08:22:51.084812-03', '2026-05-20 08:22:51.084818-03', 'true', 'Tratos Culturais');
/*!40000 ALTER TABLE "referencias_atividadeeducampo" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_classificacaoproduto
CREATE TABLE IF NOT EXISTS "referencias_classificacaoproduto" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_classificacaoproduto_nome_1b2c3289_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_classificacaoproduto: 8 rows
/*!40000 ALTER TABLE "referencias_classificacaoproduto" DISABLE KEYS */;
INSERT INTO "referencias_classificacaoproduto" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:51.015478-03', '2026-05-20 08:22:51.015485-03', 'true', 'Adubo'),
	(2, '2026-05-20 08:22:51.016841-03', '2026-05-20 08:22:51.016848-03', 'true', 'Combustível'),
	(3, '2026-05-20 08:22:51.017717-03', '2026-05-20 08:22:51.017723-03', 'true', 'Defensivo'),
	(4, '2026-05-20 08:22:51.040042-03', '2026-05-20 08:22:51.040061-03', 'true', 'Fertilizante Foliar'),
	(5, '2026-05-20 08:22:51.043156-03', '2026-05-20 08:22:51.043175-03', 'true', 'Embalagem'),
	(6, '2026-05-20 08:22:51.044971-03', '2026-05-20 08:22:51.044988-03', 'true', 'Ferramenta'),
	(7, '2026-05-20 08:22:51.046654-03', '2026-05-20 08:22:51.046668-03', 'true', 'EPI'),
	(8, '2026-05-20 08:22:51.048215-03', '2026-05-20 08:22:51.048228-03', 'true', 'Outros');
/*!40000 ALTER TABLE "referencias_classificacaoproduto" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_contagerencial
CREATE TABLE IF NOT EXISTS "referencias_contagerencial" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"codigo" VARCHAR(50) NOT NULL,
	"nome" VARCHAR(150) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("codigo")
)
CREATE INDEX "referencias_contagerencial_codigo_3c1adb1e_like" ON "" ("codigo");;

-- Copiando dados para a tabela public.referencias_contagerencial: 22 rows
/*!40000 ALTER TABLE "referencias_contagerencial" DISABLE KEYS */;
INSERT INTO "referencias_contagerencial" ("id", "created_at", "updated_at", "ativo", "codigo", "nome") VALUES
	(1, '2026-05-20 08:22:50.917807-03', '2026-05-20 08:22:50.917814-03', 'true', '102701', 'MASSEY FERGUSON 265'),
	(2, '2026-05-20 08:22:50.997349-03', '2026-05-20 08:22:50.997363-03', 'true', '102703', 'JOHN DEERE 5085 E 4x4'),
	(3, '2026-05-20 08:22:50.998561-03', '2026-05-20 08:22:50.998569-03', 'true', '102704', 'MASSEY FERGUSON 275'),
	(4, '2026-05-20 08:22:50.999564-03', '2026-05-20 08:22:50.999571-03', 'true', '102705', 'MASSEY FERGUSON 275 4x4'),
	(5, '2026-05-20 08:22:51.000531-03', '2026-05-20 08:22:51.000537-03', 'true', '102706', 'VALTRA BF75'),
	(6, '2026-05-20 08:22:51.001492-03', '2026-05-20 08:22:51.001498-03', 'true', '102707', 'AGRALE 65 4x4'),
	(7, '2026-05-20 08:22:51.002464-03', '2026-05-20 08:22:51.00247-03', 'true', '102708', 'MASSEY FERGUSON 4265'),
	(8, '2026-05-20 08:22:51.003421-03', '2026-05-20 08:22:51.003427-03', 'true', '102711', 'MASSEY FERGUSON 75 4x4'),
	(9, '2026-05-20 08:22:51.004456-03', '2026-05-20 08:22:51.004463-03', 'true', '10271100', 'CAMINHAO TOCO MERCEDES'),
	(10, '2026-05-20 08:22:51.005431-03', '2026-05-20 08:22:51.005437-03', 'true', '102713', 'VALTRA  A73F 4x4'),
	(11, '2026-05-20 08:22:51.006535-03', '2026-05-20 08:22:51.006544-03', 'true', '10271300', 'CAMINHAO TRUCK MERCEDES'),
	(12, '2026-05-20 08:22:51.008095-03', '2026-05-20 08:22:51.008112-03', 'true', '102714', 'PA CARREGADEIRA'),
	(13, '2026-05-20 08:22:51.009653-03', '2026-05-20 08:22:51.009665-03', 'true', '102715', 'TRATOR VALTRA A73F'),
	(14, '2026-05-20 08:22:51.010939-03', '2026-05-20 08:22:51.01095-03', 'true', '101001', 'Mão de Obra Direta'),
	(15, '2026-05-20 08:22:51.012113-03', '2026-05-20 08:22:51.012122-03', 'true', '101002', 'Encargos Sociais'),
	(16, '2026-05-20 08:22:51.013109-03', '2026-05-20 08:22:51.013116-03', 'true', '102001', 'Insumos - Fertilizantes'),
	(17, '2026-05-20 08:22:51.01406-03', '2026-05-20 08:22:51.014066-03', 'true', '102002', 'Insumos - Defensivos'),
	(18, '2026-05-20 08:22:51.015163-03', '2026-05-20 08:22:51.015169-03', 'true', '102003', 'Insumos - Combustíveis'),
	(19, '2026-05-20 08:22:51.016164-03', '2026-05-20 08:22:51.016172-03', 'true', '103001', 'Serviços Terceirizados'),
	(20, '2026-05-20 08:22:51.017126-03', '2026-05-20 08:22:51.017132-03', 'true', '104001', 'Despesas Administrativas'),
	(21, '2026-05-20 08:22:51.018089-03', '2026-05-20 08:22:51.018095-03', 'true', '105001', 'Investimentos - Máquinas'),
	(22, '2026-05-20 08:22:51.019042-03', '2026-05-20 08:22:51.019049-03', 'true', '105002', 'Investimentos - Lavouras');
/*!40000 ALTER TABLE "referencias_contagerencial" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_criteriorateio
CREATE TABLE IF NOT EXISTS "referencias_criteriorateio" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_criteriorateio_nome_3801f1ce_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_criteriorateio: 6 rows
/*!40000 ALTER TABLE "referencias_criteriorateio" DISABLE KEYS */;
INSERT INTO "referencias_criteriorateio" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:51.087462-03', '2026-05-20 08:22:51.087474-03', 'true', 'Área (Hectares)'),
	(2, '2026-05-20 08:22:51.089305-03', '2026-05-20 08:22:51.089314-03', 'true', 'Produção (Sacas)'),
	(3, '2026-05-20 08:22:51.091016-03', '2026-05-20 08:22:51.09103-03', 'true', 'Planta (Quantidade)'),
	(4, '2026-05-20 08:22:51.092429-03', '2026-05-20 08:22:51.092442-03', 'true', 'Direto'),
	(5, '2026-05-20 08:22:51.09377-03', '2026-05-20 08:22:51.093781-03', 'true', 'Por Talhão'),
	(6, '2026-05-20 08:22:51.095002-03', '2026-05-20 08:22:51.09501-03', 'true', 'Por Fazenda');
/*!40000 ALTER TABLE "referencias_criteriorateio" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_cultura
CREATE TABLE IF NOT EXISTS "referencias_cultura" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_cultura_nome_7214a9f1_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_cultura: 6 rows
/*!40000 ALTER TABLE "referencias_cultura" DISABLE KEYS */;
INSERT INTO "referencias_cultura" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.846905-03', '2026-05-20 08:22:50.846924-03', 'true', 'Café'),
	(2, '2026-05-20 08:22:50.857203-03', '2026-05-20 08:22:50.857221-03', 'true', 'Soja'),
	(3, '2026-05-20 08:22:50.859409-03', '2026-05-20 08:22:50.859424-03', 'true', 'Milho'),
	(4, '2026-05-20 08:22:50.860965-03', '2026-05-20 08:22:50.860983-03', 'true', 'Todas'),
	(5, '2026-05-20 08:22:50.862338-03', '2026-05-20 08:22:50.86235-03', 'true', 'Feijão'),
	(6, '2026-05-20 08:22:50.863561-03', '2026-05-20 08:22:50.863568-03', 'true', 'Equino');
/*!40000 ALTER TABLE "referencias_cultura" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_grupoquimico
CREATE TABLE IF NOT EXISTS "referencias_grupoquimico" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_grupoquimico_nome_8add82a4_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_grupoquimico: 8 rows
/*!40000 ALTER TABLE "referencias_grupoquimico" DISABLE KEYS */;
INSERT INTO "referencias_grupoquimico" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:51.051541-03', '2026-05-20 08:22:51.051555-03', 'true', 'Triazol'),
	(2, '2026-05-20 08:22:51.053627-03', '2026-05-20 08:22:51.05364-03', 'true', 'Estrobirulina'),
	(3, '2026-05-20 08:22:51.054859-03', '2026-05-20 08:22:51.054869-03', 'true', 'Neonicotinoide'),
	(4, '2026-05-20 08:22:51.055963-03', '2026-05-20 08:22:51.055972-03', 'true', 'Organofosforado'),
	(5, '2026-05-20 08:22:51.057559-03', '2026-05-20 08:22:51.057572-03', 'true', 'Piretroide'),
	(6, '2026-05-20 08:22:51.058975-03', '2026-05-20 08:22:51.058985-03', 'true', 'Glifosato'),
	(7, '2026-05-20 08:22:51.060236-03', '2026-05-20 08:22:51.060245-03', 'true', 'Cobre'),
	(8, '2026-05-20 08:22:51.061475-03', '2026-05-20 08:22:51.061483-03', 'true', 'Outros');
/*!40000 ALTER TABLE "referencias_grupoquimico" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_grupotrabalhador
CREATE TABLE IF NOT EXISTS "referencias_grupotrabalhador" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_grupotrabalhador_nome_623f64a5_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_grupotrabalhador: 7 rows
/*!40000 ALTER TABLE "referencias_grupotrabalhador" DISABLE KEYS */;
INSERT INTO "referencias_grupotrabalhador" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.998869-03', '2026-05-20 08:22:50.998882-03', 'true', 'Grupo Tratoristas'),
	(2, '2026-05-20 08:22:51.030796-03', '2026-05-20 08:22:51.030803-03', 'true', 'Grupo Administrativo'),
	(3, '2026-05-20 08:22:51.032312-03', '2026-05-20 08:22:51.032319-03', 'true', 'Grupo Irrigação'),
	(4, '2026-05-20 08:22:51.033281-03', '2026-05-20 08:22:51.033287-03', 'true', 'Grupo Colheita'),
	(5, '2026-05-20 08:22:51.034221-03', '2026-05-20 08:22:51.034228-03', 'true', 'Mão de Obra Própria'),
	(6, '2026-05-20 08:22:51.035197-03', '2026-05-20 08:22:51.035203-03', 'true', 'Mão de Obra Terceirizada'),
	(7, '2026-05-20 08:22:51.036316-03', '2026-05-20 08:22:51.036325-03', 'true', 'Parceiros');
/*!40000 ALTER TABLE "referencias_grupotrabalhador" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_modalidade
CREATE TABLE IF NOT EXISTS "referencias_modalidade" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_modalidade_nome_176296d7_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_modalidade: 4 rows
/*!40000 ALTER TABLE "referencias_modalidade" DISABLE KEYS */;
INSERT INTO "referencias_modalidade" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.902601-03', '2026-05-20 08:22:50.902608-03', 'true', 'Mecanizado'),
	(2, '2026-05-20 08:22:50.904039-03', '2026-05-20 08:22:50.904048-03', 'true', 'Manual'),
	(3, '2026-05-20 08:22:50.905054-03', '2026-05-20 08:22:50.90506-03', 'true', 'Semi-Mecanizado'),
	(4, '2026-05-20 08:22:50.906005-03', '2026-05-20 08:22:50.906011-03', 'true', 'Outros');
/*!40000 ALTER TABLE "referencias_modalidade" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_resistenciaferrugem
CREATE TABLE IF NOT EXISTS "referencias_resistenciaferrugem" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_resistenciaferrugem_nome_757e1461_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_resistenciaferrugem: 4 rows
/*!40000 ALTER TABLE "referencias_resistenciaferrugem" DISABLE KEYS */;
INSERT INTO "referencias_resistenciaferrugem" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.886362-03', '2026-05-20 08:22:50.886372-03', 'true', 'Suscetível'),
	(2, '2026-05-20 08:22:50.887859-03', '2026-05-20 08:22:50.887867-03', 'true', 'Resistente'),
	(3, '2026-05-20 08:22:50.888882-03', '2026-05-20 08:22:50.888888-03', 'true', 'Tolerante'),
	(4, '2026-05-20 08:22:50.890237-03', '2026-05-20 08:22:50.890249-03', 'true', 'Não Informado');
/*!40000 ALTER TABLE "referencias_resistenciaferrugem" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_statuscultivo
CREATE TABLE IF NOT EXISTS "referencias_statuscultivo" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_statuscultivo_nome_a041cf94_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_statuscultivo: 4 rows
/*!40000 ALTER TABLE "referencias_statuscultivo" DISABLE KEYS */;
INSERT INTO "referencias_statuscultivo" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.871974-03', '2026-05-20 08:22:50.871984-03', 'true', 'Em Formação'),
	(2, '2026-05-20 08:22:50.873642-03', '2026-05-20 08:22:50.873657-03', 'true', 'Em Produção'),
	(3, '2026-05-20 08:22:50.875163-03', '2026-05-20 08:22:50.875174-03', 'true', 'Renovação'),
	(4, '2026-05-20 08:22:50.876635-03', '2026-05-20 08:22:50.876646-03', 'true', 'Implantado');
/*!40000 ALTER TABLE "referencias_statuscultivo" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_statusordemservico
CREATE TABLE IF NOT EXISTS "referencias_statusordemservico" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_statusordemservico_nome_2c2ae2af_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_statusordemservico: 5 rows
/*!40000 ALTER TABLE "referencias_statusordemservico" DISABLE KEYS */;
INSERT INTO "referencias_statusordemservico" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.894478-03', '2026-05-20 08:22:50.894494-03', 'true', 'Rascunho'),
	(2, '2026-05-20 08:22:50.896347-03', '2026-05-20 08:22:50.896358-03', 'true', 'Aprovada'),
	(3, '2026-05-20 08:22:50.897468-03', '2026-05-20 08:22:50.897477-03', 'true', 'Em Execução'),
	(4, '2026-05-20 08:22:50.898526-03', '2026-05-20 08:22:50.898534-03', 'true', 'Concluída'),
	(5, '2026-05-20 08:22:50.89951-03', '2026-05-20 08:22:50.899516-03', 'true', 'Cancelada');
/*!40000 ALTER TABLE "referencias_statusordemservico" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_tipodestinacao
CREATE TABLE IF NOT EXISTS "referencias_tipodestinacao" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_tipodestinacao_nome_d630273f_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_tipodestinacao: 5 rows
/*!40000 ALTER TABLE "referencias_tipodestinacao" DISABLE KEYS */;
INSERT INTO "referencias_tipodestinacao" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:51.022404-03', '2026-05-20 08:22:51.022412-03', 'true', 'Aplicação'),
	(2, '2026-05-20 08:22:51.024627-03', '2026-05-20 08:22:51.024643-03', 'true', 'Venda'),
	(3, '2026-05-20 08:22:51.025959-03', '2026-05-20 08:22:51.025972-03', 'true', 'Estoque'),
	(4, '2026-05-20 08:22:51.027381-03', '2026-05-20 08:22:51.027393-03', 'true', 'Perda'),
	(5, '2026-05-20 08:22:51.028501-03', '2026-05-20 08:22:51.028508-03', 'true', 'Consumo Interno');
/*!40000 ALTER TABLE "referencias_tipodestinacao" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_tipoirrigacao
CREATE TABLE IF NOT EXISTS "referencias_tipoirrigacao" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_tipoirrigacao_nome_6f6595a7_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_tipoirrigacao: 5 rows
/*!40000 ALTER TABLE "referencias_tipoirrigacao" DISABLE KEYS */;
INSERT INTO "referencias_tipoirrigacao" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.87937-03', '2026-05-20 08:22:50.879379-03', 'true', 'Irrigado'),
	(2, '2026-05-20 08:22:50.881047-03', '2026-05-20 08:22:50.881055-03', 'true', 'Não Irrigado'),
	(3, '2026-05-20 08:22:50.882114-03', '2026-05-20 08:22:50.88212-03', 'true', 'Gotejamento'),
	(4, '2026-05-20 08:22:50.883124-03', '2026-05-20 08:22:50.88313-03', 'true', 'Aspersão'),
	(5, '2026-05-20 08:22:50.884103-03', '2026-05-20 08:22:50.884109-03', 'true', 'Pivô Central');
/*!40000 ALTER TABLE "referencias_tipoirrigacao" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_tipoitem
CREATE TABLE IF NOT EXISTS "referencias_tipoitem" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_tipoitem_nome_a568e6c6_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_tipoitem: 4 rows
/*!40000 ALTER TABLE "referencias_tipoitem" DISABLE KEYS */;
INSERT INTO "referencias_tipoitem" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.866282-03', '2026-05-20 08:22:50.86629-03', 'true', 'Produto'),
	(2, '2026-05-20 08:22:50.867712-03', '2026-05-20 08:22:50.867718-03', 'true', 'Serviço'),
	(3, '2026-05-20 08:22:50.868738-03', '2026-05-20 08:22:50.868744-03', 'true', 'Máquina'),
	(4, '2026-05-20 08:22:50.869721-03', '2026-05-20 08:22:50.869727-03', 'true', 'Mão de Obra');
/*!40000 ALTER TABLE "referencias_tipoitem" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_tipomaquina
CREATE TABLE IF NOT EXISTS "referencias_tipomaquina" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_tipomaquina_nome_69276b77_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_tipomaquina: 6 rows
/*!40000 ALTER TABLE "referencias_tipomaquina" DISABLE KEYS */;
INSERT INTO "referencias_tipomaquina" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-06-12 08:36:21.549452-03', '2026-06-17 09:06:03.192718-03', 'true', 'TRATOR'),
	(2, '2026-06-12 08:36:21.553132-03', '2026-06-12 08:43:26.944857-03', 'true', 'COLHEITADEIRA'),
	(3, '2026-06-12 08:36:21.555248-03', '2026-06-12 08:43:43.531914-03', 'true', 'CAMINHÃO'),
	(9, '2026-06-17 09:05:00.846338-03', '2026-06-17 09:05:00.846564-03', 'true', 'Trator'),
	(10, '2026-06-17 09:05:00.88152-03', '2026-06-17 09:05:00.881532-03', 'true', 'Colhetadeira'),
	(11, '2026-06-17 09:05:00.882655-03', '2026-06-17 09:05:00.882661-03', 'true', 'Caminhao');
/*!40000 ALTER TABLE "referencias_tipomaquina" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_tipooperacao
CREATE TABLE IF NOT EXISTS "referencias_tipooperacao" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_tipooperacao_nome_56ea5bde_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_tipooperacao: 24 rows
/*!40000 ALTER TABLE "referencias_tipooperacao" DISABLE KEYS */;
INSERT INTO "referencias_tipooperacao" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:51.097923-03', '2026-05-20 08:22:51.097938-03', 'true', 'Pulverização - Todas as Ruas'),
	(2, '2026-05-20 08:22:51.099852-03', '2026-05-20 08:22:51.099864-03', 'true', 'Pulverização Lavoura Nova - Todas as Ruas'),
	(3, '2026-05-20 08:22:51.101031-03', '2026-05-20 08:22:51.101042-03', 'true', 'Drench - Todas as Ruas'),
	(4, '2026-05-20 08:22:51.102092-03', '2026-05-20 08:22:51.1021-03', 'true', 'Aplicação de herbicida em Faixa - Todas as Ruas'),
	(5, '2026-05-20 08:22:51.103077-03', '2026-05-20 08:22:51.103084-03', 'true', 'Aplicação de herbicida em Faixa - Duas vezes por rua'),
	(6, '2026-05-20 08:22:51.104072-03', '2026-05-20 08:22:51.104078-03', 'true', 'Aplicação de herbicida em Faixa - Ruas Alternadas'),
	(7, '2026-05-20 08:22:51.105005-03', '2026-05-20 08:22:51.105011-03', 'true', 'Aplicação de herbicida em A. Total - Todas as Ruas'),
	(8, '2026-05-20 08:22:51.105922-03', '2026-05-20 08:22:51.105928-03', 'true', 'Aplicação de herbicida em A. Total - Duas vezes por rua'),
	(9, '2026-05-20 08:22:51.107039-03', '2026-05-20 08:22:51.10705-03', 'true', 'Roçada Mecânica (R. Simples) - Todas as Ruas'),
	(10, '2026-05-20 08:22:51.108448-03', '2026-05-20 08:22:51.108459-03', 'true', 'Roçada Mecânica (R. Simples) - Duas vezes por rua'),
	(11, '2026-05-20 08:22:51.109685-03', '2026-05-20 08:22:51.109694-03', 'true', 'Adubação - Todas as Ruas'),
	(12, '2026-05-20 08:22:51.110813-03', '2026-05-20 08:22:51.110821-03', 'true', 'Trincha - Ruas Alternadas'),
	(13, '2026-05-20 08:22:51.112078-03', '2026-05-20 08:22:51.112086-03', 'true', 'Trincha - Todas as Ruas'),
	(14, '2026-05-20 08:22:51.113143-03', '2026-05-20 08:22:51.113151-03', 'true', 'Decotamento - Ruas Alternadas'),
	(15, '2026-05-20 08:22:51.114248-03', '2026-05-20 08:22:51.114256-03', 'true', 'Decotamento - Todas as Ruas'),
	(16, '2026-05-20 08:22:51.115281-03', '2026-05-20 08:22:51.115287-03', 'true', 'Esqueleto - Ruas Alternadas'),
	(17, '2026-05-20 08:22:51.116304-03', '2026-05-20 08:22:51.116312-03', 'true', 'Esqueleto - Todas as Ruas'),
	(18, '2026-05-20 08:22:51.117288-03', '2026-05-20 08:22:51.117295-03', 'true', 'Arruação - Todas as Ruas'),
	(19, '2026-05-20 08:22:51.118299-03', '2026-05-20 08:22:51.118306-03', 'true', 'Rastreamento - Todas as Ruas'),
	(20, '2026-05-20 08:22:51.119269-03', '2026-05-20 08:22:51.119276-03', 'true', 'Colheita Mecânica (Colhedora) - Todas as Ruas'),
	(21, '2026-05-20 08:22:51.120261-03', '2026-05-20 08:22:51.120268-03', 'true', 'Colheita Semi-Mecanizada (Derriçadora) - Todas as Ruas'),
	(22, '2026-05-20 08:22:51.121641-03', '2026-05-20 08:22:51.121652-03', 'true', 'Colheita Manual (Mão) - Todas as Ruas'),
	(23, '2026-05-20 08:22:51.122716-03', '2026-05-20 08:22:51.122722-03', 'true', 'Limpeza e Secagem de Café'),
	(24, '2026-05-20 08:22:51.124292-03', '2026-05-20 08:22:51.124303-03', 'true', 'Beneficiamento de Café');
/*!40000 ALTER TABLE "referencias_tipooperacao" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_tiporateio
CREATE TABLE IF NOT EXISTS "referencias_tiporateio" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("nome")
)
CREATE INDEX "referencias_tiporateio_nome_e910a704_like" ON "" ("nome");;

-- Copiando dados para a tabela public.referencias_tiporateio: 4 rows
/*!40000 ALTER TABLE "referencias_tiporateio" DISABLE KEYS */;
INSERT INTO "referencias_tiporateio" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.911842-03', '2026-05-20 08:22:50.911855-03', 'true', 'Direto'),
	(2, '2026-05-20 08:22:50.913574-03', '2026-05-20 08:22:50.913584-03', 'true', 'Indireto'),
	(3, '2026-05-20 08:22:50.914597-03', '2026-05-20 08:22:50.914603-03', 'true', 'Rateado'),
	(4, '2026-05-20 08:22:50.915583-03', '2026-05-20 08:22:50.91559-03', 'true', 'Administrativo');
/*!40000 ALTER TABLE "referencias_tiporateio" ENABLE KEYS */;

-- Copiando estrutura para tabela public.referencias_unidademedida
CREATE TABLE IF NOT EXISTS "referencias_unidademedida" (
	"id" BIGINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	"ativo" BOOLEAN NOT NULL,
	"sigla" VARCHAR(10) NOT NULL,
	"nome" VARCHAR(100) NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("sigla")
)
CREATE INDEX "referencias_unidademedida_sigla_44450d9d_like" ON "" ("sigla");;

-- Copiando dados para a tabela public.referencias_unidademedida: 8 rows
/*!40000 ALTER TABLE "referencias_unidademedida" DISABLE KEYS */;
INSERT INTO "referencias_unidademedida" ("id", "created_at", "updated_at", "ativo", "sigla", "nome") VALUES
	(1, '2026-05-20 08:22:51.011518-03', '2026-05-20 08:22:51.011531-03', 'true', 'kg', 'Quilograma'),
	(2, '2026-05-20 08:22:51.013053-03', '2026-05-20 08:22:51.013061-03', 'true', 'L', 'Litro'),
	(3, '2026-05-20 08:22:51.064834-03', '2026-05-20 08:22:51.064844-03', 'true', 'un', 'Unidade'),
	(4, '2026-05-20 08:22:51.065945-03', '2026-05-20 08:22:51.065951-03', 'true', 'ha', 'Hectare'),
	(5, '2026-05-20 08:22:51.06692-03', '2026-05-20 08:22:51.066926-03', 'true', 'sc', 'Saca'),
	(6, '2026-05-20 08:22:51.067847-03', '2026-05-20 08:22:51.067853-03', 'true', 'h', 'Hora'),
	(7, '2026-05-20 08:22:51.068894-03', '2026-05-20 08:22:51.0689-03', 'true', 'm', 'Metro'),
	(8, '2026-05-20 08:22:51.069829-03', '2026-05-20 08:22:51.069836-03', 'true', 'ton', 'Tonelada');
/*!40000 ALTER TABLE "referencias_unidademedida" ENABLE KEYS */;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
