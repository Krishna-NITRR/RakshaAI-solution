import asyncio
import unittest

from models.database import Base, engine
from services.cv_incidents import CvIncidentService, normalize_detections
from services.dgms import build_report, pdf_bytes
from services.graph_rca import query_graph
from services.rul import predict_rul
from services.sync import SyncService
from services.tickets import TicketService
from services.telemetry import TelemetrySimulator


class PlatformSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def test_rul_degrades_under_stress(self):
        healthy = predict_rul({"methane_ch4": 0.3, "co_ppm": 5, "bearing_temperature": 50, "vibration": 1.5, "dust": 1})
        stressed = predict_rul({"methane_ch4": 1.5, "co_ppm": 35, "bearing_temperature": 95, "vibration": 7, "dust": 5})
        self.assertLess(stressed["health_index"], healthy["health_index"])
        self.assertGreater(stressed["rul_hours"], 0)

    def test_ticket_deduplication_and_transition(self):
        service = TicketService()
        first, created = service.create_ticket("Smoke hazard", "Test", "smoke:test")
        duplicate, duplicate_created = service.create_ticket("Smoke hazard", "Test", "smoke:test")
        self.assertTrue(created)
        self.assertFalse(duplicate_created)
        self.assertEqual(first["id"], duplicate["id"])
        self.assertEqual(service.update_ticket(first["id"], "IN_PROGRESS")["status"], "IN_PROGRESS")

    def test_cv_sync_idempotency(self):
        service = SyncService()
        first = service.process({"temp_uuid": "test-sync-1", "type": "inspection"})
        duplicate = service.process({"temp_uuid": "test-sync-1", "type": "inspection"})
        self.assertTrue(first["ok"])
        self.assertTrue(duplicate["duplicate"])
        self.assertEqual(first["server_id"], duplicate["server_id"])

    def test_cv_detection_normalization(self):
        normalized = normalize_detections([{"incident_type": "missing_helmet", "confidence": 95}])
        self.assertEqual(normalized[0]["incident_type"], "NO_HELMET")
        self.assertEqual(normalized[0]["confidence"], 0.95)
        with self.assertRaisesRegex(ValueError, "requires incident_type"):
            normalize_detections([{"confidence": 0.8}])

    def test_dgms_and_rca_outputs(self):
        report = build_report("form-iv-a")
        self.assertTrue(pdf_bytes(report).startswith(b"%PDF-1.4"))
        graph = query_graph("BEARING_OVERHEAT")
        self.assertEqual(len(graph["nodes"]), 4)
        self.assertIn("Reg. 160", graph["citation"])

    def test_telemetry_fault_creates_hazard(self):
        simulator = TelemetrySimulator()
        asyncio.run(simulator.set_fault("methane-leak", True))
        asyncio.run(simulator.tick())
        hazards = [hazard for asset in simulator.snapshot()["assets"] for hazard in asset["hazards"]]
        self.assertTrue(any(hazard["code"] == "METHANE_HIGH" for hazard in hazards))


if __name__ == "__main__":
    unittest.main()
