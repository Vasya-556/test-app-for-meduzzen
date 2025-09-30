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
from fastapi import WebSocket, WebSocketDisconnect
from uuid import UUID

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

@app.get("/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.Users).filter(models.Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": str(user.id), "username": user.username}

class ConnectionManager:
    def __init__(self):
        self.active: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active[user_id] = websocket

    def disconnect(self, user_id: str):
        self.active.pop(user_id, None)

    async def send_personal_message(self, message: dict, user_id: str):
        ws = self.active.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(user_id)

manager = ConnectionManager()

@app.websocket("/ws/")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except Exception:
        await websocket.close(code=1008)
        return

    db = SessionLocal()
    user = db.query(models.Users).filter(models.Users.email == email).first()
    db.close()
    if not user:
        await websocket.close(code=1008)
        return

    user_id = str(user.id)
    await manager.connect(user_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            recipient_id = data.get("recipient_id")
            content = data.get("content")
            if not recipient_id or not content:
                continue

            db = SessionLocal()
            msg = models.Messages(sender_id=user.id, recipient_id=UUID(recipient_id), content=content)
            db.add(msg)
            db.commit()
            db.refresh(msg)
            db.close()

            await websocket.send_json({
                "type": "sent",
                "id": str(msg.id),
                "recipient_id": recipient_id,
                "content": content,
                "created_at": msg.created_at.isoformat(),
                "updated_at": msg.updated_at.isoformat() if msg.updated_at else msg.created_at.isoformat()
            })

            await manager.send_personal_message({
                "type": "new_message",
                "id": str(msg.id),
                "sender_id": str(user.id),
                "content": content,
                "created_at": msg.created_at.isoformat(),
                "updated_at": msg.updated_at.isoformat() if msg.updated_at else msg.created_at.isoformat()
            }, recipient_id)
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@app.get("/messages/{recipient_id}")
def get_messages(recipient_id: str, current_user: models.Users = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(models.Messages).filter(
        ((models.Messages.sender_id == current_user.id) & (models.Messages.recipient_id == UUID(recipient_id))) |
        ((models.Messages.sender_id == UUID(recipient_id)) & (models.Messages.recipient_id == current_user.id))
    ).order_by(models.Messages.created_at).all()

    return [
        {
            "id": str(msg.id),
            "sender_id": str(msg.sender_id),
            "recipient_id": str(msg.recipient_id),
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
            "updated_at": msg.updated_at.isoformat() if msg.updated_at else msg.created_at.isoformat()
        }
        for msg in messages
    ]

@app.put("/messages/{message_id}")
def edit_message(
    message_id: str,
    new_content: dict,
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(models.Messages).filter(models.Messages.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to edit this message")
    
    msg.content = new_content.get("content", msg.content)
    db.commit()
    db.refresh(msg)
    return {"id": str(msg.id), "content": msg.content}

@app.delete("/messages/{message_id}")
def delete_message(
    message_id: str,
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(models.Messages).filter(models.Messages.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this message")
    
    db.delete(msg)
    db.commit()
    return {"message": "Deleted successfully"}