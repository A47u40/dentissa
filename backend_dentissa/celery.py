import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_dentissa.settings')

app = Celery('dentissa')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Periodic tasks
from celery.schedules import crontab

app.conf.beat_schedule = {
    'auto-cancel-unconfirmed-24h': {
        'task': 'clinica.tasks.auto_cancelar_citas',
        'schedule': crontab(minute=0, hour='*/1'),  # every hour
    },
    'send-reminders-1h': {
        'task': 'clinica.tasks.enviar_recordatorios_1h',
        'schedule': crontab(minute=0, hour='*/1'),
    },
    'send-birthday-greetings': {
        'task': 'clinica.tasks.enviar_felicitaciones_cumpleanos',
        'schedule': crontab(minute=0, hour=9),  # Daily 9 AM
    },
}
