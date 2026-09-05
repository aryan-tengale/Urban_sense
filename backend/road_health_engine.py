"""
UrbanSense AI - Road Health & Predictive Maintenance Engine (Modules F, G & M)
Computes dynamic Road Health Scores (0-100), Predictive Failure Risk (%),
and plain-language maintenance recommendations.
"""

from datetime import datetime, timezone
from database import get_db

def recalculate_road_health(road_id: str) -> dict:
    """
    Recalculates the health score, predictive failure risk, and maintenance priority
    for a given road segment based on current active defect clusters and traffic stress.
    """
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT * FROM road_segments WHERE road_id = ?", (road_id,))
    road = c.fetchone()
    if not road:
        conn.close()
        return {}

    # Fetch active clusters on this road
    c.execute("""
    SELECT defect_type, persistence_level, confirmed_buses, severity, observation_count
    FROM clusters
    WHERE road_id = ? AND status != 'REPAIRED'
    """, (road_id,))
    clusters = c.fetchall()

    potholes = sum(1 for cl in clusters if cl["defect_type"] == "POTHOLE")
    cracks = sum(1 for cl in clusters if cl["defect_type"] == "ROAD_CRACK")
    waterlog = sum(1 for cl in clusters if cl["defect_type"] == "WATERLOGGING")
    missing_signs = sum(1 for cl in clusters if cl["defect_type"] in ("MISSING_SIGN", "DAMAGED_DIVIDER"))
    total_defects = len(clusters)

    # 1. Defect Severity Penalty
    defect_penalty = 0.0
    for cl in clusters:
        sev = cl["severity"]
        dtype = cl["defect_type"]
        weight = 3.5 if dtype == "POTHOLE" else (5.0 if dtype == "WATERLOGGING" else 2.0)
        if sev == "CRITICAL":
            defect_penalty += weight * 1.8
        elif sev == "HIGH":
            defect_penalty += weight * 1.4
        elif sev == "MEDIUM":
            defect_penalty += weight * 1.0
        else:
            defect_penalty += weight * 0.7

    # 2. Persistence Penalty (corroborated defects damage health more)
    persistence_penalty = 0.0
    multi_bus_corroborated_count = 0
    for cl in clusters:
        if cl["persistence_level"] == "HIGH":
            persistence_penalty += 4.5
        elif cl["persistence_level"] == "MEDIUM":
            persistence_penalty += 2.0

        if cl["confirmed_buses"] and len(cl["confirmed_buses"]) > 15:  # JSON list > 1 bus
            multi_bus_corroborated_count += 1
            persistence_penalty += 2.5

    # 3. Traffic Stress Penalty
    traffic_score = road["traffic_score"]
    traffic_penalty_map = {
        "LOW": 0.0,
        "MODERATE": 4.0,
        "HIGH": 8.5,
        "SEVERE": 14.0
    }
    traffic_penalty = traffic_penalty_map.get(traffic_score, 5.0)

    # Calculate overall Health Score (100 is pristine)
    total_deduction = defect_penalty + persistence_penalty + traffic_penalty
    health_score = max(15, min(100, int(round(100.0 - total_deduction))))

    # 4. Predictive Failure Risk % (Probability that road requires emergency intervention)
    base_risk = (100 - health_score) * 0.95
    acceleration = (multi_bus_corroborated_count * 5.0) + (potholes * 3.0) + (waterlog * 4.0)
    if traffic_score in ("HIGH", "SEVERE"):
        acceleration += 6.0

    risk_pct = max(10, min(98, int(round(base_risk + acceleration * 0.35))))

    # 5. Maintenance Priority
    if risk_pct >= 75 or health_score <= 55:
        priority = "P1 — Immediate Inspection"
    elif risk_pct >= 50 or health_score <= 75:
        priority = "P2 — Scheduled Repair (48h)"
    else:
        priority = "P3 — Routine Monitoring"

    # 6. Natural Language Rationale
    reasons = []
    if potholes > 0:
        reasons.append(f"{potholes} active pothole cluster(s)")
    if waterlog > 0:
        reasons.append(f"{waterlog} recurrent waterlogging hotspot(s)")
    if multi_bus_corroborated_count > 0:
        reasons.append(f"multi-bus persistence confirmed across fleet")
    if traffic_score in ("HIGH", "SEVERE"):
        reasons.append("sustained heavy transit wear")

    if reasons:
        risk_rationale = f"Elevated risk: {', '.join(reasons)}. Proactive intervention recommended before roadbed degradation."
    else:
        risk_rationale = "Nominal road health: Regular transit corridor inspection active."

    now = datetime.now(timezone.utc).isoformat()

    c.execute("""
    UPDATE road_segments
    SET health_score = ?,
        defect_count = ?,
        potholes_count = ?,
        cracks_count = ?,
        waterlogging_count = ?,
        missing_signs_count = ?,
        maintenance_risk_pct = ?,
        maintenance_priority = ?,
        risk_rationale = ?,
        last_updated = ?
    WHERE road_id = ?
    """, (
        health_score,
        total_defects,
        potholes,
        cracks,
        waterlog,
        missing_signs,
        risk_pct,
        priority,
        risk_rationale,
        now,
        road_id
    ))

    conn.commit()
    conn.close()

    return {
        "road_id": road_id,
        "name": road["name"],
        "health_score": health_score,
        "traffic_score": traffic_score,
        "defect_count": total_defects,
        "potholes_count": potholes,
        "cracks_count": cracks,
        "waterlogging_count": waterlog,
        "maintenance_risk_pct": risk_pct,
        "maintenance_priority": priority,
        "risk_rationale": risk_rationale
    }
