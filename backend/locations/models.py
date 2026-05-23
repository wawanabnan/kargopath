from django.db import models


class Port(models.Model):
    """
    Pelabuhan laut (SEA) dan bandara (AIR).
    Digunakan sebagai origin/destination pada scope P2P, P2D, D2P.
    """
    TYPE_CHOICES = (
        ('SEA', 'Sea Port'),
        ('AIR', 'Airport'),
    )

    code         = models.CharField(max_length=10, unique=True, help_text='IATA/UN LOCODE, e.g. IDTPP, CGK')
    name         = models.CharField(max_length=255, help_text='Full port/airport name')
    city         = models.CharField(max_length=100)
    province     = models.CharField(max_length=100, blank=True)
    country      = models.CharField(max_length=100, default='Indonesia')
    country_code = models.CharField(max_length=3, default='ID')
    port_type    = models.CharField(max_length=3, choices=TYPE_CHOICES)
    is_active    = models.BooleanField(default=True)

    class Meta:
        ordering = ['country_code', 'port_type', 'name']
        verbose_name = 'Port / Airport'
        verbose_name_plural = 'Ports / Airports'

    def __str__(self):
        return f'{self.code} – {self.name}, {self.city}'

    @property
    def display_label(self):
        return f'{self.code} – {self.name}, {self.city}'


class City(models.Model):
    """
    Kota/area untuk layanan trucking (Land mode) dan Door pickup/delivery.
    """
    name         = models.CharField(max_length=100)
    province     = models.CharField(max_length=100, blank=True)
    country      = models.CharField(max_length=100, default='Indonesia')
    country_code = models.CharField(max_length=3, default='ID')
    is_active    = models.BooleanField(default=True)

    class Meta:
        ordering = ['country_code', 'province', 'name']
        unique_together = ('name', 'province', 'country_code')
        verbose_name = 'City'
        verbose_name_plural = 'Cities'

    def __str__(self):
        return f'{self.name}, {self.province}' if self.province else self.name
