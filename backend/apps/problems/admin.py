from django.contrib import admin
from .models import ProgrammingLanguage, Problem, Submission, ProblemAttempt


@admin.register(ProgrammingLanguage)
class ProgrammingLanguageAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = ("title", "difficulty", "created_by", "is_public", "created_at")
    list_filter = ("difficulty", "is_public", "created_at")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("created_by",)


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("user", "problem", "language", "status", "created_at")
    list_filter = ("status", "language", "created_at")
    search_fields = ("user__username", "problem__title")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("user", "problem")


@admin.register(ProblemAttempt)
class ProblemAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "problem", "language", "updated_at", "created_at")
    list_filter = ("language", "created_at", "updated_at")
    search_fields = ("user__username", "problem__title")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("user", "problem", "language")
