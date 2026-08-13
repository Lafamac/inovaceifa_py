from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import ProprietarioViewSet, FazendaViewSet, SafraViewSet
from core.backup import BackupViewSet

router = DefaultRouter()
router.register('proprietarios', ProprietarioViewSet, basename='proprietario')
router.register('fazendas', FazendaViewSet, basename='fazenda')
router.register('safras', SafraViewSet, basename='safra')

urlpatterns = [
    path('', include(router.urls)),
    path('backup/', BackupViewSet.as_view(), name='backup'),
]
