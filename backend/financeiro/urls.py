from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PedidoCompraViewSet, ItemPedidoCompraViewSet, ContasAPagarViewSet,
    PedidoVendaViewSet, ContasAReceberViewSet
)

router = DefaultRouter()
router.register(r'pedidos-compra', PedidoCompraViewSet, basename='pedido-compra')
router.register(r'itens-pedido-compra', ItemPedidoCompraViewSet, basename='item-pedido-compra')
router.register(r'contas-pagar', ContasAPagarViewSet, basename='contas-pagar')
router.register(r'pedidos-venda', PedidoVendaViewSet, basename='pedido-venda')
router.register(r'contas-receber', ContasAReceberViewSet, basename='contas-receber')

urlpatterns = [
    path('', include(router.urls)),
]

