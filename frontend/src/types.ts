export interface Bus {
  bus_id: string;
  route_id: string;
  status: string;
  latitude: number;
  longitude: number;
  camera_status: string;
  network_status: 'ONLINE' | 'OFFLINE';
  edge_status: string;
  inference_fps: number;
  cpu_pct: number;
  gpu_pct: number;
  events_queued: number;
  last_sync: string;
}

export interface RoadSegment {
  road_id: string;
  name: string;
  geometry_coords: [number, number][];
  health_score: number;
  traffic_score: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  vehicle_density_per_min: number;
  defect_count: number;
  potholes_count: number;
  cracks_count: number;
  waterlogging_count: number;
  missing_signs_count: number;
  maintenance_risk_pct: number;
  maintenance_priority: string;
  risk_rationale: string;
  last_updated: string;
}

export interface Cluster {
  cluster_id: string;
  defect_type: string;
  road_id: string;
  road_name: string;
  latitude: number;
  longitude: number;
  observation_count: number;
  first_detected: string;
  last_detected: string;
  persistence_level: 'LOW' | 'MEDIUM' | 'HIGH';
  confirmed_buses: string[];
  avg_confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  recommended_action: string;
}

export interface EventItem {
  event_id: string;
  event_type: string;
  bus_id: string;
  camera_id: string;
  route_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  evidence_url: string;
  cluster_id?: string;
  road_id?: string;
  cluster?: Cluster;
}

export interface Incident {
  incident_id: string;
  event_id?: string;
  incident_type: string;
  bus_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  vehicle_plate?: string;
  plate_confidence?: number;
  incident_confidence: number;
  status: string;
  evidence_package: {
    pre_seconds?: number;
    post_seconds?: number;
    offending_vehicle_type?: string;
    trajectory?: string;
    evidence_frames?: string[];
    plate_crop_url?: string;
    depth_estimate_cm?: number;
    affected_lanes?: number;
    congestion_impact?: string;
  };
}

export interface SummaryMetrics {
  active_buses: number;
  offline_buses: number;
  events_today: number;
  critical_issues: number;
  congested_roads: number;
  avg_city_road_health: number;
  active_incidents: number;
  bandwidth_saved_pct: number;
  bandwidth_saved_mb: number;
  raw_video_mb: number;
  event_data_mb: number;
}

export interface EdgeStats {
  bus: Bus;
  bandwidth: {
    bus_id: string;
    raw_video_mb: number;
    event_data_mb: number;
    bandwidth_saved_mb: number;
    bandwidth_saved_pct: number;
    frames_processed: number;
    events_extracted: number;
  };
  traffic: {
    cars_per_min: number;
    buses_per_min: number;
    bikes_per_min: number;
    trucks_per_min: number;
    total_vehicles_per_min: number;
    density_estimate: string;
    congestion_level: string;
  };
  edge_ai: {
    model: string;
    classes_active: string[];
    inference_fps: number;
    cpu_pct: number;
    gpu_pct: number;
  };
}

export interface DemoStepMetadata {
  step: number;
  title: string;
  description: string;
  badge: string;
  highlight_screen: string;
}

export interface DemoState {
  current_step: number;
  total_steps: number;
  metadata: DemoStepMetadata;
}

// Footage Analysis Types
export interface PipelineStage {
  stage: string;
  label: string;
  status: 'COMPLETED' | 'PENDING' | 'PROCESSING';
  duration_ms: number;
}

export interface DetectionBbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  frame_index: number;
  timestamp_sec: number;
  class_id: string;
  label: string;
  category: string;
  confidence: number;
  severity?: string;
  bbox: DetectionBbox;
  geo?: { latitude: number; longitude: number };
}

export interface DefectSummaryItem {
  label: string;
  count: number;
  avg_confidence: number;
  dominant_severity: string;
  severity_breakdown: Record<string, number>;
}

export interface VehicleSummaryItem {
  label: string;
  count: number;
}

export interface TimelineEvent {
  timestamp_sec: number;
  event_type: string;
  label: string;
  confidence: number;
  severity: string;
  frame_index: number;
}

export interface RoadHealthImpact {
  total_defects_detected: number;
  total_vehicles_counted: number;
  severity_penalty_pts: number;
  traffic_stress_multiplier: number;
  estimated_health_score_impact: number;
  estimated_road_health_after: number;
  current_baseline_health: number;
  risk_level: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export interface MaintenanceRecommendation {
  priority: string;
  action: string;
  department: string;
  category: string;
  estimated_cost_inr: number;
}

export interface AnalysisResult {
  analysis_id: string;
  filename: string;
  file_size_mb: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  started_at: string;
  completed_at: string | null;
  video_duration_sec: number;
  total_frames_analyzed: number;
  analysis_fps: number;
  pipeline_stages: PipelineStage[];
  matched_road: { road_id: string; name: string; lat: number; lng: number };
  detections: Detection[];
  defect_summary: Record<string, DefectSummaryItem>;
  vehicle_summary: Record<string, VehicleSummaryItem>;
  timeline: TimelineEvent[];
  severity_distribution: Record<string, number>;
  road_health_impact: RoadHealthImpact;
  maintenance_recommendations: MaintenanceRecommendation[];
}

export interface AnalysisSummary {
  analysis_id: string;
  filename: string;
  file_size_mb: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  video_duration_sec: number;
  total_frames_analyzed: number;
  matched_road: { road_id: string; name: string; lat: number; lng: number };
  defect_summary: Record<string, DefectSummaryItem>;
  severity_distribution: Record<string, number>;
  road_health_impact: RoadHealthImpact;
}
