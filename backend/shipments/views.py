from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Shipment, ShipmentMilestone, ShipmentDocument
from .serializers import ShipmentSerializer, ShipmentMilestoneSerializer, ShipmentDocumentSerializer, PublicTrackingSerializer

class ShipmentViewSet(viewsets.ModelViewSet):
    serializer_class = ShipmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        tenant = user.tenant
        
        if user.role in ('ADMIN', 'SALES', 'OPS'):
            return Shipment.objects.filter(tenant=tenant).prefetch_related('milestones', 'documents')
        return Shipment.objects.filter(tenant=tenant, client=user).prefetch_related('milestones', 'documents')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def milestones(self, request, pk=None):
        if request.user.role not in ('ADMIN', 'OPS', 'SALES'):
            return Response({'detail': 'Permission denied.'}, status=403)
        shipment = self.get_object()
        serializer = ShipmentMilestoneSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                shipment=shipment,
                updated_by=request.user,
                tenant=request.user.tenant,  # auto-set tenant
            )
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
            serializer.save(
                shipment=shipment,
                uploaded_by=request.user,
                tenant=request.user.tenant,
            )
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_tracking(request):
    """
    Public tracking endpoint — no auth required.
    GET /api/v1/public/tracking/?awb={shipment_number_or_awb}
    """
    awb = request.query_params.get('awb', '').strip()
    if not awb:
        return Response({'detail': 'Parameter "awb" is required.'}, status=400)

    shipment = get_object_or_404(
        Shipment.objects.select_related(
            'quotation__request',
            'quotation__request__submitted_by',
        ).prefetch_related('milestones'),
        shipment_number=awb,
    )
    serializer = PublicTrackingSerializer(shipment)
    return Response(serializer.data)
