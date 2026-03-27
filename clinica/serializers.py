from rest_framework import serializers
from django.contrib.auth.hashers import check_password
from .models import (
    Rol, Usuario, PacientePerfil, EspecialistaPerfil,
    Cita, ColaNotificacion, Promocion, CasoExito, PreguntaFrecuente, Servicio
)


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'


class PacientePerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = PacientePerfil
        fields = '__all__'
        read_only_fields = ['usuario']


class EspecialistaPerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = EspecialistaPerfil
        fields = '__all__'
        read_only_fields = ['usuario']


class UsuarioSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    perfil_paciente = PacientePerfilSerializer(read_only=True)
    perfil_especialista = EspecialistaPerfilSerializer(read_only=True)

    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nombre_completo', 'telefono', 'rol', 'rol_nombre',
                  'fecha_registro', 'perfil_paciente', 'perfil_especialista']


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6)
    nombre_completo = serializers.CharField(max_length=200)
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    rol_nombre = serializers.ChoiceField(choices=['Paciente', 'Asistente', 'Especialista', 'Admin'])
    # Patient fields
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True)
    enfermedad_importante = serializers.CharField(required=False, allow_blank=True)
    alergias = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError('Este correo ya está registrado.')
        return value

    def create(self, validated_data):
        rol_nombre = validated_data.pop('rol_nombre')
        fecha_nacimiento = validated_data.pop('fecha_nacimiento', None)
        enfermedad_importante = validated_data.pop('enfermedad_importante', '')
        alergias = validated_data.pop('alergias', '')

        rol, _ = Rol.objects.get_or_create(nombre=rol_nombre)
        usuario = Usuario.objects.create(
            email=validated_data['email'],
            password=validated_data['password'],
            nombre_completo=validated_data['nombre_completo'],
            telefono=validated_data.get('telefono', ''),
            rol=rol,
        )

        if rol_nombre == 'Paciente':
            edad = None
            if fecha_nacimiento:
                from datetime import date
                today = date.today()
                edad = today.year - fecha_nacimiento.year - (
                    (today.month, today.day) < (fecha_nacimiento.month, fecha_nacimiento.day)
                )
            PacientePerfil.objects.create(
                usuario=usuario,
                fecha_nacimiento=fecha_nacimiento,
                edad=edad,
                enfermedad_importante=enfermedad_importante,
                alergias=alergias,
            )
        elif rol_nombre in ('Especialista', 'Admin'):
            EspecialistaPerfil.objects.create(usuario=usuario)

        return usuario


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        try:
            usuario = Usuario.objects.select_related('rol').get(email=data['email'])
        except Usuario.DoesNotExist:
            raise serializers.ValidationError('Credenciales inválidas.')
        if not check_password(data['password'], usuario.password):
            raise serializers.ValidationError('Credenciales inválidas.')
        data['usuario'] = usuario
        return data


class CitaSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source='paciente.nombre_completo', read_only=True)
    especialista_nombre = serializers.CharField(source='especialista.nombre_completo', read_only=True)

    class Meta:
        model = Cita
        fields = '__all__'

    def validate(self, data):
        """Clinic-wide schedule: no two appointments can overlap on the same date.
        Skip this check if no time fields are being modified (e.g. status-only PATCH)."""
        # Only validate time overlaps if time fields are actually being changed
        time_fields_in_data = any(k in data for k in ('hora_inicio', 'hora_fin', 'fecha_cita'))
        if not time_fields_in_data:
            return data

        fecha = data.get('fecha_cita', getattr(self.instance, 'fecha_cita', None))
        hora_inicio = data.get('hora_inicio', getattr(self.instance, 'hora_inicio', None))
        hora_fin = data.get('hora_fin', getattr(self.instance, 'hora_fin', None))

        if not (fecha and hora_inicio and hora_fin):
            return data

        qs = Cita.objects.filter(
            fecha_cita=fecha,
            estado__in=['Pendiente', 'Confirmada'],
        )
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        for cita in qs:
            if cita.hora_inicio < hora_fin and cita.hora_fin > hora_inicio:
                raise serializers.ValidationError(
                    f'Ya existe una cita entre {cita.hora_inicio} y {cita.hora_fin}. '
                    f'El horario no está disponible.'
                )
        return data


class ColaNotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ColaNotificacion
        fields = '__all__'


class PromocionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promocion
        fields = '__all__'


class CasoExitoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CasoExito
        fields = '__all__'


class PreguntaFrecuenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreguntaFrecuente
        fields = '__all__'


class ServicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servicio
        fields = '__all__'
