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
    """
    POST /api/v1/auth/register/ — Public, no auth.
    Returns JWT tokens immediately after registration so the client
    does not need a separate login call.
    """
    queryset           = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class   = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Issue JWT tokens right away
        token = CustomTokenObtainPairSerializer.get_token(user)
        return Response({
            'user': {
                'id':          user.id,
                'email':       user.email,
                'first_name':  user.first_name,
                'last_name':   user.last_name,
                'role':        user.role,
                'client_type': user.client_type,
                'kyc_level':   user.kyc_level,
            },
            'tenant': {
                'id':            user.tenant_id,
                'name':          user.tenant.name,
                'slug':          user.tenant.slug,
                'primary_color': user.tenant.primary_color,
            },
            'access':  str(token.access_token),
            'refresh': str(token),
        }, status=status.HTTP_201_CREATED)


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


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/ — Change authenticated user's password."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password', '')
        new_password     = request.data.get('new_password', '')

        if not current_password or not new_password:
            return Response(
                {'detail': 'current_password and new_password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.check_password(current_password):
            return Response(
                {'current_password': ['Current password is incorrect.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {'new_password': ['Password must be at least 8 characters.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])
        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extend JWT payload with user, tenant, role, kyc_level, and client_type."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email']       = user.email
        token['role']        = user.role
        token['first_name']  = user.first_name
        token['client_type'] = user.client_type or ''
        token['kyc_level']   = user.kyc_level
        token['company']     = user.company.name if user.company else ''
        token['tenant_id']   = user.tenant_id
        token['tenant_slug'] = user.tenant.slug
        token['tenant_name'] = user.tenant.name
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
        data['tenant'] = {
            'id':            self.user.tenant_id,
            'name':          self.user.tenant.name,
            'slug':          self.user.tenant.slug,
            'primary_color': self.user.tenant.primary_color,
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
