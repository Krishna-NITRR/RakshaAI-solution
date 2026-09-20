"""Send Khaan Netra detections to the CoalGuard incident API.

Usage:
  python detect_bridge.py --input-json '{"detections":[...]}'
  python detect_bridge.py --input-file detections.json --api-url http://localhost:8000
"""
import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any


INCIDENT_CLASSES = {
    "no-hardhat": "NO_HELMET",
    "no-helmet": "NO_HELMET",
    "no-safety-vest": "NO_VEST",
    "illegal-riding": "ILLEGAL_RIDING",
    "equipment-zone-crossing": "EQUIPMENT_ZONE_CROSSING",
    "crossing-equipment": "EQUIPMENT_ZONE_CROSSING",
    "missing_helmet": "NO_HELMET",
    "missing_vest": "NO_VEST",
    "missing_safety_vest": "NO_VEST",
    "missing_mask": "NO_MASK",
}


def normalize_detection(detection: dict[str, Any]) -> dict[str, Any] | None:
    label = str(detection.get("item", detection.get("class", ""))).strip().lower()
    incident_type = INCIDENT_CLASSES.get(label)
    if not incident_type:
        return None
    confidence = float(detection.get("confidence", detection.get("score", 0)))
    if confidence > 1:
        confidence /= 100
    return {
        "incident_type": incident_type,
        "label": label,
        "confidence": round(max(0, min(1, confidence)), 4),
        "bbox": detection.get("bbox", detection.get("box")),
    }


def build_payload(data: dict[str, Any]) -> dict[str, Any]:
    detections = [item for item in (normalize_detection(raw) for raw in data.get("detections", [])) if item]
    return {
        "worker_id": data.get("worker_id", "unidentified-worker"),
        "mine_id": data.get("mine_id", "demo-mine"),
        "asset_id": data.get("asset_id", "conveyor-07"),
        "captured_at": data.get("captured_at", datetime.now(timezone.utc).isoformat()),
        "snapshot": data.get("snapshot"),
        "detections": detections,
        "source": data.get("source", "khaan-netra-bridge"),
    }


def send(payload: dict[str, Any], api_url: str) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{api_url.rstrip('/')}/api/alerts/cv-incident",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Bridge Khaan Netra detections to CoalGuard")
    parser.add_argument("--api-url", default="http://localhost:8000")
    parser.add_argument("--input-json")
    parser.add_argument("--input-file")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if args.input_file:
        with open(args.input_file, encoding="utf-8") as source:
            data = json.load(source)
    elif args.input_json:
        data = json.loads(args.input_json)
    else:
        data = json.load(sys.stdin)
    payload = build_payload(data)
    if args.dry_run:
        print(json.dumps(payload, indent=2))
        return
    try:
        print(json.dumps(send(payload, args.api_url)))
    except (OSError, urllib.error.URLError) as error:
        print(json.dumps({"queued": True, "error": str(error), "payload": payload}))


if __name__ == "__main__":
    main()
