import React, { useState, useEffect } from 'react';
import { HardDrive, Wifi, WifiOff, Camera, Cpu, Activity, Zap, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { EdgeStats } from '../types';
import { api } from '../api';

interface EdgeDeviceMonitorScreenProps {
  edgeStats: EdgeStats | null;
  onRefresh: () => void;
}

export const EdgeDeviceMonitorScreen: React.FC<EdgeDeviceMonitorScreenProps> = ({ edgeStats, onRefresh }) => {
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isOnline = edgeStats?.bus.network_status === 'ONLINE';

  const handleToggleNetwork = async () => {
    if (!edgeStats) return;
    setLoading(true);
    try {
      const nextStatus = isOnline ? 'OFFLINE' : 'ONLINE';
      await api.toggleBusNetwork(edgeStats.bus.bus_id, nextStatus);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQueueOfflineEvent = async () => {
    setLoading(true);
    try {
      await api.queueOfflineEvent();
      setSyncStatusMsg('Event stored in local edge queue buffer.');
      setTimeout(() => setSyncStatusMsg(null), 3500);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncEvents = async () => {
    setLoading(true);
    try {
      const res = await api.syncEdgeEvents();
      setSyncStatusMsg(`${res.synced_count} queued events flushed & synchronized to backend ✓`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.25rem', height: 'calc(100vh - 125px)' }}>
      {/* Left Column: Live Edge Viewfinder & YOLO AI Detection */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardDrive size={18} color="#38bdf8" />
              BUS-104 ONBOARD EDGE AI VIEWFINDER
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Front 1080p camera feed &middot; INT8 quantized real-time object detection
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.5rem', borderRadius: 4 }}>
              INFERENCE: {edgeStats?.edge_ai.inference_fps || 29.2} FPS
            </span>
          </div>
        </div>

        {/* Viewfinder Canvas Simulation */}
        <div style={{
          flex: 1,
          background: '#070b14',
          borderRadius: 12,
          border: '1px solid var(--border-medium)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
        }}>
          {/* Animated SVG Camera Simulator */}
          <svg width="100%" height="100%" viewBox="0 0 640 360" style={{ display: 'block' }}>
            {/* Asphalt road perspective */}
            <polygon points="120,360 270,140 370,140 520,360" fill="#131b2e" />
            <line x1="320" y1="140" x2="320" y2="360" stroke="#fbbf24" strokeWidth="2" strokeDasharray="12 8" />

            {/* Virtual Vehicle Counting Line */}
            <line x1="160" y1="280" x2="480" y2="280" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="160" y="260" width="130" height="18" fill="rgba(6, 182, 212, 0.85)" rx="2" />
            <text x="225" y="273" fontFamily="monospace" fontSize="10" fontWeight="bold" fill="#042f2e" textAnchor="middle">
              VIRTUAL COUNT LINE
            </text>

            {/* Sensed Pothole with Bounding Box */}
            <rect x="240" y="220" width="140" height="60" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 3" />
            <rect x="240" y="202" width="115" height="18" fill="#f59e0b" rx="2" />
            <text x="297" y="215" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#1e1000" textAnchor="middle">
              POTHOLE 96.4%
            </text>

            {/* Ahead Vehicle 1: Car */}
            <rect x="330" y="150" width="80" height="55" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="330" y="136" width="65" height="14" fill="#0284c7" rx="2" />
            <text x="362" y="147" fontFamily="sans-serif" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">
              CAR 94%
            </text>

            {/* Ahead Vehicle 2: Two Wheeler */}
            <rect x="250" y="170" width="30" height="45" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" />
            <rect x="250" y="158" width="48" height="12" fill="#059669" rx="2" />
            <text x="274" y="167" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">
              BIKE 91%
            </text>

            {/* HUD Reticle Overlay */}
            <circle cx="320" cy="180" r="14" fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
            <line x1="300" y1="180" x2="340" y2="180" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
            <line x1="320" y1="160" x2="320" y2="200" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />

            {/* HUD Telemetry text */}
            <text x="15" y="25" fontFamily="monospace" fontSize="11" fill="#38bdf8">BUS-104 &middot; CAM-FRONT (1080p@30)</text>
            <text x="15" y="42" fontFamily="monospace" fontSize="10" fill="#94a3b8">LAT 12.9750° LON 77.6080° &middot; SPEED 32 KM/H</text>
            <text x="15" y="345" fontFamily="monospace" fontSize="11" fill="#10b981">MODEL: YOLO-v8n-INT8 &middot; LATENCY 14.2ms</text>
          </svg>
        </div>

        {/* Live Traffic Density Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
          <div className="glass-card" style={{ textAlign: 'center', padding: '0.65rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CARS / MIN</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
              {edgeStats?.traffic.cars_per_min || 16}
            </div>
          </div>

          <div className="glass-card" style={{ textAlign: 'center', padding: '0.65rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>BIKES / MIN</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
              {edgeStats?.traffic.bikes_per_min || 28}
            </div>
          </div>

          <div className="glass-card" style={{ textAlign: 'center', padding: '0.65rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>BUSES / MIN</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>
              {edgeStats?.traffic.buses_per_min || 3}
            </div>
          </div>

          <div className="glass-card" style={{ textAlign: 'center', padding: '0.65rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CONGESTION</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'monospace' }}>
              {edgeStats?.traffic.congestion_level || 'HIGH'}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Bandwidth Optimization & Offline Resilience */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Module H: Bandwidth Savings Card */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 800, letterSpacing: '0.05em' }}>
            MODULE H &middot; BANDWIDTH OPTIMIZATION
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
            Measured Edge Bandwidth Savings
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', marginBottom: '1rem' }}>
            Calculated live: Raw continuous 1080p stream vs. event-only structured payload
          </p>

          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 12,
            padding: '1rem',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', color: '#34d399' }}>
              {edgeStats?.bandwidth.bandwidth_saved_pct || 98.5}%
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
              REDUCTION IN CELLULAR DATA CONSUMPTION
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
            <div className="glass-card">
              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>RAW VIDEO (UNFILTERED)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: '#fb7185' }}>
                {edgeStats?.bandwidth.raw_video_mb || 45.2} MB
              </div>
            </div>

            <div className="glass-card">
              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>EVENT METADATA UPLOADED</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: '#34d399' }}>
                {edgeStats?.bandwidth.event_data_mb || 0.68} MB
              </div>
            </div>
          </div>
        </div>

        {/* Module I: Offline-First Operation & Queueing */}
        <div className="glass-panel" style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.05em' }}>
            MODULE I &middot; OFFLINE-FIRST RESILIENCE
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
            Network Dead Zone Simulation
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', marginBottom: '1rem' }}>
            When 4G is lost in tunnels, AI queues events locally and synchronizes on reconnect.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(13, 19, 31, 0.7)',
            padding: '0.85rem',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CELLULAR LINK</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: isOnline ? '#34d399' : '#fb7185' }}>
                {edgeStats?.bus.network_status || 'ONLINE'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>QUEUED IN EDGE BUFFER</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: '#fbbf24' }}>
                {edgeStats?.bus.events_queued || 0} events
              </div>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button
              className={isOnline ? 'btn-danger' : 'btn-success'}
              onClick={handleToggleNetwork}
              disabled={loading}
              style={{ justifyContent: 'center' }}
            >
              {isOnline ? <WifiOff size={15} /> : <Wifi size={15} />}
              {isOnline ? 'Simulate Dead Zone (Go Offline)' : 'Restore Network Connection'}
            </button>

            {!isOnline && (
              <button
                className="btn-secondary"
                onClick={handleQueueOfflineEvent}
                disabled={loading}
                style={{ justifyContent: 'center' }}
              >
                Trigger Offline Defect (Queue Event)
              </button>
            )}

            {isOnline && (edgeStats?.bus.events_queued || 0) > 0 && (
              <button
                className="btn-primary"
                onClick={handleSyncEvents}
                disabled={loading}
                style={{ justifyContent: 'center' }}
              >
                Flush Queue & Synchronize Now
              </button>
            )}
          </div>

          {syncStatusMsg && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: 8,
              fontSize: '0.8rem',
              color: '#34d399',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {syncStatusMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
