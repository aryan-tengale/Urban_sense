"""
UrbanSense AI - Multi-Bus Evidence Fusion Engine (Module E)
Clusters spatial observations across the fleet, calculates cross-bus corroboration,
eliminates redundant alerts, and identifies persistent physical road defects.
"""

import json
from datetime import datetime, timezone
from database import get_db, haversine_distance_meters

PROXIMITY_THRESHOLD_METERS = 25.0

def fuse_event_observation(
    event_id: str,
    event_type: str,
    bus_id: str,
    latitude: float,
    longitude: float,
    confidence: float,
    severity: str,
    road_id: str,
    timestamp: str
) -> dict:
    """
    Fuses an incoming event into a spatial cluster.
    If an existing defect cluster is within 25m, merges the observation,
    boosts confidence if corroborated by multiple distinct buses,
    and updates persistence status.
    """
    conn = get_db()
    c = conn.cursor()

    # Find road details
    c.execute("SELECT name FROM road_segments WHERE road_id = ?", (road_id,))
    road_row = c.fetchone()
    road_name = road_row["name"] if road_row else "Urban Arterial Corridor"

    # Search existing active clusters for this defect type on this road
    c.execute("""
    SELECT cluster_id, defect_type, road_id, road_name, latitude, longitude,
           observation_count, first_detected, last_detected, persistence_level,
           confirmed_buses, avg_confidence, severity, status, recommended_action
    FROM clusters
    WHERE defect_type = ?
    """, (event_type,))
    candidate_clusters = c.fetchall()

    matched_cluster = None
    min_dist = float("inf")

    for clu in candidate_clusters:
        dist = haversine_distance_meters(latitude, longitude, clu["latitude"], clu["longitude"])
        if dist <= PROXIMITY_THRESHOLD_METERS and dist < min_dist:
            min_dist = dist
            matched_cluster = clu

    is_new_corroboration = False

    if matched_cluster:
        # Merge into existing cluster
        cluster_id = matched_cluster["cluster_id"]
        obs_count = matched_cluster["observation_count"] + 1
        buses = json.loads(matched_cluster["confirmed_buses"])
        
        if bus_id not in buses:
            buses.append(bus_id)
            is_new_corroboration = True

        # Calculate corroborated confidence
        prev_conf = matched_cluster["avg_confidence"]
        new_avg_conf = round(((prev_conf * (obs_count - 1)) + confidence) / obs_count, 3)

        # Multi-bus corroboration bonus (spec: multiple independent buses boost confidence)
        if len(buses) >= 2:
            new_avg_conf = min(0.99, max(new_avg_conf, 0.96))

        # Persistence level
        if len(buses) >= 2 and obs_count >= 3:
            persistence = "HIGH"
            status = "CONFIRMED_PERSISTENT"
        elif len(buses) >= 2 or obs_count >= 3:
            persistence = "MEDIUM"
            status = "CORROBORATED"
        else:
            persistence = "LOW"
            status = "ACTIVE"

        # Severity escalation if verified by multiple buses
        cluster_sev = matched_cluster["severity"]
        if persistence == "HIGH" and cluster_sev != "CRITICAL":
            cluster_sev = "HIGH"

        rec_action = (
            "P1 — Immediate inspection and asphalt hot-mix repair"
            if cluster_sev in ("HIGH", "CRITICAL")
            else "P2 — Scheduled maintenance within 48h"
        )

        c.execute("""
        UPDATE clusters
        SET observation_count = ?,
            last_detected = ?,
            persistence_level = ?,
            confirmed_buses = ?,
            avg_confidence = ?,
            severity = ?,
            status = ?,
            recommended_action = ?
        WHERE cluster_id = ?
        """, (
            obs_count,
            timestamp,
            persistence,
            json.dumps(buses),
            new_avg_conf,
            cluster_sev,
            status,
            rec_action,
            cluster_id
        ))

        # Link event to cluster
        c.execute("""
        UPDATE events
        SET cluster_id = ?, status = ?
        WHERE event_id = ?
        """, (cluster_id, "FUSED", event_id))

        conn.commit()
        conn.close()

        return {
            "cluster_id": cluster_id,
            "fused": True,
            "is_new_corroboration": is_new_corroboration,
            "observation_count": obs_count,
            "confirmed_buses": buses,
            "persistence_level": persistence,
            "confidence": new_avg_conf,
            "status": status,
            "distance_meters": round(min_dist, 1)
        }

    else:
        # Create a fresh cluster
        prefix = road_id.replace("ROAD-", "")
        cluster_id = f"CLU-{prefix}-{int(datetime.now().timestamp() % 100000)}"
        buses = [bus_id]
        persistence = "LOW"
        status = "ACTIVE"
        rec_action = "P3 — Routine Monitoring" if severity in ("LOW", "MEDIUM") else "P2 — Scheduled Repair"

        c.execute("""
        INSERT INTO clusters (
            cluster_id, defect_type, road_id, road_name,
            latitude, longitude, observation_count, first_detected,
            last_detected, persistence_level, confirmed_buses,
            avg_confidence, severity, status, recommended_action
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cluster_id,
            event_type,
            road_id,
            road_name,
            latitude,
            longitude,
            1,
            timestamp,
            timestamp,
            persistence,
            json.dumps(buses),
            confidence,
            severity,
            status,
            rec_action
        ))

        # Link event
        c.execute("""
        UPDATE events
        SET cluster_id = ?, status = ?
        WHERE event_id = ?
        """, (cluster_id, "CLUSTERED", event_id))

        conn.commit()
        conn.close()

        return {
            "cluster_id": cluster_id,
            "fused": False,
            "is_new_corroboration": False,
            "observation_count": 1,
            "confirmed_buses": buses,
            "persistence_level": persistence,
            "confidence": confidence,
            "status": status,
            "distance_meters": 0.0
        }
