from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from services.cv_incidents import cv_incident_service


class SyncService:
    def __init__(self) -> None:
        self._accepted: dict[str, dict[str, Any]] = {}

    def load_persisted(self, session_factory) -> None:
        from models import SyncReceipt
        db = session_factory()
        try:
            for row in db.query(SyncReceipt).all():
                self._accepted[row.temp_uuid] = row.result or {}
        finally:
            db.close()

    def process(self, item: dict[str, Any]) -> dict[str, Any]:
        temp_uuid = str(item.get("temp_uuid", "")).strip()
        if not temp_uuid:
            return {"ok": False, "error": "temp_uuid is required"}
        if temp_uuid in self._accepted:
            return {"ok": True, "duplicate": True, **self._accepted[temp_uuid]}

        from models import SyncReceipt
        from models.database import SessionLocal
        db = SessionLocal()
        try:
            persisted = db.query(SyncReceipt).filter(SyncReceipt.temp_uuid == temp_uuid).first()
            if persisted:
                result = persisted.result or {}
                self._accepted[temp_uuid] = result
                return {"ok": True, "duplicate": True, **result}
        finally:
            db.close()

        item_type = item.get("type", "inspection")
        if item_type == "cv_incident":
            incident, created, ticket = cv_incident_service.create_incident(item)
            result = {"server_id": incident["id"], "entity": "cv_incident", "created": created, "ticket_id": ticket["id"] if ticket else None}
        else:
            result = {"server_id": f"INS-{uuid4().hex[:8].upper()}", "entity": "inspection", "created": True}
        result["synced_at"] = datetime.now(timezone.utc).isoformat()
        self._accepted[temp_uuid] = result
        db = SessionLocal()
        try:
            db.add(SyncReceipt(temp_uuid=temp_uuid, entity=result["entity"], server_id=result["server_id"], result=result))
            db.commit()
        finally:
            db.close()
        return {"ok": True, "duplicate": False, **result}


sync_service = SyncService()
