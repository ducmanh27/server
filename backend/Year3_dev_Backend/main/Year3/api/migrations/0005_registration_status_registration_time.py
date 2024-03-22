# Generated by Django 4.1.1 on 2023-11-30 04:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_alter_nodeconfigbuffer_mac_alter_registration_mac'),
    ]

    operations = [
        migrations.AddField(
            model_name='registration',
            name='status',
            field=models.TextField(db_column='status', default='sync'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='registration',
            name='time',
            field=models.BigIntegerField(db_column='time', default=1),
            preserve_default=False,
        ),
    ]
