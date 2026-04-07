from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from clusterpilot_contracts.models import (
    JobCreate,
    JobRecord,
    JobStatus,
    NodeHeartbeatPayload,
    NodeRecord,
    NodeRegistration,
    NodeStatus,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class InMemoryStore:
    nodes: dict[str, NodeRecord] = field(default_factory=dict)
    jobs: dict[str, JobRecord] = field(default_factory=dict)

    def register_node(self, payload: NodeRegistration) -> NodeRecord:
        now = utc_now()
        existing = self.nodes.get(payload.node_id)
        if existing is not None:
            updated = existing.model_copy(
                update={
                    "name": payload.name,
                    "address": payload.address,
                    "tags": payload.tags,
                    "capabilities": payload.capabilities,
                    "status": NodeStatus.ONLINE,
                    "last_seen_at": now,
                }
            )
            self.nodes[payload.node_id] = updated
            return updated

        node = NodeRecord(
            node_id=payload.node_id,
            name=payload.name,
            address=payload.address,
            tags=payload.tags,
            status=NodeStatus.ONLINE,
            capabilities=payload.capabilities,
            registered_at=now,
            last_seen_at=now,
        )
        self.nodes[node.node_id] = node
        return node

    def record_heartbeat(self, node_id: str, payload: NodeHeartbeatPayload) -> NodeRecord | None:
        node = self.nodes.get(node_id)
        if node is None:
            return None

        updated = node.model_copy(
            update={
                "status": payload.status,
                "last_seen_at": utc_now(),
                "heartbeat": payload.heartbeat,
            }
        )
        self.nodes[node_id] = updated
        return updated

    def list_nodes(self) -> list[NodeRecord]:
        return sorted(self.nodes.values(), key=lambda item: item.name.lower())

    def create_job(self, payload: JobCreate) -> JobRecord:
        now = utc_now()
        job = JobRecord(
            name=payload.name,
            runtime=payload.runtime,
            entrypoint=payload.entrypoint,
            arguments=payload.arguments,
            requirements=payload.requirements,
            status=JobStatus.QUEUED,
            created_at=now,
            updated_at=now,
        )
        self.jobs[job.job_id] = job
        return job

    def list_jobs(self) -> list[JobRecord]:
        return sorted(self.jobs.values(), key=lambda item: item.created_at, reverse=True)


store = InMemoryStore()
