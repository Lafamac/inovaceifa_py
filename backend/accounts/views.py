from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiTypes, extend_schema


@extend_schema(
    tags=["Autenticacao"],
    responses={200: OpenApiResponse(response=OpenApiTypes.OBJECT)},
    summary="Dados do usuario autenticado",
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    perfil_nome = user.perfil.nome if user.perfil else "Sem Perfil"
    perfil_nivel = user.perfil.nivel if user.perfil else None
    
    avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop"
    
    # Multi-tenant middleware sets request.fazendas_permitidas
    fazenda_padrao = None
    if hasattr(request, 'fazendas_permitidas') and request.fazendas_permitidas.exists():
        fazenda_padrao = request.fazendas_permitidas.first().id

    return Response({
        "id": user.id,
        "username": user.username,
        "nome": user.get_full_name() or user.username,
        "email": user.email,
        "cargo": perfil_nome,
        "avatar": avatar,
        "perfil_id": perfil_nivel,
        "fazenda_padrao": fazenda_padrao
    })
