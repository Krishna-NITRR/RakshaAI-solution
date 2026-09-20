from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from services.telemetry import FAULT_TYPES, telemetry_simulator


router = APIRouter(prefix="/telemetry", tags=["telemetry"])


class FaultRequest(BaseModel):
    enabled: bool = True


@router.get("/snapshot")
async def get_snapshot():
    await telemetry_simulator.start()
    return telemetry_simulator.snapshot()


@router.get("/history")
async def get_history(limit: int = 30):
    await telemetry_simulator.start()
    return {"items": telemetry_simulator.recent_history(limit)}


@router.get("/faults")
async def get_faults():
    return telemetry_simulator.fault_state()


@router.post("/faults/{fault_type}")
async def set_fault(fault_type: str, request: FaultRequest):
    if fault_type not in FAULT_TYPES:
        raise HTTPException(status_code=404, detail=f"Unknown fault type: {fault_type}")
    return await telemetry_simulator.set_fault(fault_type, request.enabled)


async def telemetry_socket(websocket: WebSocket) -> None:
    await websocket.accept()
    await telemetry_simulator.start()
    queue = await telemetry_simulator.subscribe()
    try:
        await websocket.send_json({"type": "telemetry", **telemetry_simulator.snapshot()})
        while True:
            event = await queue.get()
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        await telemetry_simulator.unsubscribe(queue)