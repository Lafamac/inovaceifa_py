from django.urls import path, include
from rest_framework.routers import DefaultRouter
from cadastros.views import (
    TalhaoViewSet, EstimativaProducaoTalhaoViewSet,
    MaquinaViewSet, CustoMensalMaquinaViewSet,
    FuncionarioViewSet, SalarioMensalViewSet,
    TerceirizadoViewSet, TurmaTerceirizadaViewSet,
    ProdutoViewSet, EstoqueMovimentoViewSet, EstoqueSaldoViewSet
)

router = DefaultRouter()
router.register('talhoes', TalhaoViewSet, basename='talhao')
router.register('talhoes/estimativas', EstimativaProducaoTalhaoViewSet, basename='talhao-estimativa')
router.register('maquinas', MaquinaViewSet, basename='maquina')
router.register('maquinas/custos-mensais', CustoMensalMaquinaViewSet, basename='maquina-custo-mensal')
router.register('funcionarios', FuncionarioViewSet, basename='funcionario')
router.register('funcionarios/salarios-mensais', SalarioMensalViewSet, basename='funcionario-salario-mensal')
router.register('terceirizados', TerceirizadoViewSet, basename='terceirizado')
router.register('turmas-terceirizadas', TurmaTerceirizadaViewSet, basename='turma-terceirizada')
router.register('produtos', ProdutoViewSet, basename='produto')
router.register('estoque/movimentos', EstoqueMovimentoViewSet, basename='estoque-movimento')
router.register('estoque/saldos', EstoqueSaldoViewSet, basename='estoque-saldo')

urlpatterns = [
    path('', include(router.urls)),
]
