from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers

from .views import QuotationRequestViewSet, QuotationViewSet, QuotationItemViewSet, ChargeMasterViewSet, TaxMasterViewSet

router = DefaultRouter()
router.register(r'quotations/requests', QuotationRequestViewSet, basename='quotation-request')
router.register(r'quotations',          QuotationViewSet,        basename='quotation')
router.register(r'charge-masters',      ChargeMasterViewSet,     basename='charge-master')
router.register(r'tax-masters',         TaxMasterViewSet,        basename='tax-master')

# Nested router: /api/v1/quotations/{quotation_pk}/items/
quotation_router = nested_routers.NestedDefaultRouter(router, r'quotations', lookup='quotation')
quotation_router.register(r'items', QuotationItemViewSet, basename='quotation-items')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(quotation_router.urls)),
]
