from __future__ import annotations

import hashlib
import json
from pathlib import Path
from uuid import uuid4

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile

from clusterpilot_core.models import (
    AgentModelConfig,
    AgentName,
    EmbeddingRuntimeConfig,
    JobCreate,
    JobRecord,
    JobStatus,
    KnowledgeDocumentRecord,
    KnowledgeDocumentStatus,
    KnowledgeSearchRequest,
    KnowledgeSearchResult,
    ModelCatalogItem,
    ModelCatalogUpsert,
    NodeHeartbeatPayload,
    NodeRecord,
    NodeRegistration,
    NodeStatus,
    ProviderIntegrationRecord,
    ProviderIntegrationStatus,
    ProviderIntegrationUpsert,
)
from clusterpilot_core.settings import ControlPlaneSettings

from ..database.models import (
    AgentConfigOrm,
    EmbeddingConfigOrm,
    JobOrm,
    KnowledgeChunkOrm,
    KnowledgeDocumentOrm,
    ModelCatalogOrm,
    NodeOrm,
)


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


def _to_embedding_config(item: EmbeddingConfigOrm) -> EmbeddingRuntimeConfig:
    return EmbeddingRuntimeConfig(
        provider=item.provider,
        model=item.model,
        base_url=item.base_url,
        enabled=item.enabled,
        dimensions=item.dimensions,
    )


def _to_document_record(item: KnowledgeDocumentOrm) -> KnowledgeDocumentRecord:
    return KnowledgeDocumentRecord(
        document_id=item.document_id,
        agent_name=AgentName(item.agent_name),
        filename=item.filename,
        content_type=item.content_type,
        source_path=item.source_path,
        checksum=item.checksum,
        status=KnowledgeDocumentStatus(item.status),
        chunk_count=item.chunk_count,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = sum(a * a for a in left) ** 0.5
    right_norm = sum(b * b for b in right) ** 0.5
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot / (left_norm * right_norm)


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


class SqlAlchemyEmbeddingConfigRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self) -> EmbeddingRuntimeConfig:
        item = await self.session.get(EmbeddingConfigOrm, 1)
        if item is None:
            item = EmbeddingConfigOrm(
                config_id=1,
                provider="ollama",
                model="nomic-embed-text",
                base_url="http://ollama:11434",
                enabled=True,
                dimensions=None,
            )
            self.session.add(item)
            await self.session.commit()
            await self.session.refresh(item)
        return _to_embedding_config(item)

    async def upsert(self, payload: EmbeddingRuntimeConfig) -> EmbeddingRuntimeConfig:
        item = await self.session.get(EmbeddingConfigOrm, 1)
        if item is None:
            item = EmbeddingConfigOrm(config_id=1)
            self.session.add(item)
        item.provider = payload.provider
        item.model = payload.model
        item.base_url = payload.base_url
        item.enabled = payload.enabled
        item.dimensions = payload.dimensions
        await self.session.commit()
        await self.session.refresh(item)
        return _to_embedding_config(item)


class SqlAlchemyKnowledgeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.settings = ControlPlaneSettings()

    async def save_upload(self, agent_name: AgentName, upload: UploadFile) -> KnowledgeDocumentRecord:
        content = await upload.read()
        document_id = f"doc-{uuid4().hex[:12]}"
        storage_root = Path(self.settings.knowledge_storage_path)
        agent_dir = storage_root / agent_name.value
        agent_dir.mkdir(parents=True, exist_ok=True)
        target_path = agent_dir / f"{document_id}-{upload.filename}"
        target_path.write_bytes(content)
        checksum = hashlib.sha256(content).hexdigest()
        now = datetime.now(timezone.utc)
        item = KnowledgeDocumentOrm(
            document_id=document_id,
            agent_name=agent_name.value,
            filename=upload.filename,
            content_type=upload.content_type or "application/octet-stream",
            source_path=str(target_path),
            checksum=checksum,
            status=KnowledgeDocumentStatus.PENDING.value,
            chunk_count=0,
            created_at=now,
            updated_at=now,
        )
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return _to_document_record(item)

    async def list_documents(self, agent_name: AgentName) -> list[KnowledgeDocumentRecord]:
        result = await self.session.execute(
            select(KnowledgeDocumentOrm)
            .where(KnowledgeDocumentOrm.agent_name == agent_name.value)
            .order_by(KnowledgeDocumentOrm.created_at.desc())
        )
        return [_to_document_record(item) for item in result.scalars().all()]

    async def get_document(self, document_id: str) -> KnowledgeDocumentOrm | None:
        return await self.session.get(KnowledgeDocumentOrm, document_id)

    async def replace_chunks(
        self,
        document_id: str,
        agent_name: AgentName,
        chunks: list[tuple[str, list[float], dict]],
        status: KnowledgeDocumentStatus,
    ) -> None:
        result = await self.session.execute(select(KnowledgeChunkOrm).where(KnowledgeChunkOrm.document_id == document_id))
        for item in result.scalars().all():
            await self.session.delete(item)
        for index, (text, embedding, metadata) in enumerate(chunks):
            self.session.add(
                KnowledgeChunkOrm(
                    chunk_id=f"chunk-{uuid4().hex[:12]}",
                    document_id=document_id,
                    agent_name=agent_name.value,
                    chunk_index=index,
                    text=text,
                    embedding=embedding,
                    chunk_metadata=metadata,
                )
            )
        document = await self.session.get(KnowledgeDocumentOrm, document_id)
        if document is not None:
            document.chunk_count = len(chunks)
            document.status = status.value
            document.updated_at = datetime.now(timezone.utc)
        await self.session.commit()

    async def mark_document_status(self, document_id: str, status: KnowledgeDocumentStatus) -> None:
        document = await self.session.get(KnowledgeDocumentOrm, document_id)
        if document is None:
            return
        document.status = status.value
        document.updated_at = datetime.now(timezone.utc)
        await self.session.commit()

    async def search(
        self,
        payload: KnowledgeSearchRequest,
        embedding_config: EmbeddingRuntimeConfig,
    ) -> list[KnowledgeSearchResult]:
        from ...worker.embedding import OllamaEmbeddingClient

        client = OllamaEmbeddingClient(embedding_config)
        query_vector = await client.embed(payload.query)
        result = await self.session.execute(
            select(KnowledgeChunkOrm)
            .where(KnowledgeChunkOrm.agent_name == payload.agent_name.value)
            .order_by(KnowledgeChunkOrm.created_at.desc())
        )
        ranked: list[KnowledgeSearchResult] = []
        for item in result.scalars().all():
            score = cosine_similarity(query_vector, item.embedding)
            ranked.append(
                KnowledgeSearchResult(
                    chunk_id=item.chunk_id,
                    document_id=item.document_id,
                    agent_name=payload.agent_name,
                    text=item.text,
                    score=score,
                    metadata=item.chunk_metadata,
                )
            )
        ranked.sort(key=lambda item: item.score, reverse=True)
        return ranked[: payload.top_k]
