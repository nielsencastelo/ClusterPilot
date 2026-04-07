from __future__ import annotations

from clusterpilot_core.models import NodeCapabilities

from .inventory import collect_capabilities


class InventoryAgent:
    def collect(self) -> NodeCapabilities:
        return collect_capabilities()
