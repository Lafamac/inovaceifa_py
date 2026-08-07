from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from core.models import Fazenda, Safra, Proprietario
from referencias.models import TipoOperacao, GrupoTrabalhador
from accounts.models import Perfil
from cadastros.models import Talhao, Produto, Terceirizado, TurmaTerceirizada
from planejamento.models import PlanejamentoSafra, OrdemServicoPlanejada, ItemInsumoOSPlanejado, OrdemServicoPlanejadaTalhao
from operacoes.models import OrdemServico

User = get_user_model()

class PlanejamentoAPITests(APITestCase):

    def setUp(self):
        # 1. Perfil e Usuários
        self.perfil_admin, _ = Perfil.objects.get_or_create(nome="Administrador", nivel=1)
        self.perfil_operator, _ = Perfil.objects.get_or_create(nome="Operador", nivel=3)

        self.proprietario = Proprietario.objects.create(
            nome="Proprietario Teste", email="prop@teste.com"
        )

        self.admin_user = User.objects.create_user(
            username="admin", email="admin@test.com", password="password123",
            perfil=self.perfil_admin
        )
        self.operator_user = User.objects.create_user(
            username="operator", email="operator@test.com", password="password123",
            perfil=self.perfil_operator
        )

        # 2. Fazenda e Safra
        self.fazenda = Fazenda.objects.create(
            nome="Fazenda Teste", sigla="FT", proprietario=self.proprietario
        )
        self.admin_user.fazendas_permitidas.add(self.fazenda)
        self.operator_user.fazendas_permitidas.add(self.fazenda)

        self.safra = Safra.objects.create(
            fazenda=self.fazenda, nome="Safra 2026", data_inicio="2026-01-01", data_fim="2026-12-31", ativa=True
        )

        # 0. Referências auxiliares
        from referencias.models import Cultura, TipoIrrigacao, UnidadeMedida, ClassificacaoProduto
        self.cultura, _ = Cultura.objects.get_or_create(nome="Café Arábica")
        self.irrigacao, _ = TipoIrrigacao.objects.get_or_create(nome="Gotejamento")
        self.unidade, _ = UnidadeMedida.objects.get_or_create(nome="Kilograma", sigla="kg")
        self.classif, _ = ClassificacaoProduto.objects.get_or_create(nome="Fertilizante")

        # 3. Talhões
        self.talhao1 = Talhao.objects.create(
            fazenda=self.fazenda, codigo="T1", nome="Talhão 1", area=10.0,
            tipo_irrigacao=self.irrigacao, cultura=self.cultura
        )
        self.talhao2 = Talhao.objects.create(
            fazenda=self.fazenda, codigo="T2", nome="Talhão 2", area=15.0,
            tipo_irrigacao=self.irrigacao, cultura=self.cultura
        )

        # 4. Produto
        self.produto = Produto.objects.create(
            nome_comercial="NPK Teste", unidade=self.unidade, classificacao=self.classif,
            concentracao="10-10-10"
        )

        # 5. Tipo Operação
        self.tipo_operacao = TipoOperacao.objects.create(
            nome="Adubação Foliar"
        )

        # 6. Terceirizado
        self.terceirizado = Terceirizado.objects.create(
            fazenda=self.fazenda, nome="Terceirizado Teste", documento="12345678901", cargo="Panha"
        )

        # 7. TurmaTerceirizada
        self.turma_terceirizada = TurmaTerceirizada.objects.create(
            fazenda=self.fazenda, nome="Turma Teste", responsavel="Líder", qtd_pessoas=15
        )

        # URLs
        self.list_url = reverse('planejamento-list')

    def test_admin_can_create_planejamento(self):
        self.client.force_authenticate(user=self.admin_user)
        self.client.credentials(HTTP_X_SAFRA_ID=str(self.safra.id), HTTP_X_FAZENDA_ID=str(self.fazenda.id))
        
        data = {
            "fazenda": self.fazenda.id,
            "safra": self.safra.id,
            "descricao": "Meu Planejamento de Safra",
            "data_planejamento": "2026-05-19",
            "observacao": "Alguma obs"
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PlanejamentoSafra.objects.count(), 1)
        self.assertEqual(PlanejamentoSafra.objects.first().descricao, "Meu Planejamento de Safra")

    def test_operator_cannot_create_planejamento(self):
        self.client.force_authenticate(user=self.operator_user)
        self.client.credentials(HTTP_X_SAFRA_ID=str(self.safra.id), HTTP_X_FAZENDA_ID=str(self.fazenda.id))
        
        data = {
            "fazenda": self.fazenda.id,
            "safra": self.safra.id,
            "descricao": "Tentativa Operador",
            "data_planejamento": "2026-05-19"
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_automatic_insumo_calculation_and_overwrite(self):
        planejamento = PlanejamentoSafra.objects.create(
            fazenda=self.fazenda, safra=self.safra,
            descricao="Plan Calc", data_planejamento="2026-05-19"
        )
        self.client.force_authenticate(user=self.admin_user)
        self.client.credentials(HTTP_X_SAFRA_ID=str(self.safra.id), HTTP_X_FAZENDA_ID=str(self.fazenda.id))

        os_data = {
            "planejamento": planejamento.id,
            "tipo_operacao": self.tipo_operacao.id,
            "data_inicio_planejada": "2026-05-20",
            "data_fim_planejada": "2026-05-22",
            "talhoes_ids": [self.talhao1.id, self.talhao2.id],
            "insumos": [
                {
                    "produto": self.produto.id,
                    "dose_planejada": "2.0000"
                }
            ]
        }
        os_url = reverse('planejamento-os-list')
        response = self.client.post(os_url, os_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        os_plan = OrdemServicoPlanejada.objects.first()
        insumo = os_plan.insumos.first()
        self.assertEqual(float(insumo.quantidade_planejada), 50.0)

        os_data_manual = {
            "planejamento": planejamento.id,
            "tipo_operacao": self.tipo_operacao.id,
            "data_inicio_planejada": "2026-05-20",
            "data_fim_planejada": "2026-05-22",
            "talhoes_ids": [self.talhao1.id, self.talhao2.id],
            "insumos": [
                {
                    "produto": self.produto.id,
                    "dose_planejada": "2.0000",
                    "quantidade_planejada": "80.0000"
                }
            ]
        }
        response_manual = self.client.post(os_url, os_data_manual, format='json')
        self.assertEqual(response_manual.status_code, status.HTTP_201_CREATED)
        
        os_plan_manual = OrdemServicoPlanejada.objects.filter(insumos__quantidade_planejada=80.0).first()
        self.assertIsNotNone(os_plan_manual)

    def test_approval_locks_planning(self):
        planejamento = PlanejamentoSafra.objects.create(
            fazenda=self.fazenda, safra=self.safra,
            descricao="Plan Lock", data_planejamento="2026-05-19",
            aprovado=True
        )
        self.client.force_authenticate(user=self.admin_user)
        self.client.credentials(HTTP_X_SAFRA_ID=str(self.safra.id), HTTP_X_FAZENDA_ID=str(self.fazenda.id))

        os_data = {
            "planejamento": planejamento.id,
            "tipo_operacao": self.tipo_operacao.id,
            "data_inicio_planejada": "2026-05-20",
            "data_fim_planejada": "2026-05-22"
        }
        os_url = reverse('planejamento-os-list')
        response = self.client.post(os_url, os_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("já está Aprovado", str(response.data))

    def test_generate_real_ordens_servico(self):
        planejamento = PlanejamentoSafra.objects.create(
            fazenda=self.fazenda, safra=self.safra,
            descricao="Plan Real", data_planejamento="2026-05-19",
            aprovado=False
        )
        os_plan = OrdemServicoPlanejada.objects.create(
            planejamento=planejamento, tipo_operacao=self.tipo_operacao,
            data_inicio_planejada="2026-05-20", data_fim_planejada="2026-05-22",
            terceirizado=self.terceirizado, usar_turma=True,
            valor_planejado_turma=1500.00
        )
        OrdemServicoPlanejadaTalhao.objects.create(ordem_servico_planejada=os_plan, talhao=self.talhao1)
        ItemInsumoOSPlanejado.objects.create(
            ordem_servico_planejada=os_plan, produto=self.produto,
            dose_planejada=2.5, quantidade_planejada=25.0
        )

        self.client.force_authenticate(user=self.admin_user)
        self.client.credentials(HTTP_X_SAFRA_ID=str(self.safra.id), HTTP_X_FAZENDA_ID=str(self.fazenda.id))

        gen_url = reverse('planejamento-gerar-ordens-servico', args=[planejamento.id])
        response = self.client.post(gen_url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        planejamento.refresh_from_db()
        self.assertTrue(planejamento.aprovado)

        self.assertEqual(OrdemServico.objects.count(), 1)
        os_real = OrdemServico.objects.first()
        self.assertEqual(os_real.status, 'APROVADA')
        self.assertEqual(os_real.origem_planejada, os_plan)
        self.assertEqual(os_real.terceirizado_planejado, self.terceirizado)
        self.assertTrue(os_real.usar_turma)
        self.assertEqual(float(os_real.valor_planejado_turma), 1500.00)
        
        self.assertEqual(os_real.talhoes.count(), 1)
        self.assertEqual(os_real.talhoes.first().talhao, self.talhao1)

        self.assertEqual(os_real.insumos.count(), 1)
        insumo_real = os_real.insumos.first()
        self.assertEqual(float(insumo_real.dose_planejada), 2.5)
        self.assertEqual(float(insumo_real.quantidade_planejada), 25.0)

    def test_planned_end_date_cannot_be_before_start_date(self):
        planejamento = PlanejamentoSafra.objects.create(
            fazenda=self.fazenda, safra=self.safra,
            descricao="Plan Date Test", data_planejamento="2026-05-19"
        )
        self.client.force_authenticate(user=self.admin_user)
        self.client.credentials(HTTP_X_SAFRA_ID=str(self.safra.id), HTTP_X_FAZENDA_ID=str(self.fazenda.id))

        os_data = {
            "planejamento": planejamento.id,
            "tipo_operacao": self.tipo_operacao.id,
            "data_inicio_planejada": "2026-05-22",
            "data_fim_planejada": "2026-05-20",  # Invalid: end < start
            "talhoes_ids": [self.talhao1.id]
        }
        os_url = reverse('planejamento-os-list')
        response = self.client.post(os_url, os_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("término planejado não pode ser menor", str(response.data))

    def test_ad_hoc_product_creation_and_purchase_order(self):
        planejamento = PlanejamentoSafra.objects.create(
            fazenda=self.fazenda, safra=self.safra,
            descricao="Plan AdHoc", data_planejamento="2026-05-19"
        )
        self.client.force_authenticate(user=self.admin_user)
        self.client.credentials(HTTP_X_SAFRA_ID=str(self.safra.id), HTTP_X_FAZENDA_ID=str(self.fazenda.id))

        os_data = {
            "planejamento": planejamento.id,
            "tipo_operacao": self.tipo_operacao.id,
            "data_inicio_planejada": "2026-05-20",
            "data_fim_planejada": "2026-05-22",
            "talhoes_ids": [self.talhao1.id],
            "insumos": [
                {
                    "produto_nome_novo": "ADUBO SECRETO XPTO",
                    "unidade_sigla": "kg",
                    "dose_planejada": "3.0000",
                    "quantidade_planejada": "30.0000"
                }
            ]
        }
        os_url = reverse('planejamento-os-list')
        response = self.client.post(os_url, os_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify product created
        self.assertTrue(Produto.objects.filter(nome_comercial="ADUBO SECRETO XPTO", fazenda=self.fazenda).exists())
        prod_created = Produto.objects.get(nome_comercial="ADUBO SECRETO XPTO", fazenda=self.fazenda)

        # Verify PO created with total quantity
        from financeiro.models import PedidoCompra, ItemPedidoCompra
        self.assertTrue(PedidoCompra.objects.filter(fazenda=self.fazenda, de_planejamento=True, status='RASCUNHO').exists())
        po = PedidoCompra.objects.get(fazenda=self.fazenda, de_planejamento=True, status='RASCUNHO')
        self.assertTrue(ItemPedidoCompra.objects.filter(pedido_compra=po, produto=prod_created).exists())
        po_item = ItemPedidoCompra.objects.get(pedido_compra=po, produto=prod_created)
        self.assertEqual(float(po_item.quantidade), 30.0)

    def test_deficit_calculation_with_existing_stock(self):
        # 1. Add some initial stock
        from cadastros.models import EstoqueMovimento
        from decimal import Decimal
        EstoqueMovimento.objects.create(
            fazenda=self.fazenda,
            safra=self.safra,
            produto=self.produto,
            tipo_movimento='ENTRADA',
            quantidade=Decimal('20.0000'),
            valor_unitario=Decimal('10.0000'),
            valor_total=Decimal('200.00'),
            data_movimento="2026-05-18",
            documento_referencia="Initial stock"
        )

        planejamento = PlanejamentoSafra.objects.create(
            fazenda=self.fazenda, safra=self.safra,
            descricao="Plan Deficit", data_planejamento="2026-05-19"
        )
        self.client.force_authenticate(user=self.admin_user)
        self.client.credentials(HTTP_X_SAFRA_ID=str(self.safra.id), HTTP_X_FAZENDA_ID=str(self.fazenda.id))

        # Case A: Plan 50 units. Deficit = 50 - 20 = 30 units.
        os_data = {
            "planejamento": planejamento.id,
            "tipo_operacao": self.tipo_operacao.id,
            "data_inicio_planejada": "2026-05-20",
            "data_fim_planejada": "2026-05-22",
            "talhoes_ids": [self.talhao1.id],
            "insumos": [
                {
                    "produto": self.produto.id,
                    "dose_planejada": "5.0000",
                    "quantidade_planejada": "50.0000"
                }
            ]
        }
        os_url = reverse('planejamento-os-list')
        response = self.client.post(os_url, os_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        from financeiro.models import PedidoCompra, ItemPedidoCompra
        po = PedidoCompra.objects.get(fazenda=self.fazenda, de_planejamento=True, status='RASCUNHO')
        po_item = ItemPedidoCompra.objects.get(pedido_compra=po, produto=self.produto)
        self.assertEqual(float(po_item.quantidade), 30.0)  # 50 planned - 20 stock = 30 required

        # Case B: Update plan to 15 units. Stock (20) >= 15, so deficit <= 0. PO item should be removed.
        os_plan = OrdemServicoPlanejada.objects.first()
        os_data_update = {
            "planejamento": planejamento.id,
            "tipo_operacao": self.tipo_operacao.id,
            "data_inicio_planejada": "2026-05-20",
            "data_fim_planejada": "2026-05-22",
            "talhoes_ids": [self.talhao1.id],
            "insumos": [
                {
                    "produto": self.produto.id,
                    "dose_planejada": "1.5000",
                    "quantidade_planejada": "15.0000"
                }
            ]
        }
        update_url = reverse('planejamento-os-detail', args=[os_plan.id])
        response_update = self.client.put(update_url, os_data_update, format='json')
        self.assertEqual(response_update.status_code, status.HTTP_200_OK)

        # PO shouldn't contain product anymore
        self.assertFalse(ItemPedidoCompra.objects.filter(pedido_compra=po, produto=self.produto).exists())

    def test_multi_plan_safra_consolidation(self):
        # Plan 30 in Plan 1 and Plan 40 in Plan 2. Stock is 10. Required = (30 + 40) - 10 = 60.
        from cadastros.models import EstoqueMovimento
        from decimal import Decimal
        EstoqueMovimento.objects.create(
            fazenda=self.fazenda, safra=self.safra, produto=self.produto,
            tipo_movimento='ENTRADA', quantidade=Decimal('10.0000'), data_movimento="2026-05-18"
        )

        plan1 = PlanejamentoSafra.objects.create(fazenda=self.fazenda, safra=self.safra, descricao="Plan 1", data_planejamento="2026-05-19")
        plan2 = PlanejamentoSafra.objects.create(fazenda=self.fazenda, safra=self.safra, descricao="Plan 2", data_planejamento="2026-05-19")

        self.client.force_authenticate(user=self.admin_user)
        self.client.credentials(HTTP_X_SAFRA_ID=str(self.safra.id), HTTP_X_FAZENDA_ID=str(self.fazenda.id))

        os_url = reverse('planejamento-os-list')

        # Add OS to Plan 1
        self.client.post(os_url, {
            "planejamento": plan1.id, "tipo_operacao": self.tipo_operacao.id,
            "data_inicio_planejada": "2026-05-20", "data_fim_planejada": "2026-05-22",
            "talhoes_ids": [self.talhao1.id],
            "insumos": [{"produto": self.produto.id, "dose_planejada": "3.0000", "quantidade_planejada": "30.0000"}]
        }, format='json')

        # Add OS to Plan 2
        self.client.post(os_url, {
            "planejamento": plan2.id, "tipo_operacao": self.tipo_operacao.id,
            "data_inicio_planejada": "2026-05-20", "data_fim_planejada": "2026-05-22",
            "talhoes_ids": [self.talhao1.id],
            "insumos": [{"produto": self.produto.id, "dose_planejada": "4.0000", "quantidade_planejada": "40.0000"}]
        }, format='json')

        from financeiro.models import PedidoCompra, ItemPedidoCompra
        po = PedidoCompra.objects.get(fazenda=self.fazenda, de_planejamento=True, status='RASCUNHO')
        po_item = ItemPedidoCompra.objects.get(pedido_compra=po, produto=self.produto)
        self.assertEqual(float(po_item.quantidade), 60.0)

