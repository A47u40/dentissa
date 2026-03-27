from django.contrib import admin
from .models import (
    Rol, Usuario, PacientePerfil, EspecialistaPerfil,
    Cita, ColaNotificacion, Promocion, CasoExito, PreguntaFrecuente
)

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre']


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre_completo', 'email', 'rol', 'fecha_registro']
    list_filter = ['rol']
    search_fields = ['nombre_completo', 'email']


@admin.register(PacientePerfil)
class PacientePerfilAdmin(admin.ModelAdmin):
    list_display = ['id', 'usuario', 'edad', 'fecha_nacimiento']


@admin.register(EspecialistaPerfil)
class EspecialistaPerfilAdmin(admin.ModelAdmin):
    list_display = ['id', 'usuario', 'especialidad']


@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = ['id', 'paciente', 'especialista', 'fecha_cita', 'hora_inicio', 'estado']
    list_filter = ['estado', 'fecha_cita']
    search_fields = ['paciente__nombre_completo', 'especialista__nombre_completo']


@admin.register(ColaNotificacion)
class ColaNotificacionAdmin(admin.ModelAdmin):
    list_display = ['id', 'cita', 'medio', 'tipo_aviso', 'estado', 'fecha_envio_programada']
    list_filter = ['estado', 'medio']


@admin.register(Promocion)
class PromocionAdmin(admin.ModelAdmin):
    list_display = ['id', 'titulo', 'activo', 'fecha_inicio', 'fecha_fin']
    list_filter = ['activo']


@admin.register(CasoExito)
class CasoExitoAdmin(admin.ModelAdmin):
    list_display = ['id', 'titulo']


@admin.register(PreguntaFrecuente)
class PreguntaFrecuenteAdmin(admin.ModelAdmin):
    list_display = ['id', 'pregunta']
