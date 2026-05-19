from django.urls import path
from .views import ComparativoSafraView, FluxoCaixaView, EficienciaOperacionalView

urlpatterns = [
    path('relatorios/comparativo-safra/', ComparativoSafraView.as_view(), name='comparativo-safra'),
    path('relatorios/fluxo-caixa/', FluxoCaixaView.as_view(), name='fluxo-caixa'),
    path('relatorios/eficiencia-operacional/', EficienciaOperacionalView.as_view(), name='eficiencia-operacional'),
]
