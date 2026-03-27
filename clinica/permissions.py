from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, 'usuario') and
                    request.user.usuario.rol and request.user.usuario.rol.nombre == 'Admin')


class IsAssistant(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, 'usuario') and
                    request.user.usuario.rol and request.user.usuario.rol.nombre == 'Asistente')


class IsPatient(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, 'usuario') and
                    request.user.usuario.rol and request.user.usuario.rol.nombre == 'Paciente')


class IsAdminOrAssistant(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not hasattr(request.user, 'usuario'):
            return False
        rol = getattr(request.user.usuario.rol, 'nombre', '')
        return rol in ('Admin', 'Asistente', 'Especialista')
