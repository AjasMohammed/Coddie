import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .piston import PistonClient
from asgiref.sync import sync_to_async
from apps.problems.models import Problem, ProgrammingLanguage, Submission
from .services import DriverTemplateService


class ConnectionManager:
    """
    Manages active WebSocket connections.
    """

    def __init__(self):
        self.active_connections: list[AsyncWebsocketConsumer] = []

    async def connect(self, websocket: AsyncWebsocketConsumer):
        """Accept and store a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: AsyncWebsocketConsumer):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_message(self, message: str, websocket: AsyncWebsocketConsumer):
        """Send a message to a specific connection."""
        await websocket.send(text_data=message)

    async def broadcast(self, message: str):
        """Send a message to all active connections."""
        for connection in self.active_connections:
            await connection.send(text_data=message)


manager = ConnectionManager()


class CodeExecutionConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time code execution.

    Receives code execution requests via WebSocket and streams
    results back to the client.
    """

    async def connect(self):
        """Accept WebSocket connection with JWT token authentication."""
        # Debug: Print the path being accessed
        path = self.scope.get("path", "")
        print(f"WebSocket connection attempt to path: {path}")

        # Get token from query string
        query_string = self.scope.get("query_string", b"").decode()
        token = None

        # Parse query string for token
        if query_string:
            try:
                from urllib.parse import parse_qs
                params = parse_qs(query_string)
                token = params.get("token", [None])[0]
            except Exception as e:
                print(f"Error parsing query string: {e}")

        # If token provided, authenticate user
        if token:
            from rest_framework_simplejwt.tokens import AccessToken
            from django.contrib.auth import get_user_model
            User = get_user_model()

            try:
                access_token = AccessToken(token)
                user_id = access_token["user_id"]
                user = await database_sync_to_async(User.objects.get)(id=user_id)
                self.scope["user"] = user
                print(f"WebSocket authenticated user: {user.username}")
            except Exception as e:
                print(f"Token authentication failed: {e}")
                await self.close()
                return

        # Check if user is authenticated
        if self.scope["user"].is_anonymous:
            print("WebSocket connection rejected: user is anonymous")
            await self.close()
            return

        await manager.connect(self)
        print(f"WebSocket connected successfully to path: {path}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        manager.disconnect(self)

    async def receive(self, text_data):
        """
        Receive and process code execution request.

        Expected JSON format:
        {
            "language": "python",
            "version": "3.10.0",
            "code": "class Solution: ...",
            "problem_slug": "two-sum",
            "mode": "run" | "submit",
            "custom_input": "..." (optional, for 'run' mode)
        }
        """
        try:
            data = json.loads(text_data)
            language_slug = data.get("language")
            version = data.get("version", "*")
            user_code = data.get("code")
            problem_slug = data.get("problem_slug")
            mode = data.get("mode", "run")
            # custom_input = data.get("custom_input")

            if not language_slug or not user_code or not problem_slug:
                await self.send(
                    text_data=json.dumps(
                        {"error": "Language, code, and problem_slug are required"}
                    )
                )
                return

            # Fetch Problem and Language
            try:
                problem = await sync_to_async(Problem.objects.get)(slug=problem_slug)
                language = await sync_to_async(ProgrammingLanguage.objects.get)(
                    slug=language_slug
                )
            except Problem.DoesNotExist:
                await self.send(text_data=json.dumps({"error": "Problem not found"}))
                return
            except ProgrammingLanguage.DoesNotExist:
                await self.send(text_data=json.dumps({"error": "Language not found"}))
                return

            # Prepare Test Cases
            test_cases = []
            if mode == "run":
                # Use the first example test case if no custom input or as default
                if problem.test_cases:
                    test_cases = problem.test_cases[:5]
                    print("Test Cases: ", test_cases)
            else:  # mode == "submit"
                test_cases = problem.test_cases

            # Generate Driver Code
            full_code = await sync_to_async(DriverTemplateService.generate_driver_code)(
                language, user_code, problem, test_cases
            )
            print("+==============================================")
            print("Full Code to Execute:\n", full_code)
            print("+==============================================")
            # Execute code via Piston
            client = PistonClient()
            result = await sync_to_async(client.execute)(
                language=language_slug,
                version=version,
                files=[{"content": full_code}],
                stdin="",  # We are injecting inputs directly into the code
            )

            # Parse result and determine status
            status = "Pending"
            output_text = ""
            execution_time = None
            memory_usage = None

            if result.get("compile") and result["compile"].get("stderr"):
                status = "Compilation Error"
                output_text = result["compile"]["stderr"]
            elif result.get("run"):
                run_result = result["run"]
                stdout = run_result.get("stdout", "")
                stderr = run_result.get("stderr", "")
                exit_code = run_result.get("code", 1)

                # Try to parse JSON output from stdout
                try:
                    parsed_output = json.loads(stdout.strip())
                    if parsed_output.get("status") == "Accepted":
                        status = "Accepted"
                    elif parsed_output.get("status"):
                        status = parsed_output["status"]
                    else:
                        status = "Wrong Answer"
                    output_text = stdout
                except (json.JSONDecodeError, ValueError):
                    # Not JSON, check exit code and stderr
                    if exit_code != 0 or stderr:
                        status = "Runtime Error"
                        output_text = stderr or stdout
                    else:
                        status = "Wrong Answer"
                        output_text = stdout

                # Extract execution time and memory if available
                execution_time = run_result.get("time", None)
                memory_usage = run_result.get("memory", None)

            # Create submission if mode is "submit"
            submission_id = None
            if mode == "submit":
                user = self.scope["user"]
                if not user.is_anonymous:
                    submission = await self.create_submission(
                        user=user,
                        problem=problem,
                        language=language,
                        code=user_code,
                        status=status,
                        output=output_text,
                        execution_time=execution_time,
                        memory_usage=memory_usage,
                    )
                    submission_id = submission.id if submission else None

            # Send result back to client
            await self.send(
                text_data=json.dumps(
                    {
                        "result": result,
                        "mode": mode,
                        "status": status,
                        "output": output_text,
                        "execution_time": execution_time,
                        "memory_usage": memory_usage,
                        "submission_id": submission_id,
                    }
                )
            )

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({"error": "Invalid JSON format"}))
        except Exception as e:
            await self.send(text_data=json.dumps({"error": str(e)}))

    @database_sync_to_async
    def create_submission(self, user, problem, language, code, status, output, execution_time, memory_usage):
        """Create a submission record."""
        try:
            submission = Submission.objects.create(
                user=user,
                problem=problem,
                language=language,
                code=code,
                status=status,
                output=output,
                execution_time=execution_time,
                memory_usage=memory_usage,
            )
            return submission
        except Exception as e:
            print(f"Error creating submission: {e}")
            return None
