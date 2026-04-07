from __future__ import annotations

from fastapi import HTTPException, status

from clusterpilot_core.models import (
    AgentConfigListResponse,
    AgentModelConfig,
    ModelCatalogResponse,
    ModelCatalogUpsert,
)

from ...infrastructure.repositories.memory import InMemoryAgentConfigRepository, InMemoryModelCatalogRepository


class ModelService:
    def __init__(
        self,
        model_repository: InMemoryModelCatalogRepository,
        agent_repository: InMemoryAgentConfigRepository,
    ) -> None:
        self.model_repository = model_repository
        self.agent_repository = agent_repository

    def list_models(self) -> ModelCatalogResponse:
        items = self.model_repository.list()
        return ModelCatalogResponse(items=items, total=len(items))

    def upsert_model(self, payload: ModelCatalogUpsert):
        return self.model_repository.upsert(payload)

    def list_agent_configs(self) -> AgentConfigListResponse:
        items = self.agent_repository.list()
        return AgentConfigListResponse(items=items, total=len(items))

    def upsert_agent_config(self, payload: AgentModelConfig) -> AgentModelConfig:
        available = self.model_repository.find(provider=payload.provider, model=payload.model)
        if available is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The selected provider/model is not present in the system catalog.",
            )
        return self.agent_repository.upsert(payload)
