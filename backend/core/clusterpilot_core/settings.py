from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ControlPlaneSettings:
    app_name: str = "ClusterPilot Control Plane"
    api_version: str = "0.2.0"
    allowed_origins: tuple[str, ...] = (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    )


@dataclass(frozen=True)
class WorkerSettings:
    control_plane_url: str = os.getenv("CLUSTERPILOT_CONTROL_PLANE_URL", "http://localhost:8000")
    heartbeat_interval_seconds: int = int(os.getenv("CLUSTERPILOT_HEARTBEAT_SECONDS", "10"))
