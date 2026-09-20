from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.tickets import TICKET_STATUSES, ticket_service


router = APIRouter(prefix="/api/tickets", tags=["tickets"])


class TicketCreate(BaseModel):
    title: str = Field(min_length=3)
    description: str = Field(min_length=3)
    source: str = Field(min_length=2)
    severity: str = "high"


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    assignee: Optional[str] = None
    note: Optional[str] = None


@router.get("")
def list_tickets():
    return {"items": ticket_service.list_tickets(), "statuses": TICKET_STATUSES}


@router.post("")
def create_ticket(payload: TicketCreate):
    ticket, created = ticket_service.create_ticket(payload.title, payload.description, payload.source, payload.severity)
    return {"ticket": ticket, "created": created}


@router.patch("/{ticket_id}")
def update_ticket(ticket_id: str, payload: TicketUpdate):
    try:
        ticket = ticket_service.update_ticket(ticket_id, payload.status, payload.assignee, payload.note)
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Ticket not found") from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return ticket