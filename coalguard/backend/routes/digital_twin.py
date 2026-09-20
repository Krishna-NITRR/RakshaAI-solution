from fastapi import APIRouter

from services.digital_twin import twin_state


router = APIRouter(prefix="/api/digital-twin", tags=["digital-twin"])


@router.get("/state")
def get_twin_state():
    return twin_state()
