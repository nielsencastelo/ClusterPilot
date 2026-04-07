from __future__ import annotations

import json
from urllib import request

from .bootstrap import configure_local_paths

configure_local_paths()

from clusterpilot_contracts.models import NodeHeartbeat, NodeHeartbeatPayload, NodeRegistration, NodeStatus

from .config import AgentConfig
from .inventory import collect_capabilities


def _post_json(url: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def register_node(config: AgentConfig) -> dict:
    payload = NodeRegistration(
        node_id=config.node_id,
        name=config.node_name,
        address=config.node_name,
        tags=["worker", "local"],
        capabilities=collect_capabilities(),
    )
    return _post_json(
        f"{config.control_plane_url}/api/v1/nodes/register",
        payload.model_dump(mode="json"),
    )


def send_heartbeat(config: AgentConfig) -> dict:
    payload = NodeHeartbeatPayload(
        status=NodeStatus.ONLINE,
        heartbeat=NodeHeartbeat(
            cpu_percent=None,
            memory_percent=None,
            gpu_percent=None,
            active_jobs=0,
            message="worker-agent heartbeat",
        ),
    )
    return _post_json(
        f"{config.control_plane_url}/api/v1/nodes/{config.node_id}/heartbeat",
        payload.model_dump(mode="json"),
    )
