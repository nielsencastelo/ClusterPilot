from __future__ import annotations

from fastapi import HTTPException, status

from clusterpilot_core.models import (
    AgentConfigListResponse,
    AgentModelConfig,
    ModelCatalogResponse,
    ModelCatalogUpsert,
)

from ...infrastructure.repositories.sqlalchemy import (
    SqlAlchemyAgentConfigRepository,
    SqlAlchemyModelCatalogRepository,
)


class ModelService:
    def __init__(
        self,
        model_repository: SqlAlchemyModelCatalogRepository,
        agent_repository: SqlAlchemyAgentConfigRepository,
    ) -> None:
        self.model_repository = model_repository
        self.agent_repository = agent_repository

    async def list_models(self) -> ModelCatalogResponse:
        items = await self.model_repository.list()
        return ModelCatalogResponse(items=items, total=len(items))

    async def upsert_model(self, payload: ModelCatalogUpsert):
        return await self.model_repository.upsert(payload)

    async def list_agent_configs(self) -> AgentConfigListResponse:
        items = await self.agent_repository.list()
        return AgentConfigListResponse(items=items, total=len(items))

    async def upsert_agent_config(self, payload: AgentModelConfig) -> AgentModelConfig:
        available = await self.model_repository.find(provider=payload.provider, model=payload.model)
        if available is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The selected provider/model is not present in the system catalog.",
            )
        return await self.agent_repository.upsert(payload)
