from django.urls import path, include
from rest_framework.routers import DefaultRouter
from referencias.views import (
    CulturaViewSet, TipoItemViewSet, StatusCultivoViewSet, TipoIrrigacaoViewSet,
    ResistenciaFerrugemViewSet, StatusOrdemServicoViewSet, ModalidadeViewSet,
    TipoRateioViewSet, ContaGerencialViewSet, TipoDestinacaoViewSet,
    GrupoTrabalhadorViewSet, ClassificacaoProdutoViewSet, GrupoQuimicoViewSet,
    UnidadeMedidaViewSet, AtividadeEducampoViewSet, CriterioRateioViewSet,
    TipoOperacaoViewSet, TipoMaquinaViewSet, EncargoFolhaViewSet
)

router = DefaultRouter()
router.register('ref/culturas', CulturaViewSet, basename='ref-cultura')
router.register('ref/tipos-item', TipoItemViewSet, basename='ref-tipo-item')
router.register('ref/status-cultivo', StatusCultivoViewSet, basename='ref-status-cultivo')
router.register('ref/tipos-irrigacao', TipoIrrigacaoViewSet, basename='ref-tipo-irrigacao')
router.register('ref/resistencias-ferrugem', ResistenciaFerrugemViewSet, basename='ref-resistencia-ferrugem')
router.register('ref/status-os', StatusOrdemServicoViewSet, basename='ref-status-os')
router.register('ref/modalidades', ModalidadeViewSet, basename='ref-modalidade')
router.register('ref/tipos-rateio', TipoRateioViewSet, basename='ref-tipo-rateio')
router.register('ref/contas-gerenciais', ContaGerencialViewSet, basename='ref-conta-gerencial')
router.register('ref/tipos-destinacao', TipoDestinacaoViewSet, basename='ref-tipo-destinacao')
router.register('ref/grupos-trabalhador', GrupoTrabalhadorViewSet, basename='ref-grupo-trabalhador')
router.register('ref/classificacoes-produto', ClassificacaoProdutoViewSet, basename='ref-classificacao-produto')
router.register('ref/grupos-quimico', GrupoQuimicoViewSet, basename='ref-grupo-quimico')
router.register('ref/unidades-medida', UnidadeMedidaViewSet, basename='ref-unidade-medida')
router.register('ref/atividades-educampo', AtividadeEducampoViewSet, basename='ref-atividade-educampo')
router.register('ref/criterios-rateio', CriterioRateioViewSet, basename='ref-criterio-rateio')
router.register('ref/tipos-operacao', TipoOperacaoViewSet, basename='ref-tipo-operacao')
router.register('ref/tipos-maquina', TipoMaquinaViewSet, basename='ref-tipo-maquina')
router.register('ref/encargos-folha', EncargoFolhaViewSet, basename='ref-encargo-folha')

urlpatterns = [
    path('', include(router.urls)),
]
