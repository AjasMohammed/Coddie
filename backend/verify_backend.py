import requests
import time

BASE_URL = "http://localhost:8000/api"
AUTH_URL = f"{BASE_URL}/auth"
PROBLEMS_URL = f"{BASE_URL}/problems"
EXECUTION_URL = f"{BASE_URL}/execution"


def verify():
    # 1. Register
    print("1. Registering user...")
    timestamp = int(time.time())
    email = f"testuser_{timestamp}@example.com"
    password = "password123"
    username = f"testuser_{timestamp}"

    response = requests.post(
        f"{AUTH_URL}/register/",
        json={"username": username, "email": email, "password": password},
    )
    if response.status_code != 201:
        print(f"Registration failed: {response.text}")
        return
    print("Registration successful")

    # 2. Login
    print("2. Logging in...")
    response = requests.post(
        f"{AUTH_URL}/token/", json={"email": email, "password": password}
    )
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    token = response.json()["access"]
    print("Login successful")
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Problem
    print("3. Creating problem...")
    problem_data = {
        "title": f"Two Sum {timestamp}",
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        "difficulty": "Easy",
        "time_limit": 1.0,
        "memory_limit": 128000,
        "test_cases": [{"input": "2\n2 7 11 15\n9", "output": "0 1"}],
        "function_name": "twoSum",
    }
    response = requests.post(
        PROBLEMS_URL + "/problems/", json=problem_data, headers=headers
    )
    if response.status_code != 201:
        print(f"Problem creation failed: {response.text}")
        return
    print("Problem created successfully")

    # 4. Run Code
    print("4. Running code...")
    code = """
print("Hello World")
"""
    response = requests.post(
        f"{EXECUTION_URL}/run/",
        json={"language": "python", "version": "3.10.0", "code": code},
        headers=headers,
    )
    if response.status_code != 200:
        print(f"Execution failed: {response.text}")
        return
    print(f"Execution result: {response.json()}")


if __name__ == "__main__":
    verify()
