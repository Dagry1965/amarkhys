from datetime import datetime, timedelta
from typing import List

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import SessionLocal
from models import (
    User,
    Client,
    Vehicle,
    Appointment,
)
from schemas import (
    UserCreate,
    UserRead,
    Token,
    ClientCreate,
    ClientRead,
    VehicleCreate,
    VehicleRead,
    AppointmentCreate,
    AppointmentRead,
)

# ===================== CONFIG =====================

JWT_SECRET = "change_me_to_secure_value"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter()


# ===================== DB DEPENDENCY =====================

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ===================== AUTH HELPERS =====================

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire}
    token = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return token if isinstance(token, str) else token.decode()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(sub)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive or not found user")
    return user


# ===================== AUTH ENDPOINTS =====================

@router.post("/auth/register", response_model=UserRead)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    email = payload.email.lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=email,
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/login", response_model=Token)
def login(payload: UserCreate, db: Session = Depends(get_db)):
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer"}


@router.get("/users/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


# ===================== CLIENTS =====================

@router.post("/clients", response_model=ClientRead)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    db_client = Client(name=client.name, email=client.email, phone=client.phone)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


@router.get("/clients", response_model=List[ClientRead])
def list_clients(db: Session = Depends(get_db)):
    return db.query(Client).all()


@router.get("/clients/{client_id}", response_model=ClientRead)
def get_client(client_id: int, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client


# ===================== VEHICLES =====================

@router.post("/vehicles", response_model=VehicleRead)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == vehicle.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found for this vehicle")

    db_vehicle = Vehicle(
        client_id=vehicle.client_id,
        marque=vehicle.marque,
        modele=vehicle.modele,
        immatriculation=vehicle.immatriculation,
    )
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


@router.get("/vehicles", response_model=List[VehicleRead])
def list_vehicles(db: Session = Depends(get_db)):
    return db.query(Vehicle).all()


@router.get("/vehicles/{vehicle_id}", response_model=VehicleRead)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return db_vehicle


@router.get("/vehicles/{vehicle_id}/appointments", response_model=List[AppointmentRead])
def list_vehicle_appointments(vehicle_id: int, db: Session = Depends(get_db)):
    return db.query(Appointment).filter(Appointment.vehicle_id == vehicle_id).all()


# ===================== APPOINTMENTS =====================

@router.post("/appointments", response_model=AppointmentRead)
def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == appointment.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if appointment.start_time >= appointment.end_time:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")

    db_apt = Appointment(
        vehicle_id=appointment.vehicle_id,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        status=appointment.status,
    )
    db.add(db_apt)
    db.commit()
    db.refresh(db_apt)
    return db_apt


@router.get("/appointments", response_model=List[AppointmentRead])
def list_appointments(db: Session = Depends(get_db)):
    return db.query(Appointment).all()
