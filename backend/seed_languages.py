import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.problems.models import ProgrammingLanguage


python_template = """
import sys
import json

# --- USER CODE ---
{{ user_code }}
# -----------------

def run():
    test_cases = {{ test_cases_literal }}
    sol = Solution()
    return_type = "{{ return_type }}"

    for i, case in enumerate(test_cases):
        inputs = case['input']
        expected = case['output']
        try:
            # Dynamic method call
            func = getattr(sol, "{{ function_name }}")
            result = func(*inputs)

            # Type checking
            if result is None and return_type != "void":
                print(json.dumps({"status": "Runtime Error", "input": inputs, "expected": expected, "error": f"Output type mismatch. Expected {return_type}, got NoneType"}))
                return

            if result != expected:
                print(json.dumps({"status": "Wrong Answer", "input": inputs, "expected": expected, "actual": result}))
                return
        except Exception as e:
            error_msg = str(e)
            # Check if it's a type mismatch error
            if "NoneType" in error_msg or "type" in error_msg.lower():
                if "Expected" not in error_msg and return_type:
                    error_msg = f"Output type mismatch. Expected {return_type}, got {type(result).__name__ if 'result' in locals() else 'NoneType'}"
            print(json.dumps({"status": "Runtime Error", "input": inputs, "expected": expected, "error": error_msg}))
            return

    print(json.dumps({"status": "Accepted"}))

if __name__ == "__main__":
    run()
"""

ProgrammingLanguage.objects.update_or_create(
    slug="python",
    defaults={
        "name": "Python",
        "boilerplate": "class Solution:\n    def solve(self, args):\n        pass",
        "driver_template": python_template,
    },
)
print("Seeded Python language.")
