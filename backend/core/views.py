from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.models import Proprietario, Fazenda, Safra
from core.serializers import ProprietarioSerializer, FazendaSerializer, SafraSerializer

class ProprietarioViewSet(viewsets.ModelViewSet):
    queryset = Proprietario.objects.filter(ativo=True)
    serializer_class = ProprietarioSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()

class FazendaViewSet(viewsets.ModelViewSet):
    serializer_class = FazendaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Retorna apenas as fazendas que o usuário logado tem permissão
        return self.request.fazendas_permitidas

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()

class SafraViewSet(viewsets.ModelViewSet):
    serializer_class = SafraSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Retorna as safras vinculadas às fazendas permitidas do usuário
        return Safra.objects.filter(fazenda__in=self.request.fazendas_permitidas, ativo=True)

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()
