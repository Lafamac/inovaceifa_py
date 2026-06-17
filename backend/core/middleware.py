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
            # Bloqueia usuários vinculados a proprietários inativos
            if not request.user.is_superuser and not (getattr(request.user, 'perfil', None) and request.user.perfil.nivel == 1):
                from core.models import Proprietario
                if Proprietario.objects.filter(email__iexact=request.user.email, ativo=False).exists():
                    return JsonResponse(
                        {"detail": "Este proprietário está inativo. Entre em contato com o administrador do sistema."},
                        status=403
                    )
                if request.user.fazendas_permitidas.exists():
                    if not request.user.fazendas_permitidas.filter(proprietario__ativo=True).exists():
                        return JsonResponse(
                            {"detail": "Sua conta está vinculada a um proprietário inativo. Entre em contato com o administrador do sistema."},
                            status=403
                        )

            # 1. Definir fazendas permitidas com base no perfil
            is_super = getattr(request.user, 'perfil', None) and request.user.perfil.nivel == 1
            is_proprietario = getattr(request.user, 'perfil', None) and request.user.perfil.nivel == 2
            
            if is_super or request.user.is_superuser:
                request.fazendas_permitidas = Fazenda.objects.filter(ativo=True)
            elif is_proprietario:
                from core.models import Proprietario
                try:
                    prop = Proprietario.objects.get(email__iexact=request.user.email)
                    request.fazendas_permitidas = Fazenda.objects.filter(proprietario=prop, ativo=True)
                except Proprietario.DoesNotExist:
                    request.fazendas_permitidas = Fazenda.objects.none()
            else:
                request.fazendas_permitidas = request.user.fazendas_permitidas.filter(ativo=True)

            # 2. Verificar caminhos isentos
            path = request.path_info
            exempt_paths = [
                '/admin/',
                '/api/auth/',
                '/api/schema/',
                '/api/docs/',
                '/api/proprietarios/',
                '/api/fazendas/',
                '/api/safras/',
                '/api/ref/',
            ]
            is_exempt = any(path.startswith(p) for p in exempt_paths)

            # 3. Interceptar header X-Safra-ID (apenas para caminhos não isentos)
            safra_id = request.headers.get('X-Safra-ID')

            if safra_id and not is_exempt:
                try:
                    safra = Safra.objects.get(id=safra_id, ativo=True)
                    # Validar acesso à safra
                    if safra.fazenda in request.fazendas_permitidas:
                        request.safra_ativa = safra
                        request.fazenda_ativa = safra.fazenda
                        
                        # Se for superusuário, restringir fazendas permitidas ao proprietário da fazenda ativa
                        if is_super or request.user.is_superuser:
                            request.fazendas_permitidas = Fazenda.objects.filter(
                                proprietario=safra.fazenda.proprietario,
                                ativo=True
                            )
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

            # 4. Bloquear endpoints operacionais sem safra_ativa
            if path.startswith('/api/') and not is_exempt and not request.safra_ativa:
                return JsonResponse(
                    {"detail": "O cabeçalho X-Safra-ID é obrigatório para acessar endpoints operacionais."},
                    status=400
                )
