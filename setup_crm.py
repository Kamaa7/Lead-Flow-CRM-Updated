import os
import sys
import subprocess
from pathlib import Path

def run_command(command, cwd=None):
    print(f"Running: {command}")
    try:
        process = subprocess.Popen(
            command,
            shell=True,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            print(f"Error executing command: {command}")
            if stdout:
                print(f"STDOUT: {stdout}")
            if stderr:
                print(f"STDERR: {stderr}")
            return False
        
        if stdout:
            print(stdout)
        return True
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        return False

def setup_backend():
    print("\n=== Setting up Backend ===")
    backend_dir = os.path.join("backend")
    
    # Create virtual environment
    if not run_command("python -m venv venv", cwd=backend_dir):
        return False
    
    # Activate virtual environment and install dependencies
    pip_install = """
    .\\venv\\Scripts\\activate && 
    python -m pip install --upgrade pip && 
    pip install -r requirements.txt
    """
    
    if not run_command(pip_install, cwd=backend_dir):
        return False
    
    # Create .env file
    env_content = """# Backend Configuration
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=sqlite:///./leadflow.db
FRONTEND_URL=http://localhost:3000
    """
    
    with open(os.path.join(backend_dir, ".env"), "w") as f:
        f.write(env_content)
    
    print("\n✅ Backend setup completed successfully!")
    return True

def setup_frontend():
    print("\n=== Setting up Frontend ===")
    frontend_dir = os.path.join("frontend")
    
    # Create .env file
    env_content = """# Frontend Configuration
REACT_APP_API_URL=http://localhost:8001
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
    """
    
    with open(os.path.join(frontend_dir, ".env"), "w") as f:
        f.write(env_content)
    
    # Install dependencies
    if not run_command("npm install", cwd=frontend_dir):
        return False
    
    print("\n✅ Frontend setup completed successfully!")
    return True

def print_instructions():
    print("\n" + "="*50)
    print("🚀 LeadFlow CRM Setup Complete!")
    print("="*50)
    print("\nTo start the application, follow these steps:")
    print("\n1. Start the Backend Server:")
    print("   cd backend")
    print("   .\\venv\\Scripts\\activate")
    print("   uvicorn server:app --reload --port 8001")
    print("\n2. In a new terminal, start the Frontend:")
    print("   cd frontend")
    print("   npm start")
    print("\n3. Open your browser and visit:")
    print("   http://localhost:3000")
    print("\n4. Default credentials:")
    print("   Email: admin@example.com")
    print("   Password: admin123")

def main():
    print("🚀 Starting LeadFlow CRM Setup...")
    
    # Create directories if they don't exist
    os.makedirs("backend", exist_ok=True)
    os.makedirs("frontend", exist_ok=True)
    
    if not setup_backend():
        print("\n❌ Backend setup failed. Please check the errors above.")
        return
    
    if not setup_frontend():
        print("\n❌ Frontend setup failed. Please check the errors above.")
        return
    
    print_instructions()

if __name__ == "__main__":
    main()
