from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Annotated, Optional
import models
from database import engine, SessionLocal
from sqlalchemy.orm import Session
import hashlib, os

app = FastAPI()
models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try: 
        yield db
    finally:
        db.close()

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreateBase(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
class UserUpdate(BaseModel):
    username: Optional[str]
    email: Optional[EmailStr]
    password: Optional[str]

origins = ["http://localhost:3000/"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    return hashlib.sha256(password.encode() + salt).hexdigest()

@app.post("/signup/")
async def create_user(user: UserCreateBase, db: Session = Depends(get_db)):
    existing_user = db.query(models.Users).filter(
        (models.Users.email == user.email) | (models.Users.username == user.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already exists")

    hashed_pw = hash_password(user.password)

    new_user = models.Users(
        username=user.username,
        email=user.email,
        password=hashed_pw
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": str(new_user.id),
        "username": new_user.username,
        "email": new_user.email,
        "is_active": new_user.is_active
    }

@app.post("/signin/")
async def signin(user: UserLogin, db: Session = Depends(get_db)):
    return {"message": "signin"}