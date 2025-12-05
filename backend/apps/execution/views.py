from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .piston import PistonClient
from apps.problems.models import Problem, ProgrammingLanguage
from .services import DriverTemplateService


class RunCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        language_slug = request.data.get("language")
        version = request.data.get("version", "*")
        user_code = request.data.get("code")
        problem_slug = request.data.get("problem_slug")
        mode = request.data.get("mode", "run")

        if not language_slug or not user_code or not problem_slug:
            return Response(
                {"error": "Language, code, and problem_slug are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            problem = Problem.objects.get(slug=problem_slug)
            language = ProgrammingLanguage.objects.get(slug=language_slug)
        except Problem.DoesNotExist:
            return Response(
                {"error": "Problem not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except ProgrammingLanguage.DoesNotExist:
            return Response(
                {"error": "Language not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Prepare Test Cases
        test_cases = []
        if mode == "run":
            if problem.test_cases:
                test_cases = problem.test_cases[:5]
                print("Test Cases: ", test_cases)
        else:  # mode == "submit"
            test_cases = problem.test_cases

        # Generate Driver Code
        try:
            full_code = DriverTemplateService.generate_driver_code(
                language, user_code, problem, test_cases
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to generate driver code: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Execute code via Piston
        client = PistonClient()
        result = client.execute(
            language=language_slug,
            version=version,
            files=[{"content": full_code}],
            stdin="",
        )

        # Add mode to result for frontend context
        result["mode"] = mode

        return Response(result)
