from django.test import TestCase
from .models import Problem, Submission, ProgrammingLanguage
from .serializers import ProblemSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class ProblemSerializerTest(TestCase):
    def test_validate_test_cases_valid(self):
        data = {
            "title": "Test Problem",
            "description": "Test Description",
            "difficulty": "Easy",
            "time_limit": 1.0,
            "memory_limit": 256,
            "function_name": "test",
            "test_cases": [{"input": "1", "output": "1"}],
            "is_public": True,
        }
        # We need a user context for the serializer if we were saving, but for validation of a field it might be fine.
        # However, ModelSerializer validation usually runs on the whole object.
        # Let's just test the method directly or via serializer validation.
        serializer = ProblemSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_validate_test_cases_invalid_type(self):
        data = {"title": "Test Problem", "test_cases": "not a list"}
        serializer = ProblemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("test_cases", serializer.errors)

    def test_validate_test_cases_invalid_structure(self):
        data = {
            "title": "Test Problem",
            "test_cases": [{"input": "1"}],  # Missing output
        }
        serializer = ProblemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("test_cases", serializer.errors)


class SubmissionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        self.language = ProgrammingLanguage.objects.create(
            name="Python", slug="python", boilerplate="print('hello')"
        )
        self.problem = Problem.objects.create(
            title="Test Problem",
            description="Desc",
            difficulty="Easy",
            time_limit=1.0,
            memory_limit=256,
            test_cases=[],
            function_name="test",
            created_by=self.user,
        )

    def test_submission_fields(self):
        submission = Submission.objects.create(
            user=self.user,
            problem=self.problem,
            language=self.language,
            code="print('hello')",
            execution_time=0.5,
            memory_usage=1024,
        )
        self.assertEqual(submission.execution_time, 0.5)
        self.assertEqual(submission.memory_usage, 1024)
