from typing import Any

from services.telemetry import telemetry_simulator


PATHS: dict[str, dict[str, Any]] = {
    "BEARING_OVERHEAT": {
        "label": "Bearing overheat",
        "component": "Drive-end bearing",
        "consequence": "Conveyor jam",
        "regulation": "CMR 2017 Regulation 160",
        "citation": "Reg. 160: machinery and transport equipment must be maintained and operated to prevent danger.",
    },
    "METHANE_HIGH": {
        "label": "Methane concentration high",
        "component": "Ventilation district",
        "consequence": "Ignition risk",
        "regulation": "CMR 2017 Regulation 153",
        "citation": "Reg. 153: statutory limits and precautions apply to inflammable gas in mine workings.",
    },
    "VIBRATION_HIGH": {
        "label": "Abnormal vibration",
        "component": "Conveyor drive train",
        "consequence": "Mechanical failure",
        "regulation": "CMR 2017 Regulation 160",
        "citation": "Reg. 160: machinery must be maintained in safe working condition.",
    },
    "ZONE_INTRUSION": {
        "label": "Restricted-zone intrusion",
        "component": "Equipment isolation boundary",
        "consequence": "Worker struck-by exposure",
        "regulation": "CMR 2017 Regulation 105",
        "citation": "Reg. 105: precautions are required to protect persons working near moving machinery.",
    },
}


def query_graph(anomaly: str | None = None) -> dict[str, Any]:
    hazards = [hazard for asset in telemetry_simulator.snapshot()["assets"] for hazard in asset["hazards"]]
    selected = anomaly or (hazards[0]["code"] if hazards else "BEARING_OVERHEAT")
    path = PATHS.get(selected, PATHS["BEARING_OVERHEAT"])
    nodes = [
        {"id": "anomaly", "label": path["label"], "kind": "sensor anomaly"},
        {"id": "component", "label": path["component"], "kind": "component"},
        {"id": "consequence", "label": path["consequence"], "kind": "consequence"},
        {"id": "regulation", "label": path["regulation"], "kind": "regulation"},
    ]
    edges = [
        {"from": "anomaly", "to": "component", "label": "indicates"},
        {"from": "component", "to": "consequence", "label": "can cause"},
        {"from": "consequence", "to": "regulation", "label": "requires control under"},
    ]
    return {"anomaly": selected, "nodes": nodes, "edges": edges, "citation": path["citation"], "evidence": hazards}
