from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PedidoCompraViewSet, ItemPedidoCompraViewSet, ContasAPagarViewSet

router = DefaultRouter()
router.register(r'pedidos-compra', PedidoCompraViewSet, basename='pedido-compra')
router.register(r'itens-pedido-compra', ItemPedidoCompraViewSet, basename='item-pedido-compra')
router.register(r'contas-a-pagar', ContasAPagarViewSet, basename='contas-a-pagar')

urlpatterns = [
    path('', include(router.urls)),
]
