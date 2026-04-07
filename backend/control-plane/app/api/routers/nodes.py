from fastapi import APIRouter, HTTPException, status

from clusterpilot_core.models import (
    NodeHeartbeatPayload,
    NodeListResponse,
    NodeRecord,
    NodeRegistration,
)

from ...dependencies import NodeServiceDep

router = APIRouter(prefix="/api/v1/nodes", tags=["nodes"])


@router.get("", response_model=NodeListResponse)
async def list_nodes(service: NodeServiceDep) -> NodeListResponse:
    return await service.list_nodes()


@router.post("/register", response_model=NodeRecord, status_code=status.HTTP_201_CREATED)
async def register_node(payload: NodeRegistration, service: NodeServiceDep) -> NodeRecord:
    return await service.register_node(payload)


@router.post("/{node_id}/heartbeat", response_model=NodeRecord)
async def record_heartbeat(
    node_id: str, payload: NodeHeartbeatPayload, service: NodeServiceDep
) -> NodeRecord:
    node = await service.record_heartbeat(node_id, payload)
    if node is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node '{node_id}' is not registered.",
        )
    return node
