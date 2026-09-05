import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, FileText, Send, Car, Video } from 'lucide-react';
import { Incident } from '../types';

interface IncidentCentreScreenProps {
  incidents: Incident[];
}

export const IncidentCentreScreen: React.FC<IncidentCentreScreenProps> = ({ incidents }) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident>(incidents[0] || null);
  const [forwarded, setForwarded] = useState(false);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.25rem', height: 'calc(100vh - 125px)' }}>
      {/* Left Column: Incidents Triage Roster */}
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
              INCIDENT INTELLIGENCE & ANPR
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Safety breaches & offending vehicle tracking
            </p>
          </div>
          <span className="badge-critical">{incidents.length} Critical</span>
        </div>

        {/* Incident List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {incidents.map(inc => {
            const isSelected = selectedIncident?.incident_id === inc.incident_id;
            return (
              <div
                key={inc.incident_id}
                onClick={() => { setSelectedIncident(inc); setForwarded(false); }}
                style={{
                  background: isSelected ? 'rgba(244, 63, 94, 0.12)' : 'rgba(13, 19, 31, 0.6)',
                  border: isSelected ? '1px solid #f43f5e' : '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span className="badge-critical">
                    {inc.incident_type.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {inc.incident_id}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
                  {inc.vehicle_plate ? `Plate: ${inc.vehicle_plate}` : 'Infrastructure Hazard'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span>Sensed by {inc.bus_id}</span>
                  <span style={{ color: '#fb7185', fontWeight: 700 }}>{(inc.incident_confidence * 100).toFixed(0)}% AI Conf</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Incident Dossier & Evidence Strip */}
      {selectedIncident && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto', gap: '1.25rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#fb7185', fontWeight: 800, letterSpacing: '0.05em' }}>
                CASE FILE &middot; {selectedIncident.incident_id}
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
                {selectedIncident.incident_type.replace(/_/g, ' ')}
              </h1>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Captured by {selectedIncident.bus_id} &middot; Coordinates: {selectedIncident.latitude.toFixed(4)}° N, {selectedIncident.longitude.toFixed(4)}° E
              </div>
            </div>

            <span className="badge-critical" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
              STATUS: {selectedIncident.status}
            </span>
          </div>

          {/* Evidence Frame Preview */}
          <div style={{
            background: '#090d16',
            border: '1px solid var(--border-medium)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
          }}>
            <img
              src={`/api/evidence/${selectedIncident.incident_id.toLowerCase()}.svg`}
              alt="Incident Keyframe"
              style={{ width: '100%', height: 'auto', maxHeight: '340px', objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* ANPR Vehicle Identification Card */}
          {selectedIncident.vehicle_plate && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 10,
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  fontSize: '1.4rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 6,
                  border: '2px solid #0f172a',
                  letterSpacing: '0.08em'
                }}>
                  {selectedIncident.vehicle_plate}
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#fb7185', fontWeight: 800 }}>
                    ANPR CONFIDENCE
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                    {((selectedIncident.plate_confidence || 0.94) * 100).toFixed(1)}% Match
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Type: {selectedIncident.evidence_package.offending_vehicle_type || 'Motor Vehicle'}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', maxWidth: '350px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>DETECTED TRAJECTORY</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.3 }}>
                  {selectedIncident.evidence_package.trajectory || 'Unsafe high-speed maneuver causing pedestrian hazard'}
                </div>
              </div>
            </div>
          )}

          {/* Multi-Second Pre/Post Incident Timeline */}
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.65rem' }}>
              Structured Incident Evidence Package (Pre / Impact / Post Buffer)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>T - 8 SECONDS</div>
                <div style={{ height: 60, background: '#0a0e17', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.75rem' }}>
                  Approaching Vehicle Trajectory
                </div>
              </div>

              <div className="glass-card" style={{ textAlign: 'center', border: '1px solid #f43f5e' }}>
                <div style={{ fontSize: '0.7rem', color: '#fb7185', fontWeight: 700, marginBottom: '0.25rem' }}>T = 0s (IMPACT/BREACH)</div>
                <div style={{ height: 60, background: '#0a0e17', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185', fontSize: '0.75rem' }}>
                  OCR Keyframe & Bounding Box
                </div>
              </div>

              <div className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>T + 8 SECONDS</div>
                <div style={{ height: 60, background: '#0a0e17', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.75rem' }}>
                  Post-Incident Departure
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              className="btn-primary"
              onClick={() => setForwarded(true)}
              style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)' }}
            >
              <Send size={15} /> {forwarded ? 'Dossier Dispatched ✓' : 'Forward Evidence to Traffic Police'}
            </button>

            <button className="btn-secondary">
              <FileText size={15} /> Export Audit PDF
            </button>

            {forwarded && (
              <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                Package securely routed to Bangalore Traffic Police Command Center.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
