"""
Optimized API views for Problems app using APIView instead of ViewSets.
Implements cursor pagination and query optimization.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Problem, Submission, ProgrammingLanguage, ProblemAttempt
from .services import BoilerplateGeneratorService
from .serializers import (
    ProblemListSerializer,
    ProblemDetailSerializer,
    ProblemCreateSerializer,
    SubmissionListSerializer,
    SubmissionDetailSerializer,
    SubmissionCreateSerializer,
    ProgrammingLanguageSerializer,
    ProblemAttemptSerializer,
    ProblemAttemptUpdateSerializer,
)
from .pagination import CursorPagination


class ProblemListView(APIView):
    """
    GET: List problems with cursor pagination and filtering.
    Optimized with select_related and only() for minimal fields.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Start with optimized queryset
        queryset = Problem.objects.select_related("created_by").only(
            "id", "title", "slug", "difficulty", "created_at", "created_by__username"
        )

        # Filter by difficulty if provided
        difficulty = request.query_params.get("difficulty")
        if difficulty and difficulty in ["Easy", "Medium", "Hard"]:
            queryset = queryset.filter(difficulty=difficulty)

        # Filter by public status (default to public only)
        show_private = (
            request.query_params.get("show_private", "false").lower() == "true"
        )
        if not show_private:
            queryset = queryset.filter(is_public=True)

        # Search by title
        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(Q(title__icontains=search))

        # Cursor pagination
        paginator = CursorPagination(page_size=20)
        cursor = request.query_params.get("cursor")
        page_size = request.query_params.get("page_size")

        try:
            if page_size:
                page_size = int(page_size)
            items, next_cursor, _ = paginator.paginate(queryset, cursor, page_size)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProblemListSerializer(items, many=True)
        return Response(paginator.get_paginated_response(serializer.data, next_cursor))


