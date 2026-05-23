from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PortViewSet, CityViewSet

router = DefaultRouter()
router.register(r'ports',  PortViewSet,  basename='port')
router.register(r'cities', CityViewSet,  basename='city')

urlpatterns = [
    path('', include(router.urls)),
]
