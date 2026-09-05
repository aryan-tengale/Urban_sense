# UrbanSense AI — Mobile Urban Intelligence Platform
### SIH Problem Statement 26124 &middot; Bharat Electronics Limited (BEL)

> **Core Concept:** Transforming public transport bus fleets into distributed, mobile edge-AI urban sensing infrastructure.

---

## Quick Start Guide

### 1. Start the Backend Server (FastAPI + WebSockets)
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8000
```
- API Health Check: `http://localhost:8000/api/health`
- Interactive API Documentation (Swagger): `http://localhost:8000/docs`

### 2. Start the Frontend Dashboard (React + TypeScript + Vite)
```bash
cd frontend
npm run dev -- --port 3003
```
- Operational Command Centre: `http://localhost:3003`

### 3. Run Automated Engine Unit Tests
```bash
cd backend
venv/bin/python3 -m unittest discover -s tests -v
```

---

## Directory Structure & Key Files

```text
urbansense-ai/
├── MASTER_SPECIFICATION.md           # Master SIH 26124 BEL specification
├── AGENTS.md                         # Agent instructions & Ponytail senior dev config
├── .agents/
│   └── rules/
│       └── ponytail.md               # Ponytail ruleset (native-first, zero-bloat)
├── backend/
│   ├── server.py                     # FastAPI REST API & WebSocket gateway
│   ├── database.py                   # SQLite schema, distance math, and Bengaluru seed data
│   ├── fusion_engine.py              # Module E: Multi-bus geospatial evidence fusion (<25m)
│   ├── road_health_engine.py         # Module F & G: Road Health scoring & predictive failure risk
│   ├── edge_simulator.py             # Module H & I: Real bandwidth calculation & offline queue
│   ├── scenario_runner.py            # Section 30: 9-step evaluator presentation runner
│   ├── urbansense.db                 # SQLite database file
│   └── tests/
│       └── test_engines.py           # Automated test suite
└── frontend/
    ├── package.json
    ├── vite.config.ts                # Dev server config & proxy to backend
    ├── index.html                    # Entry HTML with Inter & JetBrains Mono fonts
    └── src/
        ├── App.tsx                   # Dashboard shell & WebSocket subscriber
        ├── index.css                 # Command & Control dark glassmorphic design system
        ├── types.ts                  # TypeScript data interfaces
        ├── api.ts                    # REST API client
        ├── components/
        │   ├── Navbar.tsx            # Operational topbar & live city KPIs
        │   └── DemoController.tsx    # Docked 9-step evaluator scenario controller
        └── screens/
            ├── CommandCentreScreen.tsx       # Screen 1: Leaflet GIS map & live alert feed
            ├── RoadIntelligenceScreen.tsx    # Screen 2: Corridor leaderboard & health dossiers
            ├── IncidentCentreScreen.tsx      # Screen 3: Incident dossiers & ANPR plate reader
            ├── FleetMonitoringScreen.tsx     # Screen 4: Bus telemetry & network toggles
            ├── AnalyticsScreen.tsx           # Screen 5: Traffic density & defect breakdown
            ├── EventDetailModal.tsx          # Screen 6: Evidence inspector & human-in-the-loop
            ├── PredictiveMaintenanceScreen.tsx # Screen 7: 14-day failure risk ranking
            └── EdgeDeviceMonitorScreen.tsx   # Screen 8: BUS-104 live camera HUD & bandwidth
```
