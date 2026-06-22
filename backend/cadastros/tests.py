from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from core.models import Fazenda, Proprietario, Safra
from cadastros.models import (
    TurmaTerceirizada, Maquina, Funcionario, Produto, EstoqueMovimento,
    TransferenciaAtivo, LocacaoMaquina
)
from accounts.models import Perfil
from referencias.models import TipoMaquina, GrupoTrabalhador, UnidadeMedida, ClassificacaoProduto
from financeiro.models import ContasAPagar

User = get_user_model()

class TurmaTerceirizadaAPITests(APITestCase):
    def setUp(self):
        self.proprietario = Proprietario.objects.create(nome="Proprietario Teste", documento="11122233344")
        self.fazenda = Fazenda.objects.create(nome="Fazenda Teste", proprietario=self.proprietario, sigla="FZT")
        self.safra = Safra.objects.create(nome="Safra Teste", fazenda=self.fazenda, data_inicio="2026-01-01", data_fim="2026-12-31")
        
        self.perfil_admin, _ = Perfil.objects.get_or_create(nome="Administrador", nivel=1)
        self.admin_user = User.objects.create_user(
            username="admin_cad", email="admin_cad@test.com", password="password123",
            perfil=self.perfil_admin
        )
        self.admin_user.fazendas_permitidas.add(self.fazenda)
        
        self.client.force_authenticate(user=self.admin_user)
        # Multi-tenant context headers
        self.client.credentials(
            HTTP_X_FAZENDA_ID=str(self.fazenda.id),
            HTTP_X_SAFRA_ID=str(self.safra.id)
        )

    def test_create_and_read_turma_terceirizada_with_qtd_pessoas(self):
        url = reverse('turma-terceirizada-list')
        data = {
            "fazenda": self.fazenda.id,
            "nome": "TURMA COPA 01",
            "responsavel": "MARIO SOUZA",
            "qtd_pessoas": 15
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['qtd_pessoas'], 15)

        # Verify DB
        turma = TurmaTerceirizada.objects.get(id=response.data['id'])
        self.assertEqual(turma.qtd_pessoas, 15)
        self.assertEqual(turma.nome, "TURMA COPA 01")

        # Read list
        response_list = self.client.get(url, format='json')
        self.assertEqual(response_list.status_code, status.HTTP_200_OK)
        results = response_list.data.get('results', response_list.data) if isinstance(response_list.data, dict) else response_list.data
        self.assertTrue(any(t['id'] == turma.id and t['qtd_pessoas'] == 15 for t in results))


