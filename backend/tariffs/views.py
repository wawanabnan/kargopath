from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Tariff
from .serializers import TariffSerializer

class TariffViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Tariff Management
    Only accessible by Sales and Admin users
    """
    queryset = Tariff.objects.all()
    serializer_class = TariffSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['mode', 'scope', 'is_active', 'currency']
    search_fields = ['origin_name', 'destination_name', 'notes']
    ordering_fields = ['created_at', 'rate', 'valid_from']
    
    def get_queryset(self):
        # Only Sales and Admin can see tariffs
        if self.request.user.role not in ['SALES', 'ADMIN']:
            return Tariff.objects.none()
        return Tariff.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def search_route(self, request):
        """
        Search tariffs by route
        Query params: mode, scope, origin, destination
        """
        mode = request.query_params.get('mode')
        scope = request.query_params.get('scope')
        origin = request.query_params.get('origin')
        destination = request.query_params.get('destination')
        
        queryset = self.get_queryset()
        
        if mode:
            queryset = queryset.filter(mode=mode)
        if scope:
            queryset = queryset.filter(scope=scope)
        if origin:
            queryset = queryset.filter(origin_name__icontains=origin)
        if destination:
            queryset = queryset.filter(destination_name__icontains=destination)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
