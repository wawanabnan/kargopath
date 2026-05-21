from rest_framework import serializers
from .models import QuotationRequest, Quotation, QuotationItem, QuotationRequestCargoItem


class QuotationRequestCargoItemSerializer(serializers.ModelSerializer):
    """Serializer untuk cargo item individual."""
    class Meta:
        model = QuotationRequestCargoItem
        fields = [
            'id', 'container_size', 'container_qty', 'container_weight',
            'package_type', 'package_qty', 'gross_weight', 'volume_cbm',
            'length', 'width', 'height', 'is_stackable'
        ]
        read_only_fields = ('id',)


class QuotationRequestSerializer(serializers.ModelSerializer):
    """
    Serializer untuk QuotationRequest.
    Validasi kondisional berdasarkan mode × scope sesuai Service Matrix.
    """
    derived_services = serializers.ReadOnlyField()
    submitted_by_email = serializers.EmailField(source='submitted_by.email', read_only=True)
    quotation_details = serializers.SerializerMethodField(read_only=True)
    cargo_items = QuotationRequestCargoItemSerializer(many=True, required=False)

    class Meta:
        model = QuotationRequest
        fields = '__all__'
        read_only_fields = (
            'reference_no', 'submitted_by', 'sales_in_charge',
            'status', 'created_at', 'updated_at',
        )

    def get_quotation_details(self, obj):
        try:
            q = obj.quotation
            return {
                'id': q.id,
                'quotation_number': q.quotation_number,
                'status': q.status,
                'grand_total': float(q.grand_total),
                'currency': q.currency,
            }
        except:
            return None

    def validate(self, data):
        scope = data.get('scope', '')
        mode  = data.get('mode', '')

        needs_pickup     = scope in ('d2d', 'd2p')
        needs_delivery   = scope in ('d2d', 'p2d')
        needs_origin_port = scope in ('p2p', 'p2d')
        needs_dest_port  = scope in ('p2p', 'd2p')

        # ── Origin validation ──────────────────────────────────────────────
        if needs_pickup and not data.get('pickup_address'):
            raise serializers.ValidationError(
                {'pickup_address': 'Pickup address is required for Door to ... service scope.'}
            )
        if needs_origin_port and not data.get('pol'):
            raise serializers.ValidationError(
                {'pol': 'Port/Airport of Loading (POL) is required for Port to ... service scope.'}
            )

        # ── Destination validation ─────────────────────────────────────────
        if needs_delivery and not data.get('delivery_address'):
            raise serializers.ValidationError(
                {'delivery_address': 'Delivery address is required for ... to Door service scope.'}
            )
        if needs_dest_port and not data.get('pod'):
            raise serializers.ValidationError(
                {'pod': 'Port/Airport of Discharge (POD) is required for ... to Port service scope.'}
            )

        # ── Shipper validation (only when pickup involved) ─────────────────
        if needs_pickup and not data.get('shipper_same_as_client', True):
            if not data.get('shipper_company'):
                raise serializers.ValidationError(
                    {'shipper_company': 'Shipper company name is required.'}
                )

        # ── Consignee validation (only when delivery involved) ─────────────
        if needs_delivery and not data.get('consignee_same_as_client', False):
            if not data.get('consignee_company'):
                raise serializers.ValidationError(
                    {'consignee_company': 'Consignee company name is required.'}
                )

        # ── Sea-specific validation ────────────────────────────────────────
        if mode == 'sea':
            if not data.get('sea_type'):
                raise serializers.ValidationError(
                    {'sea_type': 'Sea type (FCL/LCL) is required for Sea Freight.'}
                )
            if data.get('sea_type') == 'FCL':
                if not data.get('container_size'):
                    raise serializers.ValidationError(
                        {'container_size': 'Container size is required for FCL.'}
                    )
                if not data.get('container_qty'):
                    raise serializers.ValidationError(
                        {'container_qty': 'Number of containers is required for FCL.'}
                    )

        # ── Cargo weight/volume for LCL / Air / Land ──────────────────────
        loose_cargo = (mode == 'sea' and data.get('sea_type') == 'LCL') \
                      or mode in ('air', 'land')
        if loose_cargo:
            if not data.get('gross_weight'):
                raise serializers.ValidationError(
                    {'gross_weight': 'Total gross weight is required.'}
                )
            if not data.get('volume_cbm'):
                raise serializers.ValidationError(
                    {'volume_cbm': 'Total volume (CBM) is required.'}
                )

        return data

    def create(self, validated_data):
        """Create QuotationRequest with nested cargo items and auto-aggregate to flat fields."""
        cargo_items_data = validated_data.pop('cargo_items', [])
        quotation_request = QuotationRequest.objects.create(**validated_data)
        
        # Create cargo items
        for item_data in cargo_items_data:
            QuotationRequestCargoItem.objects.create(
                quotation_request=quotation_request,
                **item_data
            )
        
        # Auto-aggregate to flat fields for backward compatibility
        if cargo_items_data:
            self._aggregate_cargo_items(quotation_request)
        
        return quotation_request
    
    def update(self, instance, validated_data):
        """Update QuotationRequest and replace cargo items, then auto-aggregate."""
        cargo_items_data = validated_data.pop('cargo_items', None)
        
        # Update main fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Replace cargo items if provided
        if cargo_items_data is not None:
            instance.cargo_items.all().delete()
            for item_data in cargo_items_data:
                QuotationRequestCargoItem.objects.create(
                    quotation_request=instance,
                    **item_data
                )
            self._aggregate_cargo_items(instance)
        
        return instance
    
    def _aggregate_cargo_items(self, instance):
        """Aggregate cargo items totals to flat fields for backward compatibility."""
        items = instance.cargo_items.all()
        
        # Aggregate FCL containers
        total_containers = sum(item.container_qty or 0 for item in items if item.container_size)
        if total_containers > 0:
            # Use first container size as representative (or most common)
            first_container = items.filter(container_size__isnull=False).first()
            if first_container:
                instance.container_size = first_container.container_size
                instance.container_qty = total_containers
                total_weight = sum(item.container_weight or 0 for item in items if item.container_size)
                instance.container_weight = total_weight / total_containers if total_containers > 0 else 0
        
        # Aggregate LCL/Air/Land packages
        total_packages = sum(item.package_qty or 0 for item in items if item.package_type)
        if total_packages > 0:
            first_package = items.filter(package_type__isnull=False).first()
            if first_package:
                instance.package_type = first_package.package_type
                instance.package_qty = total_packages
                instance.gross_weight = sum(item.gross_weight or 0 for item in items)
                instance.volume_cbm = sum(item.volume_cbm or 0 for item in items)
        
        instance.save()


class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = '__all__'
        read_only_fields = ('amount',)


class QuotationSerializer(serializers.ModelSerializer):
    """Serializer untuk Quotation (dokumen resmi dari Sales)."""
    items = QuotationItemSerializer(many=True, read_only=True)
    request_reference = serializers.CharField(source='request.reference_no', read_only=True)
    client_email      = serializers.EmailField(source='request.submitted_by.email', read_only=True)
    client_company    = serializers.CharField(
        source='request.submitted_by.company.name', read_only=True, default=''
    )
    request_details   = QuotationRequestSerializer(source='request', read_only=True)

    class Meta:
        model = Quotation
        fields = '__all__'
        read_only_fields = (
            'quotation_number', 'subtotal', 'tax_amount',
            'grand_total', 'created_at', 'updated_at',
        )
