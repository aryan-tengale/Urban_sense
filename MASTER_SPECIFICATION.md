# URBANSENSE AI — MASTER PRODUCT REQUIREMENTS & MVP SPECIFICATION
## SIH Problem Statement 26124 — Bharat Electronics Limited

---

# 0. DOCUMENT PURPOSE

This document is the single source of truth for building the UrbanSense AI prototype.

The system is designed for SIH Problem Statement 26124:

- Problem Statement ID: 26124
- Problem Statement Title: AI-Powered Mobile Urban Intelligence Platform Using Public Transport Fleet
- Organization: Bharat Electronics Limited (BEL)
- Department: Bharat Electronics Limited
- Category: Software
- Theme: Smart Automation

The goal is to build a credible, visually polished, technically coherent working prototype that demonstrates the core idea end-to-end:

CAMERA / ROAD VIDEO → EDGE AI → EVENT DETECTION → GPS + TIMESTAMP → EVENT INTELLIGENCE → CENTRAL BACKEND → GIS DASHBOARD → ANALYTICS → ACTIONABLE AUTHORITY RECOMMENDATION

The product must feel like a scalable government/enterprise platform rather than a collection of disconnected AI demos.

---

# 1. OFFICIAL PROBLEM CONTEXT

## Background

Urban public transport buses traverse almost every major road in a city every day. Modern buses are increasingly equipped with multiple cameras covering the front, rear, sides, and passenger cabin. However, these cameras are primarily used for recording incidents and are not leveraged as intelligent sensing platforms.

At the same time, city authorities rely on fixed CCTV cameras, manual inspections and citizen complaints to identify road defects, traffic congestion, missing infrastructure and unsafe driving behaviour.

This results in:

- Delayed response
- Incomplete situational awareness
- Inefficient maintenance planning
- Fragmented information
- Reactive rather than proactive operations

## Required solution direction

Develop an AI-powered onboard and centralized software platform that transforms public transport buses into mobile urban sensing units.

The onboard software should analyse video streams from multiple bus-mounted cameras to detect:

- Potholes
- Damaged roads
- Missing road dividers
- Missing zebra crossings
- Damaged or missing traffic signboards
- Waterlogging
- Other road hazards
- Vehicle density
- Traffic bottlenecks
- Vulnerable pedestrian situations
- Rash driving / unsafe driving
- Hit-and-run incidents
- Offending vehicle tracking
- Registration-number extraction with confidence
- Timestamp and GPS location

The system should securely share relevant alerts with a central command system.

The centralized platform should:

- Aggregate information from the entire bus fleet
- Visualize events on a GIS map
- Generate congestion heat maps
- Identify infrastructure deficiencies
- Analyse traffic patterns
- Estimate route delays
- Provide actionable insights for transport authorities

The expected solution is an edge-AI onboard processing framework integrated with a centralized urban intelligence platform.

It should generate:

- Reliable alerts
- GIS-based dashboards
- Road condition maps
- Traffic analytics
- Incident reports
- Proactive maintenance intelligence
- Improved traffic-management intelligence
- Public-safety intelligence
- Evidence-based decision support
- Low-bandwidth intelligent edge processing

---

# 2. PRODUCT VISION

## Vision Statement

Transform existing public transport buses into a distributed fleet of mobile AI sensors that continuously observe the city and convert physical-world observations into actionable urban intelligence.

## Core proposition

“Every bus becomes a moving sensor. Every journey becomes a source of urban intelligence.”

Instead of requiring massive deployment of new fixed sensing infrastructure, UrbanSense AI uses the existing public-transport fleet, onboard cameras, GPS and edge computing to create continuous city-wide situational awareness.

## Core positioning

Do NOT position the product as merely:

“AI pothole detection.”

Position it as:

“An edge-AI and centralized urban intelligence platform that transforms public transport fleets into distributed, mobile urban sensing infrastructure.”

---

# 3. KEY DESIGN PRINCIPLES

1. Edge-first
   - Process video locally whenever practical.
   - Upload events and compact evidence rather than continuous raw video.

2. Fleet intelligence
   - Use observations from multiple buses.
   - Corroborate repeated detections.
   - Build persistent city-level knowledge.

3. Actionability
   - Convert AI detections into severity, priority and recommendations.

