from typing import Any

from services.telemetry import telemetry_simulator


ZONES = [
    {"id": "gallery-b", "label": "Gallery B", "x": 12, "y": 22, "width": 74, "height": 25, "risk": "green"},
    {"id": "longwall-3", "label": "Longwall 3", "x": 12, "y": 63, "width": 74, "height": 22, "risk": "green"},
]

WORKERS = [
    {"id": "W-104", "name": "A. Kumar", "zone": "gallery-b", "x": 31, "y": 34, "status": "on-shift"},
    {"id": "W-205", "name": "S. Das", "zone": "longwall-3", "x": 67, "y": 74, "status": "on-shift"},
]


def twin_state() -> dict[str, Any]:
    assets = telemetry_simulator.snapshot()["assets"]
    asset_nodes = []
    for index, asset in enumerate(assets):
        asset_nodes.append({
            "id": asset["asset_id"],
            "label": asset["name"],
            "zone": "gallery-b" if index == 0 else "longwall-3",
            "x": 54 if index == 0 else 40,
            "y": 34 if index == 0 else 74,
            "status": asset["status"],
            "hazards": asset["hazards"],
            "values": asset["values"],
        })
    for zone in ZONES:
        zone_assets = [node for node in asset_nodes if node["zone"] == zone["id"]]
        if any(node["status"] == "red" for node in zone_assets):
            zone["risk"] = "red"
        elif any(node["status"] == "yellow" for node in zone_assets):
            zone["risk"] = "yellow"
        else:
            zone["risk"] = "green"
    return {"zones": ZONES, "assets": asset_nodes, "workers": WORKERS, "faults": telemetry_simulator.fault_state()}
