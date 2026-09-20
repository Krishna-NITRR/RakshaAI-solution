from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.ai_assistant import answer_query


router = APIRouter(prefix="/api/ai", tags=["safety-assistant"])


class AssistantRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)


@router.post("/query")
def query_assistant(payload: AssistantRequest):
    return answer_query(payload.question)
