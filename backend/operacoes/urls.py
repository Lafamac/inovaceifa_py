from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrdemServicoViewSet, ApontamentoOperacaoViewSet,
    ApontamentoInsumoViewSet, ApontamentoMaquinaViewSet,
    ApontamentoFuncionarioViewSet, AuditoriaOrdemServicoViewSet
)

router = DefaultRouter()
router.register(r'ordens-servico', OrdemServicoViewSet, basename='operacao-ordem-servico')
router.register(r'apontamentos', ApontamentoOperacaoViewSet, basename='operacao-apontamento')
router.register(r'apontamentos-insumo', ApontamentoInsumoViewSet, basename='operacao-apontamento-insumo')
router.register(r'apontamentos-maquina', ApontamentoMaquinaViewSet, basename='operacao-apontamento-maquina')
router.register(r'apontamentos-funcionario', ApontamentoFuncionarioViewSet, basename='operacao-apontamento-funcionario')
router.register(r'auditorias', AuditoriaOrdemServicoViewSet, basename='operacao-auditoria')

urlpatterns = [
    path('', include(router.urls)),
]
