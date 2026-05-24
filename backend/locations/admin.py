from django.contrib import admin
from mptt.admin import MPTTModelAdmin
from .models import Location


@admin.register(Location)
class LocationAdmin(MPTTModelAdmin):
    list_display  = ('name', 'kind', 'code', 'iata_code', 'unlocode', 'country_code', 'status')
    list_filter   = ('kind', 'country_code', 'status')
    search_fields = ('name', 'code', 'iata_code', 'unlocode', 'display_name')
    ordering      = ('tree_id', 'lft')
    mptt_level_indent = 20
