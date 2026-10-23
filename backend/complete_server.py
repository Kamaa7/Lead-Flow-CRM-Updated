from fastapi import FastAPI, HTTPException, Depends, status, Request
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
import httpx
import json
import logging
import uvicorn

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="LeadFlow CRM API", version="1.0.0")

# Debug: Log all registered routes
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up application...")
    for route in app.routes:
        logger.info(f"Registered route: {route.path} - {route.methods}")
    logger.info("Application startup complete")

# Stripe routes removed for now

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Security
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-this-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRATION_DELTA", "24")) * 60

# Google OAuth settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "your-google-client-id")

# In-memory storage
users_db = []
leads_db = []
properties_db = []
tasks_db = []

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
    status: str = "pending"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user_id: str

# Helper functions
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
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Find user in in-memory storage
    user = next((u for u in users_db if u["email"] == email), None)
    if user is None:
        raise credentials_exception
    return User(**user)

async def verify_google_token(token: str):
    """Verify Google ID token"""
    try:
        # For demo purposes, we'll accept any token and extract email from it
        # In production, you should verify the token with Google's servers
        if token.startswith("google_token_"):
            # Extract email from demo token
            email = token.replace("google_token_", "")
            return {"email": email, "name": email.split("@")[0]}
        else:
            # Try to decode as JWT (for demo purposes)
            try:
                payload = jwt.decode(token, options={"verify_signature": False})
                return {"email": payload.get("email", "demo@example.com"), "name": payload.get("name", "Demo User")}
            except:
                return {"email": "demo@example.com", "name": "Demo User"}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid Google token")

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "LeadFlow CRM API is running"}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "LeadFlow CRM API"}

# Auth endpoints
@app.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user already exists
    if any(u["email"] == user.email for u in users_db):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(
        id=str(len(users_db) + 1),
        email=user.email,
        full_name=user.full_name,
        created_at=datetime.now()
    )
    users_db.append(new_user.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    
    token = Token(
        access_token=access_token,
        token_type="bearer",
        user=new_user
    )
    return token

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Find user
    user = next((u for u in users_db if u["email"] == form_data.username), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # For demo purposes, accept any password for existing users
    # In production, you'd verify the password hash
    # if not verify_password(form_data.password, user["password_hash"]):
    #     raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    token = Token(
        access_token=access_token,
        token_type="bearer",
        user=User(**user)
    )
    return token

@app.post("/api/auth/google", response_model=Token)
async def google_login(request: GoogleLoginRequest):
    try:
        # Verify Google token
        user_info = await verify_google_token(request.token)
        email = user_info["email"]
        full_name = user_info["name"]
        
        # Check if user exists
        user = next((u for u in users_db if u["email"] == email), None)
        
        if not user:
            # Create new user
            new_user = User(
                id=str(len(users_db) + 1),
                email=email,
                full_name=full_name,
                created_at=datetime.now()
            )
            users_db.append(new_user.dict())
            user = new_user.dict()
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"]}, expires_delta=access_token_expires
        )
        
        token = Token(
            access_token=access_token,
            token_type="bearer",
            user=User(**user)
        )
        return token
        
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid Google token")

@app.get("/api/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Demo endpoint to create a test user
@app.post("/api/demo/create-user")
async def create_demo_user():
    """Create a demo user for testing"""
    demo_user = User(
        id="demo_1",
        email="demo@example.com",
        full_name="Demo User",
        created_at=datetime.now()
    )
    
    # Check if demo user already exists
    if not any(u["email"] == demo_user.email for u in users_db):
        users_db.append(demo_user.dict())
    
    return {"message": "Demo user created", "user": demo_user}

# Leads endpoints
@app.get("/api/leads", response_model=List[Lead])
async def get_leads(current_user: User = Depends(get_current_user)):
    user_leads = [lead for lead in leads_db if lead["user_id"] == current_user.id]
    return [Lead(**lead) for lead in user_leads]

@app.post("/api/leads", response_model=Lead)
async def create_lead(lead: Lead, current_user: User = Depends(get_current_user)):
    lead.id = str(len(leads_db) + 1)
    lead.user_id = current_user.id
    lead.created_at = datetime.now()
    leads_db.append(lead.dict())
    return lead

@app.put("/api/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead: Lead, current_user: User = Depends(get_current_user)):
    lead_index = next((i for i, l in enumerate(leads_db) if l["id"] == lead_id and l["user_id"] == current_user.id), None)
    if lead_index is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead.id = lead_id
    lead.user_id = current_user.id
    lead.updated_at = datetime.now()
    leads_db[lead_index] = lead.dict()
    return lead

@app.delete("/api/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: User = Depends(get_current_user)):
    lead_index = next((i for i, l in enumerate(leads_db) if l["id"] == lead_id and l["user_id"] == current_user.id), None)
    if lead_index is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    leads_db.pop(lead_index)
    return {"message": "Lead deleted successfully"}

# Properties endpoints
@app.get("/api/properties", response_model=List[Property])
async def get_properties(current_user: User = Depends(get_current_user)):
    user_properties = [prop for prop in properties_db if prop["user_id"] == current_user.id]
    return [Property(**prop) for prop in user_properties]

@app.post("/api/properties", response_model=Property)
async def create_property(property: Property, current_user: User = Depends(get_current_user)):
    property.id = str(len(properties_db) + 1)
    property.user_id = current_user.id
    property.created_at = datetime.now()
    properties_db.append(property.dict())
    return property

# Tasks endpoints
@app.get("/api/tasks", response_model=List[Task])
async def get_tasks(current_user: User = Depends(get_current_user)):
    user_tasks = [task for task in tasks_db if task["user_id"] == current_user.id]
    return [Task(**task) for task in user_tasks]

@app.post("/api/tasks", response_model=Task)
async def create_task(task: Task, current_user: User = Depends(get_current_user)):
    task.id = str(len(tasks_db) + 1)
    task.user_id = current_user.id
    task.created_at = datetime.now()
    tasks_db.append(task.dict())
    return task

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
