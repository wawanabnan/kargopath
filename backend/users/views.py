from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import ClientProfile
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    ClientProfileSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — Public, no auth."""
    queryset           = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class   = UserRegistrationSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET|PATCH /api/v1/auth/profile/ — Get or update user profile."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = UserProfileSerializer

    def get_object(self):
        return self.request.user


class ClientProfileView(generics.RetrieveUpdateAPIView):
    """
    GET|PATCH /api/v1/auth/profile/kyc/
    Client submits / updates their KYC information.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = ClientProfileSerializer

    def get_object(self):
        profile, _ = ClientProfile.objects.get_or_create(user=self.request.user)
        return profile

    def perform_update(self, serializer):
        instance = serializer.save()

        # Check if all required fields are complete for Level 2
        user = self.request.user
        missing = user.kyc_missing_fields

        if not missing and user.kyc_level < 2:
            # Auto-promote to Level 2 (Verified) — Sales can still override
            instance.kyc_submitted_at = timezone.now()
            instance.save(update_fields=['kyc_submitted_at'])
            user.kyc_level = 2
            user.save(update_fields=['kyc_level'])

    def patch(self, request, *args, **kwargs):
        response = super().patch(request, *args, **kwargs)
        # Return updated user profile along with KYC profile
        user_data = UserProfileSerializer(request.user).data
        return Response({
            'profile': response.data,
            'user':    user_data,
            'message': 'Profile updated successfully.',
        })


class KYCStatusView(APIView):
    """GET /api/v1/auth/kyc-status/ — Check current KYC status & missing fields."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'kyc_level':          user.kyc_level,
            'kyc_level_display':  user.get_kyc_level_display(),
            'can_accept_booking': user.can_accept_booking,
            'missing_fields':     user.kyc_missing_fields,
            'client_type':        user.client_type,
            'is_corporate_email': user.is_corporate_email,
        })


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extend JWT payload with user role, kyc_level, and client_type."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email']       = user.email
        token['role']        = user.role
        token['first_name']  = user.first_name
        token['client_type'] = user.client_type or ''
        token['kyc_level']   = user.kyc_level
        token['company']     = user.company.name if user.company else ''
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id':                self.user.id,
            'email':             self.user.email,
            'first_name':        self.user.first_name,
            'last_name':         self.user.last_name,
            'role':              self.user.role,
            'client_type':       self.user.client_type,
            'kyc_level':         self.user.kyc_level,
            'can_accept_booking': self.user.can_accept_booking,
            'company':           self.user.company.name if self.user.company else '',
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
