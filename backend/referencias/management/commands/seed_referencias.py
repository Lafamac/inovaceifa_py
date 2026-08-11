from django.core.management.base import BaseCommand
from referencias.models import (
    Cultura, TipoItem, StatusCultivo, TipoIrrigacao, ResistenciaFerrugem,
    StatusOrdemServico, Modalidade, TipoRateio, ContaGerencial, TipoDestinacao,
    GrupoTrabalhador, ClassificacaoProduto, GrupoQuimico, UnidadeMedida,
    AtividadeEducampo, CriterioRateio, TipoOperacao, TipoMaquina, EncargoFolha
)


class Command(BaseCommand):
    help = "Popula as tabelas auxiliares de referências com dados padrão do ERP Agrícola e da planilha."

    def handle(self, *args, **options):
        self.stdout.write("Iniciando semeadura de referências...")

        # 1. Cultura
        culturas = ["Café", "Soja", "Milho", "Todas", "Feijão", "Equino"]
        for nome in culturas:
            Cultura.objects.get_or_create(nome=nome)

        # 2. TipoItem
        tipos_item = ["Produto", "Serviço", "Máquina", "Mão de Obra"]
        for nome in tipos_item:
            TipoItem.objects.get_or_create(nome=nome)

        # 3. StatusCultivo
        status_cultivo = ["Em Formação", "Em Produção", "Renovação", "Implantado"]
        for nome in status_cultivo:
            StatusCultivo.objects.get_or_create(nome=nome)

        # 4. TipoIrrigacao
        tipos_irrigacao = ["Irrigado", "Não Irrigado", "Gotejamento", "Aspersão", "Pivô Central"]
        for nome in tipos_irrigacao:
            TipoIrrigacao.objects.get_or_create(nome=nome)

        # 5. ResistenciaFerrugem
        resistencias = ["Suscetível", "Resistente", "Tolerante", "Não Informado"]
        for nome in resistencias:
            ResistenciaFerrugem.objects.get_or_create(nome=nome)

        # 6. StatusOrdemServico
        status_os = ["Rascunho", "Aprovada", "Em Execução", "Concluída", "Cancelada"]
        for nome in status_os:
            StatusOrdemServico.objects.get_or_create(nome=nome)

        # 7. Modalidade
        modalidades = ["Mecanizado", "Manual", "Semi-Mecanizado", "Outros"]
        for nome in modalidades:
            Modalidade.objects.get_or_create(nome=nome)

        # 8. TipoRateio
        tipos_rateio = ["Direto", "Indireto", "Rateado", "Administrativo"]
        for nome in tipos_rateio:
            TipoRateio.objects.get_or_create(nome=nome)

        # 9. ContaGerencial
        contas = [
            ("102701", "MASSEY FERGUSON 265"),
            ("102703", "JOHN DEERE 5085 E 4x4"),
            ("102704", "MASSEY FERGUSON 275"),
            ("102705", "MASSEY FERGUSON 275 4x4"),
            ("102706", "VALTRA BF75"),
            ("102707", "AGRALE 65 4x4"),
            ("102708", "MASSEY FERGUSON 4265"),
            ("102711", "MASSEY FERGUSON 75 4x4"),
            ("10271100", "CAMINHAO TOCO MERCEDES"),
            ("102713", "VALTRA  A73F 4x4"),
            ("10271300", "CAMINHAO TRUCK MERCEDES"),
            ("102714", "PA CARREGADEIRA"),
            ("102715", "TRATOR VALTRA A73F"),
            ("101001", "Mão de Obra Direta"),
            ("101002", "Encargos Sociais"),
            ("102001", "Insumos - Fertilizantes"),
            ("102002", "Insumos - Defensivos"),
            ("102003", "Insumos - Combustíveis"),
            ("103001", "Serviços Terceirizados"),
            ("104001", "Despesas Administrativas"),
            ("105001", "Investimentos - Máquinas"),
            ("105002", "Investimentos - Lavouras"),
        ]
        for codigo, nome in contas:
            ContaGerencial.objects.get_or_create(codigo=codigo, defaults={"nome": nome})

        # 10. TipoDestinacao
        destinacoes = ["Aplicação", "Venda", "Estoque", "Perda", "Consumo Interno"]
        for nome in destinacoes:
            TipoDestinacao.objects.get_or_create(nome=nome)

        # 11. GrupoTrabalhador
        grupos_trab = [
            "Grupo Administrativo",
            "Grupo Tratoristas",
            "Grupo Irrigação",
            "Grupo Colheita",
            "Mão de Obra Própria",
            "Mão de Obra Terceirizada",
            "Parceiros"
        ]
        for nome in grupos_trab:
            GrupoTrabalhador.objects.get_or_create(nome=nome)

        # 12. ClassificacaoProduto
        classificacoes = [
            "Adubo",
            "Defensivo",
            "Fertilizante Foliar",
            "Combustível",
            "Embalagem",
            "Ferramenta",
            "EPI",
            "Outros"
        ]
        for nome in classificacoes:
            ClassificacaoProduto.objects.get_or_create(nome=nome)

        # 13. GrupoQuimico
        grupos_quimicos = [
            "Triazol",
            "Estrobirulina",
            "Neonicotinoide",
            "Organofosforado",
            "Piretroide",
            "Glifosato",
            "Cobre",
            "Outros"
        ]
        for nome in grupos_quimicos:
            GrupoQuimico.objects.get_or_create(nome=nome)

        # 14. UnidadeMedida
        unidades = [
            ("kg", "Quilograma"),
            ("L", "Litro"),
            ("un", "Unidade"),
            ("ha", "Hectare"),
            ("sc", "Saca"),
            ("h", "Hora"),
            ("m", "Metro"),
            ("ton", "Tonelada"),
        ]
        for sigla, nome in unidades:
            UnidadeMedida.objects.get_or_create(sigla=sigla, defaults={"nome": nome})

        # 15. AtividadeEducampo
        atividades = [
            "Pulverização",
            "Adubação",
            "Colheita",
            "Secagem",
            "Trincha",
            "Capina",
            "Podas",
            "Arruação",
            "Rastreamento",
            "Tratos Culturais",
            "Ad. Via Folha",
            "Ad. Via Solo",
            "Administração",
            "Comercialização",
            "Compostagem",
            "Condução da lavoura",
            "Cont. Plantas Daninhas",
            "Gestão",
            "Irrigação",
            "Plantio"
        ]
        for nome in atividades:
            AtividadeEducampo.objects.get_or_create(nome=nome)

        # 16. CriterioRateio
        criterios = ["Área (Hectares)", "Produção (Sacas)", "Planta (Quantidade)", "Direto", "Por Talhão", "Por Fazenda"]
        for nome in criterios:
            CriterioRateio.objects.get_or_create(nome=nome)

        # 17. TipoOperacao
        operacoes = [
            "Pulverização - Todas as Ruas",
            "Pulverização Lavoura Nova - Todas as Ruas",
            "Drench - Todas as Ruas",
            "Aplicação de herbicida em Faixa - Todas as Ruas",
            "Aplicação de herbicida em Faixa - Duas vezes por rua",
            "Aplicação de herbicida em Faixa - Ruas Alternadas",
            "Aplicação de herbicida em A. Total - Todas as Ruas",
            "Aplicação de herbicida em A. Total - Duas vezes por rua",
            "Roçada Mecânica (R. Simples) - Todas as Ruas",
            "Roçada Mecânica (R. Simples) - Duas vezes por rua",
            "Adubação - Todas as Ruas",
            "Trincha - Ruas Alternadas",
            "Trincha - Todas as Ruas",
            "Decotamento - Ruas Alternadas",
            "Decotamento - Todas as Ruas",
            "Esqueleto - Ruas Alternadas",
            "Esqueleto - Todas as Ruas",
            "Arruação - Todas as Ruas",
            "Rastreamento - Todas as Ruas",
            "Colheita Mecânica (Colhedora) - Todas as Ruas",
            "Colheita Semi-Mecanizada (Derriçadora) - Todas as Ruas",
            "Colheita Manual (Mão) - Todas as Ruas",
            "Limpeza e Secagem de Café",
            "Beneficiamento de Café"
        ]
        for nome in operacoes:
            TipoOperacao.objects.get_or_create(nome=nome)

        # 18. TipoMaquina
        tipos_maquina = ["Trator", "Colhetadeira", "Caminhao", "Implemento"]
        for nome in tipos_maquina:
            TipoMaquina.objects.get_or_create(nome=nome)

        # 19. EncargoFolha
        EncargoFolha.objects.get_or_create(descricao="Encargos Sociais", defaults={"valor": 34.0000})

        self.stdout.write(self.style.SUCCESS("Referências semeadas com sucesso!"))
