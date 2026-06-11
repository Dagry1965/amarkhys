from datetime import datetime, timedelta
from typing import Dict, List, Optional
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Client, Vehicle, Appointment, Intervention, InterventionLineService, InterventionLineProduct, Invoice, Payment
from schemas import UserCreate, UserRead, Token, ClientCreate, ClientRead, VehicleCreate, VehicleRead, AppointmentCreate, AppointmentRead, InterventionCreate, InterventionRead, InvoiceCreate, InvoiceRead, PaymentCreate, PaymentRead

JWT_SECRET = "change_me_to_secure_value"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def get_password_hash(password: str): return pwd_context.hash(password)
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def create_access_token(subject: str):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": subject, "exp": expire}, JWT_SECRET, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id).first()
    except: raise HTTPException(status_code=401, detail="Invalid token")

# --- AUTH ---
@router.post("/auth/register", response_model=UserRead)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(email=payload.email.lower(), password_hash=get_password_hash(payload.password), full_name=payload.full_name, role=payload.role)
    db.add(user); db.commit(); db.refresh(user); return user

@router.post("/auth/login", response_model=Token)
def login(payload: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_access_token(str(user.id)), "token_type": "bearer"}

@router.get("/users/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)): return current_user

# --- CLIENTS & VEHICLES ---
@router.post("/clients", response_model=ClientRead)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    db_c = Client(name=client.name, email=client.email, phone=client.phone)
    db.add(db_c); db.commit(); db.refresh(db_c); return db_c

@router.get("/clients", response_model=List[ClientRead])
def list_clients(db: Session = Depends(get_db)): return db.query(Client).all()

@router.post("/vehicles", response_model=VehicleRead)
def create_vehicle(v: VehicleCreate, db: Session = Depends(get_db)):
    db_v = Vehicle(client_id=v.client_id, marque=v.marque, modele=v.modele, immatriculation=v.immatriculation)
    db.add(db_v); db.commit(); db.refresh(db_v); return db_v

@router.get("/vehicles", response_model=List[VehicleRead])
def list_vehicles(db: Session = Depends(get_db)): return db.query(Vehicle).all()

# --- APPOINTMENTS ---
@router.post("/appointments", response_model=AppointmentRead)
def create_appointment(a: AppointmentCreate, db: Session = Depends(get_db)):
    db_a = Appointment(vehicle_id=a.vehicle_id, start_time=a.start_time, end_time=a.end_time, status=a.status)
    db.add(db_a); db.commit(); db.refresh(db_a); return db_a

@router.get("/appointments", response_model=List[AppointmentRead])
def list_appointments(db: Session = Depends(get_db)): return db.query(Appointment).all()

# --- INTERVENTIONS ---
@router.post("/interventions", response_model=InterventionRead)
def create_itv(data: InterventionCreate, db: Session = Depends(get_db)):
    itv = Intervention(appointment_id=data.appointment_id, notes=data.notes, status=data.status)
    db.add(itv); db.flush()
    for l in data.service_lines:
        db.add(InterventionLineService(intervention_id=itv.id, description=l.description, quantity=l.quantity, unit_price=l.unit_price))
    db.commit(); db.refresh(itv); return itv

@router.get("/interventions", response_model=List[InterventionRead])
def list_itv(db: Session = Depends(get_db)): return db.query(Intervention).all()

# --- INVOICES ---
@router.post("/invoices", response_model=InvoiceRead)
def create_inv(data: InvoiceCreate, db: Session = Depends(get_db)):
    itv = db.query(Intervention).filter(Intervention.id == data.intervention_id).first()
    total = sum(l.quantity * l.unit_price for l in itv.service_lines)
    inv = Invoice(intervention_id=data.intervention_id, total_cents=total, status="unpaid")
    db.add(inv); db.commit(); db.refresh(inv); return inv

@router.get("/invoices", response_model=List[InvoiceRead])
def list_inv(db: Session = Depends(get_db)): return db.query(Invoice).all()

@router.post("/payments", response_model=PaymentRead)
def pay(data: PaymentCreate, db: Session = Depends(get_db)):
    p = Payment(invoice_id=data.invoice_id, amount_cents=data.amount_cents, method=data.method)
    db.add(p); inv = db.query(Invoice).filter(Invoice.id == data.invoice_id).first()
    inv.status = "paid"; db.commit(); db.refresh(p); return p
