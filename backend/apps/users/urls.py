"""URL configuration for Users/Auth app."""

from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import RegisterView, CurrentUserView, UpdateProfileView

urlpatterns = [
    # JWT Token endpoints
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # User endpoints
    path("register/", RegisterView.as_view(), name="auth_register"),
    path("me/", CurrentUserView.as_view(), name="current_user"),
    path("profile/", UpdateProfileView.as_view(), name="update_profile"),
]
