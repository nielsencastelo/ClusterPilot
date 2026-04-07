from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ControlPlaneSettings:
    app_name: str = "ClusterPilot Control Plane"
    api_version: str = "0.2.0"
    database_url: str = os.getenv(
        "CLUSTERPILOT_DATABASE_URL",
        "postgresql+asyncpg://clusterpilot:clusterpilot@postgres:5432/clusterpilot",
    )
    celery_broker_url: str = os.getenv(
        "CLUSTERPILOT_CELERY_BROKER_URL",
        "redis://redis:6379/0",
    )
    celery_result_backend: str = os.getenv(
        "CLUSTERPILOT_CELERY_RESULT_BACKEND",
        "redis://redis:6379/1",
    )
    knowledge_storage_path: str = os.getenv(
        "CLUSTERPILOT_KNOWLEDGE_STORAGE_PATH",
        "/data/knowledge",
    )
    allowed_origins: tuple[str, ...] = (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    )


@dataclass(frozen=True)
class WorkerSettings:
    control_plane_url: str = os.getenv("CLUSTERPILOT_CONTROL_PLANE_URL", "http://localhost:8000")
    heartbeat_interval_seconds: int = int(os.getenv("CLUSTERPILOT_HEARTBEAT_SECONDS", "10"))