class Phase9ImplementationTests(APITestCase):
    def setUp(self):
        self.proprietario = Proprietario.objects.create(nome="Proprietario Teste", documento="11122233344")
        self.fazenda_origem = Fazenda.objects.create(nome="Fazenda Origem", proprietario=self.proprietario, sigla="FZO")
        self.fazenda_destino = Fazenda.objects.create(nome="Fazenda Destino", proprietario=self.proprietario, sigla="FZD")
        
        self.safra_origem = Safra.objects.create(nome="Safra Teste", fazenda=self.fazenda_origem, data_inicio="2026-01-01", data_fim="2026-12-31", ativa=True)
        self.safra_destino = Safra.objects.create(nome="Safra Teste", fazenda=self.fazenda_destino, data_inicio="2026-01-01", data_fim="2026-12-31", ativa=True)

        self.perfil_admin, _ = Perfil.objects.get_or_create(nome="Administrador", nivel=1)
        self.admin_user = User.objects.create_user(
            username="admin_cad_test", email="admin_cad_test@test.com", password="password123",
            perfil=self.perfil_admin
        )
        self.admin_user.fazendas_permitidas.add(self.fazenda_origem)
        self.admin_user.fazendas_permitidas.add(self.fazenda_destino)
        
        self.client.force_authenticate(user=self.admin_user)
        self.client.credentials(
            HTTP_X_FAZENDA_ID=str(self.fazenda_origem.id),
            HTTP_X_SAFRA_ID=str(self.safra_origem.id)
        )

        self.tipo_maquina = TipoMaquina.objects.create(nome="Trator")
        self.grupo_trabalhador = GrupoTrabalhador.objects.create(nome="Regular")
        self.unidade = UnidadeMedida.objects.create(sigla="KG", nome="Quilograma")
        self.classificacao = ClassificacaoProduto.objects.create(nome="Defensivo")

    def test_transferencia_maquina_updates_fazenda(self):
        maquina = Maquina.objects.create(
            fazenda=self.fazenda_origem,
            codigo="TR-01",
            descricao="Trator John Deere",
            tipo=self.tipo_maquina,
            propria=True
        )
        url = reverse('transferencia-ativo-list')
        data = {
            "tipo_ativo": "MAQUINA",
            "maquina": maquina.id,
            "origem": self.fazenda_origem.id,
            "destino": self.fazenda_destino.id,
            "data_transferencia": "2026-06-22"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify machine has been moved to destination farm
        maquina.refresh_from_db()
        self.assertEqual(maquina.fazenda, self.fazenda_destino)

    def test_transferencia_funcionario_updates_fazenda(self):
        funcionario = Funcionario.objects.create(
            fazenda=self.fazenda_origem,
            nome="Jose Silva",
            grupo_trabalhador=self.grupo_trabalhador
        )
        url = reverse('transferencia-ativo-list')
        data = {
            "tipo_ativo": "FUNCIONARIO",
            "funcionario": funcionario.id,
            "origem": self.fazenda_origem.id,
            "destino": self.fazenda_destino.id,
            "data_transferencia": "2026-06-22"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify employee has been moved to destination farm
        funcionario.refresh_from_db()
        self.assertEqual(funcionario.fazenda, self.fazenda_destino)

    def test_locacao_maquina_generates_contas_a_pagar(self):
        maquina = Maquina.objects.create(
            fazenda=self.fazenda_origem,
            codigo="TR-02_ALUGADO",
            descricao="Trator Alugado Caterpillar",
            tipo=self.tipo_maquina,
            propria=False
        )
        url = reverse('locacao-maquina-list')
        data = {
            "maquina": maquina.id,
            "safra": self.safra_origem.id,
            "fazenda": self.fazenda_origem.id,
            "tipo_cobranca": "DIA",
            "quantidade": 10.00,
            "valor_unitario": 500.00,
            "data_inicio": "2026-06-01",
            "data_fim": "2026-06-10",
            "data_vencimento": "2026-07-01",
            "observacao": "Locação de teste"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify accounts payable entry
        locacao = LocacaoMaquina.objects.get(id=response.data['id'])
        self.assertIsNotNone(locacao.contas_a_pagar)
        self.assertEqual(locacao.valor_total, 5000.00)
        self.assertEqual(locacao.contas_a_pagar.valor, 5000.00)
        self.assertEqual(locacao.contas_a_pagar.status, 'PENDENTE')

    def test_symmetric_product_transfer(self):
        produto_origem = Produto.objects.create(
            fazenda=self.fazenda_origem,
            safra=self.safra_origem,
            codigo="PROD-01",
            nome_comercial="HERBICIDA ALFA",
            unidade=self.unidade,
            classificacao=self.classificacao
        )
        # Create initial stock at origin so balance check passes
        EstoqueMovimento.objects.create(
            fazenda=self.fazenda_origem,
            safra=self.safra_origem,
            produto=produto_origem,
            tipo_movimento='ENTRADA',
            quantidade=100.00,
            valor_unitario=50.00,
            valor_total=5000.00,
            data_movimento="2026-06-01"
        )
        
        url = reverse('estoque-movimento-list')
        data = {
            "tipo_movimento": "TRANSFERENCIA",
            "produto": produto_origem.id,
            "quantidade": 30.00,
            "valor_unitario": 50.00,
            "data_movimento": "2026-06-22",
            "origem_transferencia": self.fazenda_origem.id,
            "destino_transferencia": self.fazenda_destino.id,
            "observacao": "Transferencia de 30 unidades"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify both outflow and inflow records exist in database
        outflow = EstoqueMovimento.objects.get(id=response.data['id'])
        self.assertEqual(outflow.tipo_movimento, 'TRANSFERENCIA')
        self.assertEqual(outflow.fazenda, self.fazenda_origem)
        self.assertEqual(outflow.quantidade, 30.00)
        
        inflow = outflow.transferencia_vinculada
        self.assertIsNotNone(inflow)
        self.assertEqual(inflow.tipo_movimento, 'TRANSFERENCIA')
        self.assertEqual(inflow.fazenda, self.fazenda_destino)
        self.assertEqual(inflow.safra, self.safra_destino)
        self.assertEqual(inflow.quantidade, 30.00)
        
        # Verify destination product was automatically cloned
        produto_destino = inflow.produto
        self.assertNotEqual(produto_destino.id, produto_origem.id)
        self.assertEqual(produto_destino.nome_comercial, produto_origem.nome_comercial)
        self.assertEqual(produto_destino.fazenda, self.fazenda_destino)
        self.assertEqual(produto_destino.safra, self.safra_destino)
