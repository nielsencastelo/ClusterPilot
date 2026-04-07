from fastapi import APIRouter, status

from clusterpilot_contracts.models import JobCreate, JobListResponse, JobRecord

from ..dependencies import StoreDep

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


@router.get("", response_model=JobListResponse)
async def list_jobs(store: StoreDep) -> JobListResponse:
    items = store.list_jobs()
    return JobListResponse(items=items, total=len(items))


@router.post("", response_model=JobRecord, status_code=status.HTTP_201_CREATED)
async def create_job(payload: JobCreate, store: StoreDep) -> JobRecord:
    return store.create_job(payload)
