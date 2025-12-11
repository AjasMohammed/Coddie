from django.db import models
from django.conf import settings
from django.utils.text import slugify


class ProgrammingLanguage(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)
    boilerplate = models.TextField(help_text="Initial code template for this language")
    driver_template = models.TextField(
        help_text="Driver code template for this language", blank=True, default=""
    )

    def __str__(self):
        return self.name


class Problem(models.Model):
    DIFFICULTY_CHOICES = [
        ("Easy", "Easy"),
        ("Medium", "Medium"),
        ("Hard", "Hard"),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True, db_index=True)
    description = models.TextField(help_text="Markdown supported")
    difficulty = models.CharField(
        max_length=10, choices=DIFFICULTY_CHOICES, db_index=True
    )
    time_limit = models.FloatField(
        help_text="Time limit in seconds", null=True, blank=True
    )
    memory_limit = models.IntegerField(
        help_text="Memory limit in KB", null=True, blank=True
    )
    test_cases = models.JSONField(help_text="JSON list of input/output pairs")
    function_name = models.CharField(
        max_length=100, help_text="Entry point function name"
    )

    # Define possible data types for return_type and argument_types
    class DataType(models.TextChoices):
        INTEGER = "int", "int"
        STRING = "string", "string"
        FLOAT = "float", "float"
        BOOLEAN = "boolean", "boolean"
        VOID = "void", "void"

    return_type = models.CharField(
        max_length=50,
        choices=DataType.choices,
        default=DataType.VOID,
        help_text="Return type of the function (e.g., int, string, void)",
    )
    argument_types = models.JSONField(
        help_text="List of argument types (e.g., ['int[]', 'int'])",
        default=list,
        blank=True,
    )

    starter_code = models.TextField(
        blank=True,
        default="",
        help_text="Initial/template code for users to start with",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="problems"
    )
    language = models.ForeignKey(
        ProgrammingLanguage,
        on_delete=models.SET_NULL,
        null=True,
        help_text="The programming language this problem is designed for",
    )
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["difficulty", "-created_at"]),  # For filtered lists
            models.Index(fields=["created_by", "-created_at"]),  # For user's problems
            models.Index(
                fields=["is_public", "-created_at"]
            ),  # For public problem lists
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Submission(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Accepted", "Accepted"),
        ("Wrong Answer", "Wrong Answer"),
        ("Time Limit Exceeded", "Time Limit Exceeded"),
        ("Runtime Error", "Runtime Error"),
        ("Compilation Error", "Compilation Error"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions"
    )
    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="submissions"
    )
    language = models.ForeignKey(ProgrammingLanguage, on_delete=models.PROTECT)
    code = models.TextField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="Pending", db_index=True
    )
    output = models.TextField(blank=True, null=True)
    execution_time = models.FloatField(
        null=True, blank=True, help_text="Execution time in seconds"
    )
    memory_usage = models.IntegerField(
        null=True, blank=True, help_text="Memory usage in KB"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "-created_at"]),  # For user's submissions
            models.Index(fields=["problem", "-created_at"]),  # For problem submissions
            models.Index(fields=["status", "-created_at"]),  # For filtering by status
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.problem.title} - {self.status}"


class ProblemAttempt(models.Model):
    """
    Tracks a user's attempt at solving a problem in a specific language.
    One attempt per user-problem-language combination.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="problem_attempts",
    )
    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="attempts"
    )
    language = models.ForeignKey(
        ProgrammingLanguage,
        on_delete=models.PROTECT,
        help_text="Language for this specific attempt",
    )
    code = models.TextField(
        help_text="Code for this language attempt",
        blank=True,
        default="",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        # One attempt per user-problem-language combination
        unique_together = [["user", "problem", "language"]]
        indexes = [
            models.Index(fields=["user", "-updated_at"]),  # For user's recent attempts
            models.Index(fields=["problem", "-updated_at"]),  # For problem attempts
        ]

    def __str__(self):
        return f"{self.user.username} - {self.problem.title} ({self.language.name})"
