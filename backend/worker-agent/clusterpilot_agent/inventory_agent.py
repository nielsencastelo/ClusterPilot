from __future__ import annotations

from .bootstrap import configure_local_paths

configure_local_paths()

from clusterpilot_core.models import NodeCapabilities

from .inventory import collect_capabilities


class InventoryAgent:
    def collect(self) -> NodeCapabilities:
        return collect_capabilities()
