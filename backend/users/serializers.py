from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Company, ClientProfile, FREE_EMAIL_DOMAINS

User = get_user_model()


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Company
        fields = ('id', 'name', 'tax_id', 'nib_siup', 'address', 'contact_number', 'website')


class UserRegistrationSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    first_name       = serializers.CharField(required=True)
    last_name        = serializers.CharField(required=False, allow_blank=True, default='')
    company_name     = serializers.CharField(required=False, allow_blank=True, default='')
    position         = serializers.CharField(required=False, allow_blank=True, default='')
    phone            = serializers.CharField(required=False, allow_blank=True, default='')
    client_type      = serializers.ChoiceField(choices=['individual', 'business', 'corporate'])

    class Meta:
        model  = User
        fields = (
            'email', 'password', 'confirm_password',
            'first_name', 'last_name',
            'client_type', 'company_name', 'position', 'phone',
        )

    def validate_email(self, value):
        email = value.lower()
        client_type = self.initial_data.get('client_type', '')

        # Business AND Corporate clients MUST use a company (non-free) email
        if client_type in ('business', 'corporate'):
            domain = email.split('@')[1]
            if domain in FREE_EMAIL_DOMAINS:
                raise serializers.ValidationError(
                    f"Business and Corporate accounts require a company email address "
                    f"(e.g. @yourcompany.com). Free providers like @{domain} are not accepted."
                )
        return email

    def validate_company_name(self, value):
        client_type = self.initial_data.get('client_type', '')
        if client_type in ('business', 'corporate') and not value:
            raise serializers.ValidationError(
                'Company name is required for Business and Corporate accounts.'
            )
        return value

    def validate(self, data):
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        company_name = validated_data.pop('company_name', '')
        position     = validated_data.pop('position', '')
        phone        = validated_data.pop('phone', '')
        client_type  = validated_data.get('client_type')

        # Create or find company if Business/Corporate
        company = None
        if client_type in ('business', 'corporate') and company_name:
            company, _ = Company.objects.get_or_create(name=company_name)

        user = User.objects.create_user(
            email       = validated_data['email'],
            password    = validated_data['password'],
            first_name  = validated_data.get('first_name', ''),
            last_name   = validated_data.get('last_name', ''),
            role        = 'CLIENT',
            client_type = client_type,
            kyc_level   = 1,
            company     = company,
        )

        # Auto-create ClientProfile with available data
        ClientProfile.objects.create(
            user     = user,
            phone    = phone,
            position = position,
        )

        return user


class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ClientProfile
        exclude = ('user', 'kyc_reviewed_by')
        read_only_fields = ('kyc_submitted_at', 'kyc_reviewed_at', 'kyc_notes', 'created_at', 'updated_at')


class UserProfileSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    profile = ClientProfileSerializer(read_only=True)
    kyc_missing_fields   = serializers.ReadOnlyField()
    can_accept_booking   = serializers.ReadOnlyField()
    is_corporate_email   = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = (
            'id', 'email', 'first_name', 'last_name',
            'role', 'client_type', 'kyc_level',
            'company', 'profile',
            'kyc_missing_fields', 'can_accept_booking', 'is_corporate_email',
        )
        read_only_fields = ('email', 'role', 'kyc_level')
