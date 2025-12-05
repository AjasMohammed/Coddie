"""URL configuration for Problems app."""

from django.urls import path
from .views import (
    ProblemListView,
    ProblemDetailView,
    ProblemBoilerplateView,
    ProblemCreateView,
    ProblemUpdateView,
    UserProblemsListView,
    SubmissionListView,
    SubmissionDetailView,
    SubmissionCreateView,
    ProgrammingLanguageListView,
    ProblemAttemptView,
)

urlpatterns = [
    # Problem endpoints
    path("problems/", ProblemListView.as_view(), name="problem-list"),
    path("problems/create/", ProblemCreateView.as_view(), name="problem-create"),
    path("problems/my/", UserProblemsListView.as_view(), name="user-problem-list"),
    path("problems/<slug:slug>/", ProblemDetailView.as_view(), name="problem-detail"),
    path(
        "problems/<slug:slug>/boilerplate/",
        ProblemBoilerplateView.as_view(),
        name="problem-boilerplate",
    ),
    path(
        "problems/<slug:slug>/update/",
        ProblemUpdateView.as_view(),
        name="problem-update",
    ),
    # Submission endpoints
    path("submissions/", SubmissionListView.as_view(), name="submission-list"),
    path(
        "submissions/create/", SubmissionCreateView.as_view(), name="submission-create"
    ),
    path(
        "submissions/<int:pk>/",
        SubmissionDetailView.as_view(),
        name="submission-detail",
    ),
    # Language endpoints
    path("languages/", ProgrammingLanguageListView.as_view(), name="language-list"),
    # Problem Attempt endpoints
    path(
        "problems/<slug:problem_slug>/attempt/",
        ProblemAttemptView.as_view(),
        name="problem-attempt",
    ),
]
