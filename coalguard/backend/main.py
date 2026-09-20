from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from models.database import Base, engine, SessionLocal
import models  # noqa: F401 - register all SQLAlchemy models before create_all
from routes import auth, inspections, actions, compliance, dashboard, admin, telemetry, ml, tickets, cv_incidents, dgms, rca, ai, digital_twin, sync
from services.telemetry import telemetry_simulator


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    from services.tickets import ticket_service
    from services.cv_incidents import cv_incident_service
    from services.sync import sync_service
    telemetry_simulator.load_persisted(SessionLocal)
    ticket_service.load_persisted(SessionLocal)
    cv_incident_service.load_persisted(SessionLocal)
    sync_service.load_persisted(SessionLocal)
    await telemetry_simulator.start()
    yield
    await telemetry_simulator.stop()

app = FastAPI(title="CoalGuard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(inspections.router)
app.include_router(actions.router)
app.include_router(compliance.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(telemetry.router)
app.include_router(ml.router)
app.include_router(tickets.router)
app.include_router(cv_incidents.router)
app.include_router(dgms.router)
app.include_router(rca.router)
app.include_router(ai.router)
app.include_router(digital_twin.router)
app.include_router(sync.router)


@app.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket):
    await telemetry.telemetry_socket(websocket)

@app.get("/health")
def health_check():
    return {"status": "ok"}
