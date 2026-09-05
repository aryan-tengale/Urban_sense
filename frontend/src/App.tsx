import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DemoController } from './components/DemoController';
import { CommandCentreScreen } from './screens/CommandCentreScreen';
import { RoadIntelligenceScreen } from './screens/RoadIntelligenceScreen';
import { IncidentCentreScreen } from './screens/IncidentCentreScreen';
import { FleetMonitoringScreen } from './screens/FleetMonitoringScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { PredictiveMaintenanceScreen } from './screens/PredictiveMaintenanceScreen';
import { EdgeDeviceMonitorScreen } from './screens/EdgeDeviceMonitorScreen';
import { EventDetailModal } from './screens/EventDetailModal';

import { Bus, RoadSegment, Cluster, EventItem, Incident, SummaryMetrics, EdgeStats, DemoState } from './types';
import { api } from './api';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<string>('command_centre');
  const [wsConnected, setWsConnected] = useState(false);

  // Core Data States
  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [edgeStats, setEdgeStats] = useState<EdgeStats | null>(null);
  const [demoState, setDemoState] = useState<DemoState | null>(null);

  // Inspector Modal
  const [selectedEvent, setSelectedEvent] = useState<EventItem | Cluster | null>(null);

  // Fetch all state from API
  const refreshData = useCallback(async () => {
    try {
      const [sum, bList, rList, cList, eList, iList, eStat, dState] = await Promise.all([
        api.getSummary(),
        api.getBuses(),
        api.getRoads(),
        api.getClusters(),
        api.getEvents(50),
        api.getIncidents(),
        api.getEdgeStats(),
        api.getDemoState()
      ]);

      setMetrics(sum);
      setBuses(bList);
      setRoads(rList);
      setClusters(cList);
      setEvents(eList);
      setIncidents(iList);
      setEdgeStats(eStat);
      setDemoState(dState);
    } catch (e) {
      console.error('Error fetching UrbanSense telemetry:', e);
    }
  }, []);

  // Initial load & Polling fallback
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // WebSocket Live Telemetry Connection
  useEffect(() => {
    let ws: WebSocket;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => {
          setWsConnected(false);
          setTimeout(connectWs, 3000);
        };
        ws.onerror = () => ws.close();
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // On any live broadcast, refresh telemetry
            refreshData();
            if (data.type === 'DEMO_STEP_TRIGGERED' && data.data?.metadata?.highlight_screen) {
              setCurrentScreen(data.data.metadata.highlight_screen);
            }
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };
      } catch (e) {
        console.error('WS connect failed:', e);
      }
    };

    connectWs();
    return () => {
      if (ws) ws.close();
    };
  }, [refreshData]);

  // Handle Demo step click
  const handleStepChanged = (step: number, highlightScreen?: string) => {
    refreshData();
    if (highlightScreen) {
      setCurrentScreen(highlightScreen);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Navigation */}
      <Navbar
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        metrics={metrics}
        wsConnected={wsConnected}
      />

      {/* Evaluator 9-Step Demo Banner */}
      <DemoController
        demoState={demoState}
        onStepChanged={handleStepChanged}
      />

      {/* Main Screen Content */}
      <main style={{ flex: 1, padding: '1rem 1.5rem', overflow: 'hidden' }}>
        {currentScreen === 'command_centre' && (
          <CommandCentreScreen
            buses={buses}
            roads={roads}
            clusters={clusters}
            events={events}
            metrics={metrics}
            onSelectEvent={setSelectedEvent}
            onSelectRoad={() => setCurrentScreen('road_intelligence')}
          />
        )}

        {currentScreen === 'road_intelligence' && (
          <RoadIntelligenceScreen
            roads={roads}
            clusters={clusters}
            onSelectCluster={setSelectedEvent}
          />
        )}

        {currentScreen === 'incident_centre' && (
          <IncidentCentreScreen
            incidents={incidents}
          />
        )}

        {currentScreen === 'fleet_monitoring' && (
          <FleetMonitoringScreen
            buses={buses}
            onRefresh={refreshData}
          />
        )}

        {currentScreen === 'analytics' && (
          <AnalyticsScreen
            roads={roads}
            clusters={clusters}
            metrics={metrics}
          />
        )}

        {currentScreen === 'predictive_maintenance' && (
          <PredictiveMaintenanceScreen
            roads={roads}
          />
        )}

        {currentScreen === 'edge_monitor' && (
          <EdgeDeviceMonitorScreen
            edgeStats={edgeStats}
            onRefresh={refreshData}
          />
        )}
      </main>

      {/* Event Detail Inspector Modal */}
      {selectedEvent && (
        <EventDetailModal
          item={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={() => {
            setSelectedEvent(null);
            refreshData();
          }}
        />
      )}
    </div>
  );
};

export default App;
