"""
Optimized serializers for User and Profile models.
Uses field-specific serializers to minimize payload size.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal user serializer for FK references in other serializers.
    Only includes essential identification fields.
    """

    class Meta:
        model = User
        fields = ["id", "username", "email"]
        read_only_fields = ["id", "username", "email"]


class ProfileSerializer(serializers.ModelSerializer):
    """Profile data serializer."""

    class Meta:
        model = Profile
        fields = ["bio", "avatar", "score", "created_at", "updated_at"]
        read_only_fields = ["score", "created_at", "updated_at"]


class UserProfileSerializer(serializers.ModelSerializer):
    """
    User serializer with profile data.
    Uses select_related('profile') in view for optimal query.
    """

    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "profile", "date_joined"]
        read_only_fields = ["id", "username", "email", "date_joined"]


class UserStatsSerializer(serializers.ModelSerializer):
    """
    User serializer with submission statistics.
    Uses annotated queryset from view for optimal performance.
    """

    profile = ProfileSerializer(read_only=True)
    total_submissions = serializers.IntegerField(read_only=True)
    accepted_submissions = serializers.IntegerField(read_only=True)
    pending_submissions = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "profile",
            "date_joined",
            "total_submissions",
            "accepted_submissions",
            "pending_submissions",
        ]
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        # Create profile automatically
        Profile.objects.create(user=user)
        return user


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating only profile fields."""

    class Meta:
        model = Profile
        fields = ["bio", "avatar"]

    def update(self, instance, validated_data):
        instance.bio = validated_data.get("bio", instance.bio)
        instance.avatar = validated_data.get("avatar", instance.avatar)
        instance.save()
        return instance
