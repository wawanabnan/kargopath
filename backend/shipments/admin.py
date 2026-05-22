from django.contrib import admin
from .models import Shipment, ShipmentMilestone, ShipmentDocument

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('shipment_number', 'tenant', 'client', 'status', 'created_at')
    search_fields = ('shipment_number', 'client__email', 'awb_bl_number')
    list_filter = ('tenant', 'status',)
    
    def get_queryset(self, request):
        """Filter shipments by tenant for non-superusers."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(tenant=request.user.tenant)

admin.site.register(ShipmentMilestone)
admin.site.register(ShipmentDocument)
