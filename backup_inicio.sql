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

-- Copiando dados para a tabela public.accounts_usuario: 2 rows
DELETE FROM "accounts_usuario";
/*!40000 ALTER TABLE "accounts_usuario" DISABLE KEYS */;
INSERT INTO "accounts_usuario" ("id", "password", "last_login", "is_superuser", "username", "first_name", "last_name", "email", "is_staff", "is_active", "date_joined", "created_at", "updated_at", "ativo", "perfil_id") VALUES
	(1, 'pbkdf2_sha256$1000000$yFTLDB4PA0NlwOYryiqsca$UtLjFrAOwSPzC8neuqUMLscfZ6kQIqSaxiFsQX4uajE=', '2026-06-19 09:12:22.818942-03', 'true', 'admin', '', '', 'admin@teste.com', 'true', 'true', '2026-05-19 15:33:35.801082-03', '2026-05-19 15:33:36.174943-03', '2026-06-18 07:56:52.972199-03', 'true', 1),
	
/*!40000 ALTER TABLE "accounts_usuario" ENABLE KEYS */;


-- Copiando dados para a tabela public.referencias_atividadeeducampo: -1 rows
DELETE FROM "referencias_atividadeeducampo";
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

-- Copiando dados para a tabela public.referencias_classificacaoproduto: -1 rows
DELETE FROM "referencias_classificacaoproduto";
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

-- Copiando dados para a tabela public.referencias_contagerencial: 22 rows
DELETE FROM "referencias_contagerencial";
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

-- Copiando dados para a tabela public.referencias_criteriorateio: -1 rows
DELETE FROM "referencias_criteriorateio";
/*!40000 ALTER TABLE "referencias_criteriorateio" DISABLE KEYS */;
INSERT INTO "referencias_criteriorateio" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:51.087462-03', '2026-05-20 08:22:51.087474-03', 'true', 'Área (Hectares)'),
	(2, '2026-05-20 08:22:51.089305-03', '2026-05-20 08:22:51.089314-03', 'true', 'Produção (Sacas)'),
	(3, '2026-05-20 08:22:51.091016-03', '2026-05-20 08:22:51.09103-03', 'true', 'Planta (Quantidade)'),
	(4, '2026-05-20 08:22:51.092429-03', '2026-05-20 08:22:51.092442-03', 'true', 'Direto'),
	(5, '2026-05-20 08:22:51.09377-03', '2026-05-20 08:22:51.093781-03', 'true', 'Por Talhão'),
	(6, '2026-05-20 08:22:51.095002-03', '2026-05-20 08:22:51.09501-03', 'true', 'Por Fazenda');
/*!40000 ALTER TABLE "referencias_criteriorateio" ENABLE KEYS */;

-- Copiando dados para a tabela public.referencias_cultura: -1 rows
DELETE FROM "referencias_cultura";
/*!40000 ALTER TABLE "referencias_cultura" DISABLE KEYS */;
INSERT INTO "referencias_cultura" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.846905-03', '2026-05-20 08:22:50.846924-03', 'true', 'Café'),
	(2, '2026-05-20 08:22:50.857203-03', '2026-05-20 08:22:50.857221-03', 'true', 'Soja'),
	(3, '2026-05-20 08:22:50.859409-03', '2026-05-20 08:22:50.859424-03', 'true', 'Milho'),
	(4, '2026-05-20 08:22:50.860965-03', '2026-05-20 08:22:50.860983-03', 'true', 'Todas'),
	(5, '2026-05-20 08:22:50.862338-03', '2026-05-20 08:22:50.86235-03', 'true', 'Feijão'),
	(6, '2026-05-20 08:22:50.863561-03', '2026-05-20 08:22:50.863568-03', 'true', 'Equino');
/*!40000 ALTER TABLE "referencias_cultura" ENABLE KEYS */;

-- Copiando dados para a tabela public.referencias_grupoquimico: -1 rows
DELETE FROM "referencias_grupoquimico";
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

-- Copiando dados para a tabela public.referencias_grupotrabalhador: -1 rows
DELETE FROM "referencias_grupotrabalhador";
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

