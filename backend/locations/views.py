from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Location, LocationKind
from .serializers import LocationSelectSerializer


class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only endpoint for location master data.

    GET /api/v1/locations/?kind=port              → sea ports
    GET /api/v1/locations/?kind=airport           → airports
    GET /api/v1/locations/?kind=city              → cities
    GET /api/v1/locations/?kind=city-admin        → kota administratif
    GET /api/v1/locations/?kind=regency           → kabupaten
    GET /api/v1/locations/?country_code=ID        → filter by country
    GET /api/v1/locations/?search=jakarta         → search by name/code
    GET /api/v1/locations/?kind=port&search=tg    → combined filter + search

    Shortcut filters:
    GET /api/v1/locations/sea_ports/              → all sea ports
    GET /api/v1/locations/airports/               → all airports
    GET /api/v1/locations/cities/                 → cities + city-admin + regency
    """
    serializer_class   = LocationSelectSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['kind', 'country_code', 'status']
    search_fields      = ['name', 'display_name', 'code', 'iata_code', 'unlocode']
    ordering_fields    = ['name', 'code']
    ordering           = ['name']

    def get_queryset(self):
        return Location.objects.filter(status='active').select_related('parent')

    def sea_ports(self, request):
        """Shortcut: GET /api/v1/locations/sea_ports/"""
        from rest_framework.response import Response
        qs = self.get_queryset().filter(kind=LocationKind.PORT)
        qs = self.filter_queryset(qs)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def airports(self, request):
        """Shortcut: GET /api/v1/locations/airports/"""
        from rest_framework.response import Response
        qs = self.get_queryset().filter(kind=LocationKind.AIRPORT)
        qs = self.filter_queryset(qs)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def cities(self, request):
        """Shortcut: GET /api/v1/locations/cities/ — city + city-admin + regency"""
        from rest_framework.response import Response
        qs = self.get_queryset().filter(kind__in=[
            LocationKind.CITY, LocationKind.CITY_ADMIN, LocationKind.REGENCY
        ])
        qs = self.filter_queryset(qs)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
