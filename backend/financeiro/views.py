from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from planejamento.views import BaseTenantPlanejamentoViewSet
from .models import PedidoCompra, ItemPedidoCompra, ContasAPagar
from .serializers import PedidoCompraSerializer, ItemPedidoCompraSerializer, ContasAPagarSerializer
from cadastros.models import EstoqueMovimento

class PedidoCompraViewSet(BaseTenantPlanejamentoViewSet):
    queryset = PedidoCompra.objects.all()
    serializer_class = PedidoCompraSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)
        return qs

    @action(detail=True, methods=['post'], url_path='receber')
    def receber(self, request, pk=None):
        pedido = self.get_object()
        
        if pedido.status != 'APROVADO':
            return Response(
                {"detail": "Apenas pedidos com status 'APROVADO' podem ser recebidos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            pedido.status = 'RECEBIDO'
            pedido.save()

            # 1. Criar Contas a Pagar correspondente ao valor total do pedido
            ContasAPagar.objects.create(
                fazenda=pedido.fazenda,
                safra=pedido.safra,
                pedido_compra=pedido,
                descricao=f"Compra do fornecedor: {pedido.fornecedor} (Ref. Pedido #{pedido.id})",
                valor=pedido.valor_total,
                data_vencimento=pedido.data_pedido,  # data base de vencimento
                status='PENDENTE'
            )

            # 2. Gerar movimentos de ENTRADA no estoque para cada item do pedido
            for item in pedido.itens.filter(ativo=True):
                EstoqueMovimento.objects.create(
                    fazenda=pedido.fazenda,
                    safra=pedido.safra,
                    produto=item.produto,
                    tipo_movimento='ENTRADA',
                    quantidade=item.quantidade,
                    valor_unitario=item.valor_unitario,
                    valor_total=item.valor_total,
                    data_movimento=pedido.data_pedido,
                    documento_referencia=f"Pedido #{pedido.id}",
                    observacao=f"Entrada automática pelo recebimento do Pedido de Compra #{pedido.id}."
                )

        return Response(
            {"status": "Pedido recebido com sucesso. Contas a pagar e movimentos de estoque gerados.", "id": pedido.id},
            status=status.HTTP_200_OK
        )


class ItemPedidoCompraViewSet(BaseTenantPlanejamentoViewSet):
    queryset = ItemPedidoCompra.objects.all()
    serializer_class = ItemPedidoCompraSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().filter(
            pedido_compra__fazenda__in=self.request.fazendas_permitidas
        )


class ContasAPagarViewSet(BaseTenantPlanejamentoViewSet):
    queryset = ContasAPagar.objects.all()
    serializer_class = ContasAPagarSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)
        return qs
