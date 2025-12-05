from django.contrib.auth.models import AbstractUser
from django.db import models


class AppUser(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class Profile(models.Model):
    user = models.OneToOneField(
        AppUser, on_delete=models.CASCADE, related_name="profile"
    )
    bio = models.TextField(blank=True)
    avatar = models.URLField(blank=True)
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
