from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

# ========== Auth (users) ==========

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: str = "staff"


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    role: str

    class Config:
        from_attributes = True  # pour Pydantic v2 (équiv. orm_mode=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ========== Clients / Vehicles ==========

class ClientBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientRead(ClientBase):
    id: int

    class Config:
        from_attributes = True


class VehicleBase(BaseModel):
    marque: str
    modele: str
    immatriculation: str


class VehicleCreate(VehicleBase):
    client_id: int


class VehicleRead(VehicleBase):
    id: int
    client_id: int

    class Config:
        from_attributes = True


# ========== Appointments ==========

class AppointmentBase(BaseModel):
    vehicle_id: int
    start_time: datetime
    end_time: datetime
    status: str = "scheduled"


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentRead(AppointmentBase):
    id: int

    class Config:
        from_attributes = True


# ========== Interventions ==========

class InterventionServiceLineBase(BaseModel):
    description: str
    quantity: int = 1
    unit_price: int = 0


class InterventionServiceLineCreate(InterventionServiceLineBase):
    pass


class InterventionServiceLineRead(InterventionServiceLineBase):
    id: int

    class Config:
        from_attributes = True


class InterventionProductLineBase(BaseModel):
    product_name: str
    quantity: int = 1
    unit_price: int = 0


class InterventionProductLineCreate(InterventionProductLineBase):
    pass


class InterventionProductLineRead(InterventionProductLineBase):
    id: int

    class Config:
        from_attributes = True


class InterventionBase(BaseModel):
    appointment_id: int
    status: str = "open"
    notes: Optional[str] = None


class InterventionCreate(InterventionBase):
    service_lines: List[InterventionServiceLineCreate] = []
    product_lines: List[InterventionProductLineCreate] = []


class InterventionRead(InterventionBase):
    id: int
    service_lines: List[InterventionServiceLineRead] = []
    product_lines: List[InterventionProductLineRead] = []

    class Config:
        from_attributes = True


# ========== Invoices & Payments ==========

class InvoiceBase(BaseModel):
    intervention_id: int


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceRead(InvoiceBase):
    id: int
    total_cents: int
    status: str

    class Config:
        from_attributes = True


class PaymentBase(BaseModel):
    invoice_id: int
    amount_cents: int
    method: str = "cash"


class PaymentCreate(PaymentBase):
    pass


class PaymentRead(PaymentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
