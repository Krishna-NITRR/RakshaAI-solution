from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.cv_incidents import cv_incident_service
from services.telemetry import telemetry_simulator


router = APIRouter(prefix="/api/alerts", tags=["computer-vision"])


class CvIncidentRequest(BaseModel):
    worker_id: str = "unidentified-worker"
    mine_id: str = "demo-mine"
    asset_id: str = "conveyor-07"
    captured_at: str | None = None
    snapshot: str | None = None
    detections: list[dict[str, Any]] = Field(default_factory=list)
    source: str = "khaan-netra-bridge"


@router.get("/cv-incidents")
def list_cv_incidents():
    return {"items": cv_incident_service.list_incidents()}


@router.post("/cv-incident")
async def create_cv_incident(payload: CvIncidentRequest):
    try:
        incident, created, ticket = cv_incident_service.create_incident(payload.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    if created:
        await telemetry_simulator.publish_external({"type": "cv_incident", "incident": incident, "ticket": ticket})
    return {"incident": incident, "created": created, "ticket": ticket}
