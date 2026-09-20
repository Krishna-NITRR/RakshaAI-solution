from typing import Any

from services.graph_rca import PATHS, query_graph


ANSWERS = {
    "methane": ("Treat elevated methane as a critical ventilation-control event: withdraw people from the affected district, verify ventilation, and escalate to the responsible official before resuming work.", "METHANE_HIGH"),
    "bearing": ("The bearing signal indicates thermal stress. Isolate the conveyor before inspection, check lubrication and alignment, and keep the asset in verification until the maintenance ticket is closed.", "BEARING_OVERHEAT"),
    "worker": ("A restricted-zone presence requires an immediate stop-and-check response. Confirm isolation, account for the worker, and review the machine boundary before restarting.", "ZONE_INTRUSION"),
    "default": ("CoalGuard recommends reviewing the active hazard, isolating affected machinery where required, and recording evidence before returning equipment to service.", "BEARING_OVERHEAT"),
}


def answer_query(question: str) -> dict[str, Any]:
    normalized = question.lower()
    key = "default"
    for candidate in ("methane", "bearing", "worker"):
        if candidate in normalized:
            key = candidate
            break
    answer, anomaly = ANSWERS[key]
    path = query_graph(anomaly)
    return {
        "answer": answer,
        "citations": [{"regulation": PATHS[anomaly]["regulation"], "text": PATHS[anomaly]["citation"]}],
        "related_anomaly": anomaly,
        "rca": path,
        "provider": "CoalGuard offline statutory knowledge base",
    }
