from django.contrib import admin
from .models import Tariff

@admin.register(Tariff)
class TariffAdmin(admin.ModelAdmin):
    list_display = ('mode', 'scope', 'tenant', 'origin_name', 'destination_name', 'rate', 'currency', 'is_active', 'created_at')
    list_filter = ('tenant', 'mode', 'scope', 'currency', 'is_active')
    search_fields = ('origin_name', 'destination_name', 'notes')
    readonly_fields = ('created_by', 'created_at', 'updated_at')
    
    def get_queryset(self, request):
        """Filter tariffs by tenant for non-superusers."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(tenant=request.user.tenant)
