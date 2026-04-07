from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from clusterpilot_core.models import (
    AgentModelConfig,
    AgentName,
    JobCreate,
    JobRecord,
    JobStatus,
    ModelCatalogItem,
    ModelCatalogUpsert,
    ModelSource,
    ModelStatus,
    NodeHeartbeatPayload,
    NodeRecord,
    NodeRegistration,
    NodeStatus,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class InMemoryNodeRepository:
    nodes: dict[str, NodeRecord] = field(default_factory=dict)

    def register(self, payload: NodeRegistration) -> NodeRecord:
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

    def list(self) -> list[NodeRecord]:
        return sorted(self.nodes.values(), key=lambda item: item.name.lower())


@dataclass
class InMemoryJobRepository:
    jobs: dict[str, JobRecord] = field(default_factory=dict)

    def create(self, payload: JobCreate) -> JobRecord:
        now = utc_now()
        job = JobRecord(
            name=payload.name,
            runtime=payload.runtime,
            entrypoint=payload.entrypoint,
            arguments=payload.arguments,
            requirements=payload.requirements,
            model_overrides=payload.model_overrides,
            status=JobStatus.QUEUED,
            created_at=now,
            updated_at=now,
        )
        self.jobs[job.job_id] = job
        return job

    def list(self) -> list[JobRecord]:
        return sorted(self.jobs.values(), key=lambda item: item.created_at, reverse=True)


@dataclass
class InMemoryModelCatalogRepository:
    items: dict[tuple[str, str], ModelCatalogItem] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.items:
            return
        for item in [
            ModelCatalogItem(
                provider="ollama",
                model="qwen2.5:3b",
                label="Ollama - Qwen 2.5 3B",
                source=ModelSource.LOCAL,
                available=True,
                status=ModelStatus.INSTALLED,
                tags=["balanced", "local"],
                recommended_for=[AgentName.INVENTORY, AgentName.HEARTBEAT],
            ),
            ModelCatalogItem(
                provider="openai",
                model="gpt-4.1-mini",
                label="OpenAI - GPT-4.1 Mini",
                source=ModelSource.CLOUD,
                available=True,
                status=ModelStatus.CONFIGURED,
                tags=["cloud", "fast"],
                recommended_for=[AgentName.EXECUTION, AgentName.TELEMETRY, AgentName.PLANNER],
            ),
        ]:
            self.items[(item.provider, item.model)] = item

    def list(self) -> list[ModelCatalogItem]:
        return sorted(self.items.values(), key=lambda item: (item.provider, item.model))

    def upsert(self, payload: ModelCatalogUpsert) -> ModelCatalogItem:
        item = ModelCatalogItem(**payload.model_dump())
        self.items[(item.provider, item.model)] = item
        return item

    def find(self, provider: str, model: str) -> ModelCatalogItem | None:
        return self.items.get((provider, model))


@dataclass
class InMemoryAgentConfigRepository:
    items: dict[AgentName, AgentModelConfig] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.items:
            return
        defaults = [
            AgentModelConfig(
                agent_name=AgentName.INVENTORY,
                provider="ollama",
                model="qwen2.5:3b",
                custom_prompt="Focus on hardware discovery, compatibility and capability normalization.",
                system_prompt="You are the inventory specialist for ClusterPilot nodes.",
                temperature=0.1,
            ),
            AgentModelConfig(
                agent_name=AgentName.EXECUTION,
                provider="openai",
                model="gpt-4.1-mini",
                custom_prompt="Plan safe workload execution and keep command decisions explicit.",
                system_prompt="You are the execution planner for ClusterPilot jobs.",
                temperature=0.2,
            ),
            AgentModelConfig(
                agent_name=AgentName.PLANNER,
                provider="openai",
                model="gpt-4.1-mini",
                custom_prompt="Optimize placement using available hardware, memory and network profile.",
                system_prompt="You are the scheduling planner for ClusterPilot.",
                temperature=0.2,
            ),
        ]
        for item in defaults:
            self.items[item.agent_name] = item

    def list(self) -> list[AgentModelConfig]:
        return sorted(self.items.values(), key=lambda item: item.agent_name.value)

    def upsert(self, payload: AgentModelConfig) -> AgentModelConfig:
        self.items[payload.agent_name] = payload
        return payload
