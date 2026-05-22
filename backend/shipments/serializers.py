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
