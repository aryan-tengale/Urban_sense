"""
UrbanSense AI - Edge Device Simulator & Bandwidth Optimizer (Modules B, H, I & Screen 8)
Simulates edge AI processing on public transit buses:
- Vehicle classification and virtual counting line
- Congestion state estimation
- Edge bandwidth reduction measurement (Raw 1080p stream vs compact event metadata)
- Offline queuing and automatic synchronization
"""

import json
import time
from datetime import datetime, timezone
from database import get_db

# Constants for real bandwidth modeling
RAW_VIDEO_BYTES_PER_SECOND = 562500  # ~4.5 Mbps 1080p 30fps H.264
COMPACT_EVENT_METADATA_BYTES = 850   # Structured JSON alert
COMPACT_KEYFRAME_BYTES = 48000       # Optimized 640x360 WebP/JPEG crop

class EdgeDeviceSimulator:
    def __init__(self, bus_id: str = "BUS-104"):
        self.bus_id = bus_id
        self.start_time = time.time()
        self.total_frames_processed = 3600
        self.events_extracted_count = 14
        self.raw_bytes_accumulated = 45200000
        self.event_bytes_accumulated = 680000

    def update_bandwidth_stats(self, seconds_elapsed: float, new_events_count: int = 0) -> dict:
        """Accurately calculates real measured bandwidth saved."""
        self.raw_bytes_accumulated += int(seconds_elapsed * RAW_VIDEO_BYTES_PER_SECOND)
        self.total_frames_processed += int(seconds_elapsed * 30)

        if new_events_count > 0:
            self.events_extracted_count += new_events_count
            self.event_bytes_accumulated += new_events_count * (
                COMPACT_EVENT_METADATA_BYTES + COMPACT_KEYFRAME_BYTES
            )

        saved_bytes = max(0, self.raw_bytes_accumulated - self.event_bytes_accumulated)
        saved_pct = round((saved_bytes / self.raw_bytes_accumulated) * 100.0, 2) if self.raw_bytes_accumulated > 0 else 98.5

        return {
            "bus_id": self.bus_id,
            "raw_video_mb": round(self.raw_bytes_accumulated / (1024 * 1024), 2),
            "event_data_mb": round(self.event_bytes_accumulated / (1024 * 1024), 2),
            "bandwidth_saved_mb": round(saved_bytes / (1024 * 1024), 2),
            "bandwidth_saved_pct": saved_pct,
            "frames_processed": self.total_frames_processed,
            "events_extracted": self.events_extracted_count
        }

    def get_vehicle_analytics(self) -> dict:
        """Simulates onboard real-time vehicle detection and counting line."""
        # Realistic urban traffic numbers for Bangalore arterial roads
        cars = 16
        buses = 3
        bikes = 28
        trucks = 2
        total = cars + buses + bikes + trucks
        density_est = "78 veh/km"
        congestion = "HIGH"

        return {
            "cars_per_min": cars,
            "buses_per_min": buses,
            "bikes_per_min": bikes,
            "trucks_per_min": trucks,
            "total_vehicles_per_min": total,
            "density_estimate": density_est,
            "congestion_level": congestion
        }

    def set_network_state(self, status: str) -> dict:
        """Toggles network between ONLINE and OFFLINE."""
        conn = get_db()
        c = conn.cursor()
        c.execute("""
        UPDATE buses
        SET network_status = ?
        WHERE bus_id = ?
        """, (status.upper(), self.bus_id))
        conn.commit()

        c.execute("SELECT * FROM buses WHERE bus_id = ?", (self.bus_id,))
        bus = dict(c.fetchone())
        conn.close()
        return bus

    def queue_offline_event(self, event_data: dict) -> dict:
        """Queues an event in local edge storage when network is offline."""
        conn = get_db()
        c = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()

        c.execute("""
        INSERT INTO sync_queue (bus_id, payload_json, queued_at)
        VALUES (?, ?, ?)
        """, (self.bus_id, json.dumps(event_data), now))

        # Update bus queued counter
        c.execute("""
        UPDATE buses
        SET events_queued = events_queued + 1
        WHERE bus_id = ?
        """, (self.bus_id,))

        c.execute("SELECT events_queued FROM buses WHERE bus_id = ?", (self.bus_id,))
        row = c.fetchone()
        queued_count = row[0] if row else 1

        conn.commit()
        conn.close()

        # Update bandwidth stats
        self.update_bandwidth_stats(1.0, new_events_count=1)

        return {
            "status": "QUEUED_OFFLINE",
            "bus_id": self.bus_id,
            "events_queued": queued_count,
            "timestamp": now
        }

    def sync_queued_events(self) -> dict:
        """Flushes local edge queue to the central backend upon network reconnection."""
        conn = get_db()
        c = conn.cursor()

        c.execute("""
        SELECT queue_id, payload_json, queued_at
        FROM sync_queue
        WHERE bus_id = ? AND synced_at IS NULL
        """, (self.bus_id,))
        queued_rows = c.fetchall()

        synced_events = []
        now = datetime.now(timezone.utc).isoformat()

        for row in queued_rows:
            evt = json.loads(row["payload_json"])
            synced_events.append(evt)
            c.execute("""
            UPDATE sync_queue
            SET synced_at = ?
            WHERE queue_id = ?
            """, (now, row["queue_id"]))

        # Reset queued count on bus and set last_sync
        c.execute("""
        UPDATE buses
        SET events_queued = 0, last_sync = ?, network_status = 'ONLINE'
        WHERE bus_id = ?
        """, (now, self.bus_id))

        conn.commit()
        conn.close()

        return {
            "status": "SYNCHRONIZED",
            "bus_id": self.bus_id,
            "synced_count": len(synced_events),
            "timestamp": now,
            "events": synced_events
        }

# Global simulator instance
edge_simulator = EdgeDeviceSimulator("BUS-104")
