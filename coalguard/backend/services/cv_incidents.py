from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from services.tickets import ticket_service


INCIDENT_TYPE_ALIASES = {
    "no-hardhat": "NO_HELMET",
    "no-helmet": "NO_HELMET",
    "missing_helmet": "NO_HELMET",
    "no-safety-vest": "NO_VEST",
    "no-vest": "NO_VEST",
    "missing_vest": "NO_VEST",
    "missing_safety_vest": "NO_VEST",
    "no-mask": "NO_MASK",
    "missing_mask": "NO_MASK",
    "illegal-riding": "ILLEGAL_RIDING",
    "equipment-zone-crossing": "EQUIPMENT_ZONE_CROSSING",
    "crossing-equipment": "EQUIPMENT_ZONE_CROSSING",
    "equipment_zone_crossing": "EQUIPMENT_ZONE_CROSSING",
}


def normalize_detections(raw_detections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized = []
    for detection in raw_detections:
        if not isinstance(detection, dict):
            raise ValueError("Each CV detection must be an object")
        raw_type = detection.get("incident_type", detection.get("item", detection.get("class")))
        if not raw_type or not str(raw_type).strip():
            raise ValueError("Each CV detection requires incident_type, item, or class")
        label = str(raw_type).strip().lower()
        incident_type = INCIDENT_TYPE_ALIASES.get(label, str(raw_type).strip().upper().replace("-", "_"))
        try:
            confidence = float(detection.get("confidence", detection.get("score", 0)))
        except (TypeError, ValueError) as error:
            raise ValueError("CV confidence must be numeric") from error
        if confidence > 1:
            confidence /= 100
        normalized.append({
            "incident_type": incident_type,
            "label": str(detection.get("label", raw_type)),
            "confidence": round(max(0.0, min(1.0, confidence)), 4),
            "bbox": detection.get("bbox", detection.get("box")),
        })
    return normalized


class CvIncidentService:
    def __init__(self) -> None:
        self._incidents: dict[str, dict[str, Any]] = {}

    def load_persisted(self, session_factory) -> None:
        from models import CvIncidentRecord
        db = session_factory()
        try:
            for row in db.query(CvIncidentRecord).all():
                self._incidents[row.id] = {"id": row.id, "mine_id": row.mine_id, "fingerprint": row.fingerprint, "worker_id": row.worker_id, "asset_id": row.asset_id, "captured_at": row.captured_at.isoformat(), "received_at": row.received_at.isoformat(), "source": row.source, "snapshot": row.snapshot, "detections": row.detections or [], "status": row.status}
        finally:
            db.close()

    def list_incidents(self) -> list[dict[str, Any]]:
        return sorted(self._incidents.values(), key=lambda item: item["captured_at"], reverse=True)

    def create_incident(self, payload: dict[str, Any]) -> tuple[dict[str, Any], bool, dict[str, Any] | None]:
        detections = normalize_detections(payload.get("detections", []))
        fingerprint = f"{payload.get('worker_id')}:{payload.get('asset_id')}:{detections[0].get('incident_type') if detections else 'UNKNOWN'}"
        for incident in self._incidents.values():
            if incident["fingerprint"] == fingerprint and incident["status"] == "OPEN":
                return incident, False, None

        now = datetime.now(timezone.utc).isoformat()
        incident = {
            "id": f"CVI-{uuid4().hex[:8].upper()}",
            "fingerprint": fingerprint,
            "worker_id": payload.get("worker_id", "unidentified-worker"),
            "mine_id": payload.get("mine_id", "demo-mine"),
            "asset_id": payload.get("asset_id", "conveyor-07"),
            "captured_at": payload.get("captured_at", now),
            "received_at": now,
            "source": payload.get("source", "khaan-netra-bridge"),
            "snapshot": payload.get("snapshot"),
            "detections": detections,
            "status": "OPEN",
        }
        self._incidents[incident["id"]] = incident
        self._persist(incident)
        labels = ", ".join(item["incident_type"] for item in detections) or "UNCLASSIFIED CV EVENT"
        ticket, _ = ticket_service.create_ticket(
            title=f"Computer vision incident: {labels}",
            description=f"Worker {incident['worker_id']} requires safety review near {incident['asset_id']}.",
            source=f"cv:{incident['id']}",
            severity="critical",
        )
        return incident, True, ticket

    @staticmethod
    def _persist(incident: dict[str, Any]) -> None:
        from models import CvIncidentRecord
        from models.database import SessionLocal
        db = SessionLocal()
        try:
            row = db.query(CvIncidentRecord).filter(CvIncidentRecord.id == incident["id"]).first() or CvIncidentRecord(id=incident["id"])
            row.mine_id = incident.get("mine_id")
            row.fingerprint = incident["fingerprint"]
            row.worker_id = incident["worker_id"]
            row.asset_id = incident["asset_id"]
            row.source = incident["source"]
            row.snapshot = incident.get("snapshot")
            row.detections = incident["detections"]
            row.status = incident["status"]
            db.add(row)
            db.commit()
        finally:
            db.close()


cv_incident_service = CvIncidentService()
