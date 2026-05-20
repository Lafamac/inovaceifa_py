from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import OpenApiResponse, OpenApiTypes, extend_schema
from django.db.models import Sum
from core.models import Fazenda, Safra
from referencias.models import (
    Cultura, TipoIrrigacao, StatusCultivo, ResistenciaFerrugem,
    TipoItem, GrupoTrabalhador, ClassificacaoProduto, GrupoQuimico, UnidadeMedida
)
from cadastros.models import (
    Talhao, EstimativaProducaoTalhao, Maquina, CustoMensalMaquina,
    Funcionario, SalarioMensal, Terceirizado, TurmaTerceirizada,
    Produto, EstoqueMovimento
)
from cadastros.serializers import (
    TalhaoSerializer, EstimativaProducaoTalhaoSerializer,
    MaquinaSerializer, CustoMensalMaquinaSerializer,
    FuncionarioSerializer, SalarioMensalSerializer,
    TerceirizadoSerializer, TurmaTerceirizadaSerializer,
    ProdutoSerializer, EstoqueMovimentoSerializer
)


class BaseTenantViewSet(viewsets.ModelViewSet):
    """
    ViewSet base que aplica automaticamente a autenticação obrigatória
    e fornece filtros padrão para soft-delete (ativo=True).
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Por padrão, filtra por ativo=True
        return self.queryset.filter(ativo=True)

    def perform_destroy(self, instance):
        # Soft delete mandatório
        instance.ativo = False
        instance.save()


class TalhaoViewSet(BaseTenantViewSet):
    queryset = Talhao.objects.all()
    serializer_class = TalhaoSerializer

    def get_queryset(self):
        # Filtra talhões pertencentes às fazendas permitidas do usuário
        return super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )


class EstimativaProducaoTalhaoViewSet(BaseTenantViewSet):
    queryset = EstimativaProducaoTalhao.objects.all()
    serializer_class = EstimativaProducaoTalhaoSerializer

    def get_queryset(self):
        # Filtra estimativas vinculadas à safra ativa e fazendas permitidas
        qs = super().get_queryset().filter(
            talhao__fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)
        return qs


class MaquinaViewSet(BaseTenantViewSet):
    queryset = Maquina.objects.all()
    serializer_class = MaquinaSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )


class CustoMensalMaquinaViewSet(BaseTenantViewSet):
    queryset = CustoMensalMaquina.objects.all()
    serializer_class = CustoMensalMaquinaSerializer

    def get_queryset(self):
        qs = super().get_queryset().filter(
            maquina__fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)
        return qs


class FuncionarioViewSet(BaseTenantViewSet):
    queryset = Funcionario.objects.all()
    serializer_class = FuncionarioSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )


class SalarioMensalViewSet(BaseTenantViewSet):
    queryset = SalarioMensal.objects.all()
    serializer_class = SalarioMensalSerializer

    def get_queryset(self):
        qs = super().get_queryset().filter(
            funcionario__fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)
        return qs


class TerceirizadoViewSet(BaseTenantViewSet):
    queryset = Terceirizado.objects.all()
    serializer_class = TerceirizadoSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )


class TurmaTerceirizadaViewSet(BaseTenantViewSet):
    queryset = TurmaTerceirizada.objects.all()
    serializer_class = TurmaTerceirizadaSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )


class ProdutoViewSet(BaseTenantViewSet):
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer


class EstoqueMovimentoViewSet(BaseTenantViewSet):
    queryset = EstoqueMovimento.objects.all()
    serializer_class = EstoqueMovimentoSerializer

    def get_queryset(self):
        qs = super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Validar estoque se for Saída ou Transferência
        tipo = serializer.validated_data.get('tipo_movimento')
        produto = serializer.validated_data.get('produto')
        quantidade = serializer.validated_data.get('quantidade')
        
        fazenda = serializer.validated_data.get('fazenda')
        safra = serializer.validated_data.get('safra')

        # Se for transferência, a fazenda de origem é a fazenda do contexto
        if tipo == 'TRANSFERENCIA':
            origem = serializer.validated_data.get('origem_transferencia')
            if not origem:
                return Response(
                    {"detail": "Transferência exige fazenda de origem."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            fazenda = origem

        warning_msg = None
        if tipo in ['SAIDA', 'TRANSFERENCIA']:
            # Calcular saldo atual
            saldo = self.calcular_saldo_produto(fazenda, safra, produto)
            if saldo < quantidade:
                # Alerta dinâmico (não bloqueante)
                warning_msg = f"Atenção: Saldo insuficiente de {produto.nome_comercial} para esta operação. Saldo atual: {saldo}."

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        response_data = serializer.data
        if warning_msg:
            response_data['warning'] = warning_msg

        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def calcular_saldo_produto(self, fazenda, safra, produto):
        entradas = EstoqueMovimento.objects.filter(
            fazenda=fazenda, safra=safra, produto=produto, tipo_movimento='ENTRADA', ativo=True
        ).aggregate(total=Sum('quantidade'))['total'] or 0

        saidas = EstoqueMovimento.objects.filter(
            fazenda=fazenda, safra=safra, produto=produto, tipo_movimento='SAIDA', ativo=True
        ).aggregate(total=Sum('quantidade'))['total'] or 0

        ajustes = EstoqueMovimento.objects.filter(
            fazenda=fazenda, safra=safra, produto=produto, tipo_movimento='AJUSTE', ativo=True
        ).aggregate(total=Sum('quantidade'))['total'] or 0

        transf_enviadas = EstoqueMovimento.objects.filter(
            origem_transferencia=fazenda, safra=safra, produto=produto, tipo_movimento='TRANSFERENCIA', ativo=True
        ).aggregate(total=Sum('quantidade'))['total'] or 0

        transf_recebidas = EstoqueMovimento.objects.filter(
            destino_transferencia=fazenda, safra=safra, produto=produto, tipo_movimento='TRANSFERENCIA', ativo=True
        ).aggregate(total=Sum('quantidade'))['total'] or 0

        return (entradas + ajustes + transf_recebidas) - (saidas + transf_enviadas)


class EstoqueSaldoViewSet(viewsets.ViewSet):
    """
    ViewSet somente leitura para consulta consolidada de saldos de estoque por produto
    na fazenda e safra do contexto ativo.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Cadastros"],
        responses={200: OpenApiResponse(response=OpenApiTypes.OBJECT)},
        summary="Saldos de estoque por produto",
    )
    def list(self, request):
        fazenda = request.fazenda_ativa
        safra = request.safra_ativa

        # Se não houver contexto ativo de fazenda/safra, retorna vazio ou erro conforme regras
        if not fazenda or not safra:
            return Response([])

        # Listar todos os produtos que possuem movimentos na safra/fazenda ou simplesmente todos os produtos cadastrados
        produtos = Produto.objects.filter(ativo=True)
        saldos = []

        for p in produtos:
            # Calcular o saldo
            entradas = EstoqueMovimento.objects.filter(
                fazenda=fazenda, safra=safra, produto=p, tipo_movimento='ENTRADA', ativo=True
            ).aggregate(total=Sum('quantidade'))['total'] or 0

            saidas = EstoqueMovimento.objects.filter(
                fazenda=fazenda, safra=safra, produto=p, tipo_movimento='SAIDA', ativo=True
            ).aggregate(total=Sum('quantidade'))['total'] or 0

            ajustes = EstoqueMovimento.objects.filter(
                fazenda=fazenda, safra=safra, produto=p, tipo_movimento='AJUSTE', ativo=True
            ).aggregate(total=Sum('quantidade'))['total'] or 0

            transf_enviadas = EstoqueMovimento.objects.filter(
                origem_transferencia=fazenda, safra=safra, produto=p, tipo_movimento='TRANSFERENCIA', ativo=True
            ).aggregate(total=Sum('quantidade'))['total'] or 0

            transf_recebidas = EstoqueMovimento.objects.filter(
                destino_transferencia=fazenda, safra=safra, produto=p, tipo_movimento='TRANSFERENCIA', ativo=True
            ).aggregate(total=Sum('quantidade'))['total'] or 0

            saldo_final = (entradas + ajustes + transf_recebidas) - (saidas + transf_enviadas)

            # Só retorna produtos que já tiveram algum movimento ou opcionalmente todos
            if (entradas or saidas or ajustes or transf_enviadas or transf_recebidas):
                saldos.append({
                    "produto_id": p.id,
                    "produto_nome": p.nome_comercial,
                    "unidade_sigla": p.unidade.sigla,
                    "saldo": float(saldo_final),
                    "alerta_insuficiente": saldo_final < 0
                })

        return Response(saldos)
