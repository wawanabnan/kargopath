from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.shortcuts import get_object_or_404
import uuid

from .models import QuotationRequest, Quotation, QuotationItem
from .serializers import (
    QuotationRequestSerializer,
    QuotationSerializer,
    QuotationItemSerializer,
)


class QuotationRequestViewSet(viewsets.ModelViewSet):
    """
    CRUD untuk QuotationRequest.

    Endpoints:
      POST   /api/v1/quotations/requests/                → Client submit request (authenticated)
      GET    /api/v1/quotations/requests/                → List (client: own | sales/admin: all)
      GET    /api/v1/quotations/requests/{id}/           → Detail
      PATCH  /api/v1/quotations/requests/{id}/           → Update status (sales only)
      POST   /api/v1/quotations/requests/save-draft/     → Save draft to session (public)
      POST   /api/v1/quotations/requests/submit-draft/   → Convert session draft → QuotationRequest (authenticated)
    """
    serializer_class   = QuotationRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        tenant = user.tenant
        
        if user.role in ('ADMIN', 'SALES', 'OPS'):
            qs = QuotationRequest.objects.filter(tenant=tenant).select_related(
                'submitted_by', 'submitted_by__company', 'sales_in_charge'
            )
            # Optional filter by status
            status_filter = self.request.query_params.get('status')
            if status_filter:
                qs = qs.filter(status=status_filter.upper())
            return qs
        # Client sees only their own
        return QuotationRequest.objects.filter(tenant=tenant, submitted_by=user)

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user, status='PENDING')

    @action(
        detail=False, methods=['post'],
        permission_classes=[permissions.AllowAny],
        url_path='save-draft',
    )
    def save_draft(self, request):
        """
        Public endpoint — save quotation form data to session.
        Returns a draft_key the frontend can store and send back after login.

        POST /api/v1/quotations/requests/save-draft/
        Body: any valid quotation request fields (partial OK)
        Response: { "draft_key": "<uuid>" }
        """
        draft_key = str(uuid.uuid4())
        # Store all submitted fields; frontend may send partial data
        request.session[f'quotation_draft_{draft_key}'] = request.data
        request.session.modified = True
        return Response({'draft_key': draft_key}, status=status.HTTP_200_OK)

    @action(
        detail=False, methods=['post'],
        permission_classes=[permissions.IsAuthenticated],
        url_path='submit-draft',
    )
    def submit_draft(self, request):
        """
        Authenticated endpoint — retrieve draft from session and create QuotationRequest.
        Call this after the user registers/logs in.

        POST /api/v1/quotations/requests/submit-draft/
        Body: { "draft_key": "<uuid>" }
        Response: full QuotationRequest object
        """
        draft_key = request.data.get('draft_key')
        if not draft_key:
            return Response({'detail': 'draft_key is required.'}, status=status.HTTP_400_BAD_REQUEST)

        session_key = f'quotation_draft_{draft_key}'
        draft_data = request.session.get(session_key)
        if not draft_data:
            return Response(
                {'detail': 'Draft not found or expired. Please fill the form again.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = QuotationRequestSerializer(data=draft_data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        quotation_request = serializer.save(submitted_by=request.user, status='PENDING')

        # Clean up session after successful submit
        del request.session[session_key]
        request.session.modified = True

        return Response(
            QuotationRequestSerializer(quotation_request, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['patch'],
            permission_classes=[permissions.IsAuthenticated])
    def assign_sales(self, request, pk=None):
        """Assign sales in charge to a request (Admin only)."""
        if request.user.role != 'ADMIN':
            return Response({'detail': 'Permission denied.'}, status=403)
        obj = self.get_object()
        sales_id = request.data.get('sales_id')
        obj.sales_in_charge_id = sales_id
        obj.save(update_fields=['sales_in_charge'])
        return Response({'detail': 'Sales assigned successfully.'})

    @action(detail=True, methods=['patch'],
            permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        """Sales/Admin updates request status."""
        if request.user.role not in ('ADMIN', 'SALES'):
            return Response({'detail': 'Permission denied.'}, status=403)
        obj = self.get_object()
        new_status = request.data.get('status', '').upper()
        valid = [s[0] for s in QuotationRequest.STATUS_CHOICES]
        if new_status not in valid:
            return Response({'detail': f'Invalid status. Choose from: {valid}'}, status=400)
        obj.status = new_status
        obj.save(update_fields=['status'])
        return Response({'detail': f'Status updated to {new_status}.'})


class QuotationViewSet(viewsets.ModelViewSet):
    """
    CRUD untuk Quotation (dokumen resmi yang dibuat Sales).

    Endpoints:
      POST   /api/v1/quotations/           → Sales create quotation
      GET    /api/v1/quotations/           → List
      GET    /api/v1/quotations/{id}/      → Detail (client dapat melihat miliknya)
      PATCH  /api/v1/quotations/{id}/      → Update
      POST   /api/v1/quotations/{id}/accept/  → Client accept quotation
      POST   /api/v1/quotations/{id}/reject/  → Client reject quotation
    """
    serializer_class   = QuotationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        tenant = user.tenant
        
        if user.role in ('ADMIN', 'SALES', 'OPS'):
            return Quotation.objects.filter(tenant=tenant).select_related(
                'request', 'request__submitted_by', 'created_by'
            ).prefetch_related('items')
        # Client: only quotations linked to their own requests
        return Quotation.objects.filter(
            tenant=tenant,
            request__submitted_by=user
        ).prefetch_related('items')

    def perform_create(self, serializer):
        """Auto-generate quotation number when Sales creates a quotation."""
        q_num = f"Q-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"
        quotation = serializer.save(
            created_by=self.request.user,
            quotation_number=q_num,
            status='DRAFT',
        )
        # Update related request status to QUOTED
        quotation.request.status = 'QUOTED'
        quotation.request.save(update_fields=['status'])

    @action(detail=True, methods=['post'],
            permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        """Client accepts the quotation."""
        quotation = self.get_object()
        if quotation.request.submitted_by != request.user:
            return Response({'detail': 'Permission denied.'}, status=403)
        if quotation.status != 'SENT':
            return Response({'detail': 'Only SENT quotations can be accepted.'}, status=400)
        quotation.status = 'ACCEPTED'
        quotation.save(update_fields=['status'])
        quotation.request.status = 'ACCEPTED'
        quotation.request.save(update_fields=['status'])
        
        # Trigger create ShipmentDraft
        from shipments.models import Shipment
        import datetime
        year = datetime.datetime.now().year
        # Generate a simple sequence number based on count
        seq = Shipment.objects.filter(created_at__year=year).count() + 1
        shipment_num = f"LP-{year}-{seq:05d}"
        
        Shipment.objects.create(
            tenant=quotation.request.tenant,
            shipment_number=shipment_num,
            quotation=quotation,
            client=quotation.request.submitted_by,
            status='BOOKED'
        )
        
        return Response({'detail': 'Quotation accepted. Shipment draft created successfully.'})

    @action(detail=True, methods=['post'],
            permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """Client rejects the quotation."""
        quotation = self.get_object()
        if quotation.request.submitted_by != request.user:
            return Response({'detail': 'Permission denied.'}, status=403)
        reason = request.data.get('reason', '')
        quotation.status = 'REJECTED'
        if reason:
            quotation.notes = f"Rejection reason: {reason}"
        quotation.save(update_fields=['status', 'notes'])
        quotation.request.status = 'REJECTED'
        quotation.request.save(update_fields=['status'])
        return Response({'detail': 'Quotation rejected.'})

    @action(detail=True, methods=['post'],
            permission_classes=[permissions.IsAuthenticated])
    def send_to_client(self, request, pk=None):
        """Sales marks the quotation as SENT."""
        if request.user.role not in ('ADMIN', 'SALES'):
            return Response({'detail': 'Permission denied.'}, status=403)
        quotation = self.get_object()
        quotation.status = 'SENT'
        quotation.save(update_fields=['status'])
        return Response({'detail': 'Quotation sent to client.'})


class QuotationItemViewSet(viewsets.ModelViewSet):
    """
    Manage line items (biaya) dalam sebuah Quotation.

    Endpoints:
      GET    /api/v1/quotations/{quotation_pk}/items/
      POST   /api/v1/quotations/{quotation_pk}/items/
      PATCH  /api/v1/quotations/{quotation_pk}/items/{id}/
      DELETE /api/v1/quotations/{quotation_pk}/items/{id}/
    """
    serializer_class   = QuotationItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant = self.request.user.tenant
        return QuotationItem.objects.filter(
            tenant=tenant,
            quotation_id=self.kwargs['quotation_pk']
        )

    def perform_create(self, serializer):
        quotation = get_object_or_404(Quotation, pk=self.kwargs['quotation_pk'])
        item = serializer.save(quotation=quotation)
        quotation.recalculate_totals()

    def perform_update(self, serializer):
        item = serializer.save()
        item.quotation.recalculate_totals()

    def perform_destroy(self, instance):
        quotation = instance.quotation
        instance.delete()
        quotation.recalculate_totals()
