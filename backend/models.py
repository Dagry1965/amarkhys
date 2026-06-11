from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(String, nullable=False, default="staff")  # admin / staff / client


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)

    vehicles = relationship("Vehicle", back_populates="client", cascade="all, delete-orphan")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    marque = Column(String, nullable=False)
    modele = Column(String, nullable=False)
    immatriculation = Column(String, unique=True, index=True, nullable=False)

    client = relationship("Client", back_populates="vehicles")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String, nullable=False, default="scheduled")

    vehicle = relationship("Vehicle")


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    status = Column(String, nullable=False, default="open")
    notes = Column(String, nullable=True)

    appointment = relationship("Appointment")
    service_lines = relationship("InterventionLineService", back_populates="intervention", cascade="all, delete-orphan")
    product_lines = relationship("InterventionLineProduct", back_populates="intervention", cascade="all, delete-orphan")


class InterventionLineService(Base):
    __tablename__ = "intervention_service_lines"

    id = Column(Integer, primary_key=True, index=True)
    intervention_id = Column(Integer, ForeignKey("interventions.id"), nullable=False)
    description = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False, default=0.0)

    intervention = relationship("Intervention", back_populates="service_lines")


class InterventionLineProduct(Base):
    __tablename__ = "intervention_product_lines"

    id = Column(Integer, primary_key=True, index=True)
    intervention_id = Column(Integer, ForeignKey("interventions.id"), nullable=False)
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False, default=0.0)

    intervention = relationship("Intervention", back_populates="product_lines")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    intervention_id = Column(Integer, ForeignKey("interventions.id"), nullable=False)
    total_cents = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="unpaid")

    intervention = relationship("Intervention")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    amount_cents = Column(Integer, nullable=False, default=0)
    method = Column(String, nullable=False, default="cash")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="payments")
