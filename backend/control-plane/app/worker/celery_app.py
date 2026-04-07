from __future__ import annotations

from celery import Celery

from clusterpilot_core.settings import ControlPlaneSettings

settings = ControlPlaneSettings()

celery_app = Celery(
    "clusterpilot_control_plane",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_track_started=True,
)
