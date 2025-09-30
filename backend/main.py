from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
import models
from database import engine, SessionLocal
from sqlalchemy.orm import Session
import hashlib, os, jwt
from dotenv import load_dotenv
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from jwt import PyJWTError

app = FastAPI()
models.Base.metadata.create_all(bind=engine)
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

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

class Token(BaseModel):
    access_token: str
    token_type: str

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

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
        "message": "User created succesfully"
    }

@app.post("/signin/")
async def signin(user: UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(models.Users).filter(
        models.Users.email == user.email
    ).first()
    
    if not existing_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if existing_user.password != hash_password(user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": existing_user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token, 
        "token_type": "bearer",
    }

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/signin/")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except PyJWTError:
        raise credentials_exception

    user = db.query(models.Users).filter(models.Users.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/me/")
def read_users_me(current_user: models.Users = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email
    }

@app.get("/users/")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.Users).all()
    return [
        {
            "id": str(user.id),
            "username": user.username,
        }
        for user in users
    ]