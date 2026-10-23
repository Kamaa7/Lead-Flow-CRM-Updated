import sys
print("Python version:", sys.version)
print("\nChecking required packages...")

try:
    import fastapi
    print("✅ FastAPI:", fastapi.__version__)
except ImportError:
    print("❌ FastAPI: Not installed")

try:
    import uvicorn
    print("✅ Uvicorn:", uvicorn.__version__)
except ImportError:
    print("❌ Uvicorn: Not installed")

try:
    import pymongo
    print("✅ PyMongo:", pymongo.__version__)
except ImportError:
    print("❌ PyMongo: Not installed")

try:
    import stripe
    print("✅ Stripe:", stripe.__version__)
except ImportError:
    print("❌ Stripe: Not installed")

try:
    from jose import jwt
    print("✅ python-jose: Installed")
except ImportError:
    print("❌ python-jose: Not installed")

print("\nEnvironment variables:")
import os
for var in ["MONGODB_URI", "JWT_SECRET", "STRIPE_SECRET_KEY"]:
    print(f"{var}: {'Set' if var in os.environ else 'Not set'}")
