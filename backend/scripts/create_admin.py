#!/usr/bin/env python3
"""
Create an admin user for the Covenant Azor partner portal.
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from passlib.hash import bcrypt

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

# Admin user details
ADMIN_EMAIL = "admin@covenanttechnology.net"
ADMIN_PASSWORD = "Admin123!"  # Change this after first login
ADMIN_NAME = "System Administrator"

def create_admin():
    """Create admin user in the database."""
    engine = create_engine(DATABASE_URL)

    # Hash the password
    password_hash = bcrypt.hash(ADMIN_PASSWORD)

    with engine.connect() as conn:
        # Check if admin already exists
        result = conn.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": ADMIN_EMAIL}
        )
        existing = result.fetchone()

        if existing:
            print(f"✓ Admin user already exists: {ADMIN_EMAIL}")
            return

        # Insert admin user
        conn.execute(
            text("""
                INSERT INTO users (email, password_hash, full_name, role, is_active, mfa_enabled)
                VALUES (:email, :password_hash, :full_name, :role, :is_active, :mfa_enabled)
            """),
            {
                "email": ADMIN_EMAIL,
                "password_hash": password_hash,
                "full_name": ADMIN_NAME,
                "role": "admin",
                "is_active": True,
                "mfa_enabled": False
            }
        )
        conn.commit()

        print("✓ Admin user created successfully!")
        print(f"  Email: {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
        print("\n⚠️  IMPORTANT: Change this password after first login!")

if __name__ == "__main__":
    try:
        create_admin()
    except Exception as e:
        print(f"ERROR: Failed to create admin user: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
