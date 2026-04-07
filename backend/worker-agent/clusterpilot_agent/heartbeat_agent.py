from __future__ import annotations

from .config import AgentConfig
from .control_plane import send_heartbeat


class HeartbeatAgent:
    def send(self, config: AgentConfig) -> dict:
        return send_heartbeat(config)
