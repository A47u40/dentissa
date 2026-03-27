from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

from .models import (
    Usuario, Rol, Cita, ColaNotificacion,
    Promocion, CasoExito, PreguntaFrecuente, PacientePerfil, EspecialistaPerfil, Servicio
)
from .serializers import (
    RegisterSerializer, LoginSerializer, UsuarioSerializer,
    CitaSerializer, ColaNotificacionSerializer, PromocionSerializer,
    CasoExitoSerializer, PreguntaFrecuenteSerializer,
    PacientePerfilSerializer, EspecialistaPerfilSerializer, ServicioSerializer
)


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        usuario = serializer.save()
        return Response({'message': 'Usuario registrado correctamente.'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        usuario = serializer.validated_data['usuario']
        # We use a simple dict-based token approach (no Django auth user)
        # Generate JWT using a pseudo-user approach via SimpleJWT
        from rest_framework_simplejwt.tokens import AccessToken
        import json

        # Build a simple payload
        payload = {
            'id': usuario.id,
            'email': usuario.email,
            'nombre': usuario.nombre_completo,
            'rol': usuario.rol.nombre if usuario.rol else None,
        }

        # We create tokens manually using a lightweight wrapper
        refresh = _get_tokens_for_usuario(usuario)
        return Response({
            'access': refresh['access'],
            'refresh': refresh['refresh'],
            'usuario': payload,
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _get_tokens_for_usuario(usuario):
    """Generate JWT tokens for our custom Usuario model."""
    from rest_framework_simplejwt.tokens import RefreshToken as RT

    class FakeUser:
        def __init__(self, uid):
            self.pk = uid
            self.id = uid
            self.is_authenticated = True

    fake = FakeUser(usuario.id)
    refresh = RT.for_user(fake)
    # Add custom claims
    refresh['email'] = usuario.email
    refresh['nombre'] = usuario.nombre_completo
    refresh['rol'] = usuario.rol.nombre if usuario.rol else None
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['GET'])
@permission_classes([AllowAny])
def me_view(request):
    """Return current user info from JWT payload claims."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return Response({'error': 'No autenticado.'}, status=401)
    token = auth.split(' ')[1]
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        decoded = AccessToken(token)
        # Return data directly from token claims (no DB lookup needed)
        return Response({
            'id': int(decoded['user_id']),
            'email': decoded.get('email', ''),
            'nombre_completo': decoded.get('nombre', ''),
            'rol_nombre': decoded.get('rol', ''),
        })
    except Exception as e:
        return Response({'error': str(e)}, status=401)


# ─────────────────────────────────────────────
# USUARIOS
# ─────────────────────────────────────────────

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.select_related('rol').all()
    serializer_class = UsuarioSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({'message': 'Usuario eliminado.'}, status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────
# PERFIL PACIENTE
# ─────────────────────────────────────────────

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([AllowAny])
def perfil_paciente_view(request, usuario_id):
    try:
        perfil = PacientePerfil.objects.get(usuario_id=usuario_id)
    except PacientePerfil.DoesNotExist:
        return Response({'error': 'Perfil no encontrado.'}, status=404)

    if request.method == 'GET':
        return Response(PacientePerfilSerializer(perfil).data)

    serializer = PacientePerfilSerializer(perfil, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


# ─────────────────────────────────────────────
# ESPECIALISTAS
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def especialistas_list(request):
    """Return Especialistas AND Admins (admin is also specialist)."""
    from .models import Rol
    roles = Rol.objects.filter(nombre__in=['Especialista', 'Admin'])
    usuarios = Usuario.objects.filter(rol__in=roles).select_related('perfil_especialista')
    return Response(UsuarioSerializer(usuarios, many=True).data)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([AllowAny])
def perfil_especialista_view(request, usuario_id):
    try:
        perfil = EspecialistaPerfil.objects.get(usuario_id=usuario_id)
    except EspecialistaPerfil.DoesNotExist:
        # Create profile if it doesn't exist
        try:
            usuario = Usuario.objects.get(id=usuario_id)
            perfil = EspecialistaPerfil.objects.create(usuario=usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Especialista no encontrado.'}, status=404)

    if request.method == 'GET':
        return Response(EspecialistaPerfilSerializer(perfil).data)

    serializer = EspecialistaPerfilSerializer(perfil, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


# ─────────────────────────────────────────────
# CITAS
# ─────────────────────────────────────────────

class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.select_related('paciente', 'especialista').all()
    serializer_class = CitaSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        paciente_id = self.request.query_params.get('paciente_id')
        especialista_id = self.request.query_params.get('especialista_id')
        fecha = self.request.query_params.get('fecha')
        estado = self.request.query_params.get('estado')
        if paciente_id:
            qs = qs.filter(paciente_id=paciente_id)
        if especialista_id:
            qs = qs.filter(especialista_id=especialista_id)
        if fecha:
            qs = qs.filter(fecha_cita=fecha)
        if estado:
            qs = qs.filter(estado=estado)
        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({'message': 'Cita eliminada.'}, status=204)


@api_view(['GET'])
@permission_classes([AllowAny])
def estadisticas_view(request):
    """Dashboard stats for admin."""
    from django.db.models import Count
    stats = Cita.objects.values('estado').annotate(total=Count('id'))
    result = {s['estado']: s['total'] for s in stats}
    result['total'] = Cita.objects.count()
    return Response(result)


# ─────────────────────────────────────────────
# NOTIFICACIONES / REMINDERS
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def notificaciones_list(request):
    notifs = ColaNotificacion.objects.select_related('cita', 'usuario').order_by('-fecha_envio_programada')[:100]
    return Response(ColaNotificacionSerializer(notifs, many=True).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def enviar_recordatorio_manual(request):
    """Assistant manually triggers a reminder for a cita."""
    cita_id = request.data.get('cita_id')
    medio = request.data.get('medio', 'WhatsApp')
    try:
        cita = Cita.objects.get(id=cita_id)
    except Cita.DoesNotExist:
        return Response({'error': 'Cita no encontrada.'}, status=404)

    notif = ColaNotificacion.objects.create(
        cita=cita,
        medio=medio,
        tipo_aviso='1H_RECORDATORIO',
        estado='Enviado',
        fecha_envio_programada=timezone.now(),
    )
    # Stub send
    print(f'[MANUAL REMINDER] {medio} → {cita.paciente.telefono}: Tienes cita mañana.')
    return Response({'message': f'Recordatorio enviado via {medio}.'})


# ─────────────────────────────────────────────
# CONTENIDO WEB
# ─────────────────────────────────────────────

class PromocionViewSet(viewsets.ModelViewSet):
    queryset = Promocion.objects.all()
    serializer_class = PromocionSerializer
    permission_classes = [AllowAny]


class CasoExitoViewSet(viewsets.ModelViewSet):
    queryset = CasoExito.objects.all()
    serializer_class = CasoExitoSerializer
    permission_classes = [AllowAny]


class PreguntaFrecuenteViewSet(viewsets.ModelViewSet):
    queryset = PreguntaFrecuente.objects.all()
    serializer_class = PreguntaFrecuenteSerializer
    permission_classes = [AllowAny]


class ServicioViewSet(viewsets.ModelViewSet):
    queryset = Servicio.objects.all()
    serializer_class = ServicioSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # For write actions (update/partial_update/destroy) always return all
        # so inactive services can still be edited or re-activated
        if self.action in ('update', 'partial_update', 'destroy'):
            return Servicio.objects.all()
        # For reads: return all if ?all=1, otherwise only active
        if self.request.query_params.get('all'):
            return Servicio.objects.all()
        return Servicio.objects.filter(activo=True)
