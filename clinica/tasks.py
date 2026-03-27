from celery import shared_task
from django.utils import timezone
from datetime import timedelta


@shared_task
def auto_cancelar_citas():
    """Auto-cancel appointments not confirmed 24h before start."""
    from .models import Cita
    now = timezone.now()
    # Find citas that are still Pendiente and start within next 24 hours or already passed
    limite = now + timedelta(hours=24)
    citas = Cita.objects.filter(
        estado='Pendiente',
    )
    canceladas = 0
    for cita in citas:
        from django.utils import timezone as tz
        inicio = tz.make_aware(
            tz.datetime.combine(cita.fecha_cita, cita.hora_inicio)
        )
        if inicio <= limite:
            cita.estado = 'Cancelada'
            cita.motivo_cambio = 'Cancelación automática por falta de confirmación en 24h.'
            cita.save()
            canceladas += 1
    return f'{canceladas} citas canceladas automáticamente.'


@shared_task
def enviar_recordatorios_1h():
    """Send 1h-before reminders that are due."""
    from .models import ColaNotificacion
    now = timezone.now()
    window_end = now + timedelta(minutes=5)  # process items due in the next 5 min

    notifs = ColaNotificacion.objects.filter(
        tipo_aviso='1H_RECORDATORIO',
        estado='Pendiente',
        fecha_envio_programada__lte=window_end,
    ).select_related('cita__paciente')

    for notif in notifs:
        try:
            _enviar_notificacion(notif)
            notif.estado = 'Enviado'
        except Exception:
            notif.estado = 'Fallido'
        notif.save()

    return f'{notifs.count()} recordatorios procesados.'


@shared_task
def enviar_felicitaciones_cumpleanos():
    """Send birthday greetings to patients born today."""
    from .models import PacientePerfil, ColaNotificacion
    from django.utils.timezone import now
    hoy = now().date()
    perfiles = PacientePerfil.objects.filter(
        fecha_nacimiento__month=hoy.month,
        fecha_nacimiento__day=hoy.day,
    ).select_related('usuario')

    for perfil in perfiles:
        # Create a greeting notification
        ColaNotificacion.objects.create(
            usuario=perfil.usuario,
            medio='WhatsApp',
            tipo_aviso='CUMPLEANOS',
            estado='Pendiente',
            fecha_envio_programada=now(),
        )
        _enviar_cumpleanos(perfil.usuario)

    return f'{perfiles.count()} felicitaciones enviadas.'


def _enviar_notificacion(notif):
    """Stub: replace with real Twilio/Email logic."""
    from django.conf import settings
    cita = notif.cita
    if cita:
        msg = (
            f'⏰ Recordatorio: Tienes una cita en Dentiss hoy a las {cita.hora_inicio}. '
            f'Servicio: {cita.servicio_realizado or "Dental"}.'
        )
        print(f'[NOTIF STUB] {notif.medio} → {cita.paciente.telefono}: {msg}')


def _enviar_cumpleanos(usuario):
    """Stub: replace with real Twilio/Email logic."""
    msg = f'🎂 ¡Feliz cumpleaños, {usuario.nombre_completo}! De parte de todo el equipo Dentiss.'
    print(f'[BIRTHDAY STUB] WhatsApp → {usuario.telefono}: {msg}')
