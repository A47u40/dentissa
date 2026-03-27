from django.db import models
from django.contrib.auth.hashers import make_password


class Rol(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.nombre


class Usuario(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, related_name='usuarios')
    nombre_completo = models.CharField(max_length=200, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def save(self, *args, **kwargs):
        # Hash password if it's not already hashed
        if not self.password.startswith('pbkdf2_') and not self.password.startswith('bcrypt'):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.nombre_completo} ({self.email})'


class PacientePerfil(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='perfil_paciente')
    edad = models.IntegerField(null=True, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    enfermedad_importante = models.TextField(blank=True, null=True)
    alergias = models.TextField(blank=True, null=True)
    tiene_cuenta = models.BooleanField(default=True)

    class Meta:
        db_table = 'pacientes_perfil'
        verbose_name = 'Perfil de Paciente'
        verbose_name_plural = 'Perfiles de Pacientes'

    def __str__(self):
        return f'Perfil de {self.usuario}'


class EspecialistaPerfil(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='perfil_especialista')
    especialidad = models.CharField(max_length=200, blank=True, null=True)
    whatsapp_contacto = models.CharField(max_length=30, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    anos_experiencia = models.IntegerField(null=True, blank=True)
    foto_url = models.TextField(blank=True, null=True)   # base64 or URL
    cert_foto_1 = models.TextField(blank=True, null=True)
    cert_foto_2 = models.TextField(blank=True, null=True)
    cert_foto_3 = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'especialistas_perfil'
        verbose_name = 'Perfil de Especialista'
        verbose_name_plural = 'Perfiles de Especialistas'

    def __str__(self):
        return f'{self.usuario} — {self.especialidad}'


ESTADO_CITA_CHOICES = [
    ('Pendiente', 'Pendiente'),
    ('Confirmada', 'Confirmada'),
    ('Realizada', 'Realizada'),
    ('Cancelada', 'Cancelada'),
    ('Reprogramada', 'Reprogramada'),
]

SERVICIOS_CHOICES = [
    ('Odontología General', 'Odontología General'),
    ('Limpiezas', 'Limpiezas'),
    ('Extracciones', 'Extracciones'),
    ('Caries', 'Caries'),
    ('Resina', 'Resina'),
    ('Ortodoncia', 'Ortodoncia'),
    ('Brackets', 'Brackets'),
    ('Ortopedia Maxilar', 'Ortopedia Maxilar'),
]


class Cita(models.Model):
    paciente = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='citas_paciente')
    especialista = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='citas_especialista')
    fecha_cita = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    estado = models.CharField(max_length=20, choices=ESTADO_CITA_CHOICES, default='Pendiente')
    motivo_cambio = models.TextField(blank=True, null=True)
    servicio_realizado = models.CharField(max_length=200, blank=True, null=True)
    comentario_especialista = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'citas'
        verbose_name = 'Cita'
        verbose_name_plural = 'Citas'

    def __str__(self):
        return f'Cita {self.id} — {self.paciente} con {self.especialista} el {self.fecha_cita}'


MEDIO_CHOICES = [
    ('WhatsApp', 'WhatsApp'),
    ('SMS', 'SMS'),
    ('Correo', 'Correo'),
]

TIPO_AVISO_CHOICES = [
    ('24H_CONFIRMACION', '24H_CONFIRMACION'),
    ('1H_RECORDATORIO', '1H_RECORDATORIO'),
    ('CUMPLEANOS', 'CUMPLEANOS'),
]

ESTADO_NOTIF_CHOICES = [
    ('Pendiente', 'Pendiente'),
    ('Enviado', 'Enviado'),
    ('Fallido', 'Fallido'),
]


class ColaNotificacion(models.Model):
    cita = models.ForeignKey(Cita, on_delete=models.CASCADE, related_name='notificaciones', null=True, blank=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='notificaciones', null=True, blank=True)
    medio = models.CharField(max_length=20, choices=MEDIO_CHOICES)
    tipo_aviso = models.CharField(max_length=30, choices=TIPO_AVISO_CHOICES)
    estado = models.CharField(max_length=20, choices=ESTADO_NOTIF_CHOICES, default='Pendiente')
    fecha_envio_programada = models.DateTimeField()

    class Meta:
        db_table = 'cola_notificaciones'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'


class Promocion(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    imagen_url = models.CharField(max_length=500, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'promociones'
        verbose_name = 'Promoción'
        verbose_name_plural = 'Promociones'

    def __str__(self):
        return self.titulo


class CasoExito(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    imagen_antes = models.CharField(max_length=500, blank=True, null=True)
    imagen_despues = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        db_table = 'casos_exito'
        verbose_name = 'Caso de Éxito'
        verbose_name_plural = 'Casos de Éxito'

    def __str__(self):
        return self.titulo


class PreguntaFrecuente(models.Model):
    pregunta = models.TextField()
    respuesta = models.TextField()

    class Meta:
        db_table = 'preguntas_frecuentes'
        verbose_name = 'Pregunta Frecuente'
        verbose_name_plural = 'Preguntas Frecuentes'

    def __str__(self):
        return self.pregunta[:60]


class Servicio(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    duracion_minutos = models.IntegerField(default=30)
    precio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'servicios'
        verbose_name = 'Servicio'
        verbose_name_plural = 'Servicios'

    def __str__(self):
        return self.nombre
