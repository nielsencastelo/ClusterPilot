from fastapi import APIRouter, status

from clusterpilot_core.models import JobCreate, JobListResponse, JobRecord

from ...dependencies import JobServiceDep

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


@router.get("", response_model=JobListResponse)
async def list_jobs(service: JobServiceDep) -> JobListResponse:
    return await service.list_jobs()


@router.post("", response_model=JobRecord, status_code=status.HTTP_201_CREATED)
async def create_job(payload: JobCreate, service: JobServiceDep) -> JobRecord:
    return await service.create_job(payload)
