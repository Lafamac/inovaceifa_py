import datetime
from django.core.management.base import BaseCommand
from core.models import Proprietario, Fazenda, Safra
from referencias.models import (
    Cultura, TipoIrrigacao, StatusCultivo, ResistenciaFerrugem,
    TipoMaquina, GrupoTrabalhador, ClassificacaoProduto, GrupoQuimico, UnidadeMedida
)
from cadastros.models import (
    Talhao, EstimativaProducaoTalhao, Maquina, CustoMensalMaquina,
    Funcionario, SalarioMensal, Terceirizado, TurmaTerceirizada,
    Produto, EstoqueMovimento
)

class Command(BaseCommand):
    help = "Popula os cadastros base (Fazendas, Safras, Talões, Máquinas, Funcionários, Produtos e Estoque Inicial)"

    def handle(self, *args, **options):
        self.stdout.write("Iniciando semeadura de cadastros base...")

        # 1. Proprietário Padrão
        proprietario, _ = Proprietario.objects.get_or_create(
            documento="12.345.678/0001-99",
            defaults={
                "nome": "Inova Ceifa Agropecuária",
                "email": "contato@inovaceifa.com.br",
                "celular": "(35) 99999-8888",
                "cep": "37130-000",
                "endereco": "Rodovia MG-167, Km 10",
                "bairro": "Zona Rural",
                "cidade": "Alfenas"
            }
        )

        # 2. Fazendas
        fazendas_dados = [
            ("Fazenda Bragas", "BR"),
            ("Fazenda Congonhas", "CG"),
            ("Fazenda São Francisco", "SF"),
            ("Fazenda Sumatra", "ST"),
        ]
        fazendas = {}
        for nome, sigla in fazendas_dados:
            fazenda, _ = Fazenda.objects.get_or_create(
                sigla=sigla,
                defaults={
                    "nome": nome,
                    "proprietario": proprietario
                }
            )
            fazendas[sigla] = fazenda

        # 3. Safras Ativas por Fazenda (2024/2025)
        safras = {}
        for sigla, fazenda in fazendas.items():
            safra, _ = Safra.objects.get_or_create(
                fazenda=fazenda,
                nome="2024/2025",
                defaults={
                    "data_inicio": datetime.date(2024, 9, 1),
                    "data_fim": datetime.date(2025, 8, 31),
                    "ativa": True
                }
            )
            safras[sigla] = safra

        # 4. Cultura, Irrigação, Status, Resistência padrão para os Talões
        cultura_cafe = Cultura.objects.filter(nome="Café").first()
        if not cultura_cafe:
            cultura_cafe = Cultura.objects.create(nome="Café")
            
        irrig_gotejamento = TipoIrrigacao.objects.filter(nome="Gotejamento").first()
        if not irrig_gotejamento:
            irrig_gotejamento = TipoIrrigacao.objects.create(nome="Gotejamento")

        irrig_nao = TipoIrrigacao.objects.filter(nome="Não Irrigado").first()
        if not irrig_nao:
            irrig_nao = TipoIrrigacao.objects.create(nome="Não Irrigado")

        status_prod = StatusCultivo.objects.filter(nome="Em Produção").first()
        if not status_prod:
            status_prod = StatusCultivo.objects.create(nome="Em Produção")

        resistencia_res = ResistenciaFerrugem.objects.filter(nome="Resistente").first()
        if not resistencia_res:
            resistencia_res = ResistenciaFerrugem.objects.create(nome="Resistente")

        # 5. Talões
        # Bragas
        t1, _ = Talhao.objects.get_or_create(
            fazenda=fazendas["BR"],
            codigo="T-01",
            defaults={
                "nome": "Talhão 01 - BR/Catuaí 62",
                "area": 12.50,
                "tipo_irrigacao": irrig_gotejamento,
                "cultura": cultura_cafe,
                "espacamento_rua": 3.80,
                "espacamento_planta": 0.70,
                "estande": 3759,
                "numero_plantas": 47000,
                "material_genetico": "Catuaí Vermelho IAC 62",
                "resistencia_ferrugem": resistencia_res,
                "status_cultivo": status_prod
            }
        )
        EstimativaProducaoTalhao.objects.get_or_create(
            talhao=t1,
            safra=safras["BR"],
            defaults={
                "estimativa_sacas": 500.00,
                "produtividade_esperada": 40.00
            }
        )

        t2, _ = Talhao.objects.get_or_create(
            fazenda=fazendas["BR"],
            codigo="T-02",
            defaults={
                "nome": "Talhão 02 - BR/Mundo Novo",
                "area": 8.20,
                "tipo_irrigacao": irrig_nao,
                "cultura": cultura_cafe,
                "espacamento_rua": 4.00,
                "espacamento_planta": 0.80,
                "estande": 3125,
                "numero_plantas": 25625,
                "material_genetico": "Mundo Novo 379/19",
                "resistencia_ferrugem": resistencia_res,
                "status_cultivo": status_prod
            }
        )

        # Sumatra
        t3, _ = Talhao.objects.get_or_create(
            fazenda=fazendas["ST"],
            codigo="T-01",
            defaults={
                "nome": "Talhão 01 - ST/Arara",
                "area": 15.00,
                "tipo_irrigacao": irrig_gotejamento,
                "cultura": cultura_cafe,
                "espacamento_rua": 3.60,
                "espacamento_planta": 0.60,
                "estande": 4629,
                "numero_plantas": 69435,
                "material_genetico": "Arara",
                "resistencia_ferrugem": resistencia_res,
                "status_cultivo": status_prod
            }
        )

        # 6. Máquinas
        tipo_maq = TipoMaquina.objects.filter(nome="Trator").first()
        if not tipo_maq:
            tipo_maq = TipoMaquina.objects.create(nome="Trator")

        maq1, _ = Maquina.objects.get_or_create(
            fazenda=fazendas["BR"],
            codigo="MF-265",
            defaults={
                "descricao": "Trator Massey Ferguson 265",
                "marca": "Massey Ferguson",
                "modelo": "265",
                "ano_fabricacao": 2012,
                "tipo": tipo_maq
            }
        )

        CustoMensalMaquina.objects.get_or_create(
            maquina=maq1,
            safra=safras["BR"],
            mes=9,
            ano=2024,
            defaults={
                "custo_oficina": 1200.00,
                "custo_abastecimento": 3400.00,
                "horas_trabalhadas": 120.00
            }
        )

        # 7. Funcionários
        grupo_trat = GrupoTrabalhador.objects.filter(nome="Grupo Tratoristas").first()
        if not grupo_trat:
            grupo_trat = GrupoTrabalhador.objects.create(nome="Grupo Tratoristas")

        func1, _ = Funcionario.objects.get_or_create(
            fazenda=fazendas["BR"],
            nome="Sebastião Silva",
            defaults={
                "cpf": "111.222.333-44",
                "cargo": "Tratorista",
                "grupo_trabalhador": grupo_trat,
                "salario": 2200.00
            }
        )

        SalarioMensal.objects.get_or_create(
            funcionario=func1,
            safra=safras["BR"],
            mes=9,
            ano=2024,
            defaults={
                "salario_base": 2200.00,
                "encargos": 880.00,
                "beneficios": 450.00
            }
        )

        # 8. Produtos (Insumos)
        un_kg = UnidadeMedida.objects.filter(sigla="kg").first()
        if not un_kg:
            un_kg = UnidadeMedida.objects.create(sigla="kg", nome="Quilograma")

        un_l = UnidadeMedida.objects.filter(sigla="L").first()
        if not un_l:
            un_l = UnidadeMedida.objects.create(sigla="L", nome="Litro")

        class_adubo = ClassificacaoProduto.objects.filter(nome="Adubo").first()
        if not class_adubo:
            class_adubo = ClassificacaoProduto.objects.create(nome="Adubo")

        class_comb = ClassificacaoProduto.objects.filter(nome="Combustível").first()
        if not class_comb:
            class_comb = ClassificacaoProduto.objects.create(nome="Combustível")

        class_def = ClassificacaoProduto.objects.filter(nome="Defensivo").first()
        if not class_def:
            class_def = ClassificacaoProduto.objects.create(nome="Defensivo")

        prod_npk, _ = Produto.objects.get_or_create(
            codigo="NPK-20-05-20",
            defaults={
                "nome_comercial": "Adubo NPK 20-05-20",
                "unidade": un_kg,
                "classificacao": class_adubo,
                "recomendacoes_tecnicas": "Fertilizante de solo para pós-colheita"
            }
        )

        prod_diesel, _ = Produto.objects.get_or_create(
            codigo="DIESEL-S10",
            defaults={
                "nome_comercial": "Óleo Diesel S10",
                "unidade": un_l,
                "classificacao": class_comb,
                "recomendacoes_tecnicas": "Combustível para tratores e frotas"
            }
        )

        prod_def, _ = Produto.objects.get_or_create(
            codigo="GLIFOSATO",
            defaults={
                "nome_comercial": "Glifosato 480",
                "unidade": un_l,
                "classificacao": class_def,
                "concentracao": "480 g/L",
                "periodo_carencia": 15,
                "alvo": "Mato Geral"
            }
        )

        # 9. Estoque Inicial (Entrada de Diesel e Adubo)
        EstoqueMovimento.objects.get_or_create(
            fazenda=fazendas["BR"],
            safra=safras["BR"],
            produto=prod_diesel,
            tipo_movimento="ENTRADA",
            quantidade=5000.0000,
            defaults={
                "valor_unitario": 6.2000,
                "valor_total": 31000.00,
                "data_movimento": datetime.date(2024, 9, 1),
                "documento_referencia": "NF-1004",
                "observacao": "Carga inicial de diesel de setembro"
            }
        )

        EstoqueMovimento.objects.get_or_create(
            fazenda=fazendas["BR"],
            safra=safras["BR"],
            produto=prod_npk,
            tipo_movimento="ENTRADA",
            quantidade=10000.0000,
            defaults={
                "valor_unitario": 3.5000,
                "valor_total": 35000.00,
                "data_movimento": datetime.date(2024, 9, 1),
                "documento_referencia": "NF-1005",
                "observacao": "Compra de fertilizantes para início da safra"
            }
        )

        self.stdout.write(self.style.SUCCESS("Cadastros base e estoque inicial semeados com sucesso!"))
