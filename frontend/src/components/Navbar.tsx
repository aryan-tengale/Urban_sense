import React from 'react';
import { Shield, Activity, Wifi, WifiOff, HardDrive, AlertTriangle, Layers, Car, Wrench, Eye } from 'lucide-react';
import { SummaryMetrics } from '../types';

interface NavbarProps {
  currentScreen: string;
  onSelectScreen: (screen: string) => void;
  metrics: SummaryMetrics | null;
  wsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onSelectScreen,
  metrics,
  wsConnected
}) => {
  return (
    <header className="topbar">
      {/* Brand & BEL Info */}
      <div className="brand-badge">
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'
        }}>
          <Eye size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              URBANSENSE <span style={{ color: '#38bdf8' }}>AI</span>
            </span>
            <span className="bel-tag">SIH 26124 &middot; BEL</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            Mobile Urban Sensing Fleet &middot; Edge Intelligence Platform
          </div>
        </div>
      </div>

      {/* Screen Navigation Tabs */}
      <nav className="nav-tabs" aria-label="Operational views">
        <button
          className={`nav-tab-btn ${currentScreen === 'command_centre' ? 'active' : ''}`}
          onClick={() => onSelectScreen('command_centre')}
          title="GIS Command Map"
        >
          <Layers size={15} /> Command Map
        </button>

        <button
          className={`nav-tab-btn ${currentScreen === 'road_intelligence' ? 'active' : ''}`}
          onClick={() => onSelectScreen('road_intelligence')}
          title="Road Health Index"
        >
          <Activity size={15} /> Road Health
        </button>

        <button
          className={`nav-tab-btn ${currentScreen === 'incident_centre' ? 'active' : ''}`}
          onClick={() => onSelectScreen('incident_centre')}
          title="Incident Centre & ANPR"
        >
          <Shield size={15} /> Incidents & ANPR
        </button>

        <button
          className={`nav-tab-btn ${currentScreen === 'fleet_monitoring' ? 'active' : ''}`}
          onClick={() => onSelectScreen('fleet_monitoring')}
          title="Fleet Bus Health"
        >
          <Car size={15} /> Fleet Telemetry
        </button>

        <button
          className={`nav-tab-btn ${currentScreen === 'predictive_maintenance' ? 'active' : ''}`}
          onClick={() => onSelectScreen('predictive_maintenance')}
          title="Predictive Maintenance"
        >
          <Wrench size={15} /> Predictive Risk
        </button>

        <button
          className={`nav-tab-btn ${currentScreen === 'edge_monitor' ? 'active' : ''}`}
          onClick={() => onSelectScreen('edge_monitor')}
          title="BUS-104 Onboard Edge AI"
        >
          <HardDrive size={15} /> Edge Hardware HUD
        </button>
      </nav>

      {/* Real-time Telemetry Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* City Road Health Score */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(19, 27, 44, 0.7)',
          padding: '0.35rem 0.75rem',
          borderRadius: 8,
          border: '1px solid rgba(56, 189, 248, 0.2)'
        }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>CITY ROAD HEALTH</span>
          <span style={{
            fontSize: '0.95rem',
            fontFamily: 'monospace',
            fontWeight: 800,
            color: (metrics?.avg_city_road_health || 65) < 60 ? '#f43f5e' : '#fbbf24'
          }}>
            {metrics?.avg_city_road_health || 65}/100
          </span>
        </div>

        {/* Bandwidth Savings */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '0.35rem 0.75rem',
          borderRadius: 8
        }}>
          <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>BANDWIDTH SAVED</span>
          <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 800, color: '#34d399' }}>
            {metrics?.bandwidth_saved_pct || 98.5}%
          </span>
        </div>

        {/* Live Stream / WebSocket Connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} title={wsConnected ? 'Telemetry Gateway Connected' : 'Telemetry Gateway Reconnecting'}>
          <div className={wsConnected ? 'pulse-online' : 'pulse-offline'} />
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
            {wsConnected ? 'LIVE FEED' : 'CONNECTING'}
          </span>
        </div>
      </div>
    </header>
  );
};
