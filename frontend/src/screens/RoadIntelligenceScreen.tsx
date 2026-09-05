import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, Wrench, ShieldAlert } from 'lucide-react';
import { RoadSegment, Cluster } from '../types';

interface RoadIntelligenceScreenProps {
  roads: RoadSegment[];
  clusters: Cluster[];
  onSelectCluster: (cluster: Cluster) => void;
}

export const RoadIntelligenceScreen: React.FC<RoadIntelligenceScreenProps> = ({
  roads,
  clusters,
  onSelectCluster
}) => {
  const [selectedRoad, setSelectedRoad] = useState<RoadSegment>(roads[0] || null);

  const getScoreColor = (score: number) => {
    if (score > 75) return '#10b981';
    if (score >= 55) return '#f59e0b';
    return '#f43f5e';
  };

  const roadClusters = clusters.filter(cl => cl.road_id === selectedRoad?.road_id);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.25rem', height: 'calc(100vh - 125px)' }}>
      {/* Left Column: Road Corridor Leaderboard */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
              ROAD HEALTH LEADERBOARD
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Continuous multi-bus roadbed assessment
            </p>
          </div>
          <span className="badge-medium">{roads.length} Corridors</span>
        </div>

        {/* List of Corridors */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {roads.map(road => {
            const isSelected = selectedRoad?.road_id === road.road_id;
            const scoreColor = getScoreColor(road.health_score);

            return (
              <div
                key={road.road_id}
                onClick={() => setSelectedRoad(road)}
                style={{
                  background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(13, 19, 31, 0.6)',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    {road.name}
                  </span>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: scoreColor
                  }}>
                    {road.health_score}<span style={{ fontSize: '0.7rem', color: '#64748b' }}>/100</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: '#94a3b8' }}>
                    Defects: <strong style={{ color: '#f8fafc' }}>{road.defect_count}</strong> &middot; Traffic: <strong style={{ color: '#f8fafc' }}>{road.traffic_score}</strong>
                  </span>
                  <span className={road.health_score < 60 ? 'badge-critical' : (road.health_score < 75 ? 'badge-high' : 'badge-low')}>
                    {road.maintenance_priority.split('—')[0].trim()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Road Segment Drill-Down Analysis */}
      {selectedRoad && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto', gap: '1.25rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.05em' }}>
                TRANSIT CORRIDOR DOSSIER &middot; {selectedRoad.road_id}
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
                {selectedRoad.name}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Health Index</div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: getScoreColor(selectedRoad.health_score)
                }}>
                  {selectedRoad.health_score}<span style={{ fontSize: '1rem', color: '#64748b' }}>/100</span>
                </div>
              </div>

              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: `4px solid ${getScoreColor(selectedRoad.health_score)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#f8fafc',
                background: 'rgba(13, 19, 31, 0.8)'
              }}>
                {selectedRoad.health_score < 60 ? 'CRIT' : (selectedRoad.health_score < 75 ? 'WARN' : 'GOOD')}
              </div>
            </div>
          </div>

          {/* Operational Metrics Cards */}
          <div className="hud-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="glass-card">
              <div className="hud-label">Potholes Flagged</div>
              <div className="hud-value" style={{ color: '#fbbf24' }}>{selectedRoad.potholes_count}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Multi-bus corroborated</div>
            </div>

            <div className="glass-card">
              <div className="hud-label">Waterlogging Risk</div>
              <div className="hud-value" style={{ color: '#38bdf8' }}>{selectedRoad.waterlogging_count}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Monsoon drainage hot spots</div>
            </div>

            <div className="glass-card">
              <div className="hud-label">Traffic Stress Load</div>
              <div className="hud-value" style={{ color: selectedRoad.traffic_score === 'SEVERE' ? '#f43f5e' : '#fbbf24' }}>
                {selectedRoad.traffic_score}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{selectedRoad.vehicle_density_per_min} veh/min throughput</div>
            </div>

            <div className="glass-card">
              <div className="hud-label">Failure Probability</div>
              <div className="hud-value" style={{ color: selectedRoad.maintenance_risk_pct > 75 ? '#f43f5e' : '#fbbf24' }}>
                {selectedRoad.maintenance_risk_pct}%
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Predictive risk metric</div>
            </div>
          </div>

          {/* Action Recommendation Banner (Module M) */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 12,
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Wrench size={22} color="#fbbf24" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 800 }}>
                  ACTION RECOMMENDATION
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedRoad.maintenance_priority}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                  {selectedRoad.risk_rationale}
                </div>
              </div>
            </div>

            <button className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Dispatch BBMP Crew
            </button>
          </div>

          {/* Active Defect Clusters on this Road */}
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
              Active Multi-Bus Defect Clusters on {selectedRoad.name}
            </h3>

            {roadClusters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                No critical defect clusters recorded on this corridor.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {roadClusters.map(cl => (
                  <div
                    key={cl.cluster_id}
                    className="glass-card"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className={`badge-${cl.severity.toLowerCase()}`}>
                          {cl.defect_type}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                          {cl.cluster_id}
                        </span>
                        <span className="badge-medium">
                          {cl.persistence_level} PERSISTENCE
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Observed by {cl.confirmed_buses.join(', ')} &middot; {cl.observation_count} total runs &middot; {(cl.avg_confidence * 100).toFixed(0)}% confidence
                      </div>
                    </div>

                    <button
                      className="btn-secondary"
                      onClick={() => onSelectCluster(cl)}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      View Evidence <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
