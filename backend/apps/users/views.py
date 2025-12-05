"""
Optimized API views for Users app.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

from .serializers import (
    RegisterSerializer,
    UserStatsSerializer,
    UpdateProfileSerializer,
)
from .models import Profile

User = get_user_model()


class RegisterView(APIView):
    """
    POST: Register a new user.
    Creates user and associated profile.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "id": user.id,
                    "username": user.username,
                    "message": "User created successfully",
                },
                status=status.HTTP_201_CREATED,
            )
        print("Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    """
    GET: Get current authenticated user with profile and stats.
    Optimized with select_related and annotated submission counts.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Optimized query with select_related and annotations
        user = (
            User.objects.select_related("profile")
            .annotate(
                total_submissions=Count("submissions"),
                accepted_submissions=Count(
                    "submissions", filter=Q(submissions__status="Accepted")
                ),
                pending_submissions=Count(
                    "submissions", filter=Q(submissions__status="Pending")
                ),
            )
            .get(pk=request.user.pk)
        )

        serializer = UserStatsSerializer(user)
        return Response(serializer.data)


class UpdateProfileView(APIView):
    """
    PATCH: Update user profile (bio, avatar).
    Only updates profile fields, returns minimal response.
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        try:
            profile = request.user.profile
        except Profile.DoesNotExist:
            # Create profile if it doesn't exist
            profile = Profile.objects.create(user=request.user)

        serializer = UpdateProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "bio": profile.bio,
                    "avatar": profile.avatar,
                    "message": "Profile updated successfully",
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
