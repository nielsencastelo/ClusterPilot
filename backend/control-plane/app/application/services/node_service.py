from __future__ import annotations

from clusterpilot_core.models import (
    NodeHeartbeatPayload,
    NodeListResponse,
    NodeRecord,
    NodeRegistration,
)

from ...infrastructure.repositories.sqlalchemy import SqlAlchemyNodeRepository


class NodeService:
    def __init__(self, repository: SqlAlchemyNodeRepository) -> None:
        self.repository = repository

    async def register_node(self, payload: NodeRegistration) -> NodeRecord:
        return await self.repository.register(payload)

    async def record_heartbeat(self, node_id: str, payload: NodeHeartbeatPayload) -> NodeRecord | None:
        return await self.repository.record_heartbeat(node_id, payload)

    async def list_nodes(self) -> NodeListResponse:
        items = await self.repository.list()
        return NodeListResponse(items=items, total=len(items))
