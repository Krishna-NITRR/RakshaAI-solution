from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.sync import sync_service


router = APIRouter(prefix="/api/sync", tags=["offline-sync"])


class SyncBatch(BaseModel):
    items: list[dict[str, Any]] = Field(default_factory=list, max_length=100)


@router.post("/batch")
def sync_batch(payload: SyncBatch):
    return {"results": [sync_service.process(item) for item in payload.items]}
