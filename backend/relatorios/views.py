from datetime import date

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, OpenApiTypes, extend_schema

from planejamento.views import setup_tenant_context

from . import services


REPORT_RESPONSE = OpenApiResponse(response=OpenApiTypes.OBJECT)
SAFRA_HEADER = OpenApiParameter(
    name="X-Safra-ID",
    type=OpenApiTypes.INT,
    location=OpenApiParameter.HEADER,
    required=True,
    description="ID da safra ativa usada como contexto multi-tenant.",
)
FAZENDA_QUERY = OpenApiParameter(
    name="fazenda_id",
    type=OpenApiTypes.INT,
    location=OpenApiParameter.QUERY,
    required=False,
    description="Opcional. Quando informado, seleciona uma fazenda permitida ao usuario.",
)


class BaseRelatorioView(APIView):
    permission_classes = [IsAuthenticated]
    requires_safra = True

    def initial(self, request, *args, **kwargs):
        setup_tenant_context(request)
        super().initial(request, *args, **kwargs)

    def get_selected_fazenda(self, request):
        fazenda_id = request.query_params.get("fazenda_id")
        if fazenda_id:
            try:
                fazenda = request.fazendas_permitidas.filter(id=fazenda_id, ativo=True).first()
            except ValueError:
                return None, "ID de fazenda invalido."
            if not fazenda:
                return None, "Fazenda informada nao existe ou acesso nao permitido."
            return fazenda, None

        if getattr(request, "fazenda_ativa", None):
            return request.fazenda_ativa, None

        return None, "Selecione uma fazenda ativa ou passe o parametro fazenda_id."

    def get_context_or_response(self, request):
        if self.requires_safra and not getattr(request, "safra_ativa", None):
            return None, None, Response(
                {"detail": "O cabecalho X-Safra-ID e obrigatorio para acessar este relatorio."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fazenda, error = self.get_selected_fazenda(request)
        if error:
            return None, None, Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        return request.safra_ativa, fazenda, None


class ComparativoSafraView(BaseRelatorioView):
    requires_safra = False

    @extend_schema(
        tags=["Relatorios"],
        parameters=[FAZENDA_QUERY],
        responses={200: REPORT_RESPONSE},
        summary="Comparativo planejado x realizado por safra",
    )
    def get(self, request):
        _safra, fazenda, response = self.get_context_or_response(request)
        if response:
            return response
        return Response(services.comparativo_safra(fazenda), status=status.HTTP_200_OK)


class CustoTalhaoView(BaseRelatorioView):
    @extend_schema(
        tags=["Relatorios"],
        parameters=[SAFRA_HEADER, FAZENDA_QUERY],
        responses={200: REPORT_RESPONSE},
        summary="Custo por talhao",
    )
    def get(self, request):
        safra, fazenda, response = self.get_context_or_response(request)
        if response:
            return response
        return Response(
            {
                "safra_id": safra.id,
                "safra_nome": safra.nome,
                "fazenda_id": fazenda.id,
                "fazenda_nome": fazenda.nome,
                "talhoes": services.custo_por_talhao(safra, fazenda),
            },
            status=status.HTTP_200_OK,
        )


class CustoMensalView(BaseRelatorioView):
    @extend_schema(
        tags=["Relatorios"],
        parameters=[SAFRA_HEADER, FAZENDA_QUERY],
        responses={200: REPORT_RESPONSE},
        summary="Custo mensal por fazenda",
    )
    def get(self, request):
        safra, fazenda, response = self.get_context_or_response(request)
        if response:
            return response
        return Response(
            {
                "safra_id": safra.id,
                "safra_nome": safra.nome,
                "fazenda_id": fazenda.id,
                "fazenda_nome": fazenda.nome,
                "meses": services.custo_mensal(safra, fazenda),
            },
            status=status.HTTP_200_OK,
        )


class FluxoCaixaView(BaseRelatorioView):
    @extend_schema(
        tags=["Relatorios"],
        parameters=[
            SAFRA_HEADER,
            FAZENDA_QUERY,
            OpenApiParameter("data_inicio", OpenApiTypes.DATE, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("data_fim", OpenApiTypes.DATE, OpenApiParameter.QUERY, required=False),
        ],
        responses={200: REPORT_RESPONSE},
        summary="Fluxo de caixa",
    )
    def get(self, request):
        safra, fazenda, response = self.get_context_or_response(request)
        if response:
            return response

        try:
            data_inicio = date.fromisoformat(request.query_params["data_inicio"]) if "data_inicio" in request.query_params else None
            data_fim = date.fromisoformat(request.query_params["data_fim"]) if "data_fim" in request.query_params else None
        except ValueError:
            return Response({"detail": "Formato de data invalido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        payload = services.fluxo_caixa(safra, data_inicio=data_inicio, data_fim=data_fim)
        payload.update(
            {
                "safra_id": safra.id,
                "safra_nome": safra.nome,
                "fazenda_id": fazenda.id,
                "fazenda_nome": fazenda.nome,
            }
        )
        return Response(payload, status=status.HTTP_200_OK)


class EficienciaOperacionalView(BaseRelatorioView):
    @extend_schema(
        tags=["Relatorios"],
        parameters=[SAFRA_HEADER, FAZENDA_QUERY],
        responses={200: REPORT_RESPONSE},
        summary="Eficiencia operacional",
    )
    def get(self, request):
        safra, fazenda, response = self.get_context_or_response(request)
        if response:
            return response
        return Response(services.eficiencia_operacional(safra, fazenda), status=status.HTTP_200_OK)


class ConsumoDieselView(BaseRelatorioView):
    @extend_schema(
        tags=["Relatorios"],
        parameters=[SAFRA_HEADER, FAZENDA_QUERY],
        responses={200: REPORT_RESPONSE},
        summary="Consumo de diesel",
    )
    def get(self, request):
        safra, fazenda, response = self.get_context_or_response(request)
        if response:
            return response
        return Response(
            {
                "safra_id": safra.id,
                "safra_nome": safra.nome,
                "fazenda_id": fazenda.id,
                "fazenda_nome": fazenda.nome,
                "consumo": services.consumo_diesel(safra, fazenda),
                "observacao": "Diesel e identificado por produto/classificacao contendo 'diesel'.",
            },
            status=status.HTTP_200_OK,
        )


class MofView(BaseRelatorioView):
    @extend_schema(
        tags=["Relatorios"],
        parameters=[SAFRA_HEADER, FAZENDA_QUERY],
        responses={200: REPORT_RESPONSE},
        summary="Analise de mao de obra fixa",
    )
    def get(self, request):
        safra, fazenda, response = self.get_context_or_response(request)
        if response:
            return response
        return Response(
            {
                "safra_id": safra.id,
                "safra_nome": safra.nome,
                "fazenda_id": fazenda.id,
                "fazenda_nome": fazenda.nome,
                "funcionarios": services.mao_obra_fixa(safra, fazenda),
            },
            status=status.HTTP_200_OK,
        )


class EstoqueRelatorioView(BaseRelatorioView):
    @extend_schema(
        tags=["Relatorios"],
        parameters=[SAFRA_HEADER, FAZENDA_QUERY],
        responses={200: REPORT_RESPONSE},
        summary="Estoque por produto e fazenda",
    )
    def get(self, request):
        safra, fazenda, response = self.get_context_or_response(request)
        if response:
            return response
        return Response(
            {
                "safra_id": safra.id,
                "safra_nome": safra.nome,
                "fazenda_id": fazenda.id,
                "fazenda_nome": fazenda.nome,
                "produtos": services.estoque_por_produto(safra, fazenda),
            },
            status=status.HTTP_200_OK,
        )


class GestaoAVistaView(BaseRelatorioView):
    @extend_schema(
        tags=["Relatorios"],
        parameters=[SAFRA_HEADER, FAZENDA_QUERY],
        responses={200: REPORT_RESPONSE},
        summary="Gestao a vista",
    )
    def get(self, request):
        safra, fazenda, response = self.get_context_or_response(request)
        if response:
            return response
        return Response(services.gestao_a_vista(safra, fazenda), status=status.HTTP_200_OK)


class ProducaoTalhaoView(BaseRelatorioView):
    @extend_schema(
        tags=["Relatorios"],
        parameters=[SAFRA_HEADER, FAZENDA_QUERY],
        responses={200: REPORT_RESPONSE},
        summary="Producao por talhao",
    )
    def get(self, request):
        safra, fazenda, response = self.get_context_or_response(request)
        if response:
            return response
        return Response(
            {
                "safra_id": safra.id,
                "safra_nome": safra.nome,
                "fazenda_id": fazenda.id,
                "fazenda_nome": fazenda.nome,
                "talhoes": services.producao_por_talhao(safra, fazenda),
            },
            status=status.HTTP_200_OK,
        )
