from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from core.models import Safra, Fazenda

class MultiTenantMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.safra_ativa = None
        request.fazenda_ativa = None
        request.fazendas_permitidas = Fazenda.objects.none()

        # Só validamos se o usuário estiver autenticado
        if request.user and request.user.is_authenticated:
            # 1. Definir fazendas permitidas com base no perfil
            # Perfil ID 1 = Superusuário
            is_super = getattr(request.user, 'perfil', None) and request.user.perfil.nivel == 1
            if is_super or request.user.is_superuser:
                request.fazendas_permitidas = Fazenda.objects.filter(ativo=True)
            else:
                request.fazendas_permitidas = request.user.fazendas_permitidas.filter(ativo=True)

            # 2. Interceptar header X-Safra-ID
            safra_id = request.headers.get('X-Safra-ID')

            if safra_id:
                try:
                    safra = Safra.objects.get(id=safra_id, ativo=True)
                    # Validar acesso à safra
                    if safra.fazenda in request.fazendas_permitidas:
                        request.safra_ativa = safra
                        request.fazenda_ativa = safra.fazenda
                    else:
                        return JsonResponse(
                            {"detail": "Você não tem permissão para acessar esta Safra/Fazenda."},
                            status=403
                        )
                except (Safra.DoesNotExist, ValueError):
                    return JsonResponse(
                        {"detail": "Safra informada no cabeçalho X-Safra-ID é inválida ou inativa."},
                        status=400
                    )

            # 3. Bloquear endpoints operacionais sem safra_ativa
            path = request.path_info
            
            # Caminhos isentos do cabeçalho de safra
            exempt_paths = [
                '/admin/',
                '/api/auth/',
                '/api/schema/',
                '/api/docs/',
                '/api/proprietarios/',
                '/api/fazendas/',
                '/api/safras/',
            ]

            is_exempt = any(path.startswith(p) for p in exempt_paths)

            if path.startswith('/api/') and not is_exempt and not request.safra_ativa:
                return JsonResponse(
                    {"detail": "O cabeçalho X-Safra-ID é obrigatório para acessar endpoints operacionais."},
                    status=400
                )
