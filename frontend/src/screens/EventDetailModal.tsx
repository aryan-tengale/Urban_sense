import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Copy, Send, MapPin, Bus, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { EventItem, Cluster } from '../types';
import { api } from '../api';

interface EventDetailModalProps {
  item: EventItem | Cluster | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ item, onClose, onUpdate }) => {
  if (!item) return null;

  const [department, setDepartment] = useState('BBMP Road Infrastructure & Maintenance');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Normalize between EventItem and Cluster
  const isCluster = 'observation_count' in item;
  const eventId = isCluster ? (item as Cluster).cluster_id : (item as EventItem).event_id;
  const eventType = isCluster ? (item as Cluster).defect_type : (item as EventItem).event_type;
  const severity = item.severity;
  const confidence = isCluster ? item.avg_confidence : (item as EventItem).confidence;
  const lat = item.latitude;
  const lng = item.longitude;
  const buses = isCluster ? item.confirmed_buses : [(item as EventItem).bus_id];
  const observations = isCluster ? item.observation_count : 1;
  const persistence = isCluster ? item.persistence_level : 'UNVERIFIED';

  const handleAction = async (action: 'confirm' | 'reject' | 'duplicate' | 'assign') => {
    setLoading(true);
    try {
      if (action === 'confirm') {
        await api.confirmEvent(eventId, department);
        setFeedbackSuccess('Event Confirmed. Added to AI Retraining Benchmark Dataset ✓');
      } else if (action === 'reject') {
        await api.rejectEvent(eventId, department);
        setFeedbackSuccess('Event Rejected as False Positive. Flagged for Model Fine-Tuning.');
      } else if (action === 'duplicate') {
        await api.duplicateEvent(eventId);
        setFeedbackSuccess('Marked as Duplicate Observation.');
      } else if (action === 'assign') {
        await api.assignEvent(eventId, department);
        setFeedbackSuccess(`Assigned to ${department} for repair dispatch.`);
      }
      setTimeout(() => {
        onUpdate();
      }, 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className={`badge-${severity.toLowerCase()}`} style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}>
              {eventType}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>
              {eventId}
            </span>
            <span className="badge-medium">
              {persistence} PERSISTENCE
            </span>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Keyframe Evidence Viewer */}
          <div style={{
            background: '#090d16',
            borderRadius: 10,
            border: '1px solid var(--border-medium)',
            overflow: 'hidden',
            maxHeight: '260px'
          }}>
            <img
              src={`/api/evidence/defect_${eventType.toLowerCase()}.svg`}
              alt="Defect Keyframe"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* Sensed Coordinates & Telemetry */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div className="glass-card">
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={12} color="#38bdf8" /> GPS COORDINATES
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
              </div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Bus size={12} color="#fbbf24" /> CONFIRMED BY FLEET
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                {buses.join(', ')} ({observations} runs)
              </div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ShieldCheck size={12} color="#34d399" /> AI CONFIDENCE
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                {(confidence * 100).toFixed(1)}% Match
              </div>
            </div>
          </div>

          {/* Action Recommendation */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '0.85rem 1rem',
            borderRadius: 8,
            fontSize: '0.8rem',
            color: '#fbbf24'
          }}>
            <strong>Recommended Operational Action:</strong>{' '}
            {severity === 'CRITICAL' || severity === 'HIGH'
              ? 'P1 — Immediate inspection and cold-asphalt patch dispatch'
              : 'P2 — Scheduled maintenance within 48 hours'}
          </div>

          {/* Human in the Loop Validation (Module L) */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              Human-In-The-Loop Authority Decision (Module L)
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Confirmed and rejected decisions are piped to the feedback dataset for model fine-tuning.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn-success"
                onClick={() => handleAction('confirm')}
                disabled={loading}
              >
                <CheckCircle size={15} /> Confirm Defect
              </button>

              <button
                className="btn-danger"
                onClick={() => handleAction('reject')}
                disabled={loading}
              >
                <XCircle size={15} /> Reject (False Positive)
              </button>

              <button
                className="btn-secondary"
                onClick={() => handleAction('duplicate')}
                disabled={loading}
              >
                <Copy size={15} /> Mark Duplicate
              </button>

              <button
                className="btn-primary"
                onClick={() => handleAction('assign')}
                disabled={loading}
              >
                <Send size={15} /> Assign to BBMP
              </button>
            </div>

            {feedbackSuccess && (
              <div style={{
                marginTop: '1rem',
                padding: '0.65rem 1rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                borderRadius: 6,
                fontSize: '0.8rem',
                color: '#34d399',
                fontWeight: 600
              }}>
                {feedbackSuccess}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
