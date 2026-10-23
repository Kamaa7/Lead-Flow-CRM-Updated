import sqlite3
from datetime import datetime
from passlib.hash import bcrypt
import os

def init_db():
    # Remove existing database if it exists
    if os.path.exists('leadflow.db'):
        os.remove('leadflow.db')
    
    # Create a new database
    conn = sqlite3.connect('leadflow.db')
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create test user
    user_id = "test_user_123"
    email = "demo@example.com"
    password = "password"
    full_name = "Demo User"
    hashed_password = bcrypt.hash(password)
    
    cursor.execute('''
    INSERT INTO users (id, email, hashed_password, full_name)
    VALUES (?, ?, ?, ?)
    ''', (user_id, email, hashed_password, full_name))
    
    conn.commit()
    print(f"✅ Database initialized successfully!")
    print(f"🔑 Test user created:")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    
    conn.close()

if __name__ == "__main__":
    init_db()
