"""
Service for generating problem-specific boilerplate code.
Uses templates from ProgrammingLanguage model with dynamic placeholders.
"""


class BoilerplateGeneratorService:
    """Generate language-specific boilerplate based on problem signature."""

    # Placeholder mappings
    PLACEHOLDERS = {
        "function_name": "{{ function_name }}",
        "return_type": "{{ return_type }}",
        "parameters": "{{ parameters }}",
    }

    @staticmethod
    def generate_boilerplate(problem, language):
        """
        Generate boilerplate code for a problem in a specific language.

        Args:
            problem: Problem instance
            language: ProgrammingLanguage instance

        Returns:
            str: Generated boilerplate code
        """
        template = language.boilerplate

        # Generate language-specific parameters
        params = BoilerplateGeneratorService._generate_parameters(
            problem, language.slug
        )

        # Replace placeholders
        boilerplate = template.replace("{{ function_name }}", problem.function_name)
        boilerplate = boilerplate.replace("{{ return_type }}", problem.return_type)
        boilerplate = boilerplate.replace("{{ parameters }}", params)

        return boilerplate

    @staticmethod
    def _generate_parameters(problem, language_slug):
        """Generate parameter list based on language and problem signature."""
        arg_types = problem.argument_types or []

        if language_slug == "python":
            # Python: self, *args or self, arg1, arg2, ...
            if not arg_types:
                return "self, *args"
            return "self, " + ", ".join([f"arg{i + 1}" for i in range(len(arg_types))])

        elif language_slug == "javascript":
            # JavaScript: ...args or arg1, arg2, ...
            if not arg_types:
                return "...args"
            return ", ".join([f"arg{i + 1}" for i in range(len(arg_types))])

        elif language_slug == "cpp":
            # C++: Type arg1, Type arg2, ...
            if not arg_types:
                return "auto ...args"
            return ", ".join(
                [f"{arg_types[i]} arg{i + 1}" for i in range(len(arg_types))]
            )

        elif language_slug == "java":
            # Java: Type arg1, Type arg2, ...
            if not arg_types:
                return "Object... args"
            return ", ".join(
                [f"{arg_types[i]} arg{i + 1}" for i in range(len(arg_types))]
            )

        return "*args"
