import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Shield, AlertTriangle, Activity, Bus as BusIcon, Filter, Layers, Navigation } from 'lucide-react';
import { Bus, RoadSegment, Cluster, EventItem, SummaryMetrics } from '../types';

interface CommandCentreScreenProps {
  buses: Bus[];
  roads: RoadSegment[];
  clusters: Cluster[];
  events: EventItem[];
  metrics: SummaryMetrics | null;
  onSelectEvent: (event: EventItem | Cluster) => void;
  onSelectRoad: (road: RoadSegment) => void;
}

export const CommandCentreScreen: React.FC<CommandCentreScreenProps> = ({
  buses,
  roads,
  clusters,
  events,
  metrics,
  onSelectEvent,
  onSelectRoad
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [showBuses, setShowBuses] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [showRoadCorridors, setShowRoadCorridors] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Bengaluru center
    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.6100],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map overlays when data or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    // 1. Render Road Segment Polylines
    if (showRoadCorridors) {
      roads.forEach(road => {
        const color = road.health_score > 75 ? '#10b981' : (road.health_score >= 55 ? '#f59e0b' : '#f43f5e');
        const polyline = L.polyline(road.geometry_coords, {
          color: color,
          weight: 6,
          opacity: 0.85,
          dashArray: road.traffic_score === 'SEVERE' ? '6, 6' : undefined
        });

        polyline.bindTooltip(`
          <div style="font-size: 11px; font-weight: bold; color: #fff;">
            <div>${road.name}</div>
            <div style="color: ${color};">Health Score: ${road.health_score}/100 &middot; ${road.maintenance_priority}</div>
          </div>
        `, { sticky: true, opacity: 0.95 });

        polyline.on('click', () => onSelectRoad(road));
        layerGroupRef.current?.addLayer(polyline);
      });
    }

    // 2. Render Defect Clusters
    if (showClusters) {
      clusters.forEach(cl => {
        if (filterSeverity !== 'ALL' && cl.severity !== filterSeverity) return;

        const isCritical = cl.severity === 'CRITICAL';
        const isHigh = cl.severity === 'HIGH';
        const color = isCritical ? '#f43f5e' : (isHigh ? '#f59e0b' : '#06b6d4');
        const pulseAnim = isCritical ? 'animation: pulse-ring 1.5s infinite;' : '';

        const iconHtml = `
          <div style="
            width: 32px; height: 32px; border-radius: 50%;
            background: rgba(13, 19, 31, 0.9);
            border: 2px solid ${color};
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 12px ${color};
            color: #ffffff; font-weight: bold; font-size: 11px;
            cursor: pointer; ${pulseAnim}
          ">
            ${cl.observation_count}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-cluster-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([cl.latitude, cl.longitude], { icon: customIcon });

        marker.bindPopup(`
          <div style="min-width: 220px; font-family: sans-serif; font-size: 12px;">
            <div style="font-weight: 800; font-size: 13px; color: ${color}; margin-bottom: 4px;">
              ${cl.defect_type} (${cl.severity})
            </div>
            <div style="color: #cbd5e1; margin-bottom: 4px;"><strong>Corridor:</strong> ${cl.road_name}</div>
            <div style="color: #cbd5e1; margin-bottom: 4px;">
              <strong>Observed by:</strong> ${cl.confirmed_buses.join(', ')} (${cl.observation_count} times)
            </div>
            <div style="color: #cbd5e1; margin-bottom: 6px;">
              <strong>Persistence:</strong> <span class="badge-${cl.persistence_level.toLowerCase()}">${cl.persistence_level}</span> &middot; Conf: ${(cl.avg_confidence * 100).toFixed(1)}%
            </div>
            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 8px;">
              ${cl.recommended_action}
            </div>
            <button id="inspect-cl-${cl.cluster_id}" style="
              width: 100%; padding: 6px; background: #0284c7; color: white;
              border: none; border-radius: 4px; font-weight: 600; cursor: pointer;
            ">Inspect Evidence</button>
          </div>
        `);

        marker.on('popupopen', () => {
          document.getElementById(`inspect-cl-${cl.cluster_id}`)?.addEventListener('click', () => {
            onSelectEvent(cl);
          });
        });

        layerGroupRef.current?.addLayer(marker);
      });
    }

    // 3. Render Fleet Bus Markers
    if (showBuses) {
      buses.forEach(bus => {
        const isOnline = bus.network_status === 'ONLINE';
        const busColor = isOnline ? '#38bdf8' : '#f43f5e';

        const busHtml = `
          <div style="
            display: flex; align-items: center; gap: 4px;
            background: rgba(13, 19, 31, 0.9);
            border: 1.5px solid ${busColor};
            padding: 3px 6px; border-radius: 6px;
            box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
            color: #f8fafc; font-size: 10px; font-weight: bold;
            font-family: monospace; white-space: nowrap; cursor: pointer;
          ">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${isOnline ? '#10b981' : '#f43f5e'};"></span>
            ${bus.bus_id}
          </div>
        `;

        const busIcon = L.divIcon({
          html: busHtml,
          className: 'custom-bus-marker',
          iconSize: [65, 24],
          iconAnchor: [32, 12]
        });

        const busMarker = L.marker([bus.latitude, bus.longitude], { icon: busIcon });
        busMarker.bindPopup(`
          <div style="min-width: 180px; font-size: 12px;">
            <div style="font-weight: 800; font-size: 13px; color: #38bdf8; margin-bottom: 4px;">
              ${bus.bus_id} &middot; Route ${bus.route_id}
            </div>
            <div style="color: #cbd5e1;"><strong>Network:</strong> <span style="color:${isOnline ? '#10b981':'#f43f5e'}">${bus.network_status}</span></div>
            <div style="color: #cbd5e1;"><strong>Edge AI:</strong> ${bus.edge_status} (${bus.inference_fps} FPS)</div>
            <div style="color: #cbd5e1;"><strong>Camera:</strong> ${bus.camera_status}</div>
            <div style="color: #cbd5e1;"><strong>Queued Offline:</strong> ${bus.events_queued} events</div>
            <div style="color: #94a3b8; font-size: 10px; margin-top: 4px;">Coordinates: ${bus.latitude.toFixed(4)}, ${bus.longitude.toFixed(4)}</div>
          </div>
        `);

        layerGroupRef.current?.addLayer(busMarker);
      });
    }
  }, [buses, roads, clusters, filterSeverity, showBuses, showClusters, showRoadCorridors]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 125px)' }}>
      {/* KPI Header Grid */}
      <div className="hud-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="hud-metric">
          <div className="hud-label">Active Bus Fleet</div>
          <div className="hud-value" style={{ color: '#38bdf8' }}>
            {metrics?.active_buses || 5} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/ {buses.length}</span>
          </div>
        </div>

        <div className="hud-metric amber">
          <div className="hud-label">Events Sensed Today</div>
          <div className="hud-value" style={{ color: '#fbbf24' }}>
            {metrics?.events_today || 14}
          </div>
        </div>

        <div className="hud-metric rose">
          <div className="hud-label">Critical Defect Hotspots</div>
          <div className="hud-value" style={{ color: '#fb7185' }}>
            {metrics?.critical_issues || 2}
          </div>
        </div>

        <div className="hud-metric">
          <div className="hud-label">Congested Corridors</div>
          <div className="hud-value" style={{ color: '#f59e0b' }}>
            {metrics?.congested_roads || 5}
          </div>
        </div>

        <div className="hud-metric emerald">
          <div className="hud-label">Edge Bandwidth Saved</div>
          <div className="hud-value" style={{ color: '#34d399' }}>
            {metrics?.bandwidth_saved_pct || 98.5}%
          </div>
        </div>
      </div>

      {/* Main Workspace: GIS Map + Live Sensed Events Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Left: GIS Map Panel */}
        <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Map Controls Floating Toolbar */}
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1000,
            background: 'rgba(13, 19, 31, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            backdropFilter: 'blur(10px)',
            borderRadius: 8,
            padding: '0.4rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.75rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#94a3b8' }}>
              <input type="checkbox" checked={showBuses} onChange={e => setShowBuses(e.target.checked)} />
              Buses ({buses.length})
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#94a3b8' }}>
              <input type="checkbox" checked={showClusters} onChange={e => setShowClusters(e.target.checked)} />
              Defect Clusters ({clusters.length})
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#94a3b8' }}>
              <input type="checkbox" checked={showRoadCorridors} onChange={e => setShowRoadCorridors(e.target.checked)} />
              Health Corridors
            </label>
          </div>

          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Right: Live Sensed Events & Fleet Alerts Feed */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
              <Activity size={16} color="#38bdf8" />
              LIVE FLEET ALERTS
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>REAL-TIME</span>
          </div>

          {/* Alert Stream List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {clusters.map(cl => (
              <div
                key={cl.cluster_id}
                className="glass-card"
                onClick={() => onSelectEvent(cl)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span className={`badge-${cl.severity.toLowerCase()}`}>
                    {cl.defect_type}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {cl.observation_count} observations
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.2rem' }}>
                  {cl.road_name}
                </div>

                <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Confirmed by: {cl.confirmed_buses.join(', ')}</span>
                  <span style={{ color: '#38bdf8' }}>{(cl.avg_confidence * 100).toFixed(0)}% conf</span>
                </div>
              </div>
            ))}

            {events.slice(0, 8).map(evt => (
              <div
                key={evt.event_id}
                className="glass-card"
                onClick={() => onSelectEvent(evt)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span className={`badge-${evt.severity.toLowerCase()}`}>
                    {evt.event_type}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                    {evt.bus_id}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                  Sensed on Route {evt.route_id} &middot; {(evt.confidence * 100).toFixed(0)}% conf
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
