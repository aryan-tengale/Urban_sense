"""
UrbanSense AI - Vision AI / Edge AI Footage Analyzer
Processes uploaded raw dashcam video footage through a simulated Vision AI pipeline:
  1. Frame extraction at configurable FPS intervals
  2. Object detection (vehicles, pedestrians, infrastructure)
  3. Road defect classification (potholes, cracks, waterlogging, missing signage)
  4. Severity assessment with confidence scores
  5. Temporal timeline construction of detected events
  6. Road health impact analysis with maintenance recommendations

In production, this would integrate with:
  - Google Cloud Vision AI / Vertex AI AutoML
  - YOLO-v8 or custom edge model inference
  - TensorFlow Lite for on-device processing
"""

import os
import json
import time
import random
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional

# Supported video formats
SUPPORTED_FORMATS = {'.mp4', '.avi', '.mov', '.mkv', '.webm', '.m4v', '.flv', '.wmv', '.3gp'}

# Detection class definitions matching UrbanSense taxonomy
DEFECT_CLASSES = [
    {"class_id": "pothole",         "label": "Pothole",              "category": "ROAD_DEFECT",   "severity_weight": 0.85},
    {"class_id": "crack",           "label": "Road Crack / Fatigue", "category": "ROAD_DEFECT",   "severity_weight": 0.55},
    {"class_id": "waterlogging",    "label": "Waterlogging",         "category": "ROAD_DEFECT",   "severity_weight": 0.90},
    {"class_id": "missing_sign",    "label": "Missing / Damaged Sign","category": "INFRASTRUCTURE","severity_weight": 0.50},
    {"class_id": "damaged_barrier", "label": "Damaged Road Barrier", "category": "INFRASTRUCTURE","severity_weight": 0.65},
    {"class_id": "debris",          "label": "Road Debris / Obstruction","category": "HAZARD",    "severity_weight": 0.70},
]

VEHICLE_CLASSES = [
    {"class_id": "car",        "label": "Car",             "category": "VEHICLE"},
    {"class_id": "bus",        "label": "Bus",             "category": "VEHICLE"},
    {"class_id": "truck",      "label": "Truck / HGV",     "category": "VEHICLE"},
    {"class_id": "bike",       "label": "Two-Wheeler",     "category": "VEHICLE"},
    {"class_id": "auto",       "label": "Auto-Rickshaw",   "category": "VEHICLE"},
    {"class_id": "pedestrian", "label": "Pedestrian",      "category": "VULNERABLE_USER"},
    {"class_id": "cyclist",    "label": "Cyclist",         "category": "VULNERABLE_USER"},
    {"class_id": "plate",      "label": "License Plate",   "category": "ANPR"},
]

# Bengaluru road segment reference for geo-tagging
BENGALURU_ROADS = [
    {"road_id": "ROAD-MG",    "name": "MG Road",            "lat": 12.9754, "lng": 77.6082},
    {"road_id": "ROAD-ORR",   "name": "Outer Ring Road",    "lat": 12.9250, "lng": 77.6830},
    {"road_id": "ROAD-OAR",   "name": "Old Airport Road",   "lat": 12.9620, "lng": 77.6470},
    {"road_id": "ROAD-HSR",   "name": "Hosur Road",         "lat": 12.9350, "lng": 77.6130},
    {"road_id": "ROAD-BRG",   "name": "Brigade Road",       "lat": 12.9720, "lng": 77.6070},
]


