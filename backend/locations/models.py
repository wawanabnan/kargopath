from django.db import models
from django.utils.text import slugify
from django.db.models import Q
from django.core.exceptions import ValidationError
from mptt.models import MPTTModel, TreeForeignKey


class LocationKind(models.TextChoices):
    COUNTRY       = 'country',       'Country'
    PROVINCE      = 'province',      'Province'
    REGENCY       = 'regency',       'Regency / Kabupaten'
    CITY_ADMIN    = 'city-admin',    'City Administrative / Kota'
    DISTRICT      = 'district',      'District / Kecamatan'
    LOCALITY      = 'locality',      'Locality / Kelurahan'
    CITY          = 'city',          'City (General)'
    AIRPORT       = 'airport',       'Airport'
    PORT          = 'port',          'Sea Port'
    JETTY         = 'jetty',         'Jetty'
    ANCHORAGE     = 'anchorage',     'Anchorage'
    TRAIN_STATION = 'train-station', 'Train Station'
    BUS_TERMINAL  = 'bus-terminal',  'Bus Terminal'
    WAREHOUSE     = 'warehouse',     'Warehouse / Depot'


class Location(MPTTModel):
    """
    Hierarchical location master data.
    Supports Country → Province → Regency/City → Port/Airport/etc.

    Uses django-mptt for efficient tree queries.
    """

    code         = models.CharField(max_length=20, unique=True)
    name         = models.CharField(max_length=150)
    display_name = models.CharField(max_length=255, blank=True)
    kind         = models.CharField(max_length=20, choices=LocationKind.choices)

    # Tree structure (managed by django-mptt)
    parent = TreeForeignKey(
        'self', on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='parent_id',
        related_name='children',
    )

    # Standard codes
    iata_code  = models.CharField(max_length=10, null=True, blank=True, help_text='IATA code (airports)')
    unlocode   = models.CharField(max_length=10, null=True, blank=True, help_text='UN/LOCODE (sea ports)')
    iso_code   = models.CharField(max_length=20, null=True, blank=True, help_text='ISO 3166-2')
    country_code = models.CharField(max_length=2, null=True, blank=True, help_text='ISO 3166-1 alpha-2')

    # Coordinates
    latitude   = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude  = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    altitude   = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    # Address / admin
    postal_code = models.CharField(max_length=10, null=True, blank=True)
    timezone    = models.CharField(max_length=50, null=True, blank=True)

    # Meta
    status = models.CharField(
        max_length=8,
        choices=[('active', 'Active'), ('inactive', 'Inactive')],
        default='active',
    )
    source = models.CharField(max_length=100, null=True, blank=True)
    note   = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class MPTTMeta:
        order_insertion_by = ['name']

    class Meta:
        db_table = 'locations_location'
        indexes = [
            models.Index(fields=['code'],       name='loc_code_idx'),
            models.Index(fields=['kind'],       name='loc_kind_idx'),
            models.Index(fields=['iata_code'],  name='loc_iata_idx'),
            models.Index(fields=['unlocode'],   name='loc_unlocode_idx'),
            models.Index(fields=['country_code'], name='loc_country_idx'),
            models.Index(fields=['kind', 'name'], name='loc_kind_name_idx'),
        ]
        constraints = [
            models.CheckConstraint(
                check=Q(latitude__isnull=True) | (Q(latitude__gte=-90) & Q(latitude__lte=90)),
                name='chk_lat_range',
            ),
            models.CheckConstraint(
                check=Q(longitude__isnull=True) | (Q(longitude__gte=-180) & Q(longitude__lte=180)),
                name='chk_lng_range',
            ),
        ]

    def clean(self):
        if self.pk and self.parent_id and self.parent_id == self.pk:
            raise ValidationError('Parent cannot be itself.')

    def save(self, *args, **kwargs):
        # Auto-generate code if not set
        if not self.code:
            base = (self.unlocode or self.iata_code or slugify(self.name) or 'LOC').upper()[:20]
            code = base
            i = 1
            while Location.objects.filter(code=code).exclude(pk=self.pk).exists():
                suffix = f'-{i}'
                code = base[:(20 - len(suffix))] + suffix
                i += 1
            self.code = code

        if not self.display_name:
            self.display_name = self.name

        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} [{self.kind}]'

    # ── Convenience properties ────────────────────────────────────────────────

    @property
    def full_path(self):
        """e.g. Indonesia > Jawa Timur > Surabaya > Tanjung Perak"""
        parts = [self.name]
        p = self.parent
        while p:
            parts.append(p.name)
            p = p.parent
        return ' > '.join(reversed(parts))

    def is_airport(self):
        return self.kind == LocationKind.AIRPORT

    def is_port(self):
        return self.kind in (LocationKind.PORT, LocationKind.JETTY, LocationKind.ANCHORAGE)

    def is_sea_location(self):
        return self.kind in (LocationKind.PORT, LocationKind.JETTY, LocationKind.ANCHORAGE)

    def is_air_location(self):
        return self.kind == LocationKind.AIRPORT

    def is_land_location(self):
        return self.kind in (
            LocationKind.CITY, LocationKind.CITY_ADMIN, LocationKind.REGENCY,
            LocationKind.TRAIN_STATION, LocationKind.BUS_TERMINAL,
        )
