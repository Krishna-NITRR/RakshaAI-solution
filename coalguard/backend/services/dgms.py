import hashlib
import json
from datetime import datetime, timezone
from typing import Any

from services.cv_incidents import cv_incident_service
from services.telemetry import telemetry_simulator
from services.tickets import ticket_service


def _incident_rows() -> list[dict[str, Any]]:
    return cv_incident_service.list_incidents()


def build_report(form: str = "form-iv-a") -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    snapshot = telemetry_simulator.snapshot()
    incidents = _incident_rows()
    tickets = ticket_service.list_tickets()
    hazards = [hazard for asset in snapshot["assets"] for hazard in asset["hazards"]]
    warnings = []
    if not incidents and not hazards:
        warnings.append("No incident evidence is currently available; this report is a clean-state demo preview.")
    if any(not incident.get("worker_id") or incident.get("worker_id") == "unidentified-worker" for incident in incidents):
        warnings.append("One or more incidents do not have a verified worker ID.")

    if form == "form-b":
        title = "DGMS Form B - Monthly Safety Return"
        fields = {
            "Reporting period": datetime.now(timezone.utc).strftime("%B %Y"),
            "Mine": "RakshaAI Demonstration Mine",
            "Telemetry observations": len(telemetry_simulator.recent_history(120)),
            "Open safety incidents": len(incidents) + len(hazards),
            "Corrective tickets": len(tickets),
            "Active faults": ", ".join(key for key, value in snapshot["faults"].items() if value) or "None",
        }
    else:
        title = "DGMS Form IV-A - Notice of Accident / Occurrence"
        latest = incidents[0] if incidents else None
        fields = {
            "Occurrence time": (latest or {}).get("captured_at", now),
            "Mine / gallery": (latest or {}).get("mine_id", "RakshaAI Demonstration Mine"),
            "Worker ID": (latest or {}).get("worker_id", "Not captured"),
            "Equipment / asset": (latest or {}).get("asset_id", snapshot["assets"][0]["asset_id"]),
            "Incident classification": ", ".join(item["incident_type"] for item in (latest or {}).get("detections", [])) or ", ".join(item["code"] for item in hazards) or "No active occurrence",
            "Evidence source": (latest or {}).get("source", "CoalGuard telemetry simulator"),
        }

    canonical = {"form": form, "title": title, "generated_at": now, "fields": fields, "warnings": warnings}
    signature = hashlib.sha256(json.dumps(canonical, sort_keys=True).encode("utf-8")).hexdigest()
    return {**canonical, "signature": signature, "evidence": {"incident_count": len(incidents), "ticket_count": len(tickets), "hazard_count": len(hazards)}}


def pdf_bytes(report: dict[str, Any]) -> bytes:
    lines = [report["title"], "RakshaAI CoalGuard statutory report", f"Generated: {report['generated_at']}", f"Report signature: {report['signature']}", ""]
    lines.extend(f"{key}: {value}" for key, value in report["fields"].items())
    lines.append("")
    lines.extend(f"Warning: {warning}" for warning in report["warnings"])
    text = "\n".join(lines).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    stream = f"BT /F1 10 Tf 48 760 Td 13 TL ({text.replace(chr(10), ') Tj T* (')}) Tj ET"
    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        f"<< /Length {len(stream.encode('utf-8'))} >>\nstream\n{stream}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    output = "%PDF-1.4\n"
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output.encode("utf-8")))
        output += f"{index} 0 obj\n{obj}\nendobj\n"
    xref = len(output.encode("utf-8"))
    output += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    output += "".join(f"{offset:010d} 00000 n \n" for offset in offsets[1:])
    output += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF"
    return output.encode("utf-8")
