from rest_framework import serializers
from .models import Shipment, ShipmentMilestone, ShipmentDocument
from quotations.serializers import QuotationSerializer

class ShipmentMilestoneSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = ShipmentMilestone
        fields = '__all__'
        read_only_fields = ('updated_by', 'timestamp')

class ShipmentDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = ShipmentDocument
        fields = '__all__'
        read_only_fields = ('uploaded_by', 'uploaded_at')

class PublicTrackingSerializer(serializers.ModelSerializer):
    """Lightweight serializer for public tracking — no pricing exposure."""

    status_label = serializers.SerializerMethodField()
    milestones = serializers.SerializerMethodField()
    mode = serializers.SerializerMethodField()
    origin = serializers.SerializerMethodField()
    destination = serializers.SerializerMethodField()
    commodity = serializers.SerializerMethodField()

    class Meta:
        model = Shipment
        fields = [
            'shipment_number', 'awb_bl_number', 'status', 'status_label',
            'etd', 'eta', 'mode', 'origin', 'destination', 'commodity',
            'milestones', 'created_at',
        ]

    def get_status_label(self, obj):
        return dict(Shipment.STATUS_CHOICES).get(obj.status, obj.status)

    def get_milestones(self, obj):
        ms = obj.milestones.all().order_by('timestamp')
        return [
            {
                'timestamp': m.timestamp.isoformat(),
                'status_code': m.status_code,
                'description': m.description,
                'location': m.location,
            }
            for m in ms
        ]

    def get_mode(self, obj):
        try:
            return obj.quotation.request.get_mode_display()
        except AttributeError:
            return None

    def get_origin(self, obj):
        try:
            req = obj.quotation.request
            if req.needs_origin_port:
                return req.pol_name or req.pol
            if req.needs_pickup:
                return req.pickup_city or req.pickup_address
            return req.pol_name or req.pol
        except AttributeError:
            return None

    def get_destination(self, obj):
        try:
            req = obj.quotation.request
            if req.needs_dest_port:
                return req.pod_name or req.pod
            if req.needs_delivery:
                return req.delivery_city or req.delivery_address
            return req.pod_name or req.pod
        except AttributeError:
            return None

    def get_commodity(self, obj):
        try:
            return obj.quotation.request.commodity
        except AttributeError:
            return None


class ShipmentSerializer(serializers.ModelSerializer):
    milestones = ShipmentMilestoneSerializer(many=True, read_only=True)
    documents = ShipmentDocumentSerializer(many=True, read_only=True)
    quotation_details = QuotationSerializer(source='quotation', read_only=True)
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)

    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ('shipment_number', 'created_at', 'updated_at', 'client')
    
    def create(self, validated_data):
        """Auto-set tenant from authenticated user."""
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)
