# Generated manually — removes choices constraint and increases max_length on servicio_realizado

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clinica', '0002_servicio_especialistaperfil_anos_experiencia_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cita',
            name='servicio_realizado',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
    ]
