from django.db import models
from django.conf import settings
from users.models import User
from quotations.models import Quotation

class Shipment(models.Model):
    STATUS_CHOICES = [
        ('BOOKED', 'Booked'),
        ('IN_TRANSIT', 'In Transit'),
        ('ARRIVED', 'Arrived'),
        ('DELIVERED', 'Delivered'),
        ('POD_CONFIRMED', 'POD Confirmed'),
    ]

    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='shipments'
    )
    shipment_number = models.CharField(max_length=50, unique=True)
    quotation = models.OneToOneField(Quotation, on_delete=models.CASCADE, related_name='shipment')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shipments')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='BOOKED')
    awb_bl_number = models.CharField(max_length=100, blank=True, null=True)
    eta = models.DateTimeField(blank=True, null=True)
    etd = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.shipment_number} - {self.client.email}"

    class Meta:
        ordering = ['-created_at']

class ShipmentMilestone(models.Model):
    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='shipment_milestones'
    )
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='milestones')
    status_code = models.CharField(max_length=100)
    description = models.TextField()
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    location = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.shipment.shipment_number} - {self.status_code}"

class ShipmentDocument(models.Model):
    DOC_TYPES = [
        ('BL', 'Bill of Lading'),
        ('AWB', 'Airway Bill'),
        ('INVOICE', 'Commercial Invoice'),
        ('PACKING_LIST', 'Packing List'),
        ('POD', 'Proof of Delivery'),
        ('OTHER', 'Other'),
    ]
    
    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='shipment_documents'
    )

    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DOC_TYPES)
    file = models.FileField(upload_to='shipment_docs/')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    is_visible_to_client = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.shipment.shipment_number} - {self.document_type}"