class FootageAnalysisResult:
    """Structured result container for a complete footage analysis."""

    def __init__(self, analysis_id: str, filename: str, file_size_bytes: int):
        self.analysis_id = analysis_id
        self.filename = filename
        self.file_size_bytes = file_size_bytes
        self.status = "PROCESSING"
        self.started_at = datetime.now(timezone.utc).isoformat()
        self.completed_at: Optional[str] = None

        # Analysis metadata
        self.video_duration_sec = 0.0
        self.total_frames_analyzed = 0
        self.analysis_fps = 2  # Sample rate: 2 frames per second

        # Detection results
        self.detections: list = []
        self.defect_summary: dict = {}
        self.vehicle_summary: dict = {}
        self.timeline: list = []
        self.severity_distribution: dict = {}

        # Road health impact
        self.road_health_impact: dict = {}
        self.maintenance_recommendations: list = []

        # Assigned road
        self.matched_road: dict = {}

    def to_dict(self) -> dict:
        return {
            "analysis_id": self.analysis_id,
            "filename": self.filename,
            "file_size_mb": round(self.file_size_bytes / (1024 * 1024), 2),
            "status": self.status,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "video_duration_sec": self.video_duration_sec,
            "total_frames_analyzed": self.total_frames_analyzed,
            "analysis_fps": self.analysis_fps,
            "pipeline_stages": self._get_pipeline_stages(),
            "matched_road": self.matched_road,
            "detections": self.detections,
            "defect_summary": self.defect_summary,
            "vehicle_summary": self.vehicle_summary,
            "timeline": self.timeline,
            "severity_distribution": self.severity_distribution,
            "road_health_impact": self.road_health_impact,
            "maintenance_recommendations": self.maintenance_recommendations,
        }

    def _get_pipeline_stages(self) -> list:
        stages = [
            {"stage": "VIDEO_INGESTION",     "label": "Video Ingestion & Validation",  "status": "COMPLETED", "duration_ms": 120},
            {"stage": "FRAME_EXTRACTION",     "label": "Frame Extraction @ 2 FPS",      "status": "COMPLETED", "duration_ms": 850},
            {"stage": "OBJECT_DETECTION",     "label": "YOLO-v8n Object Detection",     "status": "COMPLETED", "duration_ms": 2400},
            {"stage": "DEFECT_CLASSIFICATION","label": "Road Defect Classification",    "status": "COMPLETED", "duration_ms": 1800},
            {"stage": "SEVERITY_ASSESSMENT",  "label": "Severity & Confidence Scoring", "status": "COMPLETED", "duration_ms": 600},
            {"stage": "SPATIAL_MAPPING",      "label": "GPS / Road Segment Mapping",    "status": "COMPLETED", "duration_ms": 300},
            {"stage": "IMPACT_ANALYSIS",      "label": "Road Health Impact Analysis",   "status": "COMPLETED", "duration_ms": 450},
            {"stage": "REPORT_GENERATION",    "label": "Final Report Compilation",      "status": "COMPLETED", "duration_ms": 200},
        ]
        if self.status == "PROCESSING":
            for s in stages[3:]:
                s["status"] = "PENDING"
        return stages


def validate_video_file(filename: str) -> bool:
    """Validates the uploaded file has a supported video extension."""
    _, ext = os.path.splitext(filename.lower())
    return ext in SUPPORTED_FORMATS


def _estimate_video_duration(file_size_bytes: int) -> float:
    """Estimates video duration from file size (assuming ~4.5 Mbps H.264 1080p)."""
    bitrate_bps = 4_500_000
    bytes_per_sec = bitrate_bps / 8
    duration = file_size_bytes / bytes_per_sec
    return max(5.0, min(duration, 600.0))  # Clamp between 5s and 10min


def _generate_detections(duration_sec: float, road: dict) -> list:
    """Generates realistic frame-by-frame detections for the given video duration."""
    detections = []
    frame_interval = 0.5  # 2 FPS
    current_time = 0.0
    frame_idx = 0

    while current_time < duration_sec:
        frame_idx += 1

        # Vehicle detections (3-8 per frame in urban Bengaluru traffic)
        num_vehicles = random.randint(3, 8)
        for _ in range(num_vehicles):
            vcls = random.choice(VEHICLE_CLASSES)
            detections.append({
                "frame_index": frame_idx,
                "timestamp_sec": round(current_time, 2),
                "class_id": vcls["class_id"],
                "label": vcls["label"],
                "category": vcls["category"],
                "confidence": round(random.uniform(0.72, 0.99), 3),
                "bbox": _random_bbox(),
            })

        # Road defect detections (probabilistic — not every frame has defects)
        if random.random() < 0.15:  # ~15% of frames contain a defect
            defect = random.choice(DEFECT_CLASSES)
            severity = _assign_severity(defect["severity_weight"])
            detections.append({
                "frame_index": frame_idx,
                "timestamp_sec": round(current_time, 2),
                "class_id": defect["class_id"],
                "label": defect["label"],
                "category": defect["category"],
                "confidence": round(random.uniform(0.78, 0.98), 3),
                "severity": severity,
                "bbox": _random_bbox(),
                "geo": {
                    "latitude": road["lat"] + random.uniform(-0.002, 0.002),
                    "longitude": road["lng"] + random.uniform(-0.002, 0.002),
                },
            })

        current_time += frame_interval

    return detections


def _random_bbox() -> dict:
    """Generates a random bounding box in normalized coordinates."""
    x = round(random.uniform(0.05, 0.75), 3)
    y = round(random.uniform(0.15, 0.70), 3)
    w = round(random.uniform(0.05, 0.25), 3)
    h = round(random.uniform(0.05, 0.30), 3)
    return {"x": x, "y": y, "width": w, "height": h}


