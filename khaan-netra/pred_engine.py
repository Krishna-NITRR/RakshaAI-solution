"""Offline-friendly equipment health and remaining useful life predictor.

The CLI accepts one JSON object on stdin or through --input-json and returns one
JSON prediction. The scoring model is intentionally deterministic for edge demos;
an ML model can be added behind the same predict_rul contract later.
"""
import argparse
import json
import sys
from typing import Any


MODEL_VERSION = "stress-index-v1"
HORIZON_HOURS = 720.0


def _number(values: dict[str, Any], key: str, default: float = 0.0) -> float:
    try:
        return float(values.get(key, default))
    except (TypeError, ValueError):
        return default


def predict_rul(sensor_values: dict[str, Any]) -> dict[str, Any]:
    methane = _number(sensor_values, "methane_ch4")
    carbon_monoxide = _number(sensor_values, "co_ppm")
    temperature = _number(sensor_values, "bearing_temperature")
    vibration = _number(sensor_values, "vibration")
    dust = _number(sensor_values, "dust")

    factors = [
        ("Bearing temperature", max(0.0, (temperature - 55.0) / 45.0), 0.35, "bearing temperature"),
        ("Vibration", max(0.0, (vibration - 2.0) / 8.0), 0.25, "vibration"),
        ("Methane concentration", max(0.0, (methane - 0.45) / 1.55), 0.18, "methane"),
        ("Carbon monoxide", max(0.0, (carbon_monoxide - 10.0) / 70.0), 0.12, "CO concentration"),
        ("Dust loading", max(0.0, (dust - 2.0) / 6.0), 0.10, "dust"),
    ]
    contributions = []
    total_stress = 0.0
    for label, normalized, weight, metric in factors:
        stress = min(1.0, normalized) * weight
        total_stress += stress
        contributions.append({
            "factor": label,
            "metric": metric,
            "stress": round(stress, 4),
            "impact": "high" if stress >= weight * 0.65 else "moderate" if stress > 0 else "low",
        })

    health_index = round(max(0.0, min(100.0, (1.0 - total_stress) * 100.0)), 1)
    acceleration = 1.0 + total_stress * 2.5
    rul_hours = round(max(4.0, HORIZON_HOURS * (health_index / 100.0) / acceleration), 1)
    confidence = round(max(0.55, min(0.98, 0.94 - total_stress * 0.25)), 2)
    status = "critical" if health_index < 35 else "warning" if health_index < 70 else "healthy"

    return {
        "model_version": MODEL_VERSION,
        "health_index": health_index,
        "rul_hours": rul_hours,
        "confidence": confidence,
        "status": status,
        "stress_score": round(total_stress, 4),
        "contributions": sorted(contributions, key=lambda item: item["stress"], reverse=True),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Calculate equipment health and RUL from sensor JSON")
    parser.add_argument("--input-json", help="Sensor values as a JSON object")
    args = parser.parse_args()
    payload = json.loads(args.input_json) if args.input_json else json.load(sys.stdin)
    print(json.dumps(predict_rul(payload), separators=(",", ":")))


if __name__ == "__main__":
    main()