-- Copiando dados para a tabela public.referencias_modalidade: -1 rows
DELETE FROM "referencias_modalidade";
/*!40000 ALTER TABLE "referencias_modalidade" DISABLE KEYS */;
INSERT INTO "referencias_modalidade" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.902601-03', '2026-05-20 08:22:50.902608-03', 'true', 'Mecanizado'),
	(2, '2026-05-20 08:22:50.904039-03', '2026-05-20 08:22:50.904048-03', 'true', 'Manual'),
	(3, '2026-05-20 08:22:50.905054-03', '2026-05-20 08:22:50.90506-03', 'true', 'Semi-Mecanizado'),
	(4, '2026-05-20 08:22:50.906005-03', '2026-05-20 08:22:50.906011-03', 'true', 'Outros');
/*!40000 ALTER TABLE "referencias_modalidade" ENABLE KEYS */;

-- Copiando dados para a tabela public.referencias_resistenciaferrugem: -1 rows
DELETE FROM "referencias_resistenciaferrugem";
/*!40000 ALTER TABLE "referencias_resistenciaferrugem" DISABLE KEYS */;
INSERT INTO "referencias_resistenciaferrugem" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.886362-03', '2026-05-20 08:22:50.886372-03', 'true', 'Suscetível'),
	(2, '2026-05-20 08:22:50.887859-03', '2026-05-20 08:22:50.887867-03', 'true', 'Resistente'),
	(3, '2026-05-20 08:22:50.888882-03', '2026-05-20 08:22:50.888888-03', 'true', 'Tolerante'),
	(4, '2026-05-20 08:22:50.890237-03', '2026-05-20 08:22:50.890249-03', 'true', 'Não Informado');
/*!40000 ALTER TABLE "referencias_resistenciaferrugem" ENABLE KEYS */;

-- Copiando dados para a tabela public.referencias_statuscultivo: -1 rows
DELETE FROM "referencias_statuscultivo";
/*!40000 ALTER TABLE "referencias_statuscultivo" DISABLE KEYS */;
INSERT INTO "referencias_statuscultivo" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.871974-03', '2026-05-20 08:22:50.871984-03', 'true', 'Em Formação'),
	(2, '2026-05-20 08:22:50.873642-03', '2026-05-20 08:22:50.873657-03', 'true', 'Em Produção'),
	(3, '2026-05-20 08:22:50.875163-03', '2026-05-20 08:22:50.875174-03', 'true', 'Renovação'),
	(4, '2026-05-20 08:22:50.876635-03', '2026-05-20 08:22:50.876646-03', 'true', 'Implantado');
/*!40000 ALTER TABLE "referencias_statuscultivo" ENABLE KEYS */;

-- Copiando dados para a tabela public.referencias_statusordemservico: -1 rows
DELETE FROM "referencias_statusordemservico";
/*!40000 ALTER TABLE "referencias_statusordemservico" DISABLE KEYS */;
INSERT INTO "referencias_statusordemservico" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.894478-03', '2026-05-20 08:22:50.894494-03', 'true', 'Rascunho'),
	(2, '2026-05-20 08:22:50.896347-03', '2026-05-20 08:22:50.896358-03', 'true', 'Aprovada'),
	(3, '2026-05-20 08:22:50.897468-03', '2026-05-20 08:22:50.897477-03', 'true', 'Em Execução'),
	(4, '2026-05-20 08:22:50.898526-03', '2026-05-20 08:22:50.898534-03', 'true', 'Concluída'),
	(5, '2026-05-20 08:22:50.89951-03', '2026-05-20 08:22:50.899516-03', 'true', 'Cancelada');
/*!40000 ALTER TABLE "referencias_statusordemservico" ENABLE KEYS */;

-- Copiando dados para a tabela public.referencias_tipodestinacao: -1 rows
DELETE FROM "referencias_tipodestinacao";
/*!40000 ALTER TABLE "referencias_tipodestinacao" DISABLE KEYS */;
INSERT INTO "referencias_tipodestinacao" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:51.022404-03', '2026-05-20 08:22:51.022412-03', 'true', 'Aplicação'),
	(2, '2026-05-20 08:22:51.024627-03', '2026-05-20 08:22:51.024643-03', 'true', 'Venda'),
	(3, '2026-05-20 08:22:51.025959-03', '2026-05-20 08:22:51.025972-03', 'true', 'Estoque'),
	(4, '2026-05-20 08:22:51.027381-03', '2026-05-20 08:22:51.027393-03', 'true', 'Perda'),
	(5, '2026-05-20 08:22:51.028501-03', '2026-05-20 08:22:51.028508-03', 'true', 'Consumo Interno');
/*!40000 ALTER TABLE "referencias_tipodestinacao" ENABLE KEYS */;

