from django.contrib import admin
from .models import Shipment, ShipmentMilestone, ShipmentDocument

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('shipment_number', 'client', 'status', 'created_at')
    search_fields = ('shipment_number', 'client__email', 'awb_bl_number')
    list_filter = ('status',)

admin.site.register(ShipmentMilestone)
admin.site.register(ShipmentDocument)
