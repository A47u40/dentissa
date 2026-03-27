from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import Cita, ColaNotificacion


@receiver(post_save, sender=Cita)
def crear_notificaciones_cita(sender, instance, created, **kwargs):
    """When a new cita is created, schedule 24h confirmation and 1h reminder."""
    if not created:
        return

    try:
        fecha_hora_inicio = timezone.make_aware(
            timezone.datetime.combine(instance.fecha_cita, instance.hora_inicio)
        )

        # 24h before — confirmation notice
        ColaNotificacion.objects.create(
            cita=instance,
            medio='WhatsApp',
            tipo_aviso='24H_CONFIRMACION',
            estado='Pendiente',
            fecha_envio_programada=fecha_hora_inicio - timedelta(hours=24),
        )

        # 1h before — reminder
        ColaNotificacion.objects.create(
            cita=instance,
            medio='WhatsApp',
            tipo_aviso='1H_RECORDATORIO',
            estado='Pendiente',
            fecha_envio_programada=fecha_hora_inicio - timedelta(hours=1),
        )
    except Exception as e:
        # Notification creation failure should NOT crash the cita request
        print(f'[SIGNAL WARNING] Error creating notifications for cita {instance.id}: {e}')