-- Copiando dados para a tabela public.referencias_tipoirrigacao: -1 rows
DELETE FROM "referencias_tipoirrigacao";
/*!40000 ALTER TABLE "referencias_tipoirrigacao" DISABLE KEYS */;
INSERT INTO "referencias_tipoirrigacao" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.87937-03', '2026-05-20 08:22:50.879379-03', 'true', 'Irrigado'),
	(2, '2026-05-20 08:22:50.881047-03', '2026-05-20 08:22:50.881055-03', 'true', 'Não Irrigado'),
	(3, '2026-05-20 08:22:50.882114-03', '2026-05-20 08:22:50.88212-03', 'true', 'Gotejamento'),
	(4, '2026-05-20 08:22:50.883124-03', '2026-05-20 08:22:50.88313-03', 'true', 'Aspersão'),
	(5, '2026-05-20 08:22:50.884103-03', '2026-05-20 08:22:50.884109-03', 'true', 'Pivô Central');
/*!40000 ALTER TABLE "referencias_tipoirrigacao" ENABLE KEYS */;

-- Copiando dados para a tabela public.referencias_tipoitem: -1 rows
DELETE FROM "referencias_tipoitem";
/*!40000 ALTER TABLE "referencias_tipoitem" DISABLE KEYS */;
INSERT INTO "referencias_tipoitem" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.866282-03', '2026-05-20 08:22:50.86629-03', 'true', 'Produto'),
	(2, '2026-05-20 08:22:50.867712-03', '2026-05-20 08:22:50.867718-03', 'true', 'Serviço'),
	(3, '2026-05-20 08:22:50.868738-03', '2026-05-20 08:22:50.868744-03', 'true', 'Máquina'),
	(4, '2026-05-20 08:22:50.869721-03', '2026-05-20 08:22:50.869727-03', 'true', 'Mão de Obra');
/*!40000 ALTER TABLE "referencias_tipoitem" ENABLE KEYS */;

-- Copiando dados para a tabela public.referencias_tipomaquina: -1 rows
DELETE FROM "referencias_tipomaquina";
/*!40000 ALTER TABLE "referencias_tipomaquina" DISABLE KEYS */;
INSERT INTO "referencias_tipomaquina" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-06-12 08:36:21.549452-03', '2026-06-17 09:06:03.192718-03', 'true', 'TRATOR'),
	(2, '2026-06-12 08:36:21.553132-03', '2026-06-12 08:43:26.944857-03', 'true', 'COLHEITADEIRA'),
	(3, '2026-06-12 08:36:21.555248-03', '2026-06-12 08:43:43.531914-03', 'true', 'CAMINHÃO'),
	(9, '2026-06-17 09:05:00.846338-03', '2026-06-17 09:05:00.846564-03', 'true', 'Trator'),
	(10, '2026-06-17 09:05:00.88152-03', '2026-06-17 09:05:00.881532-03', 'true', 'Colhetadeira'),
	(11, '2026-06-17 09:05:00.882655-03', '2026-06-17 09:05:00.882661-03', 'true', 'Caminhao');
/*!40000 ALTER TABLE "referencias_tipomaquina" ENABLE KEYS */;

-- Copiando dados para a tabela public.referencias_tipooperacao: -1 rows
DELETE FROM "referencias_tipooperacao";
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

-- Copiando dados para a tabela public.referencias_tiporateio: -1 rows
DELETE FROM "referencias_tiporateio";
/*!40000 ALTER TABLE "referencias_tiporateio" DISABLE KEYS */;
INSERT INTO "referencias_tiporateio" ("id", "created_at", "updated_at", "ativo", "nome") VALUES
	(1, '2026-05-20 08:22:50.911842-03', '2026-05-20 08:22:50.911855-03', 'true', 'Direto'),
	(2, '2026-05-20 08:22:50.913574-03', '2026-05-20 08:22:50.913584-03', 'true', 'Indireto'),
	(3, '2026-05-20 08:22:50.914597-03', '2026-05-20 08:22:50.914603-03', 'true', 'Rateado'),
	(4, '2026-05-20 08:22:50.915583-03', '2026-05-20 08:22:50.91559-03', 'true', 'Administrativo');
/*!40000 ALTER TABLE "referencias_tiporateio" ENABLE KEYS */;

-- Copiando dados para a tabela public.referencias_unidademedida: -1 rows
DELETE FROM "referencias_unidademedida";
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
