import React from 'react';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Car, Shield } from 'lucide-react';
import { RoadSegment, Cluster, SummaryMetrics } from '../types';

interface AnalyticsScreenProps {
  roads: RoadSegment[];
  clusters: Cluster[];
  metrics: SummaryMetrics | null;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ roads, clusters, metrics }) => {
  const defectCounts = {
    potholes: clusters.filter(c => c.defect_type === 'POTHOLE').length,
    waterlog: clusters.filter(c => c.defect_type === 'WATERLOGGING').length,
    divider: clusters.filter(c => c.defect_type === 'DAMAGED_DIVIDER').length,
    other: clusters.filter(c => !['POTHOLE', 'WATERLOGGING', 'DAMAGED_DIVIDER'].includes(c.defect_type)).length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'calc(100vh - 125px)', overflowY: 'auto' }}>
      {/* Top Metrics */}
      <div className="hud-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="hud-metric">
          <div className="hud-label">Vehicle Throughput (Fleet Sensed)</div>
          <div className="hud-value" style={{ color: '#38bdf8' }}>4,920 <span style={{ fontSize: '0.8rem', color: '#64748b' }}>veh/hr</span></div>
        </div>

        <div className="hud-metric amber">
          <div className="hud-label">Severe Bottleneck Corridors</div>
          <div className="hud-value" style={{ color: '#fbbf24' }}>
            {roads.filter(r => r.traffic_score === 'SEVERE').length} Corridors
          </div>
        </div>

        <div className="hud-metric rose">
          <div className="hud-label">Avg Transit Delay Penalty</div>
          <div className="hud-value" style={{ color: '#fb7185' }}>+18.4 min</div>
        </div>

        <div className="hud-metric emerald">
          <div className="hud-label">Sensed Road Coverage</div>
          <div className="hud-value" style={{ color: '#34d399' }}>94.2%</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Defect Distribution Breakdown */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} color="#fbbf24" />
            INFRASTRUCTURE DEFECT TYPES (FLEET DETECTED)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#cbd5e1' }}>Potholes & Surface Cavities</span>
                <span style={{ fontWeight: 700, color: '#fbbf24' }}>{defectCounts.potholes} clusters (54%)</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '54%', height: '100%', background: '#fbbf24' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#cbd5e1' }}>Monsoon Waterlogging Hotspots</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{defectCounts.waterlog} clusters (25%)</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', background: '#38bdf8' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#cbd5e1' }}>Damaged Dividers & Pedestrian Curbs</span>
                <span style={{ fontWeight: 700, color: '#f43f5e' }}>{defectCounts.divider} clusters (14%)</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '14%', height: '100%', background: '#f43f5e' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#cbd5e1' }}>Missing Signs / Zebra Crossings</span>
                <span style={{ fontWeight: 700, color: '#a855f7' }}>7%</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '7%', height: '100%', background: '#a855f7' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Public Transport Delay Impact Analysis */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="#38bdf8" />
            ROUTE-LEVEL TRANSIT DELAY PENALTY FORECAST
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                  Route 14B &middot; Outer Ring Road Corridor
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Caused by Bellandur waterlogging + 8 severe potholes
                </div>
              </div>
              <span className="badge-critical" style={{ fontSize: '0.85rem' }}>+22 min delay</span>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                  Route 08C &middot; Majestic Interchange
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Caused by Station Road surface deterioration
                </div>
              </div>
              <span className="badge-critical" style={{ fontSize: '0.85rem' }}>+18 min delay</span>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                  Route 27A &middot; MG Road Corridor
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Caused by Trinity persistent pothole cluster
                </div>
              </div>
              <span className="badge-high" style={{ fontSize: '0.85rem' }}>+14 min delay</span>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                  Route 41A &middot; Old Airport Road
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Good road condition, nominal transit flow
                </div>
              </div>
              <span className="badge-low" style={{ fontSize: '0.85rem' }}>+3 min delay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
