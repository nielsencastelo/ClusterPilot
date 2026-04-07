from __future__ import annotations

from clusterpilot_core.models import (
    NodeHeartbeatPayload,
    NodeListResponse,
    NodeRecord,
    NodeRegistration,
)

from ...infrastructure.repositories.memory import InMemoryNodeRepository


class NodeService:
    def __init__(self, repository: InMemoryNodeRepository) -> None:
        self.repository = repository

    def register_node(self, payload: NodeRegistration) -> NodeRecord:
        return self.repository.register(payload)

    def record_heartbeat(self, node_id: str, payload: NodeHeartbeatPayload) -> NodeRecord | None:
        return self.repository.record_heartbeat(node_id, payload)

    def list_nodes(self) -> NodeListResponse:
        items = self.repository.list()
        return NodeListResponse(items=items, total=len(items))
