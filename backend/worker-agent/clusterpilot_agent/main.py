from __future__ import annotations

import time

from .artifact_agent import ArtifactAgent
from .config import get_config
from .control_plane import register_node
from .execution_agent import ExecutionAgent
from .heartbeat_agent import HeartbeatAgent
from .inventory_agent import InventoryAgent


def main() -> None:
    config = get_config()
    inventory_agent = InventoryAgent()
    heartbeat_agent = HeartbeatAgent()
    execution_agent = ExecutionAgent()
    artifact_agent = ArtifactAgent()

    print(f"ClusterPilot worker agent starting for node '{config.node_id}'")
    inventory_agent.collect()
    execution_agent.prepare_workspace("bootstrap")
    artifact_agent.resolve_artifact_dir("bootstrap")
    register_node(config)
    while True:
        heartbeat_agent.send(config)
        print("Heartbeat sent successfully.")
        time.sleep(config.heartbeat_interval_seconds)


if __name__ == "__main__":
    main()
