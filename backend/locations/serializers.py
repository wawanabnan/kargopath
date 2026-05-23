from rest_framework import serializers
from .models import Port, City


class PortSerializer(serializers.ModelSerializer):
    display_label = serializers.ReadOnlyField()

    class Meta:
        model  = Port
        fields = ('id', 'code', 'name', 'city', 'province', 'country', 'country_code', 'port_type', 'display_label')


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model  = City
        fields = ('id', 'name', 'province', 'country', 'country_code')
