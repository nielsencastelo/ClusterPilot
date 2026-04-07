from __future__ import annotations

import asyncio

from clusterpilot_core.models import JobStatus

from ..bootstrap import configure_local_paths

configure_local_paths()

from ..infrastructure.database.session import SessionLocal
from ..infrastructure.repositories.sqlalchemy import SqlAlchemyJobRepository
from .celery_app import celery_app


@celery_app.task(name="clusterpilot.jobs.process_job")
def process_job(job_id: str) -> None:
    asyncio.run(_process_job(job_id))


async def _process_job(job_id: str) -> None:
    async with SessionLocal() as session:
        repository = SqlAlchemyJobRepository(session)
        await repository.update_status(job_id, JobStatus.RUNNING)
