from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import Proprietario, Fazenda, Safra
from core.serializers import ProprietarioSerializer, FazendaSerializer, SafraSerializer
from rest_framework.exceptions import PermissionDenied
from planejamento.views import setup_tenant_context

class BaseCoreViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet for core app that enforces Cache-Control headers to prevent client-side caching of GET requests.
    """
    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if request.method in ['GET', 'HEAD']:
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        return response

class ProprietarioViewSet(BaseCoreViewSet):
    serializer_class = ProprietarioSerializer
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        is_super = getattr(request.user, 'perfil', None) and request.user.perfil.nivel == 1
        if not (is_super or request.user.is_superuser):
            raise PermissionDenied("Apenas o perfil de Superusuário (nível 1) tem acesso ao cadastro de proprietários.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        # Add warning message informing about user and email creation
        data = serializer.data
        data['warning'] = 'Proprietário cadastrado com sucesso! O usuário correspondente foi criado e os dados de acesso foram enviados por e-mail.'
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        incluir_inativos = self.request.query_params.get('incluir_inativos', 'false').lower() == 'true'
        is_detail = self.action in ['retrieve', 'update', 'partial_update', 'destroy']
        if incluir_inativos or is_detail:
            return Proprietario.objects.all()
        return Proprietario.objects.filter(ativo=True)

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()

class FazendaViewSet(BaseCoreViewSet):
    serializer_class = FazendaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        incluir_inativos = self.request.query_params.get('incluir_inativos', 'false').lower() == 'true'
        is_detail = self.action in ['retrieve', 'update', 'partial_update', 'destroy']
        user = self.request.user
        
        is_super = getattr(user, 'perfil', None) and user.perfil.nivel == 1
        is_proprietario = getattr(user, 'perfil', None) and user.perfil.nivel == 2
        
        if is_super or user.is_superuser:
            qs = Fazenda.objects.all()
        elif is_proprietario:
            try:
                prop = Proprietario.objects.get(email__iexact=user.email)
                qs = Fazenda.objects.filter(proprietario=prop)
            except Proprietario.DoesNotExist:
                qs = Fazenda.objects.none()
        else:
            qs = user.fazendas_permitidas.all()
            
        qs = qs.filter(proprietario__ativo=True)

        if not (incluir_inativos or is_detail):
            qs = qs.filter(ativo=True)
            
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        is_super = getattr(user, 'perfil', None) and user.perfil.nivel == 1
        
        if is_super or user.is_superuser:
            serializer.save()
        else:
            try:
                proprietario = Proprietario.objects.get(email__iexact=user.email)
                fazenda = serializer.save(proprietario=proprietario)
                user.fazendas_permitidas.add(fazenda)
            except Proprietario.DoesNotExist:
                raise PermissionDenied("Não foi encontrado um Proprietário associado ao seu usuário. Entre em contato com o administrador.")

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()

class SafraViewSet(BaseCoreViewSet):
    serializer_class = SafraSerializer
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        setup_tenant_context(request)
        super().initial(request, *args, **kwargs)

    def get_queryset(self):
        incluir_inativos = self.request.query_params.get('incluir_inativos', 'false').lower() == 'true'
        is_detail = self.action in ['retrieve', 'update', 'partial_update', 'destroy']
        user = self.request.user
        
        is_super = getattr(user, 'perfil', None) and user.perfil.nivel == 1
        is_proprietario = getattr(user, 'perfil', None) and user.perfil.nivel == 2

        if is_super or user.is_superuser:
            qs = Safra.objects.filter(
                fazenda__ativo=True,
                fazenda__proprietario__ativo=True
            )
        elif is_proprietario:
            try:
                from core.models import Proprietario
                prop = Proprietario.objects.get(email__iexact=user.email)
                qs = Safra.objects.filter(
                    fazenda__proprietario=prop,
                    fazenda__ativo=True,
                    fazenda__proprietario__ativo=True
                )
            except Proprietario.DoesNotExist:
                qs = Safra.objects.none()
        else:
            qs = Safra.objects.filter(
                fazenda__in=user.fazendas_permitidas.filter(ativo=True),
                fazenda__ativo=True,
                fazenda__proprietario__ativo=True
            )

        if incluir_inativos or is_detail:
            return qs
        return qs.filter(ativo=True)

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()

