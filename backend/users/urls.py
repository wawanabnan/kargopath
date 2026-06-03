from django.urls import path
from .views import RegisterView, ProfileView, ClientProfileView, KYCStatusView, ChangePasswordView, SalesUsersView, TenantSettingsView

urlpatterns = [
    path('register/',         RegisterView.as_view(),       name='register'),
    path('profile/',          ProfileView.as_view(),         name='profile'),
    path('profile/kyc/',      ClientProfileView.as_view(),   name='kyc-profile'),
    path('kyc-status/',       KYCStatusView.as_view(),       name='kyc-status'),
    path('change-password/',  ChangePasswordView.as_view(),  name='change-password'),
    path('sales-users/',      SalesUsersView.as_view(),      name='sales-users'),
    path('tenant/settings/',  TenantSettingsView.as_view(),  name='tenant-settings'),
]
