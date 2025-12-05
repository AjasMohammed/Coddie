from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import AppUser, Profile


@admin.register(AppUser)
class AppUserAdmin(UserAdmin):
    list_display = ("email", "username", "is_staff", "is_active")
    list_filter = ("is_staff", "is_active", "date_joined")
    search_fields = ("email", "username")
    ordering = ("-date_joined",)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "score", "created_at")
    search_fields = ("user__username", "user__email")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at")
