import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from core.models import Fazenda, Safra
from referencias.models import TipoOperacao, GrupoTrabalhador, ClassificacaoProduto, UnidadeMedida
from cadastros.models import (
    Talhao, EstimativaProducaoTalhao, Maquina, CustoMensalMaquina,
    Funcionario, SalarioMensal, Produto, EstoqueMovimento
)
from planejamento.models import PlanejamentoSafra, OrdemServicoPlanejada, OrdemServicoPlanejadaTalhao, ItemInsumoOSPlanejado
from operacoes.models import OrdemServico, OrdemServicoTalhao, ItemInsumoOSReal, ApontamentoOperacao, ApontamentoFuncionario, ApontamentoMaquina, ApontamentoInsumo
from financeiro.models import ContasAPagar, ContasAReceber

class Command(BaseCommand):
    help = "Semeia dados transacionais (Ordens de Serviço, Apontamentos, Contas a Pagar e Contas a Receber) para testar a troca de Fazenda no Painel."

    def handle(self, *args, **options):
        self.stdout.write("Iniciando semeadura de dados transacionais e financeiros...")

        # 1. Obter Fazendas e Safras
        try:
            fazenda_br = Fazenda.objects.get(sigla="BR")
            fazenda_st = Fazenda.objects.get(sigla="ST")
        except Fazenda.DoesNotExist:
            self.stdout.write(self.style.ERROR("Fazenda BR ou ST não encontradas. Certifique-se de rodar seed_cadastros primeiro."))
            return

        safra_br = Safra.objects.get(fazenda=fazenda_br, nome="2024/2025")
        safra_st = Safra.objects.get(fazenda=fazenda_st, nome="2024/2025")

        # 2. Obter ou Criar Talhões adicionais e estimativas para Sumatra para enriquecer Sumatra
        talhao_st = Talhao.objects.filter(fazenda=fazenda_st, codigo="T-01").first()
        if talhao_st:
            EstimativaProducaoTalhao.objects.get_or_create(
                talhao=talhao_st,
                safra=safra_st,
                defaults={
                    "estimativa_sacas": 750.00,
                    "produtividade_esperada": 50.00
                }
            )

        # 3. Criar Planejamentos de Safra
        plan_br, _ = PlanejamentoSafra.objects.get_or_create(
            fazenda=fazenda_br,
            safra=safra_br,
            defaults={
                "aprovado": True,
                "descricao": f"Planejamento Inicial {fazenda_br.nome}",
                "data_planejamento": datetime.date(2024, 9, 1)
            }
        )
        plan_st, _ = PlanejamentoSafra.objects.get_or_create(
            fazenda=fazenda_st,
            safra=safra_st,
            defaults={
                "aprovado": True,
                "descricao": f"Planejamento Inicial {fazenda_st.nome}",
                "data_planejamento": datetime.date(2024, 9, 1)
            }
        )

        # 4. Obter Tipos de Operação
        tipo_pulv = TipoOperacao.objects.filter(nome__icontains="Pulveriza").first()
        tipo_adub = TipoOperacao.objects.filter(nome__icontains="Aduba").first()
        tipo_colh = TipoOperacao.objects.filter(nome__icontains="Colheita Mec").first()

        if not tipo_pulv or not tipo_adub or not tipo_colh:
            self.stdout.write(self.style.ERROR("Tipos de operação padrão não encontrados. Rode seed_referencias primeiro."))
            return

        # 5. Máquinas e Funcionários para Sumatra para não compartilhar Bragas
        grupo_trat = GrupoTrabalhador.objects.first()
        func_st, _ = Funcionario.objects.get_or_create(
            fazenda=fazenda_st,
            nome="Francisco Alves",
            defaults={
                "cpf": "222.333.444-55",
                "cargo": "Operador de Colhedora",
                "grupo_trabalhador": grupo_trat,
                "salario": 2500.00
            }
        )
        SalarioMensal.objects.get_or_create(
            funcionario=func_st,
            safra=safra_st,
            mes=9,
            ano=2024,
            defaults={
                "salario_base": 2500.00,
                "encargos": 1000.00,
                "beneficios": 500.00
            }
        )

        tipo_maq = Maquina.objects.first().tipo
        maq_st, _ = Maquina.objects.get_or_create(
            fazenda=fazenda_st,
            codigo="CL-SUMATRA",
            defaults={
                "descricao": "Colhedora Sumatra Case IH",
                "marca": "Case IH",
                "modelo": "A8000",
                "ano_fabricacao": 2018,
                "tipo": tipo_maq
            }
        )
        CustoMensalMaquina.objects.get_or_create(
            maquina=maq_st,
            safra=safra_st,
            mes=9,
            ano=2024,
            defaults={
                "custo_oficina": 2500.00,
                "custo_abastecimento": 5500.00,
                "horas_trabalhadas": 160.00
            }
        )

        # 6. Obter Funcionários e Máquinas de Bragas
        func_br = Funcionario.objects.get(fazenda=fazenda_br, nome="Sebastião Silva")
        maq_br = Maquina.objects.get(fazenda=fazenda_br, codigo="MF-265")

        # 7. Obter Produtos
        prod_npk = Produto.objects.filter(codigo="NPK-20-05-20").first()
        prod_diesel = Produto.objects.filter(codigo="DIESEL-S10").first()
        prod_def = Produto.objects.filter(codigo="GLIFOSATO").first()

        # 8. Semeando Ordens de Serviço Reais
        # --- FAZENDA BRAGAS ---
        # OS 1: Pulverização
        os_br1, _ = OrdemServico.objects.get_or_create(
            fazenda=fazenda_br,
            safra=safra_br,
            tipo_operacao=tipo_pulv,
            status="CONCLUIDA",
            defaults={
                "data_inicio_real": datetime.date(2024, 9, 10),
                "data_fim_real": datetime.date(2024, 9, 12),
                "data_inicio_planejada": datetime.date(2024, 9, 10),
                "data_fim_planejada": datetime.date(2024, 9, 15),
                "observacao": "Aplicação de defensivo preventiva."
            }
        )
        t_br1 = Talhao.objects.get(fazenda=fazenda_br, codigo="T-01")
        OrdemServicoTalhao.objects.get_or_create(ordem_servico=os_br1, talhao=t_br1)
        ItemInsumoOSReal.objects.get_or_create(
            ordem_servico=os_br1,
            produto=prod_def,
            defaults={
                "dose_planejada": 2.00,
                "quantidade_planejada": 25.00,
                "dose_real": 2.00,
                "quantidade_real": 25.00
            }
        )
        apt_br1, _ = ApontamentoOperacao.objects.get_or_create(
            ordem_servico=os_br1,
            data_apontamento=datetime.date(2024, 9, 11),
            defaults={"clima": "Ensolarado"}
        )
        ApontamentoFuncionario.objects.get_or_create(apontamento=apt_br1, funcionario=func_br, defaults={"horas_trabalhadas": 16.00})
        ApontamentoMaquina.objects.get_or_create(apontamento=apt_br1, maquina=maq_br, defaults={"horimetro_inicial": 1000.00, "horimetro_final": 1016.00})
        ApontamentoInsumo.objects.get_or_create(apontamento=apt_br1, produto=prod_def, defaults={"quantidade_total": 25.00, "dose_realizada": 2.00})

        # OS 2: Adubação (Em Execução para ter variedade)
        os_br2, _ = OrdemServico.objects.get_or_create(
            fazenda=fazenda_br,
            safra=safra_br,
            tipo_operacao=tipo_adub,
            status="EM_EXECUCAO",
            defaults={
                "data_inicio_planejada": datetime.date(2024, 9, 18),
                "data_fim_planejada": datetime.date(2024, 9, 22),
                "observacao": "Adubação nitrogenada."
            }
        )
        t_br2 = Talhao.objects.get(fazenda=fazenda_br, codigo="T-02")
        OrdemServicoTalhao.objects.get_or_create(ordem_servico=os_br2, talhao=t_br2)

        # OS 3: OS Atrasada (para testar a Gestão à Vista)
        os_br3, _ = OrdemServico.objects.get_or_create(
            fazenda=fazenda_br,
            safra=safra_br,
            tipo_operacao=tipo_adub,
            status="APROVADA",
            defaults={
                "data_inicio_planejada": datetime.date(2024, 9, 1),
                "data_fim_planejada": datetime.date(2024, 9, 5), # Menor que hoje
                "observacao": "OS que ficou atrasada na execução."
            }
        )
        OrdemServicoTalhao.objects.get_or_create(ordem_servico=os_br3, talhao=t_br1)

        # --- FAZENDA SUMATRA ---
        # OS 1: Colheita Mecanizada
        os_st1, _ = OrdemServico.objects.get_or_create(
            fazenda=fazenda_st,
            safra=safra_st,
            tipo_operacao=tipo_colh,
            status="CONCLUIDA",
            defaults={
                "data_inicio_real": datetime.date(2024, 9, 5),
                "data_fim_real": datetime.date(2024, 9, 9),
                "data_inicio_planejada": datetime.date(2024, 9, 5),
                "data_fim_planejada": datetime.date(2024, 9, 10),
                "observacao": "Colheita mecanizada de precisão."
            }
        )
        OrdemServicoTalhao.objects.get_or_create(ordem_servico=os_st1, talhao=talhao_st)
        apt_st1, _ = ApontamentoOperacao.objects.get_or_create(
            ordem_servico=os_st1,
            data_apontamento=datetime.date(2024, 9, 7),
            defaults={"clima": "Ensolarado"}
        )
        ApontamentoFuncionario.objects.get_or_create(apontamento=apt_st1, funcionario=func_st, defaults={"horas_trabalhadas": 32.00})
        ApontamentoMaquina.objects.get_or_create(apontamento=apt_st1, maquina=maq_st, defaults={"horimetro_inicial": 200.00, "horimetro_final": 232.00})

        # OS 2: Pulverização
        os_st2, _ = OrdemServico.objects.get_or_create(
            fazenda=fazenda_st,
            safra=safra_st,
            tipo_operacao=tipo_pulv,
            status="CONCLUIDA",
            defaults={
                "data_inicio_real": datetime.date(2024, 9, 15),
                "data_fim_real": datetime.date(2024, 9, 16),
                "data_inicio_planejada": datetime.date(2024, 9, 15),
                "data_fim_planejada": datetime.date(2024, 9, 18)
            }
        )
        OrdemServicoTalhao.objects.get_or_create(ordem_servico=os_st2, talhao=talhao_st)

        # 9. Semeando Dados Financeiros (Contas a Pagar e Contas a Receber)
        # --- FAZENDA BRAGAS ---
        ContasAPagar.objects.get_or_create(
            fazenda=fazenda_br,
            safra=safra_br,
            descricao="Adubo NPK Yara Fertilizantes",
            defaults={
                "valor": Decimal("15400.00"),
                "data_vencimento": datetime.date(2024, 9, 30),
                "data_pagamento": datetime.date(2024, 9, 28),
                "status": "PAGO"
            }
        )
        ContasAPagar.objects.get_or_create(
            fazenda=fazenda_br,
            safra=safra_br,
            descricao="Defensivos Syngenta Agrícola",
            defaults={
                "valor": Decimal("8200.00"),
                "data_vencimento": datetime.date(2024, 10, 15),
                "status": "PENDENTE"
            }
        )
        ContasAReceber.objects.get_or_create(
            fazenda=fazenda_br,
            safra=safra_br,
            descricao="Venda de Café Especial - Lote 01 (Cooxupé)",
            defaults={
                "categoria_receita": "VENDA_CAFE",
                "valor": Decimal("95000.00"),
                "data_vencimento": datetime.date(2024, 10, 20),
                "data_recebimento": datetime.date(2024, 10, 20),
                "status": "RECEBIDO"
            }
        )
        ContasAReceber.objects.get_or_create(
            fazenda=fazenda_br,
            safra=safra_br,
            descricao="Receita Custeio Banco do Brasil",
            defaults={
                "categoria_receita": "CUSTEIO_AGRICOLA",
                "valor": Decimal("120000.00"),
                "data_vencimento": datetime.date(2024, 11, 10),
                "status": "PENDENTE"
            }
        )

        # --- FAZENDA SUMATRA ---
        ContasAPagar.objects.get_or_create(
            fazenda=fazenda_st,
            safra=safra_st,
            descricao="Peças de Colhedora Case IH",
            defaults={
                "valor": Decimal("24500.00"),
                "data_vencimento": datetime.date(2024, 9, 15),
                "data_pagamento": datetime.date(2024, 9, 14),
                "status": "PAGO"
            }
        )
        ContasAPagar.objects.get_or_create(
            fazenda=fazenda_st,
            safra=safra_st,
            descricao="Óleo Diesel S10 - Abastecimento Sumatra",
            defaults={
                "valor": Decimal("18900.00"),
                "data_vencimento": datetime.date(2024, 10, 5),
                "status": "PENDENTE"
            }
        )
        ContasAReceber.objects.get_or_create(
            fazenda=fazenda_st,
            safra=safra_st,
            descricao="Venda Parcial Café - Lote Sumatra (Exportadora Guaxupé)",
            defaults={
                "categoria_receita": "VENDA_CAFE",
                "valor": Decimal("180000.00"),
                "data_vencimento": datetime.date(2024, 10, 10),
                "data_recebimento": datetime.date(2024, 10, 10),
                "status": "RECEBIDO"
            }
        )
        ContasAReceber.objects.get_or_create(
            fazenda=fazenda_st,
            safra=safra_st,
            descricao="Outras Receitas de Milho Safrinha",
            defaults={
                "categoria_receita": "CEREAIS",
                "valor": Decimal("65000.00"),
                "data_vencimento": datetime.date(2024, 12, 1),
                "status": "PENDENTE"
            }
        )

        self.stdout.write(self.style.SUCCESS("Dados transacionais e financeiros semeados com absoluto sucesso!"))
