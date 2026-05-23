from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_tenant_user_tenant'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='client_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('company', 'Company / Corporate'),
                    ('personal_business', 'Personal Business'),
                ],
                max_length=20,
                null=True,
            ),
        ),
    ]
