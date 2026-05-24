from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LocationViewSet

router = DefaultRouter()
router.register(r'', LocationViewSet, basename='location')

urlpatterns = [
    path('', include(router.urls)),
    # Shortcut endpoints
    path('sea-ports/', LocationViewSet.as_view({'get': 'sea_ports'}), name='location-sea-ports'),
    path('airports/',  LocationViewSet.as_view({'get': 'airports'}),  name='location-airports'),
    path('cities/',    LocationViewSet.as_view({'get': 'cities'}),    name='location-cities'),
]
