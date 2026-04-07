from __future__ import annotations

from clusterpilot_core.models import JobCreate, JobListResponse, JobRecord

from ...infrastructure.repositories.sqlalchemy import SqlAlchemyJobRepository
from ...worker.tasks import process_job


class JobService:
    def __init__(self, repository: SqlAlchemyJobRepository) -> None:
        self.repository = repository

    async def list_jobs(self) -> JobListResponse:
        items = await self.repository.list()
        return JobListResponse(items=items, total=len(items))

    async def create_job(self, payload: JobCreate) -> JobRecord:
        job = await self.repository.create(payload)
        process_job.delay(job.job_id)
        return job
