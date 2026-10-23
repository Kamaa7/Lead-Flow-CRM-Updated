import sqlite3
from datetime import datetime
from passlib.hash import bcrypt

def create_test_user():
    # Connect to the database
    conn = sqlite3.connect('leadflow.db')
    cursor = conn.cursor()
    
    # Create users table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
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
    email = "test@example.com"
    password = "password123"
    full_name = "Test User"
    hashed_password = bcrypt.hash(password)
    
    try:
        cursor.execute('''
        INSERT INTO users (id, email, hashed_password, full_name)
        VALUES (?, ?, ?, ?)
        ''', (user_id, email, hashed_password, full_name))
        
        conn.commit()
        print(f"✅ Created test user: {email} with password: {password}")
        
    except sqlite3.IntegrityError:
        print("ℹ️ Test user already exists")
    
    conn.close()

if __name__ == "__main__":
    create_test_user()
