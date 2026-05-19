from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import ProprietarioViewSet, FazendaViewSet, SafraViewSet

router = DefaultRouter()
router.register('proprietarios', ProprietarioViewSet, basename='proprietario')
router.register('fazendas', FazendaViewSet, basename='fazenda')
router.register('safras', SafraViewSet, basename='safra')

urlpatterns = [
    path('', include(router.urls)),
]
