from .bootstrap import configure_local_paths

configure_local_paths()

from fastapi import FastAPI

from .api.routers.health import router as health_router
from .api.routers.jobs import router as jobs_router
from .api.routers.model_management import router as model_management_router
from .api.routers.nodes import router as nodes_router

app = FastAPI(
    title="ClusterPilot Control Plane",
    version="0.1.0",
    description="FastAPI control plane for node inventory, jobs, model catalog and agent configuration.",
)

app.include_router(health_router)
app.include_router(nodes_router)
app.include_router(jobs_router)
app.include_router(model_management_router)
