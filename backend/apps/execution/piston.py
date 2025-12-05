import requests


class PistonClient:
    BASE_URL = "http://localhost:2000/api/v2"

    def get_runtimes(self):
        response = requests.get(f"{self.BASE_URL}/runtimes")
        return response.json()

    def execute(
        self,
        language,
        version,
        files,
        stdin="",
        args=None,
        compile_timeout=10000,
        run_timeout=3000,
        memory_limit=128000000,
    ):
        payload = {
            "language": language,
            "version": version,
            "files": files,
            "stdin": stdin,
            "args": args or [],
            "compile_timeout": compile_timeout,
            "run_timeout": run_timeout,
            "memory_limit": memory_limit,
        }
        # print("Files: ", files)
        response = requests.post(f"{self.BASE_URL}/execute", json=payload)
        print("Response: ", response.json())
        return response.json()
