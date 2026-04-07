from __future__ import annotations

from fastapi import UploadFile

from clusterpilot_core.models import (
    AgentName,
    EmbeddingRuntimeConfig,
    KnowledgeDocumentListResponse,
    KnowledgeDocumentRecord,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
)

from ...infrastructure.repositories.sqlalchemy import (
    SqlAlchemyEmbeddingConfigRepository,
    SqlAlchemyKnowledgeRepository,
)
from ...worker.tasks import index_knowledge_document


class KnowledgeService:
    def __init__(
        self,
        knowledge_repository: SqlAlchemyKnowledgeRepository,
        embedding_repository: SqlAlchemyEmbeddingConfigRepository,
    ) -> None:
        self.knowledge_repository = knowledge_repository
        self.embedding_repository = embedding_repository

    async def list_documents(self, agent_name: AgentName) -> KnowledgeDocumentListResponse:
        items = await self.knowledge_repository.list_documents(agent_name)
        return KnowledgeDocumentListResponse(items=items, total=len(items))

    async def save_document(self, agent_name: AgentName, upload: UploadFile) -> KnowledgeDocumentRecord:
        document = await self.knowledge_repository.save_upload(agent_name, upload)
        index_knowledge_document.delay(document.document_id)
        return document

    async def search(self, payload: KnowledgeSearchRequest) -> KnowledgeSearchResponse:
        embedding_config = await self.embedding_repository.get()
        items = await self.knowledge_repository.search(payload, embedding_config)
        return KnowledgeSearchResponse(items=items, total=len(items))

    async def get_embedding_config(self) -> EmbeddingRuntimeConfig:
        return await self.embedding_repository.get()

    async def save_embedding_config(self, payload: EmbeddingRuntimeConfig) -> EmbeddingRuntimeConfig:
        return await self.embedding_repository.upsert(payload)
