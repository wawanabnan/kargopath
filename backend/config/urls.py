from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/v1/auth/login/',         CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(),          name='token_refresh'),
    path('api/v1/auth/',               include('users.urls')),

    # App
    path('api/v1/', include('quotations.urls')),
    path('api/v1/shipments/', include('shipments.urls')),
    path('api/v1/tariffs/', include('tariffs.urls')),
]
