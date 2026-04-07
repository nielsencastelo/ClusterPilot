from __future__ import annotations

import asyncio

from ..bootstrap import configure_local_paths

configure_local_paths()

from clusterpilot_core.models import AgentName, JobStatus, KnowledgeDocumentStatus

from ..infrastructure.database.session import SessionLocal
from ..infrastructure.repositories.sqlalchemy import (
    SqlAlchemyEmbeddingConfigRepository,
    SqlAlchemyJobRepository,
    SqlAlchemyKnowledgeRepository,
)
from .embedding import OllamaEmbeddingClient
from .celery_app import celery_app
from .knowledge_ingestion import chunk_text, extract_text


@celery_app.task(name="clusterpilot.jobs.process_job")
def process_job(job_id: str) -> None:
    asyncio.run(_process_job(job_id))


async def _process_job(job_id: str) -> None:
    async with SessionLocal() as session:
        repository = SqlAlchemyJobRepository(session)
        await repository.update_status(job_id, JobStatus.RUNNING)


@celery_app.task(name="clusterpilot.knowledge.index_document")
def index_knowledge_document(document_id: str) -> None:
    asyncio.run(_index_knowledge_document(document_id))


async def _index_knowledge_document(document_id: str) -> None:
    async with SessionLocal() as session:
        knowledge_repository = SqlAlchemyKnowledgeRepository(session)
        embedding_repository = SqlAlchemyEmbeddingConfigRepository(session)
        document = await knowledge_repository.get_document(document_id)
        if document is None:
            return

        try:
            await knowledge_repository.mark_document_status(document_id, KnowledgeDocumentStatus.INDEXING)

            text = extract_text(document.source_path, document.content_type)
            chunks = chunk_text(text)
            embedding_config = await embedding_repository.get()
            client = OllamaEmbeddingClient(embedding_config)

            indexed_chunks: list[tuple[str, list[float], dict]] = []
            for index, chunk in enumerate(chunks):
                embedding = await client.embed(chunk)
                indexed_chunks.append(
                    (
                        chunk,
                        embedding,
                        {
                            "filename": document.filename,
                            "content_type": document.content_type,
                            "chunk_index": index,
                        },
                    )
                )

            await knowledge_repository.replace_chunks(
                document_id=document.document_id,
                agent_name=AgentName(document.agent_name),
                chunks=indexed_chunks,
                status=KnowledgeDocumentStatus.INDEXED,
            )
        except Exception:
            await knowledge_repository.mark_document_status(document_id, KnowledgeDocumentStatus.FAILED)
            raise
