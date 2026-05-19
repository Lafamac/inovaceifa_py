from django.urls import path, include
from rest_framework.routers import DefaultRouter
from planejamento.views import (
    PlanejamentoSafraViewSet, OrdemServicoPlanejadaViewSet,
    PlanejamentoAduboViewSet, PlanejamentoRateioViewSet
)

router = DefaultRouter()
router.register('planejamentos', PlanejamentoSafraViewSet, basename='planejamento')
router.register('ordens-servico-planejadas', OrdemServicoPlanejadaViewSet, basename='planejamento-os')
router.register('adubacoes-planejadas', PlanejamentoAduboViewSet, basename='planejamento-adubo')
router.register('rateios-planejados', PlanejamentoRateioViewSet, basename='planejamento-rateio')

urlpatterns = [
    path('', include(router.urls)),
]
