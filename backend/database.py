"""
UrbanSense AI - Database Module
SQLite-backed storage with spatial math and realistic urban fleet seed data.
Ponytail senior-dev mode: stdlib sqlite3, zero ORM overhead, edge-case safe.
"""

import sqlite3
import json
import math
import os
from datetime import datetime, timezone

DB_PATH = os.environ.get("URBANSENSE_DB_PATH", os.path.join(os.path.dirname(__file__), "urbansense.db"))

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in meters between two coordinates."""
    r = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c

def init_db():
    conn = get_db()
    c = conn.cursor()

    # Buses table
    c.execute("""
    CREATE TABLE IF NOT EXISTS buses (
        bus_id TEXT PRIMARY KEY,
        route_id TEXT NOT NULL,
        status TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        camera_status TEXT NOT NULL,
        network_status TEXT NOT NULL,
        edge_status TEXT NOT NULL,
        inference_fps REAL NOT NULL,
        cpu_pct REAL NOT NULL,
        gpu_pct REAL NOT NULL,
        events_queued INTEGER NOT NULL DEFAULT 0,
        last_sync TEXT NOT NULL
    )
    """)

    # Road Segments table
    c.execute("""
    CREATE TABLE IF NOT EXISTS road_segments (
        road_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        geometry_coords TEXT NOT NULL,
        health_score INTEGER NOT NULL,
        traffic_score TEXT NOT NULL,
        vehicle_density_per_min INTEGER NOT NULL,
        defect_count INTEGER NOT NULL DEFAULT 0,
        potholes_count INTEGER NOT NULL DEFAULT 0,
        cracks_count INTEGER NOT NULL DEFAULT 0,
        waterlogging_count INTEGER NOT NULL DEFAULT 0,
        missing_signs_count INTEGER NOT NULL DEFAULT 0,
        maintenance_risk_pct INTEGER NOT NULL,
        maintenance_priority TEXT NOT NULL,
        risk_rationale TEXT NOT NULL,
        last_updated TEXT NOT NULL
    )
    """)

    # Clusters (Multi-bus fused persistent defects)
    c.execute("""
    CREATE TABLE IF NOT EXISTS clusters (
        cluster_id TEXT PRIMARY KEY,
        defect_type TEXT NOT NULL,
        road_id TEXT NOT NULL,
        road_name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        observation_count INTEGER NOT NULL DEFAULT 1,
        first_detected TEXT NOT NULL,
        last_detected TEXT NOT NULL,
        persistence_level TEXT NOT NULL,
        confirmed_buses TEXT NOT NULL,
        avg_confidence REAL NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        recommended_action TEXT NOT NULL
    )
    """)

    # Events table
    c.execute("""
    CREATE TABLE IF NOT EXISTS events (
        event_id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        bus_id TEXT NOT NULL,
        camera_id TEXT NOT NULL,
        route_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        confidence REAL NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        evidence_url TEXT NOT NULL,
        cluster_id TEXT,
        road_id TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Incidents table
    c.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        incident_id TEXT PRIMARY KEY,
        event_id TEXT,
        incident_type TEXT NOT NULL,
        bus_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        vehicle_plate TEXT,
        plate_confidence REAL,
        incident_confidence REAL NOT NULL,
        status TEXT NOT NULL,
        evidence_package TEXT NOT NULL
    )
    """)

    # Offline sync queue
    c.execute("""
    CREATE TABLE IF NOT EXISTS sync_queue (
        queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
        bus_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        queued_at TEXT NOT NULL,
        synced_at TEXT
    )
    """)

    # Feedback audit
    c.execute("""
    CREATE TABLE IF NOT EXISTS feedback_audit (
        audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL,
        user_action TEXT NOT NULL,
        department TEXT,
        notes TEXT,
        timestamp TEXT NOT NULL
    )
    """)

    # Bandwidth telemetry metrics
    c.execute("""
    CREATE TABLE IF NOT EXISTS bandwidth_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bus_id TEXT NOT NULL,
        raw_video_bytes INTEGER NOT NULL,
        event_data_bytes INTEGER NOT NULL,
        frames_processed INTEGER NOT NULL,
        events_extracted INTEGER NOT NULL,
        timestamp TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

