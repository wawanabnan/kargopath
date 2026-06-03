from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('quotations', '0005_alter_quotationrequest_sales_in_charge'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChargeMaster',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(blank=True, max_length=30, null=True)),
                ('category', models.CharField(choices=[('freight', 'Main Freight'), ('trucking', 'Trucking'), ('customs', 'Customs & Clearance'), ('handling', 'Handling & THC'), ('insurance', 'Insurance'), ('other', 'Other Charges')], default='freight', max_length=20)),
                ('name', models.CharField(max_length=255)),
                ('default_unit', models.CharField(default='Lot', max_length=30)),
                ('default_rate', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('default_currency', models.CharField(default='IDR', max_length=5)),
                ('taxable_default', models.BooleanField(default=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='charge_masters', to='users.tenant')),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.AddField(
            model_name='quotation',
            name='is_price_locked',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='quotationitem',
            name='charge_master',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='quotation_items', to='quotations.chargemaster'),
        ),
        migrations.AddField(
            model_name='quotationitem',
            name='is_taxable',
            field=models.BooleanField(default=True),
        ),
        migrations.AddConstraint(
            model_name='chargemaster',
            constraint=models.UniqueConstraint(fields=('tenant', 'name'), name='uniq_charge_master_name_per_tenant'),
        ),
    ]
