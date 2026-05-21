from rest_framework import serializers
from .models import Tariff

class TariffSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Tariff
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')
    
    def validate(self, data):
        # Validate that origin/destination types match the scope
        scope = data.get('scope')
        origin_type = data.get('origin_type')
        destination_type = data.get('destination_type')
        
        # Door-to-Door: both must be ADDRESS
        if scope == 'D2D':
            if origin_type != 'ADDRESS' or destination_type != 'ADDRESS':
                raise serializers.ValidationError("Door-to-Door requires both origin and destination to be ADDRESS type")
        
        # Port-to-Port: both must be PORT or AIRPORT
        if scope == 'P2P':
            if origin_type == 'ADDRESS' or destination_type == 'ADDRESS':
                raise serializers.ValidationError("Port-to-Port cannot have ADDRESS type")
        
        # Validate address fields are provided when type is ADDRESS
        if origin_type == 'ADDRESS' and not data.get('origin_address'):
            raise serializers.ValidationError("Origin address is required when origin type is ADDRESS")
        
        if destination_type == 'ADDRESS' and not data.get('destination_address'):
            raise serializers.ValidationError("Destination address is required when destination type is ADDRESS")
        
        return data
