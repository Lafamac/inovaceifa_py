from rest_framework import permissions

class IsSuperUsuarioOrReadOnly(permissions.BasePermission):
    """
    Permissão que libera apenas leitura (SAFE_METHODS) para usuários autenticados,
    e exige perfil de Superusuário (nivel = 1) para qualquer alteração (POST, PUT, PATCH, DELETE).
    """
    def has_permission(self, request, view):
        # Acesso de leitura é liberado para qualquer usuário autenticado
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Escrita exige autenticação e perfil_id = 1 (Superusuário)
        if not (request.user and request.user.is_authenticated):
            return False

        is_super = getattr(request.user, 'perfil', None) and request.user.perfil.nivel == 1
        return bool(is_super or request.user.is_superuser)
