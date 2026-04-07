from __future__ import annotations

import os
import socket
from dataclasses import dataclass


@dataclass
class AgentConfig:
    control_plane_url: str = os.getenv("CLUSTERPILOT_CONTROL_PLANE_URL", "http://localhost:8000")
    node_id: str = os.getenv("CLUSTERPILOT_NODE_ID", socket.gethostname().lower())
    node_name: str = os.getenv("CLUSTERPILOT_NODE_NAME", socket.gethostname())
    heartbeat_interval_seconds: int = int(os.getenv("CLUSTERPILOT_HEARTBEAT_SECONDS", "10"))


def get_config() -> AgentConfig:
    return AgentConfig()
