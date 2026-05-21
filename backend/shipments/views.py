from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Shipment, ShipmentMilestone, ShipmentDocument
from .serializers import ShipmentSerializer, ShipmentMilestoneSerializer, ShipmentDocumentSerializer

class ShipmentViewSet(viewsets.ModelViewSet):
    serializer_class = ShipmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('ADMIN', 'SALES', 'OPS'):
            return Shipment.objects.all().prefetch_related('milestones', 'documents')
        return Shipment.objects.filter(client=user).prefetch_related('milestones', 'documents')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def milestones(self, request, pk=None):
        if request.user.role not in ('ADMIN', 'OPS', 'SALES'):
            return Response({'detail': 'Permission denied.'}, status=403)
        shipment = self.get_object()
        serializer = ShipmentMilestoneSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(shipment=shipment, updated_by=request.user)
            # Update shipment status based on milestone if provided
            new_status = request.data.get('new_shipment_status')
            if new_status:
                shipment.status = new_status
                shipment.save(update_fields=['status'])
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def documents(self, request, pk=None):
        if request.user.role not in ('ADMIN', 'OPS', 'SALES'):
            return Response({'detail': 'Permission denied.'}, status=403)
        shipment = self.get_object()
        serializer = ShipmentDocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(shipment=shipment, uploaded_by=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
