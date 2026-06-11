$ErrorActionPreference = "Stop"

if (-Not (Test-Path ".\docker-compose.yml")) {
  Write-Error "docker-compose.yml introuvable. Lancez ce script depuis la racine du repo."
  exit 1
}

Write-Output "Écrasement de backend\main.py …"
@'
from fastapi import FastAPI
from auth import router as auth_router

app = FastAPI(title="Amarkhys API")
app.include_router(auth_router, prefix="/auth", tags=["auth"])
'@ | Out-File -Encoding UTF8 -FilePath backend\main.py

Write-Output "Écrasement de backend\auth.py …"
@'
#!/usr/bin/env python3
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Generator, Optional
from sqlalchemy import create_engine, Column, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os
import jwt
import uuid

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/amarkhys")
JWT_SECRET = os.getenv("JWT_SECRET", "change_me_to_secure_value")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

class User(Base):
    tablename = "users"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, nullable=False, default="client")

Base.metadata.create_all(bind=engine)

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    token = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return token if isinstance(token, str) else token.decode()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter()

@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name or ""
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(payload: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer"}
'@ | Out-File -Encoding UTF8 -FilePath backend\auth.py

Write-Output "Reconstruire l'image backend sans cache …"
docker compose build --no-cache backend

Write-Output "Démarrage des conteneurs en arrière-plan …"
docker compose up -d

Write-Output "Affichage des logs backend (10s d'attente pour démarrage) …"
Start-Sleep -Seconds 5
docker compose logs backend --no-log-prefix --tail=200

Write-Output "Fini. Ouvrez http://localhost:8000/docs pour vérifier Swagger."