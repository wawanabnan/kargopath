from django.contrib import admin
from .models import Tariff

@admin.register(Tariff)
class TariffAdmin(admin.ModelAdmin):
    list_display = ('mode', 'scope', 'origin_name', 'destination_name', 'rate', 'currency', 'is_active', 'created_at')
    list_filter = ('mode', 'scope', 'currency', 'is_active')
    search_fields = ('origin_name', 'destination_name', 'notes')
    readonly_fields = ('created_by', 'created_at', 'updated_at')
