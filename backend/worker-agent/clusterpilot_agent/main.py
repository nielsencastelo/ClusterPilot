from __future__ import annotations

import time

from .config import get_config
from .control_plane import register_node, send_heartbeat


def main() -> None:
    config = get_config()
    print(f"ClusterPilot worker agent starting for node '{config.node_id}'")
    register_node(config)
    while True:
        send_heartbeat(config)
        print("Heartbeat sent successfully.")
        time.sleep(config.heartbeat_interval_seconds)


if __name__ == "__main__":
    main()
