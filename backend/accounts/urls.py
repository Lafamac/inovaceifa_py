from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, PerfilViewSet

router = DefaultRouter()
router.register('usuarios', UsuarioViewSet, basename='usuario')
router.register('perfis', PerfilViewSet, basename='perfil')

urlpatterns = [
    path('', include(router.urls)),
]
