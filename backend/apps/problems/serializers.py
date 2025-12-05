"""
Optimized serializers for Problems app.
Separate serializers for list vs detail views to minimize payload size.
"""

from rest_framework import serializers
from .models import Problem, Submission, ProgrammingLanguage, ProblemAttempt


class ProgrammingLanguageSerializer(serializers.ModelSerializer):
    """Language serializer - minimal fields for selection."""

    class Meta:
        model = ProgrammingLanguage
        fields = ["id", "name", "slug", "boilerplate"]


class ProblemListSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for problem lists.
    Excludes heavy fields like test_cases and description.
    Used with select_related('created_by') and only() in view.
    """

    created_by = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Problem
        fields = [
            "id",
            "title",
            "slug",
            "difficulty",
            "created_by",
            "is_public",
            "created_at",
        ]
        read_only_fields = ["id", "slug", "created_by", "created_at"]


class ProblemDetailSerializer(serializers.ModelSerializer):
    """
    Full serializer for problem detail view.
    Includes all fields including test_cases and description.
    Converts test case inputs/outputs from lists to strings for JSON serialization.
    """

    created_by = serializers.CharField(source="created_by.username", read_only=True)
    language = ProgrammingLanguageSerializer(read_only=True)

    class Meta:
        model = Problem
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "difficulty",
            "time_limit",
            "memory_limit",
            "test_cases",
            "function_name",
            "return_type",
            "starter_code",
            "language",
            "created_by",
            "is_public",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_by", "created_at", "updated_at"]

    def validate_test_cases(self, value):
        """Validate test cases structure."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Test cases must be a list")
        for case in value:
            if not isinstance(case, dict):
                raise serializers.ValidationError("Each test case must be a dictionary")
            if "input" not in case or "output" not in case:
                raise serializers.ValidationError(
                    "Each test case must have 'input' and 'output' keys"
                )
        return value


class ProblemCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating problems.
    Expects test case inputs/outputs as lists (parsed by frontend).
    """

    class Meta:
        model = Problem
        fields = [
            "title",
            "description",
            "difficulty",
            "time_limit",
            "memory_limit",
            "test_cases",
            "function_name",
            "return_type",
            "language",
            "starter_code",
            "argument_types",
            "is_public",
        ]

    def validate_test_cases(self, value):
        """Validate test cases structure - inputs should be lists."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Test cases must be a list")
        if len(value) < 1:
            raise serializers.ValidationError("At least one test case is required")

        for case in value:
            if not isinstance(case, dict):
                raise serializers.ValidationError("Each test case must be a dictionary")
            if "input" not in case or "output" not in case:
                raise serializers.ValidationError(
                    "Each test case must have 'input' and 'output' keys"
                )
            # Validate that input is a list (frontend should have converted it)
            if not isinstance(case["input"], list):
                raise serializers.ValidationError(
                    "Test case 'input' must be a list. Frontend should parse strings to lists before sending."
                )

        return value

    def validate(self, data):
        """
        Validate and parse test case outputs based on return_type.
        """
        return_type = data.get("return_type")
        test_cases = data.get("test_cases", [])

        if not return_type or not test_cases:
            return data

        for i, case in enumerate(test_cases):
            output = case.get("output")
            # Skip if output is already None (for void) or we want to allow it
            if output is None and return_type != "void":
                # If strict, raise error. For now, let's assume it might be allowed or handled later.
                # But usually output is required.
                pass

            try:
                if return_type == "integer":
                    case["output"] = int(output)
                elif return_type == "float":
                    case["output"] = float(output)
                elif return_type == "boolean":
                    if isinstance(output, bool):
                        pass
                    elif str(output).lower() in ["true", "1"]:
                        case["output"] = True
                    elif str(output).lower() in ["false", "0"]:
                        case["output"] = False
                    else:
                        raise ValueError(f"Invalid boolean value: {output}")
                elif return_type == "integer[]":
                    if isinstance(output, str):
                        import json

                        try:
                            parsed = json.loads(output)
                        except Exception:
                            # Try manual parsing if simple format
                            parsed = [
                                int(x.strip())
                                for x in output.strip("[]").split(",")
                                if x.strip()
                            ]

                        if not isinstance(parsed, list):
                            raise ValueError("Output must be a list")
                        case["output"] = [int(x) for x in parsed]
                    elif isinstance(output, list):
                        case["output"] = [int(x) for x in output]
                # Add more types as needed
            except (ValueError, TypeError) as e:
                raise serializers.ValidationError(
                    f"Test case {i + 1} output error: {str(e)}"
                )

        data["test_cases"] = test_cases
        return data


class SubmissionListSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for submission lists.
    Uses select_related('problem', 'user', 'language') in view.
    Excludes heavy 'code' and 'output' fields.
    """

    problem_title = serializers.CharField(source="problem.title", read_only=True)
    problem_slug = serializers.CharField(source="problem.slug", read_only=True)
    language_name = serializers.CharField(source="language.name", read_only=True)
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "problem_title",
            "problem_slug",
            "user_name",
            "language_name",
            "status",
            "execution_time",
            "memory_usage",
            "created_at",
        ]
        read_only_fields = fields


class SubmissionDetailSerializer(serializers.ModelSerializer):
    """Full serializer for submission detail view including code."""

    problem_title = serializers.CharField(source="problem.title", read_only=True)
    problem_slug = serializers.CharField(source="problem.slug", read_only=True)
    language_name = serializers.CharField(source="language.name", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "problem",
            "problem_title",
            "problem_slug",
            "language",
            "language_name",
            "code",
            "status",
            "output",
            "execution_time",
            "memory_usage",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "problem_title",
            "problem_slug",
            "language_name",
            "status",
            "output",
            "execution_time",
            "memory_usage",
            "created_at",
        ]


class SubmissionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating submissions."""

    class Meta:
        model = Submission
        fields = ["problem", "language", "code"]

    def validate_code(self, value):
        """Validate code is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Code cannot be empty")
        return value


class ProblemAttemptSerializer(serializers.ModelSerializer):
    """Serializer for ProblemAttempt - stores user's current code state for a problem."""

    problem_slug = serializers.CharField(source="problem.slug", read_only=True)
    language_name = serializers.CharField(source="language.name", read_only=True)

    class Meta:
        model = ProblemAttempt
        fields = [
            "id",
            "problem",
            "problem_slug",
            "language",
            "language_name",
            "code",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "problem_slug",
            "language_name",
            "created_at",
            "updated_at",
        ]


class ProblemAttemptUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating ProblemAttempt code and language."""

    class Meta:
        model = ProblemAttempt
        fields = ["code", "language"]

    def validate_code(self, value):
        """Allow empty code for clearing/resetting."""
        return value
