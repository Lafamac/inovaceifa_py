from django.urls import path, include
from rest_framework.routers import DefaultRouter
from cadastros.views import (
    TalhaoViewSet, EstimativaProducaoTalhaoViewSet,
    MaquinaViewSet, CustoMensalMaquinaViewSet,
    FuncionarioViewSet, SalarioMensalViewSet,
    TerceirizadoViewSet, TurmaTerceirizadaViewSet,
    ProdutoViewSet, EstoqueMovimentoViewSet, EstoqueSaldoViewSet,
    TransferenciaAtivoViewSet, LocacaoMaquinaViewSet, ManutencaoMaquinaViewSet
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
router.register('transferencias-ativos', TransferenciaAtivoViewSet, basename='transferencia-ativo')
router.register('locacoes-maquinas', LocacaoMaquinaViewSet, basename='locacao-maquina')
router.register('manutencoes-maquinas', ManutencaoMaquinaViewSet, basename='manutencao-maquina')


urlpatterns = [
    path('', include(router.urls)),
]