def _assign_severity(weight: float) -> str:
    """Assigns severity based on defect class weight + random variation."""
    score = weight + random.uniform(-0.15, 0.15)
    if score > 0.80:
        return "CRITICAL"
    elif score > 0.60:
        return "HIGH"
    elif score > 0.40:
        return "MEDIUM"
    return "LOW"


def _build_timeline(detections: list, duration_sec: float) -> list:
    """Builds a temporal timeline of significant events from detections."""
    timeline = []
    defect_detections = [d for d in detections if d["category"] in ("ROAD_DEFECT", "INFRASTRUCTURE", "HAZARD")]

    for det in defect_detections:
        timeline.append({
            "timestamp_sec": det["timestamp_sec"],
            "event_type": det["class_id"].upper(),
            "label": det["label"],
            "confidence": det["confidence"],
            "severity": det.get("severity", "MEDIUM"),
            "frame_index": det["frame_index"],
        })

    # Sort by timestamp
    timeline.sort(key=lambda x: x["timestamp_sec"])
    return timeline


def _build_defect_summary(detections: list) -> dict:
    """Aggregates defect detection counts and average confidences."""
    defects = [d for d in detections if d["category"] in ("ROAD_DEFECT", "INFRASTRUCTURE", "HAZARD")]
    summary = {}
    for d in defects:
        cls = d["class_id"]
        if cls not in summary:
            summary[cls] = {"label": d["label"], "count": 0, "total_confidence": 0.0, "severities": []}
        summary[cls]["count"] += 1
        summary[cls]["total_confidence"] += d["confidence"]
        if "severity" in d:
            summary[cls]["severities"].append(d["severity"])

    # Compute averages
    result = {}
    for cls, data in summary.items():
        sev_counts = {}
        for s in data["severities"]:
            sev_counts[s] = sev_counts.get(s, 0) + 1
        dominant_severity = max(sev_counts, key=sev_counts.get) if sev_counts else "MEDIUM"
        result[cls] = {
            "label": data["label"],
            "count": data["count"],
            "avg_confidence": round(data["total_confidence"] / data["count"], 3),
            "dominant_severity": dominant_severity,
            "severity_breakdown": sev_counts,
        }
    return result


def _build_vehicle_summary(detections: list) -> dict:
    """Aggregates vehicle counts by class."""
    vehicles = [d for d in detections if d["category"] in ("VEHICLE", "VULNERABLE_USER", "ANPR")]
    summary = {}
    for v in vehicles:
        cls = v["class_id"]
        if cls not in summary:
            summary[cls] = {"label": v["label"], "count": 0}
        summary[cls]["count"] += 1
    return summary


def _build_severity_distribution(detections: list) -> dict:
    """Builds severity distribution across all defect detections."""
    defects = [d for d in detections if "severity" in d]
    dist = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for d in defects:
        dist[d["severity"]] = dist.get(d["severity"], 0) + 1
    return dist


def _compute_road_health_impact(defect_summary: dict, vehicle_summary: dict) -> dict:
    """Computes the road health impact score based on detected defects and traffic load."""
    total_defects = sum(d["count"] for d in defect_summary.values())
    total_vehicles = sum(v["count"] for v in vehicle_summary.values())

    # Weighted severity penalty
    severity_penalty = 0
    for cls, data in defect_summary.items():
        cls_def = next((c for c in DEFECT_CLASSES if c["class_id"] == cls), None)
        weight = cls_def["severity_weight"] if cls_def else 0.5
        severity_penalty += data["count"] * weight * 3.5

    # Traffic stress multiplier
    traffic_multiplier = 1.0
    if total_vehicles > 500:
        traffic_multiplier = 1.4
    elif total_vehicles > 200:
        traffic_multiplier = 1.2

    raw_impact = min(severity_penalty * traffic_multiplier, 45)
    estimated_health_after = max(20, round(75 - raw_impact, 1))

    return {
        "total_defects_detected": total_defects,
        "total_vehicles_counted": total_vehicles,
        "severity_penalty_pts": round(severity_penalty, 1),
        "traffic_stress_multiplier": traffic_multiplier,
        "estimated_health_score_impact": round(-raw_impact, 1),
        "estimated_road_health_after": estimated_health_after,
        "current_baseline_health": 75,
        "risk_level": "CRITICAL" if estimated_health_after < 40 else "HIGH" if estimated_health_after < 55 else "MODERATE",
    }


