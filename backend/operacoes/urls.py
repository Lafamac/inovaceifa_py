from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrdemServicoViewSet, ApontamentoOperacaoViewSet,
    ApontamentoInsumoViewSet, ApontamentoMaquinaViewSet,
    ApontamentoFuncionarioViewSet, AuditoriaOrdemServicoViewSet,
    GastoRateioRealizadoViewSet, AbastecimentoMaquinaViewSet,
    RateioOperacionalViewSet, ApontamentoTurmaViewSet
)

router = DefaultRouter()
router.register(r'ordens-servico', OrdemServicoViewSet, basename='operacao-ordem-servico')
router.register(r'apontamentos', ApontamentoOperacaoViewSet, basename='operacao-apontamento')
router.register(r'apontamentos-insumo', ApontamentoInsumoViewSet, basename='operacao-apontamento-insumo')
router.register(r'apontamentos-maquina', ApontamentoMaquinaViewSet, basename='operacao-apontamento-maquina')
router.register(r'apontamentos-funcionario', ApontamentoFuncionarioViewSet, basename='operacao-apontamento-funcionario')
router.register(r'apontamentos-turma', ApontamentoTurmaViewSet, basename='operacao-apontamento-turma')
router.register(r'auditorias', AuditoriaOrdemServicoViewSet, basename='operacao-auditoria')
router.register(r'gastos-rateio', GastoRateioRealizadoViewSet, basename='operacao-gasto-rateio')
router.register(r'abastecimentos', AbastecimentoMaquinaViewSet, basename='operacao-abastecimento')
router.register(r'rateios-operacionais', RateioOperacionalViewSet, basename='operacao-rateio-operacional')

urlpatterns = [
    path('', include(router.urls)),
]
