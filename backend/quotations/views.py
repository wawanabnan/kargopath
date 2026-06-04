from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.shortcuts import get_object_or_404
import uuid

from .models import QuotationRequest, Quotation, QuotationItem, ChargeMaster
from .serializers import (
    QuotationRequestSerializer,
    QuotationSerializer,
    QuotationItemSerializer,
    ChargeMasterSerializer,
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
        
        if user.role in ('ADMIN', 'OPS'):
            qs = QuotationRequest.objects.filter(tenant=tenant).select_related(
                'submitted_by', 'submitted_by__company', 'sales_in_charge'
            )
            status_filter = self.request.query_params.get('status')
            if status_filter:
                qs = qs.filter(status=status_filter.upper())
            return qs

        if user.role == 'SALES':
            # Sales only sees requests assigned to them
            return QuotationRequest.objects.filter(
                tenant=tenant, sales_in_charge=user
            ).select_related('submitted_by', 'submitted_by__company', 'sales_in_charge')

        # Client sees only their own
        return QuotationRequest.objects.filter(tenant=tenant, submitted_by=user)

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user, status='INQUIRY')

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

        quotation_request = serializer.save(submitted_by=request.user, status='INQUIRY')

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
        if request.user.role not in ('ADMIN', 'SALES'):
            return Response({'detail': 'Permission denied.'}, status=403)
        obj = self.get_object()
        sales_id = request.data.get('sales_id')
        if not sales_id:
            return Response({'detail': 'sales_id is required.'}, status=400)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            sales_user = User.objects.get(id=sales_id, tenant=request.user.tenant, role='SALES')
        except User.DoesNotExist:
            return Response({'detail': 'Sales user not found or is an Admin.'}, status=404)
        obj.sales_in_charge = sales_user
        obj.status = 'ASSIGNED'
        obj.save(update_fields=['sales_in_charge', 'status'])
        display = f"{sales_user.first_name} {sales_user.last_name}".strip() or sales_user.email.split('@')[0]
        return Response({'detail': 'Sales assigned successfully.', 'sales_display': display, 'sales_id': sales_user.id})

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
        if self.request.user.role != 'SALES':
            raise PermissionDenied('Only SALES can create quotations.')
        q_num = f"Q-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"
        quotation = serializer.save(
            created_by=self.request.user,
            quotation_number=q_num,
            status='DRAFT',
        )
        # Update related request status to QUOTED
        quotation.request.status = 'QUOTED'
        quotation.request.save(update_fields=['status'])
        quotation.recalculate_totals()

    def perform_update(self, serializer):
        instance = self.get_object()
        # Pricing fields can only be updated by SALES before price lock.
        pricing_fields = {'discount_type', 'discount', 'tax_rate', 'currency'}
        touching_pricing = any(
            field in serializer.validated_data for field in pricing_fields
        )
        if touching_pricing:
            if self.request.user.role != 'SALES':
                raise PermissionDenied('Only SALES can update quotation pricing.')
            if instance.is_price_locked:
                raise PermissionDenied('Quotation price is locked after shipment booking.')
        serializer.save()
        instance.recalculate_totals()

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
        quotation.is_price_locked = True
        quotation.save(update_fields=['is_price_locked', 'updated_at'])
        
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
        """Sales marks the quotation as SENT. Rejects if total is zero."""
        if request.user.role != 'SALES':
            return Response({'detail': 'Permission denied.'}, status=403)
        quotation = self.get_object()
        if float(quotation.grand_total) <= 0:
            return Response(
                {'detail': 'Cannot send quotation with zero total. Add charges first.'},
                status=400,
            )
        quotation.status = 'SENT'
        quotation.save(update_fields=['status'])
        return Response({'detail': 'Quotation sent to client.'})

    @action(detail=True, methods=['get'],
            permission_classes=[permissions.IsAuthenticated])
    def pdf(self, request, pk=None):
        """Generate and download a PDF for this quotation."""
        quotation = self.get_object()
        items = quotation.items.all()
        from django.template.loader import render_to_string
        from weasyprint import HTML
        from django.http import HttpResponse

        status_map = {
            'DRAFT': ('draft', 'DRAFT — Not Final'),
            'SENT': ('sent', 'QUOTATION'),
            'ACCEPTED': ('accepted', 'ACCEPTED'),
            'REJECTED': ('rejected', 'REJECTED'),
            'EXPIRED': ('rejected', 'EXPIRED'),
        }
        status_class, status_label = status_map.get(quotation.status, ('draft', quotation.status))

        html = render_to_string('quotations/quotation_pdf.html', {
            'quotation': quotation,
            'request': quotation.request,
            'items': items,
            'status_class': status_class,
            'status_label': status_label,
        })

        pdf = HTML(string=html).write_pdf()
        filename = f"{quotation.quotation_number}.pdf"
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response


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

    def _validate_pricing_mutation(self, quotation):
        if self.request.user.role != 'SALES':
            raise PermissionDenied('Only SALES can update quotation prices.')
        if quotation.is_price_locked:
            raise PermissionDenied('Quotation price is locked after shipment booking.')

    def perform_create(self, serializer):
        quotation = get_object_or_404(Quotation, pk=self.kwargs['quotation_pk'])
        self._validate_pricing_mutation(quotation)
        item = serializer.save(quotation=quotation, tenant=quotation.tenant)
        quotation.recalculate_totals()

    def perform_update(self, serializer):
        self._validate_pricing_mutation(serializer.instance.quotation)
        item = serializer.save()
        item.quotation.recalculate_totals()

    def perform_destroy(self, instance):
        quotation = instance.quotation
        self._validate_pricing_mutation(quotation)
        instance.delete()
        quotation.recalculate_totals()


class ChargeMasterViewSet(viewsets.ModelViewSet):
    """
    Manage reusable charge templates per tenant.
    - ADMIN: full CRUD
    - SALES: read-only
    """
    serializer_class = ChargeMasterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChargeMaster.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        if self.request.user.role != 'ADMIN':
            raise PermissionDenied('Only ADMIN can create charge masters.')
        serializer.save(tenant=self.request.user.tenant)

    def perform_update(self, serializer):
        if self.request.user.role != 'ADMIN':
            raise PermissionDenied('Only ADMIN can update charge masters.')
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'ADMIN':
            raise PermissionDenied('Only ADMIN can delete charge masters.')
        instance.delete()
