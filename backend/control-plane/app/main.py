from .bootstrap import configure_local_paths

configure_local_paths()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from clusterpilot_core.settings import ControlPlaneSettings

from .api.routers.health import router as health_router
from .api.routers.jobs import router as jobs_router
from .api.routers.model_management import router as model_management_router
from .api.routers.nodes import router as nodes_router

settings = ControlPlaneSettings()

app = FastAPI(
    title=settings.app_name,
    version=settings.api_version,
    description="FastAPI control plane for node inventory, jobs, model catalog and agent configuration.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(nodes_router)
app.include_router(jobs_router)
app.include_router(model_management_router)