4. Explainability
   - Show confidence, evidence, location, timestamp and reasoning signals.

5. Offline resilience
   - Bus-side system must queue events during connectivity loss.
   - Synchronize automatically when connectivity returns.

6. Human-in-the-loop
   - Allow authorities to confirm, reject or mark duplicate events.
   - Use feedback as future model-training data.

7. Privacy and security
   - Minimize unnecessary video transmission.
   - Apply role-based access.
   - Protect event/evidence records.

8. Scalable architecture
   - Prototype with one simulated/physical bus.
   - Architecture must support dozens, hundreds or thousands of buses.

---

# 4. TARGET USERS

## Primary users

### Municipal / City Authorities
Need:
- Road-condition visibility
- Infrastructure-deficiency identification
- Maintenance prioritization

### Traffic Police / Traffic Operations
Need:
- Congestion visibility
- Incident awareness
- Vehicle and traffic analytics

### Public Transport Authorities
Need:
- Fleet monitoring
- Route performance
- Delay intelligence
- Bus sensor health

### Road Maintenance Departments
Need:
- Prioritized repairs
- Historical defect persistence
- Evidence-backed maintenance decisions

### Emergency / Command Centre Operators
Need:
- Incident location
- Evidence
- Real-time event status

### Urban Planners / Analysts
Need:
- Historical traffic patterns
- Infrastructure gaps
- Route-level and road-level analytics

---

# 5. PROBLEM TO SOLUTION MAPPING

## Problem
Manual road inspection is slow.
## Solution
Continuous mobile AI observation from buses.

## Problem
Fixed CCTV gives incomplete coverage.
## Solution
Bus fleet creates moving coverage across normal routes.

## Problem
Raw camera data is expensive to transmit.
## Solution
Edge AI filters and summarizes events before upload.

## Problem
Single AI detections can be false positives.
## Solution
Multi-bus evidence fusion and human validation.

## Problem
Authorities receive alerts but not priorities.
## Solution
Road Health Score + severity + maintenance recommendation.

## Problem
Infrastructure failures are often detected after damage escalates.
## Solution
Predictive maintenance risk modelling.

---

# 6. HIGH-LEVEL SYSTEM ARCHITECTURE

BUS FLEET
  |
  +--> Front Camera
  +--> Rear Camera
  +--> Side Cameras
  +--> Optional Cabin Camera
  |
  v
EDGE AI ENGINE
  |
  +--> Road Defect Detection
  +--> Vehicle Detection / Tracking
  +--> Sign / Zebra / Divider Detection
  +--> Waterlogging Detection
  +--> Pedestrian Safety Analysis
  +--> Incident / Rash-Driving Analysis
  |
  v
EVENT INTELLIGENCE ENGINE
  |
  +--> Confidence
  +--> Severity
  +--> GPS
  +--> Timestamp
  +--> Bus ID
  +--> Route ID
  +--> Evidence extraction
  |
  v
EDGE DATA FILTER
  |
  +--> Compress evidence
  +--> Drop irrelevant frames
  +--> Queue when offline
  |
  v
4G / 5G / Wi-Fi
  |
  v
API GATEWAY / BACKEND
  |
  +--> Event Store
  +--> Fleet Store
  +--> Analytics Engine
  +--> GIS Engine
  +--> Prediction Engine
  +--> Alert Engine
  |
  v
CENTRAL COMMAND PLATFORM
  |
  +--> GIS Command Map
  +--> Road Health Dashboard
  +--> Congestion Dashboard
  +--> Incident Centre
  +--> Fleet Monitoring
  +--> Maintenance Priorities
  +--> Reports

---

# 7. CORE FUNCTIONAL MODULES

## MODULE A — Edge AI Engine
The edge device receives camera frames/video and performs AI inference locally.

### Road / infrastructure classes
Priority classes:
- Pothole
- Road crack
- Damaged road
- Waterlogging
- Road debris / obstacle
- Traffic sign
- Missing/damaged sign
- Zebra crossing
- Missing zebra crossing
- Road divider / barrier
- Missing/damaged divider

### Traffic classes
- Car
- Bus
- Truck
- Motorcycle
- Bicycle
- Auto-rickshaw
- Pedestrian

