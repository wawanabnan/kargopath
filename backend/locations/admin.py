from django.contrib import admin
from .models import Port, City


@admin.register(Port)
class PortAdmin(admin.ModelAdmin):
    list_display  = ('code', 'name', 'city', 'province', 'country_code', 'port_type', 'is_active')
    list_filter   = ('port_type', 'country_code', 'is_active')
    search_fields = ('code', 'name', 'city')
    ordering      = ('port_type', 'country_code', 'name')


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display  = ('name', 'province', 'country_code', 'is_active')
    list_filter   = ('country_code', 'province', 'is_active')
    search_fields = ('name', 'province')
    ordering      = ('country_code', 'province', 'name')
