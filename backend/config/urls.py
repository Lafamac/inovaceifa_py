"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from accounts.views import me

urlpatterns = [
    path('admin/', admin.site.urls),

    # Autenticação JWT
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/auth/me/', me, name='auth_me'),

    # Swagger OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Rotas do Core (Proprietarios, Fazendas, Safras)
    path('api/', include('core.urls')),

    # Rotas de Referências Auxiliares
    path('api/', include('referencias.urls')),

    # Rotas de Cadastros Base e Estoque
    path('api/', include('cadastros.urls')),

    # Rotas de Planejamento da Safra
    path('api/', include('planejamento.urls')),

    # Rotas de Operações e Apontamentos
    path('api/', include('operacoes.urls')),

    # Rotas Financeiras e de Compras (Fase 6.5)
    path('api/', include('financeiro.urls')),

    # Rotas de Relatórios
    path('api/', include('relatorios.urls')),
]
