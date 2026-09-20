from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.rul import predict_rul


router = APIRouter(prefix="/api/ml", tags=["machine-learning"])


class RulRequest(BaseModel):
    asset_id: str = Field(default="conveyor-07", min_length=1)
    sensor_values: dict[str, Any]


@router.post("/predict-rul")
def predict_remaining_useful_life(request: RulRequest):
    try:
        prediction = predict_rul(request.sensor_values)
    except (ImportError, OSError, ValueError) as error:
        raise HTTPException(status_code=503, detail=f"RUL engine unavailable: {error}") from error
    return {"asset_id": request.asset_id, **prediction}
