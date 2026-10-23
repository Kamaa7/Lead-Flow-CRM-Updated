import requests
import sys

def create_test_user(email, password, full_name="Test User"):
    url = "http://localhost:8001/api/auth/register"
    data = {
        "email": email,
        "password": password,
        "full_name": full_name
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            print(f"✅ Successfully created test user: {email}")
            print(f"Password: {password}")
        else:
            print(f"❌ Error creating user: {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_test_user.py <email> <password> [full_name]")
        sys.exit(1)
        
    email = sys.argv[1]
    password = sys.argv[2]
    full_name = sys.argv[3] if len(sys.argv) > 3 else "Test User"
    
    create_test_user(email, password, full_name)