class ProblemDetailView(APIView):
    """
    GET: Retrieve single problem by slug.
    Optimized with select_related for created_by.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        problem = get_object_or_404(
            Problem.objects.select_related("created_by", "language"), slug=slug
        )

        # Check if problem is public or user is owner
        if not problem.is_public:
            if not request.user.is_authenticated or problem.created_by != request.user:
                return Response(
                    {"error": "This problem is private"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = ProblemDetailSerializer(problem)
        return Response(serializer.data)


class ProblemBoilerplateView(APIView):
    """
    GET: Generate problem-specific boilerplate for a given language.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        problem = get_object_or_404(
            Problem.objects.select_related("language"), slug=slug
        )

        # Get language from query params
        language_slug = request.query_params.get("language")
        if not language_slug:
            return Response(
                {"error": "Language parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get language object
        try:
            language = ProgrammingLanguage.objects.get(slug=language_slug)
        except ProgrammingLanguage.DoesNotExist:
            return Response(
                {"error": f"Language '{language_slug}' not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Generate boilerplate
        boilerplate = BoilerplateGeneratorService.generate_boilerplate(
            problem, language
        )

        return Response({"boilerplate": boilerplate})


class ProblemCreateView(APIView):
    """
    POST: Create a new problem.
    Requires authentication.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ProblemCreateSerializer(data=request.data)
        if serializer.is_valid():
            problem = serializer.save(created_by=request.user)
            # Return full detail
            detail_serializer = ProblemDetailSerializer(problem)
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProblemUpdateView(APIView):
    """
    PUT/PATCH: Update an existing problem.
    Only creator can update.
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, slug):
        problem = get_object_or_404(Problem, slug=slug)

        # Check ownership
        if problem.created_by != request.user:
            return Response(
                {"error": "You do not have permission to edit this problem"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ProblemCreateSerializer(problem, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            detail_serializer = ProblemDetailSerializer(problem)
            return Response(detail_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProblemsListView(APIView):
    """
    GET: List problems created by the current user.
    Optimized with select_related and only() for minimal fields.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Optimized queryset - only fetch fields needed for list view
        queryset = (
            Problem.objects.select_related("created_by")
            .filter(created_by=request.user)
            .only(
                "id",
                "title",
                "slug",
                "difficulty",
                "is_public",
                "created_at",
                "updated_at",
                "created_by__username",
            )
        )

        # Filter by difficulty if provided
        difficulty = request.query_params.get("difficulty")
        if difficulty and difficulty in ["Easy", "Medium", "Hard"]:
            queryset = queryset.filter(difficulty=difficulty)

        # Filter by public status if provided
        is_public = request.query_params.get("is_public")
        if is_public is not None:
            queryset = queryset.filter(is_public=is_public.lower() == "true")

        # Search by title
        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(Q(title__icontains=search))

        # Cursor pagination
        paginator = CursorPagination(page_size=20)
        cursor = request.query_params.get("cursor")
        page_size = request.query_params.get("page_size")

        try:
            if page_size:
                page_size = int(page_size)
            items, next_cursor, _ = paginator.paginate(queryset, cursor, page_size)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProblemListSerializer(items, many=True)
        return Response(paginator.get_paginated_response(serializer.data, next_cursor))


class SubmissionListView(APIView):
    """
    GET: List user's submissions with cursor pagination.
    Optimized with select_related for related models.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Optimized queryset with select_related
        queryset = (
            Submission.objects.select_related("user", "problem", "language")
            .filter(user=request.user)
            .only(
                "id",
                "status",
                "execution_time",
                "memory_usage",
                "created_at",
                "problem__title",
                "problem__slug",
                "user__username",
                "language__name",
            )
        )

        # Filter by status if provided
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by problem slug if provided
        problem_slug = request.query_params.get("problem")
        if problem_slug:
            queryset = queryset.filter(problem__slug=problem_slug)

        # Cursor pagination
        paginator = CursorPagination(page_size=20)
        cursor = request.query_params.get("cursor")

        try:
            items, next_cursor, _ = paginator.paginate(queryset, cursor)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubmissionListSerializer(items, many=True)
        return Response(paginator.get_paginated_response(serializer.data, next_cursor))


class SubmissionDetailView(APIView):
    """
    GET: Retrieve single submission.
    Only owner can view their submission.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        submission = get_object_or_404(
            Submission.objects.select_related("user", "problem", "language"), pk=pk
        )

        # Check ownership
        if submission.user != request.user:
            return Response(
                {"error": "You do not have permission to view this submission"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = SubmissionDetailSerializer(submission)
        return Response(serializer.data)


class SubmissionCreateView(APIView):
    """
    POST: Create a new submission.
    Requires authentication.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SubmissionCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Note: Status will be updated via WebSocket execution flow
            submission = serializer.save(user=request.user, status="Pending")
            detail_serializer = SubmissionDetailSerializer(submission)
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProgrammingLanguageListView(APIView):
    """
    GET: List all available programming languages.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        languages = ProgrammingLanguage.objects.all()
        print("LANGUAGES: ", languages)
        serializer = ProgrammingLanguageSerializer(languages, many=True)
        return Response(serializer.data)


class ProblemAttemptView(APIView):
    """
    GET: Retrieve or create a problem attempt for the current user and language.
    PATCH: Update the attempt's code for a specific language.
    Requires authentication.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, problem_slug):
        """Get or create an attempt for the user, problem, and language."""
        problem = get_object_or_404(Problem, slug=problem_slug)

        # Get language from query params (required)
        language_id = request.query_params.get("language")
        if not language_id:
            return Response(
                {"error": "Language parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            language = ProgrammingLanguage.objects.get(id=language_id)
        except ProgrammingLanguage.DoesNotExist:
            return Response(
                {"error": f"Language with id {language_id} not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get or create attempt for this specific language
        attempt, created = ProblemAttempt.objects.get_or_create(
            user=request.user,
            problem=problem,
            language=language,
            defaults={
                "code": "",  # Will be populated with boilerplate on frontend
            },
        )

        serializer = ProblemAttemptSerializer(attempt)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def patch(self, request, problem_slug):
        """Update the attempt's code for a specific language."""
        problem = get_object_or_404(Problem, slug=problem_slug)

        # Get language from request data (required)
        language_id = request.data.get("language")
        if not language_id:
            return Response(
                {"error": "Language field is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            language = ProgrammingLanguage.objects.get(id=language_id)
        except ProgrammingLanguage.DoesNotExist:
            return Response(
                {"error": f"Language with id {language_id} not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get or create attempt for this specific language
        attempt, _ = ProblemAttempt.objects.get_or_create(
            user=request.user,
            problem=problem,
            language=language,
        )

        serializer = ProblemAttemptUpdateSerializer(
            attempt, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            # Return full serializer
            full_serializer = ProblemAttemptSerializer(attempt)
            return Response(full_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
