from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from core.models import Fazenda, Safra, Proprietario
from referencias.models import TipoOperacao, UnidadeMedida, ClassificacaoProduto, TipoMaquina, GrupoTrabalhador, CriterioRateio, ContaGerencial
from cadastros.models import Produto, Talhao, Maquina, Funcionario, EstoqueMovimento
from planejamento.models import PlanejamentoSafra, OrdemServicoPlanejada
from operacoes.models import OrdemServico, ApontamentoOperacao, AuditoriaOrdemServico, GastoRateioRealizado, RateioTalhao, AbastecimentoMaquina, RateioOperacional
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

    def test_sharing_resources_same_owner(self):
        # Create a second farm for the same owner
        self.fazenda_b = Fazenda.objects.create(nome="Fazenda B", proprietario=self.proprietario, sigla="FZB")
        self.admin_user.fazendas_permitidas.add(self.fazenda_b)
        
        # Create TipoMaquina and GrupoTrabalhador references
        tipo_maq = TipoMaquina.objects.create(nome="Trator")
        grupo_func = GrupoTrabalhador.objects.create(nome="Tratoristas")

        # Create a machine and employee under Fazenda B
        self.maquina_b = Maquina.objects.create(
            codigo="MAQ-B",
            descricao="Trator John Deere",
            fazenda=self.fazenda_b,
            ano_fabricacao=2020,
            tipo=tipo_maq
        )
        self.funcionario_b = Funcionario.objects.create(
            nome="Funcionario B",
            fazenda=self.fazenda_b,
            cargo="Operador",
            grupo_trabalhador=grupo_func
        )
        
        # Iniciar OS on the first farm (self.fazenda)
        url_iniciar = reverse('operacao-ordem-servico-iniciar', args=[self.os_real.id])
        self.client.post(url_iniciar, format='json')
        
        # Create Apontamento
        ap_id = self.client.post(reverse('operacao-apontamento-list'), {
            "ordem_servico": self.os_real.id, "data_apontamento": "2026-06-01"
        }, format='json').data['id']
        
        # Add pointing with resources from the sister farm (self.fazenda_b)
        res_maq = self.client.post(reverse('operacao-apontamento-maquina-list'), {
            "apontamento": ap_id,
            "maquina": self.maquina_b.id,
            "horimetro_inicial": "100.00",
            "horimetro_final": "108.00"
        }, format='json')
        self.assertEqual(res_maq.status_code, status.HTTP_201_CREATED)
        
        res_func = self.client.post(reverse('operacao-apontamento-funcionario-list'), {
            "apontamento": ap_id,
            "funcionario": self.funcionario_b.id,
            "horas_trabalhadas": "8.00"
        }, format='json')
        self.assertEqual(res_func.status_code, status.HTTP_201_CREATED)
        
        # Concluir OS
        url_concluir = reverse('operacao-ordem-servico-concluir', args=[self.os_real.id])
        response = self.client.post(url_concluir, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.os_real.refresh_from_db()
        self.assertEqual(self.os_real.status, 'CONCLUIDA')

    def test_abastecimento_estoque_sync(self):
        # 1. Setup machine and diesel product
        tipo_maq = TipoMaquina.objects.create(nome="Trator")
        maquina = Maquina.objects.create(
            codigo="TR-AB", descricao="Trator Abastecimento",
            fazenda=self.fazenda, tipo=tipo_maq
        )
        diesel = Produto.objects.create(
            nome_comercial="Óleo Diesel S10",
            unidade=self.unidade,
            classificacao=self.classificacao
        )

        # 2. Post Abastecimento via API
        url = reverse('operacao-abastecimento-list')
        data = {
            "fazenda": self.fazenda.id,
            "safra": self.safra.id,
            "maquina": maquina.id,
            "data_abastecimento": "2026-06-01",
            "combustivel": diesel.id,
            "quantidade": "50.00",
            "valor_unitario": "6.0000",
            "valor_total": "300.00",
            "horimetro": "120.50",
            "observacao": "Abastecimento Teste"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        ab_id = res.data['id']

        # Verify stock movement SAIDA was created
        mov = EstoqueMovimento.objects.filter(
            documento_referencia=f"ABASTECIMENTO #{ab_id}",
            tipo_movimento='SAIDA'
        )
        self.assertTrue(mov.exists())
        self.assertEqual(float(mov.first().quantidade), 50.00)

        # 3. Delete Abastecimento
        url_del = reverse('operacao-abastecimento-detail', args=[ab_id])
        res_del = self.client.delete(url_del)
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)

        # Verify stock movement was inactivated
        mov = EstoqueMovimento.objects.filter(documento_referencia=f"ABASTECIMENTO #{ab_id}")
        self.assertFalse(mov.filter(ativo=True).exists())

    def test_apontamento_turma_contas_a_pagar_sync(self):
        from cadastros.models import TurmaTerceirizada
        from financeiro.models import ContasAPagar
        from operacoes.models import ApontamentoTurma
        
        # 1. Criar Turma Terceirizada
        turma = TurmaTerceirizada.objects.create(
            fazenda=self.fazenda,
            nome="TURMA DO CAFE TESTE",
            responsavel="LIDER TESTE",
            qtd_pessoas=10
        )
        
        # 2. Iniciar OS
        url_iniciar = reverse('operacao-ordem-servico-iniciar', args=[self.os_real.id])
        self.client.post(url_iniciar, format='json')
        
        # 3. Criar Apontamento
        ap_id = self.client.post(reverse('operacao-apontamento-list'), {
            "ordem_servico": self.os_real.id, "data_apontamento": "2026-06-01"
        }, format='json').data['id']
        
        # 4. Registrar Apontamento de Turma via API
        url_turma = reverse('operacao-apontamento-turma-list')
        data = {
            "apontamento": ap_id,
            "turma": turma.id,
            "valor_total": "1500.00",
            "data_vencimento": "2026-06-15"
        }
        res = self.client.post(url_turma, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        apt_turma_id = res.data['id']
        
        # 5. Verificar se Contas a Pagar correspondente foi criado automaticamente
        cp_qs = ContasAPagar.objects.filter(
            descricao=f"PAGAMENTO TURMA: {turma.nome} - OS #{self.os_real.id}".upper(),
            ativo=True
        )
        self.assertTrue(cp_qs.exists())
        cp_inst = cp_qs.first()
        self.assertEqual(float(cp_inst.valor), 1500.00)
        self.assertEqual(str(cp_inst.data_vencimento), "2026-06-15")
        
        # 6. Atualizar Apontamento de Turma
        url_detail = reverse('operacao-apontamento-turma-detail', args=[apt_turma_id])
        update_data = {
            "apontamento": ap_id,
            "turma": turma.id,
            "valor_total": "1800.00",
            "data_vencimento": "2026-06-20"
        }
        res_put = self.client.put(url_detail, update_data, format='json')
        self.assertEqual(res_put.status_code, status.HTTP_200_OK)
        
        # Verificar se Contas a Pagar foi atualizado
        cp_inst.refresh_from_db()
        self.assertEqual(float(cp_inst.valor), 1800.00)
        self.assertEqual(str(cp_inst.data_vencimento), "2026-06-20")
        
        # 7. Excluir/Soft-delete Apontamento de Turma
        res_del = self.client.delete(url_detail)
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verificar se tanto ApontamentoTurma quanto ContasAPagar foram inativados
        apt_turma = ApontamentoTurma.objects.get(id=apt_turma_id)
        self.assertFalse(apt_turma.ativo)
        
        cp_inst.refresh_from_db()
        self.assertFalse(cp_inst.ativo)

    def test_rateio_distribuicao_area(self):
        # 1. Setup criterio, conta, and 2 talhões
        criterio_area = CriterioRateio.objects.create(nome="Área (Hectares)")
        conta = ContaGerencial.objects.create(nome="Energia Elétrica")
        
        from referencias.models import TipoIrrigacao, Cultura
        ti = TipoIrrigacao.objects.create(nome="Nenhum")
        cult = Cultura.objects.create(nome="Café")
        t1 = Talhao.objects.create(codigo="T01", nome="Talhao 01", area=20.00, fazenda=self.fazenda, tipo_irrigacao=ti, cultura=cult)
        t2 = Talhao.objects.create(codigo="T02", nome="Talhao 02", area=30.00, fazenda=self.fazenda, tipo_irrigacao=ti, cultura=cult)

        # 2. Post GastoRateioRealizado via API
        url = reverse('operacao-gasto-rateio-list')
        data = {
            "fazenda": self.fazenda.id,
            "safra": self.safra.id,
            "criterio_rateio": criterio_area.id,
            "conta_gerencial": conta.id,
            "valor": "1000.00",
            "data_gasto": "2026-06-01",
            "observacao": "Conta de Luz Junho"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        gasto_id = res.data['id']

        # Verify RateioTalhao was created automatically
        rateios = RateioTalhao.objects.filter(gasto_rateio_id=gasto_id, ativo=True)
        self.assertEqual(rateios.count(), 2)
        
        # Verify areas division: 20/50 = 40%, 30/50 = 60%
        # Talhao 1 should get 400.00, Talhao 2 should get 600.00
        r1 = rateios.get(talhao=t1)
        r2 = rateios.get(talhao=t2)
        self.assertEqual(float(r1.valor), 400.00)
        self.assertEqual(float(r2.valor), 600.00)
        self.assertEqual(float(r1.percentual), 40.00)
        self.assertEqual(float(r2.percentual), 60.00)

    def test_rateio_operacional_stock_and_reports(self):
        # 1. Setup
        from referencias.models import AtividadeEducampo, TipoIrrigacao, Cultura
        from cadastros.models import SalarioMensal
        ti = TipoIrrigacao.objects.create(nome="Nenhum")
        cult = Cultura.objects.create(nome="Café")
        t1 = Talhao.objects.create(codigo="T01", nome="Talhao 01", area=20.00, fazenda=self.fazenda, tipo_irrigacao=ti, cultura=cult)
        t2 = Talhao.objects.create(codigo="T02", nome="Talhao 02", area=30.00, fazenda=self.fazenda, tipo_irrigacao=ti, cultura=cult)
        
        atividade = AtividadeEducampo.objects.create(nome="Mão de Obra Geral")
        grupo_func = GrupoTrabalhador.objects.create(nome="Tratoristas")
        func = Funcionario.objects.create(nome="Funcionario Teste", fazenda=self.fazenda, cargo="Operador", grupo_trabalhador=grupo_func)
        diesel = Produto.objects.create(nome_comercial="Óleo Diesel S10", unidade=self.unidade, classificacao=self.classificacao)
        
        # 2. Post RateioOperacional via API
        url = reverse('operacao-rateio-operacional-list')
        data = {
            "safra": self.safra.id,
            "data": "2026-06-01",
            "fazenda_rateio": self.fazenda.id,
            "atividade_educampo": atividade.id,
            
            # Planejado
            "horas_homem_plan": "10.00",
            "valor_hora_homem_plan": "20.00",
            "qtd_plan": "1.00",
            "valor_unitario_plan": "100.00",
            
            # Realizado
            "funcionario_real": func.id,
            "horas_homem_real": "8.00",
            "valor_hora_homem_real": "25.00",
            "combustivel_real": diesel.id,
            "diesel_gasto_real": "50.00",
            "valor_diesel_real": "6.00",
            "qtd_real": "1.00",
            "valor_unitario_real": "120.00"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        rateio_id = res.data['id']
        
        # Verify save method autocalculated values
        rateio = RateioOperacional.objects.get(id=rateio_id)
        self.assertEqual(float(rateio.valor_total_homem_plan), 200.00)
        self.assertEqual(float(rateio.valor_total_plan), 100.00)
        self.assertEqual(float(rateio.valor_total_homem_real), 200.00)
        self.assertEqual(float(rateio.valor_total_diesel_real), 300.00)
        self.assertEqual(float(rateio.valor_total_real), 120.00)
        
        # Verify stock movement SAIDA was created automatically for diesel
        mov = EstoqueMovimento.objects.filter(
            documento_referencia=f"RATEIO #{rateio_id}",
            tipo_movimento='SAIDA'
        )
        self.assertTrue(mov.exists())
        self.assertEqual(float(mov.first().quantidade), 50.00)
        self.assertEqual(float(mov.first().valor_total), 300.00)
        
        # 3. Verify report integration
        from relatorios import services as report_services
        
        # Custo por Talhão: Total real: homem 200 + diesel 300 + outros 120 = 620
        # Distributed by area (20 / 50 = 40%, 30 / 50 = 60%):
        # T01 share real = 620 * 0.40 = 248.00
        # T02 share real = 620 * 0.60 = 372.00
        # T01 share plan = 300 (homem 200 + outros 100) * 0.40 = 120.00
        # T02 share plan = 300 * 0.60 = 180.00
        talhoes_report = report_services.custo_por_talhao(self.safra, self.fazenda)
        t1_rep = next(r for r in talhoes_report if r["talhao_id"] == t1.id)
        t2_rep = next(r for r in talhoes_report if r["talhao_id"] == t2.id)
        self.assertEqual(t1_rep["custo_real"], 248.00)
        self.assertEqual(t2_rep["custo_real"], 372.00)
        self.assertEqual(t1_rep["custo_planejado"], 120.00)
        self.assertEqual(t2_rep["custo_planejado"], 180.00)
        
        # Custo Mensal: 620 total real added to custos_rateio_operacional
        mensal_report = report_services.custo_mensal(self.safra, self.fazenda)
        month_rep = next(r for r in mensal_report if r["mes"] == "2026-06")
        self.assertEqual(month_rep["custos_rateio_operacional"], 620.00)
        
        # Mão de Obra Fixa: func should have 8.00 hours from rateio
        salario = SalarioMensal.objects.create(
            safra=self.safra, funcionario=func, mes=6, ano=2026,
            salario_base="2000.00", encargos="500.00", beneficios="200.00"
        )
        mof_report = report_services.mao_obra_fixa(self.safra, self.fazenda)
        func_rep = next(r for r in mof_report if r["funcionario_id"] == func.id and r["mes"] == "2026-06")
        self.assertEqual(func_rep["horas_trabalhadas"], 8.00)
        
        # 4. Delete RateioOperacional and check stock is inactivated
        url_del = reverse('operacao-rateio-operacional-detail', args=[rateio_id])
        res_del = self.client.delete(url_del)
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)
        
        mov = EstoqueMovimento.objects.filter(documento_referencia=f"RATEIO #{rateio_id}")
        self.assertFalse(mov.filter(ativo=True).exists())


