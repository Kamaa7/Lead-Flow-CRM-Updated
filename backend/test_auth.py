import requests
import json

# Test the demo user creation
response = requests.post(
    "http://localhost:8001/api/demo/create-user",
    headers={"Content-Type": "application/json"}
)
print("Create demo user:", response.status_code, response.text)

# Test login with demo credentials
if response.status_code == 200:
    login_data = {
        "username": "demo@example.com",
        "password": "password"
    }
    login_response = requests.post(
        "http://localhost:8001/api/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    print("\nLogin response:", login_response.status_code, login_response.text)
