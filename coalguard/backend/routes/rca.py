from fastapi import APIRouter

from services.graph_rca import query_graph


router = APIRouter(prefix="/api/rca", tags=["root-cause-analysis"])


@router.get("/graph")
def get_graph(anomaly: str | None = None):
    return query_graph(anomaly)
