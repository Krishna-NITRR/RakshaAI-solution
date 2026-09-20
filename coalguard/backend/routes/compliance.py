from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.database import get_db
from models import User, ComplianceRequirement
from schemas.governance import ComplianceResponse
from auth import get_current_user

router = APIRouter(prefix="/compliance", tags=["compliance"])

@router.get("", response_model=list[ComplianceResponse])
def get_compliance_records(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(ComplianceRequirement)
    if current_user.role_id != "r-corporate":
        query = query.filter(ComplianceRequirement.mine_id == current_user.mine_id)
    records = query.all()
    return records
