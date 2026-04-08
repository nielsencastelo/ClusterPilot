from fastapi import APIRouter, HTTPException, status

from clusterpilot_core.models import (
    ProviderIntegrationListResponse,
    ProviderIntegrationRecord,
    ProviderIntegrationUpsert,
    ProviderTestResult,
)

from ...dependencies import ProviderIntegrationServiceDep

KNOWN_PROVIDERS = {"ollama", "anthropic", "openai", "gemini", "groq"}

router = APIRouter(prefix="/api/v1/provider-integrations", tags=["provider-integrations"])


@router.get("", response_model=ProviderIntegrationListResponse)
async def list_integrations(service: ProviderIntegrationServiceDep) -> ProviderIntegrationListResponse:
    return await service.list_integrations()


@router.get("/{provider_id}", response_model=ProviderIntegrationRecord)
async def get_integration(provider_id: str, service: ProviderIntegrationServiceDep) -> ProviderIntegrationRecord:
    _validate_provider(provider_id)
    record = await service.integration_repo.get(provider_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found.")
    return record


@router.put("/{provider_id}", response_model=ProviderIntegrationRecord)
async def upsert_integration(
    provider_id: str,
    payload: ProviderIntegrationUpsert,
    service: ProviderIntegrationServiceDep,
) -> ProviderIntegrationRecord:
    _validate_provider(provider_id)
    return await service.upsert_integration(provider_id, payload)


@router.post("/{provider_id}/test", response_model=ProviderTestResult)
async def test_connection(
    provider_id: str,
    service: ProviderIntegrationServiceDep,
) -> ProviderTestResult:
    _validate_provider(provider_id)
    return await service.test_connection(provider_id)


def _validate_provider(provider_id: str) -> None:
    if provider_id not in KNOWN_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown provider '{provider_id}'. Allowed: {sorted(KNOWN_PROVIDERS)}",
        )
