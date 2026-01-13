import os
from fastapi import APIRouter, HTTPException
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET", "dev-only-secret")  # env in prod/CI
ALGORITHM = "HS256"

users = {}

@router.post("/register")
def register(username: str, password: str):
    users[username] = password
    return {"message": "User registered"}

@router.post("/login")
def login(username: str, password: str):
    if users.get(username) != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    payload = {"sub": username, "exp": datetime.utcnow() + timedelta(hours=1)}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token}

