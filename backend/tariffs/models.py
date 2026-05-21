from django.db import models
from users.models import User

class Tariff(models.Model):
    """
    Master Tariff Table
    Stores pricing information for different routes and modes
    """
    MODE_CHOICES = [
        ('SEA', 'Sea Freight'),
        ('AIR', 'Air Freight'),
        ('LAND', 'Land/Trucking'),
    ]
    
    SCOPE_CHOICES = [
        ('D2D', 'Door to Door'),
        ('D2P', 'Door to Port'),
        ('P2D', 'Port to Door'),
        ('P2P', 'Port to Port'),
    ]
    
    LOCATION_TYPE_CHOICES = [
        ('PORT', 'Seaport'),
        ('AIRPORT', 'Airport'),
        ('CITY', 'City'),
        ('ADDRESS', 'Specific Address'),
    ]
    
    CONTAINER_TYPE_CHOICES = [
        ('20GP', '20ft General Purpose'),
        ('40GP', '40ft General Purpose'),
        ('40HC', '40ft High Cube'),
        ('LCL', 'Less than Container Load'),
    ]
    
    CURRENCY_CHOICES = [
        ('IDR', 'Indonesian Rupiah'),
        ('USD', 'US Dollar'),
    ]
    
    # Basic Info
    mode = models.CharField(max_length=10, choices=MODE_CHOICES)
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES)
    
    # Origin
    origin_type = models.CharField(max_length=10, choices=LOCATION_TYPE_CHOICES)
    origin_name = models.CharField(max_length=255, help_text="Port/Airport/City name")
    origin_address = models.TextField(blank=True, null=True, help_text="Full address for Door")
    
    # Destination
    destination_type = models.CharField(max_length=10, choices=LOCATION_TYPE_CHOICES)
    destination_name = models.CharField(max_length=255)
    destination_address = models.TextField(blank=True, null=True)
    
    # Pricing
    container_type = models.CharField(max_length=10, choices=CONTAINER_TYPE_CHOICES, blank=True, null=True)
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='IDR')
    
    # Validity
    valid_from = models.DateField()
    valid_until = models.DateField(blank=True, null=True, help_text="Leave blank for indefinite")
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='tariffs_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, help_text="Internal notes about this tariff")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['mode', 'scope', 'is_active']),
            models.Index(fields=['origin_name', 'destination_name']),
        ]
    
    def __str__(self):
        return f"{self.mode} {self.scope}: {self.origin_name} → {self.destination_name} ({self.currency} {self.rate})"
