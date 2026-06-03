from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.models import Proprietario, Fazenda, Safra
from core.serializers import ProprietarioSerializer, FazendaSerializer, SafraSerializer

class ProprietarioViewSet(viewsets.ModelViewSet):
    serializer_class = ProprietarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        incluir_inativos = self.request.query_params.get('incluir_inativos', 'false').lower() == 'true'
        is_detail = self.action in ['retrieve', 'update', 'partial_update', 'destroy']
        if incluir_inativos or is_detail:
            return Proprietario.objects.all()
        return Proprietario.objects.filter(ativo=True)

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()

class FazendaViewSet(viewsets.ModelViewSet):
    serializer_class = FazendaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        incluir_inativos = self.request.query_params.get('incluir_inativos', 'false').lower() == 'true'
        is_detail = self.action in ['retrieve', 'update', 'partial_update', 'destroy']
        is_super = getattr(self.request.user, 'perfil', None) and self.request.user.perfil.nivel == 1
        
        if is_super or self.request.user.is_superuser:
            if incluir_inativos or is_detail:
                return Fazenda.objects.all()
            return Fazenda.objects.filter(ativo=True)
        else:
            if incluir_inativos or is_detail:
                return self.request.user.fazendas_permitidas.all()
            return self.request.user.fazendas_permitidas.filter(ativo=True)

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()

from planejamento.views import setup_tenant_context

class SafraViewSet(viewsets.ModelViewSet):
    serializer_class = SafraSerializer
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        setup_tenant_context(request)
        super().initial(request, *args, **kwargs)

    def get_queryset(self):
        incluir_inativos = self.request.query_params.get('incluir_inativos', 'false').lower() == 'true'
        is_detail = self.action in ['retrieve', 'update', 'partial_update', 'destroy']
        
        if incluir_inativos or is_detail:
            return Safra.objects.filter(fazenda__in=self.request.fazendas_permitidas)
        return Safra.objects.filter(fazenda__in=self.request.fazendas_permitidas, ativo=True)

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()

