import asyncio
import random
from collections import deque
from datetime import datetime, timezone
from typing import Any

from services.tickets import ticket_service


FAULT_TYPES = {
    "bearing-thermal-surge",
    "methane-leak",
    "worker-zone-intrusion",
}


class TelemetrySimulator:
    """Small deterministic-in-shape telemetry source for demo and edge testing."""

    def __init__(self) -> None:
        self.assets: dict[str, dict[str, Any]] = {
            "conveyor-07": {
                "asset_id": "conveyor-07",
                "name": "Main Conveyor 07",
                "zone": "Gallery B / East",
                "values": {
                    "methane_ch4": 0.42,
                    "co_ppm": 8.0,
                    "bearing_temperature": 54.0,
                    "vibration": 2.2,
                    "dust": 1.8,
                },
            },
            "shearer-02": {
                "asset_id": "shearer-02",
                "name": "Longwall Shearer 02",
                "zone": "Longwall 3",
                "values": {
                    "methane_ch4": 0.58,
                    "co_ppm": 11.0,
                    "bearing_temperature": 61.0,
                    "vibration": 2.8,
                    "dust": 2.3,
                },
            },
        }
        self.faults: set[str] = set()
        self.history: deque[dict[str, Any]] = deque(maxlen=120)
        self.subscribers: set[asyncio.Queue[dict[str, Any]]] = set()
        self._task: asyncio.Task[None] | None = None
        self._lock = asyncio.Lock()

    def load_persisted(self, session_factory) -> None:
        from models import TelemetryEvent
        db = session_factory()
        try:
            rows = db.query(TelemetryEvent).order_by(TelemetryEvent.generated_at.desc()).limit(120).all()
            self.history.extend({"type": "telemetry", "generated_at": row.generated_at.isoformat(), "assets": [row.payload], "faults": self.fault_state()} for row in reversed(rows))
        finally:
            db.close()

    async def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run(), name="telemetry-simulator")

    async def stop(self) -> None:
        if self._task is None:
            return
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        self._task = None

    async def subscribe(self) -> asyncio.Queue[dict[str, Any]]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=8)
        async with self._lock:
            self.subscribers.add(queue)
        return queue

    async def unsubscribe(self, queue: asyncio.Queue[dict[str, Any]]) -> None:
        async with self._lock:
            self.subscribers.discard(queue)

    async def set_fault(self, fault_type: str, enabled: bool) -> dict[str, Any]:
        if fault_type not in FAULT_TYPES:
            raise ValueError(f"Unsupported fault type: {fault_type}")
        if enabled:
            self.faults.add(fault_type)
            ticket, created = ticket_service.create_ticket(
                title=self._fault_title(fault_type),
                description=self._fault_description(fault_type),
                source=f"telemetry:{fault_type}",
                severity="critical" if fault_type != "bearing-thermal-surge" else "high",
            )
        else:
            self.faults.discard(fault_type)
        state = self.fault_state()
        await self._publish({"type": "fault_state", "faults": state})
        if enabled and created:
            await self._publish({"type": "ticket_created", "ticket": ticket})
        return state

    def fault_state(self) -> dict[str, bool]:
        return {fault_type: fault_type in self.faults for fault_type in sorted(FAULT_TYPES)}

    def snapshot(self) -> dict[str, Any]:
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "faults": self.fault_state(),
            "assets": [self._asset_payload(asset) for asset in self.assets.values()],
        }

    def recent_history(self, limit: int = 30) -> list[dict[str, Any]]:
        return list(self.history)[-max(1, min(limit, 120)):]

    async def _run(self) -> None:
        while True:
            await asyncio.sleep(2)
            await self.tick()

    async def tick(self) -> None:
        event = {
            "type": "telemetry",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "faults": self.fault_state(),
            "assets": [],
        }
        for asset in self.assets.values():
            values = asset["values"]
            values["methane_ch4"] = self._bounded(values["methane_ch4"] + random.gauss(0, 0.025), 0.1, 2.5)
            values["co_ppm"] = self._bounded(values["co_ppm"] + random.gauss(0, 0.8), 1, 80)
            values["bearing_temperature"] = self._bounded(values["bearing_temperature"] + random.gauss(0, 1.1), 35, 110)
            values["vibration"] = self._bounded(values["vibration"] + random.gauss(0, 0.12), 0.4, 12)
            values["dust"] = self._bounded(values["dust"] + random.gauss(0, 0.08), 0.4, 8)

            if "methane-leak" in self.faults:
                values["methane_ch4"] = min(2.5, values["methane_ch4"] + 0.8)
            if "bearing-thermal-surge" in self.faults:
                values["bearing_temperature"] = min(110, values["bearing_temperature"] + 24)
                values["vibration"] = min(12, values["vibration"] + 1.5)

            payload = self._asset_payload(asset)
            event["assets"].append(payload)

        self.history.append(event)
        self._persist_event(event)
        await self._publish(event)

    @staticmethod
    def _persist_event(event: dict[str, Any]) -> None:
        from models import TelemetryEvent
        from models.database import SessionLocal
        db = SessionLocal()
        try:
            for asset in event["assets"]:
                db.add(TelemetryEvent(asset_id=asset["asset_id"], generated_at=datetime.fromisoformat(event["generated_at"]), payload=asset))
            db.commit()
        finally:
            db.close()

    def _asset_payload(self, asset: dict[str, Any]) -> dict[str, Any]:
        values = {key: round(value, 2) for key, value in asset["values"].items()}
        hazards = []
        if values["methane_ch4"] >= 1.0:
            hazards.append({"code": "METHANE_HIGH", "severity": "critical", "message": "Methane concentration exceeds safe threshold."})
        if values["bearing_temperature"] >= 82:
            hazards.append({"code": "BEARING_OVERHEAT", "severity": "high", "message": "Bearing temperature indicates thermal stress."})
        if values["vibration"] >= 5:
            hazards.append({"code": "VIBRATION_HIGH", "severity": "high", "message": "Vibration exceeds maintenance threshold."})
        if "worker-zone-intrusion" in self.faults:
            hazards.append({"code": "ZONE_INTRUSION", "severity": "critical", "message": "Worker detected inside restricted equipment zone."})
        status = "red" if any(hazard["severity"] == "critical" for hazard in hazards) else "yellow" if hazards else "green"
        return {
            "asset_id": asset["asset_id"],
            "name": asset["name"],
            "zone": asset["zone"],
            "values": values,
            "hazards": hazards,
            "status": status,
        }

    async def _publish(self, event: dict[str, Any]) -> None:
        async with self._lock:
            subscribers = tuple(self.subscribers)
        for queue in subscribers:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                try:
                    queue.get_nowait()
                    queue.put_nowait(event)
                except asyncio.QueueEmpty:
                    pass

    async def publish_external(self, event: dict[str, Any]) -> None:
        await self._publish(event)

    @staticmethod
    def _bounded(value: float, lower: float, upper: float) -> float:
        return max(lower, min(upper, value))

    @staticmethod
    def _fault_title(fault_type: str) -> str:
        return {
            "bearing-thermal-surge": "Bearing thermal surge requires inspection",
            "methane-leak": "Methane leak response required",
            "worker-zone-intrusion": "Restricted worker-zone intrusion",
        }[fault_type]

    @staticmethod
    def _fault_description(fault_type: str) -> str:
        return {
            "bearing-thermal-surge": "Bearing temperature and vibration crossed the maintenance threshold.",
            "methane-leak": "Methane concentration crossed the simulated statutory alarm threshold.",
            "worker-zone-intrusion": "A worker presence was detected in a restricted equipment zone.",
        }[fault_type]


telemetry_simulator = TelemetrySimulator()