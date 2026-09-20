from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.database import get_db
from models import User, CorrectiveAction, AuditLog, Observation, Inspection
from schemas.governance import ActionCreate, ActionUpdate, ActionResponse, AuditEventResponse
from auth import get_current_user, verify_role
from services.audit import log_action

router = APIRouter(prefix="/corrective-actions", tags=["actions"])


@router.get("/{action_id}/timeline")
def get_action_timeline(action_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    return db.query(AuditLog).filter(AuditLog.entity_type == "CorrectiveAction", AuditLog.entity_id == action_id).order_by(AuditLog.created_at.asc()).all()

@router.post("/{action_id}/verify")
def verify_action(
    action_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_role(["Mine Manager"]))
):
    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    if action.owner_id == current_user.id:
        raise HTTPException(status_code=403, detail="Cannot self-verify corrective actions")
        
    if action.status != "VERIFICATION":
        raise HTTPException(status_code=400, detail="Action is not in VERIFICATION state")
        
    before_state = {"status": action.status}
    action.status = "CLOSED"
    after_state = {"status": action.status}
    
    log_action(db, "CorrectiveAction", action.id, current_user.id, "VERIFY_AND_CLOSE", before_state, after_state)
    db.commit()
    
    return {"message": "Action verified and closed"}

@router.patch("/{action_id}", response_model=ActionResponse)
def update_action(
    action_id: str,
    payload: ActionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    if action.owner_id != current_user.id and current_user.role_id != "r-manager":
        raise HTTPException(status_code=403, detail="Not authorized to update this action")
        
    before_state = {"status": action.status}
    action.status = payload.status
    after_state = {"status": action.status}
    
    log_action(db, "CorrectiveAction", action.id, current_user.id, f"UPDATE_STATUS_TO_{payload.status}", before_state, after_state)
    db.commit()
    db.refresh(action)
    return action
