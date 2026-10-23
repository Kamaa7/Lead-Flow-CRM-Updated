from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import sqlite3
from contextlib import contextmanager
import httpx
from google.auth.transport import requests
from google.oauth2 import id_token
import json

load_dotenv()

app = FastAPI(title="LeadFlow CRM API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database
DATABASE_URL = "sqlite:///./leadflow.db"

# Initialize SQLite database
def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                hashed_password TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

# Database connection helper
@contextmanager
def get_db():
    conn = sqlite3.connect('leadflow.db')
    try:
        conn.row_factory = sqlite3.Row  # This enables name-based access to columns
        yield conn
    finally:
        conn.close()

# Initialize the database
init_db()

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRATION_DELTA", "24")) * 60

# Pydantic models
class User(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    full_name: str
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    token: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Lead(BaseModel):
    id: Optional[str] = None
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    status: str = "new"
    score: Optional[int] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user_id: str

class Property(BaseModel):
    id: Optional[str] = None
    title: str
    address: str
    price: Optional[float] = None
    property_type: str
    status: str = "available"
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user_id: str

class Task(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str = "pending"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user_id: str

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    with get_db() as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
    if not user:
        raise credentials_exception
        
    return User(
        id=str(user["id"]),
        email=user["email"],
        full_name=user["full_name"],
        is_active=bool(user["is_active"]),
        created_at=user["created_at"],
        updated_at=user["updated_at"]
    )

# Auth endpoints
@app.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user already exists
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (user.email,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        now = datetime.utcnow()
        cursor.execute(
            """
            INSERT INTO users (email, full_name, hashed_password, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user.email, user.full_name, hashed_password, True, now, now)
        )
        user_id = cursor.lastrowid
        conn.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user_id)}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=User(
            id=str(user_id),
            email=user.email,
            full_name=user.full_name,
            is_active=True,
            created_at=now,
            updated_at=now
        )
    )

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with get_db() as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (form_data.username,))
        user = cursor.fetchone()
        
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["id"])}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=User(
            id=str(user["id"]),
            email=user["email"],
            full_name=user["full_name"],
            is_active=bool(user["is_active"]),
            created_at=user["created_at"],
            updated_at=user["updated_at"]
        )
    )

@app.post("/api/auth/google", response_model=Token)
async def google_login(request: GoogleLoginRequest):
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            request.token, 
            requests.Request(),
            os.getenv("GOOGLE_CLIENT_ID")
        )
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
        
        email = idinfo['email']
        full_name = idinfo['name']
        
        # Check if user exists
        user = db.users.find_one({"email": email})
        now = datetime.utcnow()
        
        if not user:
            # Create new user
            user_doc = {
                "email": email,
                "full_name": full_name,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
                "google_id": idinfo['sub']
            }
            result = db.users.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            user = user_doc
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user["_id"])}, expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=User(
                id=str(user["_id"]),
                email=user["email"],
                full_name=user["full_name"],
                is_active=user["is_active"],
                created_at=user["created_at"],
                updated_at=user["updated_at"]
            )
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid token: {str(e)}"
        )

@app.get("/api/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"message": "LeadFlow CRM API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)