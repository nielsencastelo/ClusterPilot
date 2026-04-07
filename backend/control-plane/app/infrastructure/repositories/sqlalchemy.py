from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from clusterpilot_core.models import (
    AgentModelConfig,
    AgentName,
    JobCreate,
    JobRecord,
    JobStatus,
    ModelCatalogItem,
    ModelCatalogUpsert,
    NodeHeartbeatPayload,
    NodeRecord,
    NodeRegistration,
    NodeStatus,
)

from ..database.models import AgentConfigOrm, JobOrm, ModelCatalogOrm, NodeOrm


def _to_node_record(item: NodeOrm) -> NodeRecord:
    return NodeRecord(
        node_id=item.node_id,
        name=item.name,
        address=item.address,
        tags=item.tags,
        status=NodeStatus(item.status),
        capabilities=item.capabilities,
        heartbeat=item.heartbeat,
        registered_at=item.registered_at,
        last_seen_at=item.last_seen_at,
    )


def _to_job_record(item: JobOrm) -> JobRecord:
    return JobRecord(
        job_id=item.job_id,
        name=item.name,
        runtime=item.runtime,
        entrypoint=item.entrypoint,
        arguments=item.arguments,
        requirements=item.requirements,
        model_overrides=item.model_overrides,
        status=JobStatus(item.status),
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def _to_model_item(item: ModelCatalogOrm) -> ModelCatalogItem:
    return ModelCatalogItem(
        provider=item.provider,
        model=item.model,
        label=item.label,
        source=item.source,
        available=item.available,
        status=item.status,
        tags=item.tags,
        recommended_for=item.recommended_for,
    )


def _to_agent_config(item: AgentConfigOrm) -> AgentModelConfig:
    return AgentModelConfig(
        agent_name=AgentName(item.agent_name),
        enabled=item.enabled,
        provider=item.provider,
        model=item.model,
        custom_prompt=item.custom_prompt,
        system_prompt=item.system_prompt,
        temperature=item.temperature,
        manual_override=item.manual_override,
    )


class SqlAlchemyNodeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def register(self, payload: NodeRegistration) -> NodeRecord:
        item = await self.session.get(NodeOrm, payload.node_id)
        if item is None:
            now = datetime.now(timezone.utc)
            item = NodeOrm(
                node_id=payload.node_id,
                name=payload.name,
                address=payload.address,
                tags=payload.tags,
                status=NodeStatus.ONLINE.value,
                capabilities=payload.capabilities.model_dump(mode="json"),
                registered_at=now,
                last_seen_at=now,
            )
            self.session.add(item)
        item.name = payload.name
        item.address = payload.address
        item.tags = payload.tags
        item.status = NodeStatus.ONLINE.value
        item.capabilities = payload.capabilities.model_dump(mode="json")
        await self.session.commit()
        await self.session.refresh(item)
        return _to_node_record(item)

    async def record_heartbeat(self, node_id: str, payload: NodeHeartbeatPayload) -> NodeRecord | None:
        item = await self.session.get(NodeOrm, node_id)
        if item is None:
            return None
        item.status = payload.status.value
        item.heartbeat = payload.heartbeat.model_dump(mode="json")
        item.last_seen_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(item)
        return _to_node_record(item)

    async def list(self) -> list[NodeRecord]:
        result = await self.session.execute(select(NodeOrm).order_by(NodeOrm.name.asc()))
        return [_to_node_record(item) for item in result.scalars().all()]


class SqlAlchemyJobRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, payload: JobCreate) -> JobRecord:
        record = JobRecord(
            name=payload.name,
            runtime=payload.runtime,
            entrypoint=payload.entrypoint,
            arguments=payload.arguments,
            requirements=payload.requirements,
            model_overrides=payload.model_overrides,
            status=JobStatus.QUEUED,
        )
        item = JobOrm(
            job_id=record.job_id,
            name=record.name,
            runtime=record.runtime,
            entrypoint=record.entrypoint,
            arguments=record.arguments,
            requirements=record.requirements.model_dump(mode="json"),
            model_overrides=[override.model_dump(mode="json") for override in record.model_overrides],
            status=record.status.value,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return _to_job_record(item)

    async def list(self) -> list[JobRecord]:
        result = await self.session.execute(select(JobOrm).order_by(JobOrm.created_at.desc()))
        return [_to_job_record(item) for item in result.scalars().all()]

    async def update_status(self, job_id: str, status: JobStatus) -> None:
        item = await self.session.get(JobOrm, job_id)
        if item is None:
            return
        from datetime import datetime, timezone

        item.status = status.value
        item.updated_at = datetime.now(timezone.utc)
        await self.session.commit()


class SqlAlchemyModelCatalogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list(self) -> list[ModelCatalogItem]:
        result = await self.session.execute(select(ModelCatalogOrm).order_by(ModelCatalogOrm.provider.asc(), ModelCatalogOrm.model.asc()))
        return [_to_model_item(item) for item in result.scalars().all()]

    async def upsert(self, payload: ModelCatalogUpsert) -> ModelCatalogItem:
        key = f"{payload.provider}::{payload.model}"
        item = await self.session.get(ModelCatalogOrm, key)
        if item is None:
            item = ModelCatalogOrm(key=key)
            self.session.add(item)
        item.provider = payload.provider
        item.model = payload.model
        item.label = payload.label
        item.source = payload.source.value
        item.available = payload.available
        item.status = payload.status.value
        item.tags = payload.tags
        item.recommended_for = [value.value for value in payload.recommended_for]
        await self.session.commit()
        await self.session.refresh(item)
        return _to_model_item(item)

    async def find(self, provider: str, model: str) -> ModelCatalogItem | None:
        item = await self.session.get(ModelCatalogOrm, f"{provider}::{model}")
        return _to_model_item(item) if item is not None else None


class SqlAlchemyAgentConfigRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list(self) -> list[AgentModelConfig]:
        result = await self.session.execute(select(AgentConfigOrm).order_by(AgentConfigOrm.agent_name.asc()))
        return [_to_agent_config(item) for item in result.scalars().all()]

    async def upsert(self, payload: AgentModelConfig) -> AgentModelConfig:
        item = await self.session.get(AgentConfigOrm, payload.agent_name.value)
        if item is None:
            item = AgentConfigOrm(agent_name=payload.agent_name.value)
            self.session.add(item)
        item.enabled = payload.enabled
        item.provider = payload.provider
        item.model = payload.model
        item.custom_prompt = payload.custom_prompt
        item.system_prompt = payload.system_prompt
        item.temperature = payload.temperature
        item.manual_override = payload.manual_override
        await self.session.commit()
        await self.session.refresh(item)
        return _to_agent_config(item)
