from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from datetime import datetime
import json

app = FastAPI(title="LeadFlow CRM API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage
users_db = []
leads_db = []
properties_db = []
tasks_db = []

# Pydantic models
class User(BaseModel):
    id: Optional[str] = None
    email: str
    full_name: str
    is_active: bool = True
    created_at: Optional[datetime] = None

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Lead(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    status: str = "new"
    score: Optional[int] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
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
    user_id: str

class Task(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str = "pending"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    created_at: Optional[datetime] = None
    user_id: str

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
    
    # Create simple token
    token = Token(
        access_token=f"token_{new_user.id}",
        token_type="bearer",
        user=new_user
    )
    return token

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    # Simple login - in real app, you'd verify password
    user = next((u for u in users_db if u["email"] == user_data.email), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = Token(
        access_token=f"token_{user['id']}",
        token_type="bearer",
        user=User(**user)
    )
    return token

@app.get("/api/auth/me", response_model=User)
async def get_current_user_info(token: str):
    # Simple token validation
    if not token.startswith("token_"):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = token.replace("token_", "")
    user = next((u for u in users_db if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

# Leads endpoints
@app.get("/api/leads", response_model=List[Lead])
async def get_leads():
    return [Lead(**lead) for lead in leads_db]

@app.post("/api/leads", response_model=Lead)
async def create_lead(lead: Lead):
    lead.id = str(len(leads_db) + 1)
    lead.created_at = datetime.now()
    leads_db.append(lead.dict())
    return lead

@app.put("/api/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead: Lead):
    lead_index = next((i for i, l in enumerate(leads_db) if l["id"] == lead_id), None)
    if lead_index is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead.id = lead_id
    lead.updated_at = datetime.now()
    leads_db[lead_index] = lead.dict()
    return lead

@app.delete("/api/leads/{lead_id}")
async def delete_lead(lead_id: str):
    lead_index = next((i for i, l in enumerate(leads_db) if l["id"] == lead_id), None)
    if lead_index is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    leads_db.pop(lead_index)
    return {"message": "Lead deleted successfully"}

# Properties endpoints
@app.get("/api/properties", response_model=List[Property])
async def get_properties():
    return [Property(**prop) for prop in properties_db]

@app.post("/api/properties", response_model=Property)
async def create_property(property: Property):
    property.id = str(len(properties_db) + 1)
    property.created_at = datetime.now()
    properties_db.append(property.dict())
    return property

# Tasks endpoints
@app.get("/api/tasks", response_model=List[Task])
async def get_tasks():
    return [Task(**task) for task in tasks_db]

@app.post("/api/tasks", response_model=Task)
async def create_task(task: Task):
    task.id = str(len(tasks_db) + 1)
    task.created_at = datetime.now()
    tasks_db.append(task.dict())
    return task

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
