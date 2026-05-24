from rest_framework import serializers
from .models import Location, LocationKind


class LocationSerializer(serializers.ModelSerializer):
    full_path = serializers.ReadOnlyField()

    class Meta:
        model  = Location
        fields = (
            'id', 'code', 'name', 'display_name', 'kind',
            'iata_code', 'unlocode', 'country_code',
            'latitude', 'longitude',
            'parent', 'full_path',
        )


class LocationSelectSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdown/select use in forms."""
    label = serializers.SerializerMethodField()

    class Meta:
        model  = Location
        fields = ('id', 'code', 'name', 'display_name', 'kind',
                  'iata_code', 'unlocode', 'country_code', 'label')

    def get_label(self, obj):
        """Return display label appropriate for the location kind."""
        code = obj.iata_code or obj.unlocode or obj.code
        if code and code != obj.name:
            return f'{code} – {obj.name}'
        return obj.display_name or obj.name
