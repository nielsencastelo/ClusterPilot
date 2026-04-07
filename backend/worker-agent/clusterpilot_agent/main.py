from __future__ import annotations

import time
from urllib.error import URLError

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

    while True:
        try:
            register_node(config)
            print("Worker registered successfully.")
            break
        except URLError as exc:
            print(f"Control plane unavailable during registration: {exc}. Retrying in 5 seconds.")
            time.sleep(5)

    while True:
        try:
            heartbeat_agent.send(config)
            print("Heartbeat sent successfully.")
        except URLError as exc:
            print(f"Heartbeat failed: {exc}. Retrying in {config.heartbeat_interval_seconds} seconds.")
        time.sleep(config.heartbeat_interval_seconds)


if __name__ == "__main__":
    main()
