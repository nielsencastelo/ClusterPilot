from __future__ import annotations

from clusterpilot_core.models import NodeHeartbeat


class TelemetryAgent:
    def collect_runtime_heartbeat(self) -> NodeHeartbeat:
        return NodeHeartbeat(
            cpu_percent=None,
            memory_percent=None,
            gpu_percent=None,
            active_jobs=0,
            message="worker-agent heartbeat",
        )
