from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from core.models import Fazenda, Safra, Proprietario
from referencias.models import UnidadeMedida, ClassificacaoProduto, TipoOperacao
from cadastros.models import Produto, EstoqueMovimento
from financeiro.models import PedidoCompra, ItemPedidoCompra, ContasAPagar
from operacoes.models import OrdemServico, ApontamentoOperacao
from accounts.models import Perfil

User = get_user_model()

class FinanceiroAPITests(APITestCase):
    def setUp(self):
        # 1. Setup Tenant e Usuário
        self.proprietario = Proprietario.objects.create(nome="Prop Proprietario", documento="99999999999")
        self.fazenda = Fazenda.objects.create(nome="Fazenda Financeira", proprietario=self.proprietario, sigla="FFI")
        self.safra = Safra.objects.create(nome="Safra 2026", fazenda=self.fazenda, data_inicio="2026-01-01", data_fim="2026-12-31")
        
        self.perfil_admin, _ = Perfil.objects.get_or_create(nome="Administrador", nivel=1)
        self.user = User.objects.create_user(
            username="finance_user", email="finance@test.com", password="password123",
            perfil=self.perfil_admin
        )
        self.user.fazendas_permitidas.add(self.fazenda)

        # 2. Setup Cadastros
        self.unidade = UnidadeMedida.objects.create(nome="Saco", sigla="SC")
        self.classificacao = ClassificacaoProduto.objects.create(nome="Insumos")
        self.produto = Produto.objects.create(
            nome_comercial="Fertilizante Premium",
            unidade=self.unidade,
            classificacao=self.classificacao
        )

        # 3. Autenticação e Headers do DRF
        self.client.force_authenticate(user=self.user)
        self.client.credentials(HTTP_X_SAFRA_ID=str(self.safra.id), HTTP_X_FAZENDA_ID=str(self.fazenda.id))

    def test_criar_pedido_e_recalculo_valor_total(self):
        # 1. Criar o pedido via API
        pedido_url = reverse('pedido-compra-list')
        pedido_data = {
            "fazenda": self.fazenda.id,
            "safra": self.safra.id,
            "fornecedor": "Fornecedor Teste Ltda",
            "data_pedido": "2026-05-19",
            "status": "RASCUNHO"
        }
        response = self.client.post(pedido_url, pedido_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        pedido_id = response.data['id']

        # 2. Adicionar itens e checar se o total é recalculado automaticamente
        item_url = reverse('item-pedido-compra-list')
        item_data = {
            "pedido_compra": pedido_id,
            "produto": self.produto.id,
            "quantidade": "10.0000",
            "valor_unitario": "50.0000"
        }
        res_item = self.client.post(item_url, item_data, format='json')
        self.assertEqual(res_item.status_code, status.HTTP_201_CREATED)

        # Checar o valor total do pedido
        pedido = PedidoCompra.objects.get(id=pedido_id)
        self.assertEqual(pedido.valor_total, 500.00)

        # Adicionar mais um item
        item_data_2 = {
            "pedido_compra": pedido_id,
            "produto": self.produto.id,
            "quantidade": "5.0000",
            "valor_unitario": "100.0000"
        }
        self.client.post(item_url, item_data_2, format='json')

        pedido.refresh_from_db()
        self.assertEqual(pedido.valor_total, 1000.00) # 500 + 500

    def test_receber_pedido_gera_contas_pagar_e_entrada_estoque(self):
        # 1. Preparar Pedido Aprovado
        pedido = PedidoCompra.objects.create(
            fazenda=self.fazenda,
            safra=self.safra,
            fornecedor="Fornecedor Parceria",
            data_pedido="2026-05-19",
            status="APROVADO"
        )
        ItemPedidoCompra.objects.create(
            pedido_compra=pedido,
            produto=self.produto,
            quantidade=20,
            valor_unitario=60,
            valor_total=1200
        )
        pedido.refresh_from_db()

        # 2. Chamar endpoint receber
        receber_url = reverse('pedido-compra-receber', args=[pedido.id])
        response = self.client.post(receber_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 3. Validar se status do pedido virou RECEBIDO
        pedido.refresh_from_db()
        self.assertEqual(pedido.status, 'RECEBIDO')

        # 4. Validar se Contas a Pagar correspondente foi criado
        contas = ContasAPagar.objects.filter(pedido_compra=pedido)
        self.assertTrue(contas.exists())
        self.assertEqual(contas.count(), 1)
        self.assertEqual(contas.first().valor, 1200.00)
        self.assertEqual(contas.first().status, 'PENDENTE')

        # 5. Validar se movimentação de ENTRADA do estoque foi criada
        movimentos = EstoqueMovimento.objects.filter(documento_referencia=f"Pedido #{pedido.id}")
        self.assertTrue(movimentos.exists())
        self.assertEqual(movimentos.count(), 1)
        self.assertEqual(movimentos.first().tipo_movimento, 'ENTRADA')
        self.assertEqual(movimentos.first().quantidade, 20.0000)
        self.assertEqual(movimentos.first().valor_unitario, 60.0000)
        self.assertEqual(movimentos.first().valor_total, 1200.00)

    def test_conclusao_os_gera_saida_estoque(self):
        # 1. Setup OS e Apontamento
        tipo_op = TipoOperacao.objects.create(nome="Adubação Foliar")
        os = OrdemServico.objects.create(
            fazenda=self.fazenda,
            safra=self.safra,
            tipo_operacao=tipo_op,
            data_inicio_planejada="2026-06-01",
            data_fim_planejada="2026-06-02",
            status="EM_EXECUCAO"
        )
        os.insumos.create(produto=self.produto, quantidade_planejada=50.0000)

        apt = ApontamentoOperacao.objects.create(
            ordem_servico=os,
            data_apontamento="2026-06-01"
        )
        apt.insumos.create(produto=self.produto, quantidade_total=45.0000)

        # 2. Concluir OS
        url_concluir = reverse('operacao-ordem-servico-concluir', args=[os.id])
        response = self.client.post(url_concluir, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 3. Validar se EstoqueMovimento com tipo SAIDA foi gerado para a OS
        movimentos = EstoqueMovimento.objects.filter(documento_referencia=f"OS #{os.id}")
        self.assertTrue(movimentos.exists())
        self.assertEqual(movimentos.count(), 1)
        self.assertEqual(movimentos.first().tipo_movimento, 'SAIDA')
        self.assertEqual(movimentos.first().quantidade, 45.0000)
