from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from core.models import Fazenda, Safra, Proprietario
from referencias.models import TipoOperacao, UnidadeMedida, ClassificacaoProduto
from cadastros.models import Produto, Talhao, Maquina, Funcionario
from planejamento.models import PlanejamentoSafra, OrdemServicoPlanejada
from operacoes.models import OrdemServico, ApontamentoOperacao, AuditoriaOrdemServico
from accounts.models import Perfil

User = get_user_model()

class OperacoesAPITests(APITestCase):
    def setUp(self):
        # 1. Setup Básico (Tenant)
        self.proprietario = Proprietario.objects.create(nome="Proprietario Teste", documento="11122233344")
        self.fazenda = Fazenda.objects.create(nome="Fazenda Operacoes", proprietario=self.proprietario, sigla="FOP")
        self.safra = Safra.objects.create(nome="Safra Operacoes", fazenda=self.fazenda, data_inicio="2026-01-01", data_fim="2026-12-31")

        # 2. Setup de Usuário Admin
        self.perfil_admin, _ = Perfil.objects.get_or_create(nome="Administrador", nivel=1)
        self.admin_user = User.objects.create_user(
            username="admin_op", email="admin_op@test.com", password="password123",
            perfil=self.perfil_admin
        )
        self.admin_user.fazendas_permitidas.add(self.fazenda)

        # 3. Setup Cadastros Base
        self.unidade = UnidadeMedida.objects.create(nome="Litro", sigla="LT")
        self.classificacao = ClassificacaoProduto.objects.create(nome="Insumo")
        
        self.produto = Produto.objects.create(
            nome_comercial="Produto X",
            unidade=self.unidade,
            classificacao=self.classificacao
        )
        self.produto_nao_planejado = Produto.objects.create(
            nome_comercial="Produto Y",
            unidade=self.unidade,
            classificacao=self.classificacao
        )
        self.tipo_operacao = TipoOperacao.objects.create(nome="Pulverização")

        # 4. Criando Ordem de Serviço Real
        self.os_real = OrdemServico.objects.create(
            fazenda=self.fazenda,
            safra=self.safra,
            tipo_operacao=self.tipo_operacao,
            data_inicio_planejada="2026-06-01",
            data_fim_planejada="2026-06-02",
            status="APROVADA"
        )
        self.os_real.insumos.create(produto=self.produto, quantidade_planejada=100.0)

        # 5. Autenticação e Headers do DRF
        self.client.force_authenticate(user=self.admin_user)
        self.client.credentials(HTTP_X_SAFRA_ID=str(self.safra.id), HTTP_X_FAZENDA_ID=str(self.fazenda.id))

    def test_iniciar_e_concluir_os(self):
        # 1. Iniciar a OS
        url_iniciar = reverse('operacao-ordem-servico-iniciar', args=[self.os_real.id])
        response = self.client.post(url_iniciar, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.os_real.refresh_from_db()
        self.assertEqual(self.os_real.status, 'EM_EXECUCAO')

        # 2. Concluir a OS (sem apontamentos, não deve gerar auditoria de superdose/subdose pois qtde=0)
        # Note: qtde executada = 0, qtde planejada = 100.
        # Vai disparar subdose.
        url_concluir = reverse('operacao-ordem-servico-concluir', args=[self.os_real.id])
        response = self.client.post(url_concluir, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.os_real.refresh_from_db()
        self.assertEqual(self.os_real.status, 'CONCLUIDA')
        
        auditorias = AuditoriaOrdemServico.objects.filter(ordem_servico=self.os_real)
        self.assertTrue(auditorias.exists())
        self.assertEqual(auditorias.first().tipo_desvio, 'SUBDOSE')

    def test_apontamento_com_produto_nao_planejado_gera_auditoria(self):
        # 1. Iniciar OS
        url_iniciar = reverse('operacao-ordem-servico-iniciar', args=[self.os_real.id])
        self.client.post(url_iniciar, format='json')

        # 2. Criar Apontamento
        apontamento_url = reverse('operacao-apontamento-list')
        apontamento_data = {
            "ordem_servico": self.os_real.id,
            "data_apontamento": "2026-06-01",
            "clima": "Ensolarado"
        }
        res_ap = self.client.post(apontamento_url, apontamento_data, format='json')
        self.assertEqual(res_ap.status_code, status.HTTP_201_CREATED)
        ap_id = res_ap.data['id']

        # 3. Adicionar Insumo NÃO Planejado
        insumo_url = reverse('operacao-apontamento-insumo-list')
        insumo_data = {
            "apontamento": ap_id,
            "produto": self.produto_nao_planejado.id,
            "quantidade_total": "10.00"
        }
        self.client.post(insumo_url, insumo_data, format='json')

        # 4. Adicionar Insumo Planejado dentro da margem (exato 100)
        insumo_data2 = {
            "apontamento": ap_id,
            "produto": self.produto.id,
            "quantidade_total": "100.00"
        }
        self.client.post(insumo_url, insumo_data2, format='json')

        # 5. Concluir OS
        url_concluir = reverse('operacao-ordem-servico-concluir', args=[self.os_real.id])
        self.client.post(url_concluir, format='json')

        # 6. Checar Auditoria
        auditorias = AuditoriaOrdemServico.objects.filter(ordem_servico=self.os_real)
        self.assertEqual(auditorias.count(), 1)
        self.assertEqual(auditorias.first().tipo_desvio, 'PRODUTO_NAO_PLANEJADO')

    def test_superdose_gera_auditoria(self):
        url_iniciar = reverse('operacao-ordem-servico-iniciar', args=[self.os_real.id])
        self.client.post(url_iniciar, format='json')

        ap_id = self.client.post(reverse('operacao-apontamento-list'), {
            "ordem_servico": self.os_real.id, "data_apontamento": "2026-06-01"
        }, format='json').data['id']

        # Aplica 110 L (planejado era 100). Isso é +10%, fora da margem de 5%.
        self.client.post(reverse('operacao-apontamento-insumo-list'), {
            "apontamento": ap_id, "produto": self.produto.id, "quantidade_total": "110.00"
        }, format='json')

        url_concluir = reverse('operacao-ordem-servico-concluir', args=[self.os_real.id])
        self.client.post(url_concluir, format='json')

        auditorias = AuditoriaOrdemServico.objects.filter(ordem_servico=self.os_real)
        self.assertEqual(auditorias.count(), 1)
        self.assertEqual(auditorias.first().tipo_desvio, 'SUPERDOSE')