### Safety classes / behaviours
- Pedestrian near moving traffic
- School-child crossing candidate
- Wrong-way vehicle
- Rash-driving candidate
- Collision candidate
- Hit-and-run candidate

---

# 8. MODULE B — VEHICLE DETECTION, TRACKING AND COUNTING

Pipeline:
ROAD VIDEO → Object Detection → Tracking → Classification → Virtual Counting Line → Vehicle Count → Density Estimate → Congestion Score

Display:
- Cars/minute
- Buses/minute
- Bikes/minute
- Trucks/minute
- Total vehicles
- Estimated density
- Congestion level (LOW, MODERATE, HIGH, SEVERE)

---

# 9. MODULE C — GPS AND TEMPORAL CONTEXT

Every important event contains:
- event_id
- bus_id
- camera_id
- route_id
- timestamp
- latitude
- longitude
- event_type
- confidence
- severity
- evidence reference
- status

---

# 10. MODULE D — EVENT INTELLIGENCE ENGINE

Detection → Context → Confidence → Severity → Historical comparison → Geographical clustering → Event record → Action recommendation

---

# 11. ⭐ MODULE E — MULTI-BUS EVIDENCE FUSION

Multiple buses observe the same physical defect at different times.
Backend geospatially clusters observations (< 25m).
Corroborated observations fuse into ONE PERSISTENT DEFECT with boosted confidence and persistent severity rating.

---

# 12. ⭐ MODULE F — ROAD HEALTH SCORE

Generate 0-100 score for every road corridor:
Road Health Score = 100 - weighted defect severity - defect density - persistence penalty - traffic impact penalty.

---

# 13. ⭐ MODULE G — PREDICTIVE MAINTENANCE

Predicts which road segment is at highest risk of failure (%) with natural language explainability.

---

# 14. ⭐ MODULE H — EDGE BANDWIDTH OPTIMIZATION

Raw Video: ~45.2 MB
Event Data Uploaded: ~0.68 MB
Reduction: Measured 98.5% data saved.

---

# 15. MODULE I — OFFLINE-FIRST OPERATION

AI remains active during connectivity loss.
Events stored in local edge queue.
Automatic synchronization upon network restoration.

---

# 16. MODULE J — INCIDENT INTELLIGENCE & ANPR

Offending vehicle tracking, trajectory extraction, and license plate OCR (e.g. KA-01-AB-1234 @ 94% conf) with multi-frame evidence package.

---

# 17. MODULE K — CONTEXT-AWARE RISK ENGINE

Combines weather + waterlogging + traffic density + pedestrian presence into contextual safety scores.

---

# 18. MODULE L — HUMAN-IN-THE-LOOP VALIDATION

Enables authorities to [CONFIRM], [REJECT], [MARK DUPLICATE], and [ASSIGN].
Pipes verified decisions back into AI model retraining datasets.

---

# 19. MODULE M — AUTHORITY ACTION ENGINE

P1 — Immediate inspection recommended
P2 — Schedule maintenance within 48 hours
P3 — Routine monitoring

---

# 20. MODULE N — GIS COMMAND CENTRE & SCREENS

1. Command Centre (GIS map + live alerts)
2. Road Intelligence (Corridor leaderboard)
3. Incident Centre (ANPR & evidence dossiers)
4. Fleet Monitoring (Bus telemetry & network toggle)
5. Analytics (Traffic density & defect distribution)
6. Event Detail Inspector (Corroboration timeline)
7. Predictive Maintenance (14-day risk ranking)
8. Edge Device Monitor (Onboard camera viewfinder HUD & bandwidth counters)

---

# 21. MASTER 9-STEP EVALUATOR DEMO SCRIPT

Step 1: Bus fleet starts on Route 27A
Step 2: Road defect detected by BUS-104 (Pothole 94%)
Step 3: Vehicle traffic density estimated (Congestion HIGH)
Step 4: Event reaches backend & updates GIS map
Step 5: BUS-108 corroborates same location (Confidence 97%, Confirmed Persistent)
Step 6: Road Health updates (78 -> 59/100, P1 Immediate Inspection)
Step 7: Network disconnect simulated (7 events queued offline)
Step 8: Network restored (7 events auto-synchronized)
Step 9: Predictive maintenance & ANPR incident showcase
