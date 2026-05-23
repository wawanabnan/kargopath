from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Port, City
from .serializers import PortSerializer, CitySerializer


class PortViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only endpoint for ports and airports.

    GET /api/v1/locations/ports/              → all active ports & airports
    GET /api/v1/locations/ports/?type=SEA     → sea ports only
    GET /api/v1/locations/ports/?type=AIR     → airports only
    GET /api/v1/locations/ports/?search=jkt   → search by code, name, city
    """
    serializer_class   = PortSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['port_type', 'country_code']
    search_fields      = ['code', 'name', 'city', 'province']
    ordering_fields    = ['code', 'name', 'city']

    def get_queryset(self):
        return Port.objects.filter(is_active=True)


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only endpoint for cities (used for trucking/door services).

    GET /api/v1/locations/cities/             → all active cities
    GET /api/v1/locations/cities/?search=jkt  → search by name, province
    """
    serializer_class   = CitySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['country_code', 'province']
    search_fields      = ['name', 'province']
    ordering_fields    = ['name', 'province']

    def get_queryset(self):
        return City.objects.filter(is_active=True)
