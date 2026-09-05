import React, { useState } from 'react';
import { Bus as BusIcon, Wifi, WifiOff, Camera, Cpu, Activity, RefreshCw } from 'lucide-react';
import { Bus } from '../types';
import { api } from '../api';

interface FleetMonitoringScreenProps {
  buses: Bus[];
  onRefresh: () => void;
}

export const FleetMonitoringScreen: React.FC<FleetMonitoringScreenProps> = ({ buses, onRefresh }) => {
  const [togglingBus, setTogglingBus] = useState<string | null>(null);

  const handleToggleNetwork = async (busId: string, currentStatus: string) => {
    setTogglingBus(busId);
    try {
      const nextStatus = currentStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
      await api.toggleBusNetwork(busId, nextStatus);
      onRefresh();
    } catch (e) {
      console.error('Failed to toggle network:', e);
    } finally {
      setTogglingBus(null);
    }
  };

  const activeCount = buses.filter(b => b.status === 'ACTIVE').length;
  const offlineCount = buses.filter(b => b.network_status === 'OFFLINE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'calc(100vh - 125px)' }}>
      {/* Fleet Top Stats */}
      <div className="hud-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="hud-metric">
          <div className="hud-label">Total Mobile Sensing Units</div>
          <div className="hud-value" style={{ color: '#38bdf8' }}>{buses.length} Buses</div>
        </div>

        <div className="hud-metric emerald">
          <div className="hud-label">Operational & Streaming</div>
          <div className="hud-value" style={{ color: '#34d399' }}>{activeCount} Active</div>
        </div>

        <div className="hud-metric rose">
          <div className="hud-label">Offline / Local Buffering</div>
          <div className="hud-value" style={{ color: offlineCount > 0 ? '#fb7185' : '#64748b' }}>
            {offlineCount} {offlineCount === 1 ? 'Bus' : 'Buses'}
          </div>
        </div>

        <div className="hud-metric">
          <div className="hud-label">Average Inference Speed</div>
          <div className="hud-value" style={{ color: '#fbbf24' }}>28.9 FPS</div>
        </div>
      </div>

      {/* Fleet Telemetry Roster Table */}
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
              DISTRIBUTED SENSING FLEET TELEMETRY
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Real-time hardware, network resilience, and edge AI health
            </p>
          </div>

          <button className="btn-secondary" onClick={onRefresh} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
            <RefreshCw size={14} /> Refresh Roster
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8', background: 'rgba(7, 10, 17, 0.4)' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>BUS IDENTIFIER</th>
                <th style={{ padding: '0.85rem 1rem' }}>ROUTE</th>
                <th style={{ padding: '0.85rem 1rem' }}>NETWORK</th>
                <th style={{ padding: '0.85rem 1rem' }}>CAMERA STATUS</th>
                <th style={{ padding: '0.85rem 1rem' }}>EDGE INFERENCE</th>
                <th style={{ padding: '0.85rem 1rem' }}>QUEUED OFFLINE</th>
                <th style={{ padding: '0.85rem 1rem' }}>CPU / GPU</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>SIMULATE RESILIENCE</th>
              </tr>
            </thead>
            <tbody>
              {buses.map(bus => {
                const isOnline = bus.network_status === 'ONLINE';
                return (
                  <tr
                    key={bus.bus_id}
                    style={{
                      borderBottom: '1px solid rgba(56, 189, 248, 0.07)',
                      background: !isOnline ? 'rgba(244, 63, 94, 0.05)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BusIcon size={16} color={isOnline ? '#38bdf8' : '#f43f5e'} />
                        {bus.bus_id}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge-medium">Route {bus.route_id}</span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {isOnline ? <Wifi size={14} color="#10b981" /> : <WifiOff size={14} color="#f43f5e" />}
                        <span style={{ fontWeight: 700, color: isOnline ? '#34d399' : '#fb7185' }}>
                          {bus.network_status}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1' }}>
                        <Camera size={14} color="#38bdf8" />
                        {bus.camera_status}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#f8fafc' }}>
                      {bus.inference_fps} FPS
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: 4,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        background: bus.events_queued > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: bus.events_queued > 0 ? '#fbbf24' : '#64748b'
                      }}>
                        {bus.events_queued} events
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {bus.cpu_pct}% / {bus.gpu_pct}%
                    </td>

                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <button
                        className={isOnline ? 'btn-danger' : 'btn-success'}
                        onClick={() => handleToggleNetwork(bus.bus_id, bus.network_status)}
                        disabled={togglingBus === bus.bus_id}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        {isOnline ? 'Cut Network (Offline)' : 'Restore Network (Sync)'}
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
