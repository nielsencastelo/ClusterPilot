from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from .application.services.job_service import JobService
from .application.services.knowledge_service import KnowledgeService
from .application.services.model_service import ModelService
from .application.services.node_service import NodeService
from .application.services.provider_integration_service import ProviderIntegrationService
from .infrastructure.database.session import get_db_session
from .infrastructure.repositories.sqlalchemy import (
    SqlAlchemyAgentConfigRepository,
    SqlAlchemyEmbeddingConfigRepository,
    SqlAlchemyJobRepository,
    SqlAlchemyKnowledgeRepository,
    SqlAlchemyModelCatalogRepository,
    SqlAlchemyNodeRepository,
    SqlAlchemyProviderIntegrationRepository,
)

DbSessionDep = Annotated[AsyncSession, Depends(get_db_session)]


def get_node_service(session: DbSessionDep) -> NodeService:
    return NodeService(SqlAlchemyNodeRepository(session))


def get_job_service(session: DbSessionDep) -> JobService:
    return JobService(SqlAlchemyJobRepository(session))


def get_model_service(session: DbSessionDep) -> ModelService:
    return ModelService(SqlAlchemyModelCatalogRepository(session), SqlAlchemyAgentConfigRepository(session))


def get_knowledge_service(session: DbSessionDep) -> KnowledgeService:
    return KnowledgeService(
        SqlAlchemyKnowledgeRepository(session),
        SqlAlchemyEmbeddingConfigRepository(session),
    )


def get_provider_integration_service(session: DbSessionDep) -> ProviderIntegrationService:
    return ProviderIntegrationService(
        SqlAlchemyProviderIntegrationRepository(session),
        SqlAlchemyModelCatalogRepository(session),
    )


NodeServiceDep = Annotated[NodeService, Depends(get_node_service)]
JobServiceDep = Annotated[JobService, Depends(get_job_service)]
ModelServiceDep = Annotated[ModelService, Depends(get_model_service)]
KnowledgeServiceDep = Annotated[KnowledgeService, Depends(get_knowledge_service)]
ProviderIntegrationServiceDep = Annotated[ProviderIntegrationService, Depends(get_provider_integration_service)]
