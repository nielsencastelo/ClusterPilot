from typing import Annotated

from fastapi import Depends

from .application.services.job_service import JobService
from .application.services.model_service import ModelService
from .application.services.node_service import NodeService
from .infrastructure.repositories.memory import (
    InMemoryAgentConfigRepository,
    InMemoryJobRepository,
    InMemoryModelCatalogRepository,
    InMemoryNodeRepository,
)

node_repository = InMemoryNodeRepository()
job_repository = InMemoryJobRepository()
model_repository = InMemoryModelCatalogRepository()
agent_config_repository = InMemoryAgentConfigRepository()


def get_node_service() -> NodeService:
    return NodeService(node_repository)


def get_job_service() -> JobService:
    return JobService(job_repository)


def get_model_service() -> ModelService:
    return ModelService(model_repository, agent_config_repository)


NodeServiceDep = Annotated[NodeService, Depends(get_node_service)]
JobServiceDep = Annotated[JobService, Depends(get_job_service)]
ModelServiceDep = Annotated[ModelService, Depends(get_model_service)]
