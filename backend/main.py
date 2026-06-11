from fastapi import FastAPI
from database import Base, engine
from models import Client, Vehicle, Appointment, Intervention, InterventionLineService, InterventionLineProduct, Invoice, Payment
from routes import router

# Crée les tables si besoin
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Garage ERP API (test)")

app.include_router(router)
