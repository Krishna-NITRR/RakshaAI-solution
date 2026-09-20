from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.database import get_db
from models import User, Inspection, Observation
from schemas.governance import InspectionCreate, InspectionResponse
from auth import get_current_user, verify_role
import uuid

router = APIRouter(prefix="/inspections", tags=["inspections"])

@router.post("", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
def create_inspection(
    payload: InspectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_role(["Inspector"]))
):
    # Idempotency check
    existing = db.query(Inspection).filter(Inspection.temp_uuid == payload.temp_uuid).first()
    if existing:
        return existing
        
    if payload.severity in {"High", "Critical"} and not payload.photo_url:
        raise HTTPException(status_code=422, detail="Photo required for high or critical severity")
        
    if not payload.gps_lat or not payload.gps_lon:
        raise HTTPException(status_code=422, detail="GPS coordinates required")

    insp_id = str(uuid.uuid4())
    obs_id = str(uuid.uuid4())
    
    mine_id = current_user.mine_id if current_user.role_id != "r-corporate" else payload.mine_id
    if not mine_id or (current_user.role_id != "r-corporate" and payload.mine_id != mine_id):
        raise HTTPException(status_code=403, detail="Inspection mine scope does not match current user")

    new_insp = Inspection(
        id=insp_id,
        temp_uuid=payload.temp_uuid,
        mine_id=mine_id,
        inspector_id=current_user.id,
        gps_lat=payload.gps_lat,
        gps_lon=payload.gps_lon
    )
    
    new_obs = Observation(
        id=obs_id,
        inspection_id=insp_id,
        severity=payload.severity,
        description=payload.description,
        photo_url=payload.photo_url
    )
    
    db.add(new_insp)
    db.add(new_obs)
    db.commit()
    db.refresh(new_insp)
    return new_insp