def seed_database():
    conn = get_db()
    c = conn.cursor()

    # Check if already seeded
    c.execute("SELECT COUNT(*) FROM road_segments")
    if c.fetchone()[0] > 0:
        conn.close()
        return

    now = datetime.now(timezone.utc).isoformat()

    # 1. Road Segments (Realistic arterial corridors in Bengaluru)
    roads = [
        (
            "ROAD-MG",
            "MG Road (Trinity - Anil Kumble)",
            json.dumps([[12.9756, 77.6066], [12.9748, 77.6110], [12.9739, 77.6165]]),
            78,
            "HIGH",
            64,
            6,
            4,
            1,
            1,
            0,
            62,
            "P2 — Scheduled Repair (48h)",
            "Moderate defect escalation with high traffic wear. Multi-bus observation active near Trinity Junction.",
            now
        ),
        (
            "ROAD-ORR",
            "Outer Ring Road (Marathahalli - Bellandur)",
            json.dumps([[12.9552, 77.6980], [12.9450, 77.6930], [12.9352, 77.6846]]),
            52,
            "SEVERE",
            92,
            14,
            8,
            3,
            2,
            1,
            88,
            "P1 — Immediate Inspection",
            "Critical pothole cluster and recurrent waterlogging near tech corridor. High peak transit load.",
            now
        ),
        (
            "ROAD-OAR",
            "Old Airport Road (Domlur - HAL)",
            json.dumps([[12.9602, 77.6480], [12.9585, 77.6600], [12.9560, 77.6720]]),
            84,
            "MODERATE",
            48,
            3,
            2,
            1,
            0,
            0,
            28,
            "P3 — Routine Monitoring",
            "Low defect count, stable asphalt condition. No structural safety concerns flagged by fleet.",
            now
        ),
        (
            "ROAD-STR",
            "Station Road (Majestic Interchange)",
            json.dumps([[12.9774, 77.5729], [12.9760, 77.5755], [12.9745, 77.5780]]),
            47,
            "SEVERE",
            108,
            18,
            11,
            4,
            2,
            1,
            91,
            "P1 — Immediate Inspection",
            "Extensive surface deterioration and missing zebra markings at inter-modal bus terminus hub.",
            now
        ),
        (
            "ROAD-BRG",
            "Brigade Road (Commercial District)",
            json.dumps([[12.9734, 77.6075], [12.9710, 77.6078], [12.9680, 77.6085]]),
            69,
            "HIGH",
            72,
            5,
            3,
            1,
            0,
            1,
            64,
            "P2 — Scheduled Repair (48h)",
            "Damaged pedestrian curb divider and road surface cracking in dense retail zone.",
            now
        ),
        (
            "ROAD-HSR",
            "Hosur Road (Silk Board - Electronic City)",
            json.dumps([[12.9170, 77.6230], [12.8950, 77.6420], [12.8750, 77.6610]]),
            60,
            "HIGH",
            85,
            9,
            6,
            2,
            1,
            0,
            75,
            "P1 — Immediate Inspection",
            "Elevated defect density on expressway approach ramp with heavy freight traffic stress.",
            now
        )
    ]

    c.executemany("""
    INSERT INTO road_segments (
        road_id, name, geometry_coords, health_score, traffic_score,
        vehicle_density_per_min, defect_count, potholes_count, cracks_count,
        waterlogging_count, missing_signs_count, maintenance_risk_pct,
        maintenance_priority, risk_rationale, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, roads)

    # 2. Fleet Buses
    buses = [
        ("BUS-104", "27A", "ACTIVE", 12.9752, 77.6070, "OK", "ONLINE", "RUNNING", 29.2, 41.5, 62.0, 0, now),
        ("BUS-108", "27A", "ACTIVE", 12.9740, 77.6150, "OK", "ONLINE", "RUNNING", 28.7, 39.8, 59.4, 0, now),
        ("BUS-102", "14B", "ACTIVE", 12.9450, 77.6930, "OK", "ONLINE", "RUNNING", 30.1, 45.0, 68.2, 0, now),
        ("BUS-114", "08C", "WARNING", 12.9760, 77.5755, "OK", "OFFLINE", "RUNNING", 26.5, 52.1, 74.0, 4, now),
        ("BUS-121", "41A", "ACTIVE", 12.9602, 77.6480, "OK", "ONLINE", "RUNNING", 29.8, 38.2, 57.0, 0, now),
        ("BUS-135", "33E", "ACTIVE", 12.9710, 77.6078, "OK", "ONLINE", "RUNNING", 28.9, 43.1, 65.5, 0, now)
    ]

    c.executemany("""
    INSERT INTO buses (
        bus_id, route_id, status, latitude, longitude,
        camera_status, network_status, edge_status,
        inference_fps, cpu_pct, gpu_pct, events_queued, last_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, buses)

    # 3. Seed Existing Persistent Clusters
    clusters = [
        (
            "CLU-STR-01",
            "POTHOLE",
            "ROAD-STR",
            "Station Road (Majestic Interchange)",
            12.9765,
            77.5740,
            12,
            "2026-09-02T08:15:00Z",
            now,
            "HIGH",
            json.dumps(["BUS-114", "BUS-102", "BUS-108"]),
            0.96,
            "CRITICAL",
            "ACTIVE",
            "P1 — Immediate inspection and asphalt cold-patch repair"
        ),
        (
            "CLU-ORR-01",
            "WATERLOGGING",
            "ROAD-ORR",
            "Outer Ring Road (Marathahalli - Bellandur)",
            12.9480,
            77.6910,
            8,
            "2026-09-03T11:30:00Z",
            now,
            "HIGH",
            json.dumps(["BUS-102", "BUS-121"]),
            0.93,
            "HIGH",
            "ACTIVE",
            "P1 — Storm drain clearance recommended to prevent lane blockage"
        ),
        (
            "CLU-BRG-01",
            "DAMAGED_DIVIDER",
            "ROAD-BRG",
            "Brigade Road (Commercial District)",
            12.9720,
            77.6076,
            5,
            "2026-09-04T14:20:00Z",
            now,
            "MEDIUM",
            json.dumps(["BUS-135", "BUS-104"]),
            0.89,
            "MEDIUM",
            "ACTIVE",
            "P2 — Reset modular concrete curb barrier"
        )
    ]

    c.executemany("""
    INSERT INTO clusters (
        cluster_id, defect_type, road_id, road_name,
        latitude, longitude, observation_count, first_detected,
        last_detected, persistence_level, confirmed_buses,
        avg_confidence, severity, status, recommended_action
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, clusters)

    # 4. Seed Critical Incidents
    incidents = [
        (
            "INC-29182",
            "EVT-INIT-01",
            "POSSIBLE_HIT_AND_RUN",
            "BUS-104",
            now,
            12.9716,
            77.5946,
            "KA-01-AB-1234",
            0.94,
            0.91,
            "UNDER_REVIEW",
            json.dumps({
                "pre_seconds": 8,
                "post_seconds": 8,
                "offending_vehicle_type": "SUV (White)",
                "trajectory": "Rapid lane switch cutting across two-wheeler path followed by abrupt acceleration",
                "evidence_frames": ["frame_pre.jpg", "frame_incident.jpg", "frame_plate_crop.jpg", "frame_post.jpg"],
                "plate_crop_url": "/api/evidence/plate-29182.jpg"
            })
        ),
        (
            "INC-10387",
            "EVT-INIT-02",
            "CRITICAL_WATERLOGGING",
            "BUS-102",
            now,
            12.9480,
            77.6910,
            None,
            None,
            0.95,
            "UNDER_REVIEW",
            json.dumps({
                "depth_estimate_cm": 25,
                "affected_lanes": 2,
                "congestion_impact": "SEVERE",
                "evidence_frames": ["frame_waterlog_01.jpg", "frame_waterlog_02.jpg"]
            })
        )
    ]

    c.executemany("""
    INSERT INTO incidents (
        incident_id, event_id, incident_type, bus_id,
        timestamp, latitude, longitude, vehicle_plate,
        plate_confidence, incident_confidence, status, evidence_package
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, incidents)

    # 5. Baseline Bandwidth Telemetry
    c.execute("""
    INSERT INTO bandwidth_telemetry (
        bus_id, raw_video_bytes, event_data_bytes, frames_processed, events_extracted, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?)
    """, (
        "BUS-104",
        45200000,  # ~45.2 MB raw 1080p stream
        680000,    # ~680 KB compact event metadata + JPEG thumbnails
        3600,
        14,
        now
    ))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    seed_database()
    print(f"UrbanSense AI database initialized at: {DB_PATH}")
