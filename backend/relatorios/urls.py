from django.urls import path
from .views import (
    ComparativoSafraView,
    ConsumoDieselView,
    CustoMensalView,
    CustoTalhaoView,
    EficienciaOperacionalView,
    EstoqueRelatorioView,
    FluxoCaixaView,
    GestaoAVistaView,
    MofView,
    ProducaoTalhaoView,
)

urlpatterns = [
    path('relatorios/comparativo-safra/', ComparativoSafraView.as_view(), name='comparativo-safra'),
    path('relatorios/custo-talhao/', CustoTalhaoView.as_view(), name='custo-talhao'),
    path('relatorios/custo-mensal/', CustoMensalView.as_view(), name='custo-mensal'),
    path('relatorios/fluxo-caixa/', FluxoCaixaView.as_view(), name='fluxo-caixa'),
    path('relatorios/eficiencia-operacional/', EficienciaOperacionalView.as_view(), name='eficiencia-operacional'),
    path('relatorios/consumo-diesel/', ConsumoDieselView.as_view(), name='consumo-diesel'),
    path('relatorios/mof/', MofView.as_view(), name='mof'),
    path('relatorios/estoque/', EstoqueRelatorioView.as_view(), name='estoque-relatorio'),
    path('relatorios/gestao-a-vista/', GestaoAVistaView.as_view(), name='gestao-a-vista'),
    path('relatorios/producao-talhao/', ProducaoTalhaoView.as_view(), name='producao-talhao'),
]
