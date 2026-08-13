from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiTypes, extend_schema
from accounts.models import Usuario, Perfil
from accounts.serializers import UsuarioSerializer, PerfilSerializer
from accounts.permissions import IsSuperusuario


@extend_schema(
    tags=["Autenticacao"],
    responses={200: OpenApiResponse(response=OpenApiTypes.OBJECT)},
    summary="Dados do usuario autenticado",
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    perfil_nome = user.perfil.nome if user.perfil else ("Superusuário" if user.is_superuser else "Sem Perfil")
    perfil_nivel = user.perfil.nivel if user.perfil else (1 if user.is_superuser else None)
    
    avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop"
    
    # Multi-tenant middleware sets request.fazendas_permitidas
    fazenda_padrao = None
    if hasattr(request, 'fazendas_permitidas') and request.fazendas_permitidas.exists():
        fazenda_padrao = request.fazendas_permitidas.first().id

    # Resolve last backup date for the owner
    data_ultimo_backup = None
    from core.models import Proprietario
    try:
        prop = Proprietario.objects.get(email__iexact=user.email)
        data_ultimo_backup = prop.data_ultimo_backup
    except Proprietario.DoesNotExist:
        # If superuser or operator, check context fazenda or default
        if (perfil_nivel == 1 or user.is_superuser) or (perfil_nivel == 3):
            # Manually extract context safra from headers since this is an exempt path
            safra_id = request.headers.get('X-Safra-ID') or request.META.get('HTTP_X_SAFRA_ID')
            if safra_id:
                try:
                    from core.models import Safra
                    safra = Safra.objects.get(id=safra_id, ativo=True)
                    data_ultimo_backup = safra.fazenda.proprietario.data_ultimo_backup
                except (Safra.DoesNotExist, ValueError):
                    pass
            
            if data_ultimo_backup is None and hasattr(request, 'fazendas_permitidas') and request.fazendas_permitidas.exists():
                first_farm = request.fazendas_permitidas.first()
                data_ultimo_backup = first_farm.proprietario.data_ultimo_backup

    return Response({
        "id": user.id,
        "username": user.username,
        "nome": user.get_full_name() or user.username,
        "email": user.email,
        "cargo": perfil_nome,
        "avatar": avatar,
        "perfil_id": perfil_nivel,
        "is_superuser": user.is_superuser,
        "fazenda_padrao": fazenda_padrao,
        "data_ultimo_backup": data_ultimo_backup
    })

@extend_schema(
    tags=["Autenticacao"],
    responses={200: OpenApiResponse(description="Senha alterada com sucesso.")},
    summary="Alterar senha do usuario autenticado",
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def alterar_senha(request):
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if old_password:
        old_password = old_password.strip()
    if new_password:
        new_password = new_password.strip()
        
    if not old_password or not new_password:
        return Response({"detail": "Informe a senha atual e a nova senha."}, status=400)
    
    user = request.user
    is_correct = user.check_password(old_password)
    
    if not is_correct:
        return Response({"detail": "Senha atual incorreta."}, status=400)
        
    if len(new_password) < 6:
        return Response({"detail": "A nova senha deve conter no mínimo 6 caracteres."}, status=400)
        
    user.set_password(new_password)
    user.save()
    
    return Response({"detail": "Senha alterada com sucesso."})

class UsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, IsSuperusuario]

    def get_queryset(self):
        incluir_inativos = self.request.query_params.get('incluir_inativos', 'false').lower() == 'true'
        if incluir_inativos:
            return Usuario.objects.all().order_by('id')
        return Usuario.objects.filter(ativo=True).order_by('id')

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()

class PerfilViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Perfil.objects.all().order_by('nivel')
    serializer_class = PerfilSerializer
    permission_classes = [IsAuthenticated]

from rest_framework_simplejwt.views import TokenObtainPairView
from accounts.serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


from core.services import recuperar_senha_por_email

@extend_schema(
    tags=["Autenticacao"],
    responses={
        200: OpenApiResponse(description="Nova senha enviada por e-mail."),
        400: OpenApiResponse(description="Erro de solicitacao."),
        500: OpenApiResponse(description="Erro no servidor SMTP."),
    },
    summary="Recuperar senha por e-mail",
)
@api_view(['POST'])
@permission_classes([])
def recuperar_senha(request):
    email = request.data.get('email')
    if not email:
        return Response({"detail": "Informe o e-mail para recuperacao."}, status=400)
    
    try:
        recuperar_senha_por_email(email)
        return Response({"detail": "Uma nova senha temporaria foi enviada para o seu e-mail."})
    except ValueError as e:
        return Response({"detail": str(e)}, status=400)
    except Exception as e:
        return Response({
            "detail": f"Erro ao processar recuperacao de senha: {str(e)}. Verifique as configuracoes de SMTP."
        }, status=500)
