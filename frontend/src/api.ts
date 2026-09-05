import { Bus, RoadSegment, Cluster, EventItem, Incident, SummaryMetrics, EdgeStats, DemoState, AnalysisResult, AnalysisSummary } from './types';

const API_BASE = '/api';

export const api = {
  getSummary: async (): Promise<SummaryMetrics> => {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    return res.json();
  },

  getBuses: async (): Promise<Bus[]> => {
    const res = await fetch(`${API_BASE}/buses`);
    return res.json();
  },

  toggleBusNetwork: async (busId: string, status: 'ONLINE' | 'OFFLINE'): Promise<Bus> => {
    const res = await fetch(`${API_BASE}/buses/${busId}/network`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  getRoads: async (): Promise<RoadSegment[]> => {
    const res = await fetch(`${API_BASE}/roads`);
    return res.json();
  },

  getRoadHealth: async (roadId: string): Promise<RoadSegment & { clusters: Cluster[] }> => {
    const res = await fetch(`${API_BASE}/roads/${roadId}/health`);
    return res.json();
  },

  getEvents: async (limit = 50): Promise<EventItem[]> => {
    const res = await fetch(`${API_BASE}/events?limit=${limit}`);
    return res.json();
  },

  getEventDetail: async (eventId: string): Promise<EventItem> => {
    const res = await fetch(`${API_BASE}/events/${eventId}`);
    return res.json();
  },

  confirmEvent: async (eventId: string, department = 'BBMP Road Maintenance', notes = '') => {
    const res = await fetch(`${API_BASE}/events/${eventId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department, notes })
    });
    return res.json();
  },

  rejectEvent: async (eventId: string, department = 'BBMP Road Maintenance', notes = '') => {
    const res = await fetch(`${API_BASE}/events/${eventId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department, notes })
    });
    return res.json();
  },

  duplicateEvent: async (eventId: string) => {
    const res = await fetch(`${API_BASE}/events/${eventId}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return res.json();
  },

  assignEvent: async (eventId: string, department: string) => {
    const res = await fetch(`${API_BASE}/events/${eventId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department })
    });
    return res.json();
  },

  getClusters: async (): Promise<Cluster[]> => {
    const res = await fetch(`${API_BASE}/clusters`);
    return res.json();
  },

  getIncidents: async (): Promise<Incident[]> => {
    const res = await fetch(`${API_BASE}/incidents`);
    return res.json();
  },

  getEdgeStats: async (): Promise<EdgeStats> => {
    const res = await fetch(`${API_BASE}/edge/stats`);
    return res.json();
  },

  queueOfflineEvent: async () => {
    const res = await fetch(`${API_BASE}/edge/queue`, { method: 'POST' });
    return res.json();
  },

  syncEdgeEvents: async () => {
    const res = await fetch(`${API_BASE}/edge/sync`, { method: 'POST' });
    return res.json();
  },

  getDemoState: async (): Promise<DemoState> => {
    const res = await fetch(`${API_BASE}/demo/state`);
    return res.json();
  },

  triggerDemoStep: async (step: number) => {
    const res = await fetch(`${API_BASE}/demo/step/${step}`, { method: 'POST' });
    return res.json();
  },

  resetDemo: async () => {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    return res.json();
  },

  // Footage Upload & Vision AI Analysis
  uploadFootage: async (file: File, busId = 'BUS-UPLOAD', roadId?: string): Promise<AnalysisResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bus_id', busId);
    if (roadId) formData.append('road_id', roadId);

    const res = await fetch(`${API_BASE}/footage/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  getAnalyses: async (): Promise<AnalysisSummary[]> => {
    const res = await fetch(`${API_BASE}/footage/analyses`);
    return res.json();
  },

  getAnalysisDetail: async (analysisId: string): Promise<AnalysisResult> => {
    const res = await fetch(`${API_BASE}/footage/analyses/${analysisId}`);
    return res.json();
  },
};

