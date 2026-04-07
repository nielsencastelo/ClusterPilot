from fastapi import APIRouter, File, UploadFile

from clusterpilot_core.models import (
    AgentName,
    EmbeddingRuntimeConfig,
    KnowledgeDocumentListResponse,
    KnowledgeDocumentRecord,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
)

from ...dependencies import KnowledgeServiceDep

router = APIRouter(prefix="/api/v1/knowledge", tags=["knowledge"])


@router.get("/documents/{agent_name}", response_model=KnowledgeDocumentListResponse)
async def list_documents(agent_name: AgentName, service: KnowledgeServiceDep) -> KnowledgeDocumentListResponse:
    return await service.list_documents(agent_name)


@router.post("/documents/{agent_name}", response_model=KnowledgeDocumentRecord)
async def upload_document(
    agent_name: AgentName,
    service: KnowledgeServiceDep,
    file: UploadFile = File(...),
) -> KnowledgeDocumentRecord:
    return await service.save_document(agent_name, file)


@router.post("/search", response_model=KnowledgeSearchResponse)
async def search_knowledge(
    payload: KnowledgeSearchRequest,
    service: KnowledgeServiceDep,
) -> KnowledgeSearchResponse:
    return await service.search(payload)


@router.get("/embedding-config", response_model=EmbeddingRuntimeConfig)
async def get_embedding_config(service: KnowledgeServiceDep) -> EmbeddingRuntimeConfig:
    return await service.get_embedding_config()


@router.put("/embedding-config", response_model=EmbeddingRuntimeConfig)
async def save_embedding_config(
    payload: EmbeddingRuntimeConfig,
    service: KnowledgeServiceDep,
) -> EmbeddingRuntimeConfig:
    return await service.save_embedding_config(payload)
