"""
Unit test suite for UrbanSense AI Backend Engines
Verifies Multi-Bus Evidence Fusion, Road Health Calculation, and Offline Queueing.
"""

import unittest
import os
import json

# Point tests to a dedicated test database
os.environ["URBANSENSE_DB_PATH"] = "/Users/aryantengale/.gemini/antigravity-ide/scratch/urbansense-ai/backend/test_urbansense.db"

from database import init_db, seed_database, get_db, haversine_distance_meters
from fusion_engine import fuse_event_observation
from road_health_engine import recalculate_road_health
from edge_simulator import EdgeDeviceSimulator
import scenario_runner

class TestUrbanSenseEngines(unittest.TestCase):
    def setUp(self):
        init_db()
        seed_database()

    def tearDown(self):
        db_path = os.environ["URBANSENSE_DB_PATH"]
        if os.path.exists(db_path):
            os.remove(db_path)

    def test_haversine_distance(self):
        # Trinity Circle to Anil Kumble (~500m)
        dist = haversine_distance_meters(12.9756, 77.6066, 12.9748, 77.6110)
        self.assertTrue(400.0 < dist < 600.0)

    def test_multi_bus_evidence_fusion(self):
        # 1. First bus observes pothole
        res1 = fuse_event_observation(
            event_id="TEST-EVT-1",
            event_type="POTHOLE",
            bus_id="BUS-104",
            latitude=12.9750,
            longitude=77.6080,
            confidence=0.94,
            severity="HIGH",
            road_id="ROAD-MG",
            timestamp="2026-09-05T18:00:00Z"
        )
        self.assertFalse(res1["fused"])
        self.assertEqual(res1["observation_count"], 1)

        # 2. Second bus observes SAME spot within 10 meters
        res2 = fuse_event_observation(
            event_id="TEST-EVT-2",
            event_type="POTHOLE",
            bus_id="BUS-108",
            latitude=12.97505,
            longitude=77.60804,
            confidence=0.96,
            severity="HIGH",
            road_id="ROAD-MG",
            timestamp="2026-09-05T18:15:00Z"
        )
        self.assertTrue(res2["fused"])
        self.assertTrue(res2["is_new_corroboration"])
        self.assertEqual(res2["observation_count"], 2)
        self.assertIn("BUS-104", res2["confirmed_buses"])
        self.assertIn("BUS-108", res2["confirmed_buses"])
        self.assertGreaterEqual(res2["confidence"], 0.96)

    def test_road_health_calculation(self):
        # Recalculate MG Road health
        res = recalculate_road_health("ROAD-MG")
        self.assertIn("health_score", res)
        self.assertTrue(0 <= res["health_score"] <= 100)
        self.assertIn("maintenance_risk_pct", res)
        self.assertIn("maintenance_priority", res)

    def test_offline_edge_queue_and_sync(self):
        sim = EdgeDeviceSimulator("BUS-TEST")
        queue_res = sim.queue_offline_event({
            "event_type": "ROAD_CRACK",
            "bus_id": "BUS-TEST",
            "confidence": 0.89
        })
        self.assertEqual(queue_res["status"], "QUEUED_OFFLINE")
        self.assertGreaterEqual(queue_res["events_queued"], 1)

        sync_res = sim.sync_queued_events()
        self.assertEqual(sync_res["status"], "SYNCHRONIZED")
        self.assertGreaterEqual(sync_res["synced_count"], 1)

if __name__ == "__main__":
    unittest.main()