def _generate_maintenance_recommendations(defect_summary: dict, road_health: dict) -> list:
    """Generates actionable maintenance recommendations based on analysis results."""
    recommendations = []

    if "pothole" in defect_summary:
        count = defect_summary["pothole"]["count"]
        recommendations.append({
            "priority": "P1" if count > 3 else "P2",
            "action": f"Immediate pothole repair required — {count} potholes detected across footage span",
            "department": "BBMP Road Maintenance",
            "category": "ROAD_REPAIR",
            "estimated_cost_inr": count * 15000,
        })

    if "waterlogging" in defect_summary:
        recommendations.append({
            "priority": "P1",
            "action": "Drainage infrastructure inspection — waterlogging detected, risk of road deterioration",
            "department": "BBMP Storm Water Drainage",
            "category": "DRAINAGE",
            "estimated_cost_inr": 250000,
        })

    if "crack" in defect_summary:
        count = defect_summary["crack"]["count"]
        recommendations.append({
            "priority": "P2",
            "action": f"Surface resurfacing recommended — {count} fatigue crack(s) detected",
            "department": "BBMP Road Maintenance",
            "category": "RESURFACING",
            "estimated_cost_inr": count * 8000,
        })

    if "missing_sign" in defect_summary:
        recommendations.append({
            "priority": "P2",
            "action": "Traffic signage audit and replacement required",
            "department": "Traffic Police — Bengaluru",
            "category": "SIGNAGE",
            "estimated_cost_inr": 5000,
        })

    if "damaged_barrier" in defect_summary:
        recommendations.append({
            "priority": "P1",
            "action": "Road barrier repair — safety hazard for pedestrians and vehicles",
            "department": "BBMP Infrastructure",
            "category": "BARRIER_REPAIR",
            "estimated_cost_inr": 35000,
        })

    if "debris" in defect_summary:
        recommendations.append({
            "priority": "P1",
            "action": "Immediate debris clearance required to restore traffic flow",
            "department": "BBMP Solid Waste Management",
            "category": "CLEARANCE",
            "estimated_cost_inr": 10000,
        })

    if road_health["risk_level"] == "CRITICAL":
        recommendations.insert(0, {
            "priority": "P0",
            "action": f"CRITICAL: Road health projected to drop to {road_health['estimated_road_health_after']}/100 — escalate to Commissioner for emergency repair allocation",
            "department": "BBMP Commissioner Office",
            "category": "EMERGENCY_ESCALATION",
            "estimated_cost_inr": 500000,
        })

    return recommendations


def analyze_footage(filename: str, file_size_bytes: int, bus_id: str = "BUS-UPLOAD", road_id: Optional[str] = None) -> dict:
    """
    Main analysis pipeline entry point.
    Processes uploaded dashcam footage through the full Vision AI pipeline.
    Returns a complete structured analysis result.
    """
    # Generate analysis ID from filename hash
    hash_input = f"{filename}-{file_size_bytes}-{time.time()}"
    analysis_id = f"ANA-{hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()}"

    result = FootageAnalysisResult(analysis_id, filename, file_size_bytes)

    # Match to road segment
    if road_id:
        matched = next((r for r in BENGALURU_ROADS if r["road_id"] == road_id), None)
    else:
        matched = random.choice(BENGALURU_ROADS)
    result.matched_road = matched or BENGALURU_ROADS[0]

    # Estimate video properties
    result.video_duration_sec = round(_estimate_video_duration(file_size_bytes), 1)
    result.total_frames_analyzed = int(result.video_duration_sec * result.analysis_fps)

    # Run detection pipeline
    result.detections = _generate_detections(result.video_duration_sec, result.matched_road)
    result.defect_summary = _build_defect_summary(result.detections)
    result.vehicle_summary = _build_vehicle_summary(result.detections)
    result.timeline = _build_timeline(result.detections, result.video_duration_sec)
    result.severity_distribution = _build_severity_distribution(result.detections)
    result.road_health_impact = _compute_road_health_impact(result.defect_summary, result.vehicle_summary)
    result.maintenance_recommendations = _generate_maintenance_recommendations(
        result.defect_summary, result.road_health_impact
    )

    # Mark completed
    result.status = "COMPLETED"
    result.completed_at = datetime.now(timezone.utc).isoformat()

    return result.to_dict()


# In-memory analysis results cache
_analysis_cache: dict = {}

def store_analysis(analysis_result: dict) -> None:
    """Stores an analysis result in the in-memory cache."""
    _analysis_cache[analysis_result["analysis_id"]] = analysis_result

def get_analysis(analysis_id: str) -> Optional[dict]:
    """Retrieves a stored analysis result."""
    return _analysis_cache.get(analysis_id)

def get_all_analyses() -> list:
    """Returns all stored analysis results."""
    return list(_analysis_cache.values())
