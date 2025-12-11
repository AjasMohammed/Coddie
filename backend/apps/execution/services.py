import json
from django.template import Template, Context
from django.utils.safestring import mark_safe


class DriverTemplateService:
    @staticmethod
    def generate_driver_code(language, user_code, problem, test_cases):
        """
        Generates the full driver code by merging user code with the language's driver template.
        """
        template_str = language.driver_template
        if not template_str:
            # Fallback or error if no template exists
            return user_code

        template = Template(template_str)

        context_data = {
            "user_code": mark_safe(user_code),
            "function_name": problem.function_name,
            "return_type": problem.return_type,
            "test_cases_json": mark_safe(json.dumps(test_cases)),
            "argument_types": problem.argument_types,
        }

        # Generate language-specific literal for test_cases
        if language.slug == "python":
            # Python needs True/False/None
            context_data["test_cases_literal"] = mark_safe(repr(test_cases))
        else:
            # JS and others use JSON format (true/false/null)
            context_data["test_cases_literal"] = mark_safe(json.dumps(test_cases))

        if language.slug == "cpp":
            context_data["test_cases_cpp"] = DriverTemplateService._format_cpp(
                test_cases, problem.argument_types
            )
        elif language.slug == "java":
            context_data["test_cases_java"] = DriverTemplateService._format_java(
                test_cases, problem.argument_types
            )

        context = Context(context_data)

        return template.render(context)

    @staticmethod
    def _format_cpp(test_cases, argument_types):
        formatted = []
        for case in test_cases:
            inputs = []
            for i, val in enumerate(case["input"]):
                type_name = argument_types[i] if i < len(argument_types) else "auto"
                inputs.append(
                    {"value": DriverTemplateService._to_cpp_val(val), "type": type_name}
                )

            formatted.append(
                {
                    "inputs": inputs,
                    "expected": DriverTemplateService._to_cpp_val(case["output"]),
                }
            )
        return formatted

    @staticmethod
    def _to_cpp_val(val):
        if isinstance(val, list):
            return (
                "{" + ", ".join(DriverTemplateService._to_cpp_val(x) for x in val) + "}"
            )
        if isinstance(val, str):
            return f'"{val}"'
        if isinstance(val, bool):
            return "true" if val else "false"
        return str(val)

    @staticmethod
    def _format_java(test_cases, argument_types):
        formatted = []
        for case in test_cases:
            inputs = []
            for i, val in enumerate(case["input"]):
                type_name = argument_types[i] if i < len(argument_types) else "Object"
                inputs.append(
                    {
                        "value": DriverTemplateService._to_java_val(val, type_name),
                        "type": type_name,
                    }
                )

            formatted.append(
                {
                    "inputs": inputs,
                    "expected": DriverTemplateService._to_java_val(
                        case["output"], "Object"
                    ),  # Return type not passed here easily, but usually inferred or Object
                }
            )
        return formatted

    @staticmethod
    def _to_java_val(val, type_name="Object"):
        if isinstance(val, list):
            # Try to infer array type from type_name if possible, e.g. "int[]"
            # If type_name is "int[]", we use "new int[] { ... }"
            # If type_name is "List<Integer>", we might need "Arrays.asList(...)"
            if "[]" in type_name:
                base_type = type_name.replace("[]", "")
                return (
                    f"new {base_type}[] {{"
                    + ", ".join(
                        DriverTemplateService._to_java_val(x, base_type) for x in val
                    )
                    + "}"
                )
            return (
                "new int[] {"
                + ", ".join(DriverTemplateService._to_java_val(x) for x in val)
                + "}"
            )  # Fallback
        if isinstance(val, str):
            return f'"{val}"'
        if isinstance(val, bool):
            return "true" if val else "false"
        return str(val)
