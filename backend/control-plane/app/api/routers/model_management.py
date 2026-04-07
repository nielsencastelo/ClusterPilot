from fastapi import APIRouter, status

from clusterpilot_core.models import (
    AgentName,
    AgentConfigListResponse,
    AgentModelConfig,
    ModelCatalogItem,
    ModelCatalogResponse,
    ModelCatalogUpsert,
)

from ...dependencies import ModelServiceDep

router = APIRouter(prefix="/api/v1", tags=["model-management"])


@router.get("/models/catalog", response_model=ModelCatalogResponse)
async def list_models(service: ModelServiceDep) -> ModelCatalogResponse:
    return await service.list_models()


@router.post("/models/catalog", response_model=ModelCatalogItem, status_code=status.HTTP_201_CREATED)
async def upsert_model(payload: ModelCatalogUpsert, service: ModelServiceDep) -> ModelCatalogItem:
    return await service.upsert_model(payload)


@router.get("/agents/config", response_model=AgentConfigListResponse)
async def list_agent_configs(service: ModelServiceDep) -> AgentConfigListResponse:
    return await service.list_agent_configs()


@router.put("/agents/config/{agent_name}", response_model=AgentModelConfig)
async def upsert_agent_config(
    agent_name: AgentName, payload: AgentModelConfig, service: ModelServiceDep
) -> AgentModelConfig:
    if payload.agent_name != agent_name:
        payload = payload.model_copy(update={"agent_name": agent_name})
    return await service.upsert_agent_config(payload)
