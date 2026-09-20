from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.database import get_db
from models import User, Mine, RiskScore, ComplianceRequirement, CorrectiveAction, Observation, Inspection
from datetime import datetime
from auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(mine_id: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    scope = mine_id if current_user.role_id == "r-corporate" else current_user.mine_id
    requirements = db.query(ComplianceRequirement).filter(ComplianceRequirement.mine_id == scope).all() if scope else db.query(ComplianceRequirement).all()
    observations = db.query(Observation).join(Inspection, Observation.inspection_id == Inspection.id)
    actions = db.query(CorrectiveAction).join(Observation, CorrectiveAction.observation_id == Observation.id).join(Inspection, Observation.inspection_id == Inspection.id)
    if scope:
        observations = observations.filter(Inspection.mine_id == scope)
        actions = actions.filter(Inspection.mine_id == scope)
    observations = observations.all()
    actions = actions.all()
    open_violations = sum(1 for item in observations if item.severity in {"High", "Critical"})
    overdue = sum(1 for item in actions if item.status != "CLOSED" and item.due_date and item.due_date < datetime.utcnow())
    compliant = sum(1 for item in requirements if item.status == "compliant")
    return {"compliance_rate": round((compliant / len(requirements)) * 100, 1) if requirements else 100, "open_violations": open_violations, "overdue_actions": overdue}


@router.get("/risk/mines")
def get_mine_risks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(RiskScore, Mine).join(Mine, RiskScore.mine_id == Mine.id)
    if current_user.role_id != "r-corporate":
        query = query.filter(RiskScore.mine_id == current_user.mine_id)
    return [{"mine_id": score.mine_id, "mine_name": mine.name, "score": score.score, "reasons": score.reasons_json or []} for score, mine in query.order_by(RiskScore.score.desc()).all()]

@router.get("/corporate")
def get_corporate_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mines = db.query(Mine).all()
    total_mines = len(mines)
    
    overdue_actions = db.query(CorrectiveAction).filter(
        CorrectiveAction.status != "CLOSED",
    ).count() # Simplified for hackathon, normally check due_date
    
    risk_scores = db.query(RiskScore).order_by(RiskScore.score.desc()).all()
    
    return {
        "total_mines": total_mines,
        "overdue_actions": overdue_actions,
        "critical_mines": len([rs for rs in risk_scores if rs.score > 75]),
        "mine_risks": [{"mine_id": rs.mine_id, "score": rs.score, "reasons": rs.reasons_json} for rs in risk_scores]
    }
