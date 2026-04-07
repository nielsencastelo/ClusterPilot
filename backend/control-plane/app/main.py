from .bootstrap import configure_local_paths

configure_local_paths()

from fastapi import FastAPI

from .routers.health import router as health_router
from .routers.jobs import router as jobs_router
from .routers.nodes import router as nodes_router

app = FastAPI(
    title="ClusterPilot Control Plane",
    version="0.1.0",
    description="FastAPI MVP for node registration, heartbeats, and job queue management.",
)

app.include_router(health_router)
app.include_router(nodes_router)
app.include_router(jobs_router)
