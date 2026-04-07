from __future__ import annotations

from clusterpilot_core.models import JobCreate, JobListResponse, JobRecord

from ...infrastructure.repositories.memory import InMemoryJobRepository


class JobService:
    def __init__(self, repository: InMemoryJobRepository) -> None:
        self.repository = repository

    def list_jobs(self) -> JobListResponse:
        items = self.repository.list()
        return JobListResponse(items=items, total=len(items))

    def create_job(self, payload: JobCreate) -> JobRecord:
        return self.repository.create(payload)
