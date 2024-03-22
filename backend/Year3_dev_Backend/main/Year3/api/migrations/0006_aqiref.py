# Generated by Django 4.1.1 on 2023-12-04 06:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_registration_status_registration_time'),
    ]

    operations = [
        migrations.CreateModel(
            name='AqiRef',
            fields=[
                ('id', models.BigAutoField(db_column='id', primary_key=True, serialize=False)),
                ('pm25', models.IntegerField(db_column='pm25', null=True)),
                ('pm10', models.IntegerField(db_column='pm10', null=True)),
                ('o3', models.IntegerField(db_column='o3', null=True)),
                ('no2', models.IntegerField(db_column='no2', null=True)),
                ('so2', models.IntegerField(db_column='so2', null=True)),
                ('co', models.IntegerField(db_column='co', null=True)),
                ('t', models.IntegerField(db_column='t', null=True)),
                ('p', models.IntegerField(db_column='p', null=True)),
                ('h', models.IntegerField(db_column='h', null=True)),
                ('w', models.IntegerField(db_column='w', null=True)),
                ('time', models.BigIntegerField(db_column='time', null=True)),
                ('dew', models.IntegerField(db_column='dew', null=True)),
                ('wg', models.IntegerField(db_column='wg', null=True)),
            ],
        ),
    ]
