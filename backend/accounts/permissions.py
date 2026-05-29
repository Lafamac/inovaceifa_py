from rest_framework.permissions import BasePermission
from accounts.models import PERFIL_SUPERUSUARIO

class IsSuperusuario(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and (
                request.user.is_superuser or (
                    request.user.perfil and
                    request.user.perfil.nivel == PERFIL_SUPERUSUARIO
                )
            )
        )
