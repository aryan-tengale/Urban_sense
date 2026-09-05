import React from 'react';
import { Wrench, AlertTriangle, TrendingUp, ShieldCheck, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { RoadSegment } from '../types';

interface PredictiveMaintenanceScreenProps {
  roads: RoadSegment[];
}

export const PredictiveMaintenanceScreen: React.FC<PredictiveMaintenanceScreenProps> = ({ roads }) => {
  const sortedRoads = [...roads].sort((a, b) => b.maintenance_risk_pct - a.maintenance_risk_pct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'calc(100vh - 125px)' }}>
      {/* Overview Cards */}
      <div className="hud-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="hud-metric rose">
          <div className="hud-label">P1 Urgent Action Corridors</div>
          <div className="hud-value" style={{ color: '#fb7185' }}>
            {roads.filter(r => r.maintenance_priority.startsWith('P1')).length} Roads
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Immediate structural hazard</div>
        </div>

        <div className="hud-metric amber">
          <div className="hud-label">P2 Scheduled (48 Hours)</div>
          <div className="hud-value" style={{ color: '#fbbf24' }}>
            {roads.filter(r => r.maintenance_priority.startsWith('P2')).length} Roads
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Medium persistence wear</div>
        </div>

        <div className="hud-metric emerald">
          <div className="hud-label">P3 Routine Monitoring</div>
          <div className="hud-value" style={{ color: '#34d399' }}>
            {roads.filter(r => r.maintenance_priority.startsWith('P3')).length} Roads
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Normal transit degradation</div>
        </div>

        <div className="hud-metric">
          <div className="hud-label">Forecast Horizon</div>
          <div className="hud-value" style={{ color: '#38bdf8' }}>14 Days</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Predictive risk window</div>
        </div>
      </div>

      {/* Main Predictive Risk Table */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
              PREDICTIVE ROAD FAILURE RISK RANKING (MODULE G)
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Moves from reactive inspection to proactive multi-bus failure probability modeling
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
              <FileSpreadsheet size={14} /> Export Work Orders
            </button>
          </div>
        </div>

        {/* Predictive Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8', background: 'rgba(7, 10, 17, 0.4)' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>CORRIDOR</th>
                <th style={{ padding: '0.85rem 1rem' }}>HEALTH SCORE</th>
                <th style={{ padding: '0.85rem 1rem' }}>FAILURE RISK %</th>
                <th style={{ padding: '0.85rem 1rem' }}>PRIORITY</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>EXPLAINABLE RISK DRIVERS</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>RECOMMENDED ACTION</th>
              </tr>
            </thead>
            <tbody>
              {sortedRoads.map(road => {
                const isP1 = road.maintenance_priority.startsWith('P1');
                const isP2 = road.maintenance_priority.startsWith('P2');
                const riskColor = road.maintenance_risk_pct > 75 ? '#f43f5e' : (road.maintenance_risk_pct >= 50 ? '#f59e0b' : '#10b981');

                return (
                  <tr
                    key={road.road_id}
                    style={{
                      borderBottom: '1px solid rgba(56, 189, 248, 0.07)',
                      background: isP1 ? 'rgba(244, 63, 94, 0.04)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                      {road.name}
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {road.road_id}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: road.health_score < 60 ? '#f43f5e' : '#fbbf24' }}>
                      {road.health_score}<span style={{ fontSize: '0.7rem', color: '#64748b' }}>/100</span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: 80,
                          height: 8,
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${road.maintenance_risk_pct}%`,
                            height: '100%',
                            background: riskColor
                          }} />
                        </div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: riskColor }}>
                          {road.maintenance_risk_pct}%
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={isP1 ? 'badge-critical' : (isP2 ? 'badge-high' : 'badge-low')}>
                        {road.maintenance_priority.split('—')[0].trim()}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1', fontSize: '0.75rem', maxWidth: '380px' }}>
                      {road.risk_rationale}
                    </td>

                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <button
                        className={isP1 ? 'btn-danger' : 'btn-secondary'}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        {isP1 ? 'Issue P1 Work Order' : 'Schedule Crew'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
