from __future__ import annotations

import json
from typing import Any

import httpx

from clusterpilot_core.models import (
    AgentName,
    ModelCatalogUpsert,
    ModelSource,
    ModelStatus,
    ProviderIntegrationListResponse,
    ProviderIntegrationRecord,
    ProviderIntegrationStatus,
    ProviderIntegrationUpsert,
    ProviderTestResult,
)

from ...infrastructure.repositories.sqlalchemy import (
    SqlAlchemyModelCatalogRepository,
    SqlAlchemyProviderIntegrationRepository,
)

# ---------------------------------------------------------------------------
# Default model definitions for each provider.
# Ollama models are discovered dynamically from the running instance.
# ---------------------------------------------------------------------------

ALL_AGENTS: list[AgentName] = list(AgentName)

PROVIDER_DEFAULT_MODELS: dict[str, list[dict[str, Any]]] = {
    "anthropic": [
        {"model": "claude-opus-4-6", "label": "Claude Opus 4.6"},
        {"model": "claude-sonnet-4-6", "label": "Claude Sonnet 4.6"},
        {"model": "claude-haiku-4-5-20251001", "label": "Claude Haiku 4.5"},
    ],
    "openai": [
        {"model": "gpt-4o", "label": "GPT-4o"},
        {"model": "gpt-4o-mini", "label": "GPT-4o Mini"},
        {"model": "gpt-4-turbo", "label": "GPT-4 Turbo"},
        {"model": "o1", "label": "o1"},
        {"model": "o3-mini", "label": "o3 Mini"},
    ],
    "gemini": [
        {"model": "gemini-2.0-flash", "label": "Gemini 2.0 Flash"},
        {"model": "gemini-1.5-pro", "label": "Gemini 1.5 Pro"},
        {"model": "gemini-1.5-flash", "label": "Gemini 1.5 Flash"},
    ],
    "groq": [
        {"model": "llama-3.3-70b-versatile", "label": "Llama 3.3 70B (Groq)"},
        {"model": "llama-3.1-8b-instant", "label": "Llama 3.1 8B (Groq)"},
        {"model": "mixtral-8x7b-32768", "label": "Mixtral 8x7B (Groq)"},
        {"model": "gemma2-9b-it", "label": "Gemma 2 9B (Groq)"},
    ],
}


class ProviderIntegrationService:
    def __init__(
        self,
        integration_repository: SqlAlchemyProviderIntegrationRepository,
        model_repository: SqlAlchemyModelCatalogRepository,
    ) -> None:
        self.integration_repo = integration_repository
        self.model_repo = model_repository

    async def list_integrations(self) -> ProviderIntegrationListResponse:
        items = await self.integration_repo.list()
        return ProviderIntegrationListResponse(items=items, total=len(items))

    async def upsert_integration(
        self, provider_id: str, payload: ProviderIntegrationUpsert
    ) -> ProviderIntegrationRecord:
        return await self.integration_repo.upsert(provider_id, payload)

    async def test_connection(self, provider_id: str) -> ProviderTestResult:
        item = await self.integration_repo.get_orm(provider_id)
        if item is None:
            return ProviderTestResult(ok=False, message="Integration not configured.", models_synced=0)

        try:
            if provider_id == "ollama":
                result = await self._test_ollama(item.base_url or "http://localhost:11434")
            elif provider_id == "anthropic":
                result = await self._test_anthropic(item.api_key or "")
            elif provider_id == "openai":
                result = await self._test_openai(item.api_key or "", item.base_url)
            elif provider_id == "gemini":
                result = await self._test_gemini(item.api_key or "")
            elif provider_id == "groq":
                result = await self._test_groq(item.api_key or "")
            else:
                result = ProviderTestResult(ok=False, message=f"Unknown provider: {provider_id}")
        except Exception as exc:
            result = ProviderTestResult(ok=False, message=str(exc))

        new_status = ProviderIntegrationStatus.OK if result.ok else ProviderIntegrationStatus.ERROR
        await self.integration_repo.update_status(
            provider_id,
            new_status,
            None if result.ok else result.message,
        )

        if result.ok:
            synced = await self._sync_models(provider_id, item.api_key, item.base_url)
            result = ProviderTestResult(ok=True, message=result.message, models_synced=synced)

        return result

    # ------------------------------------------------------------------
    # Provider-specific probes
    # ------------------------------------------------------------------

    async def _test_ollama(self, base_url: str) -> ProviderTestResult:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{base_url.rstrip('/')}/api/tags")
        if response.status_code != 200:
            return ProviderTestResult(ok=False, message=f"Ollama returned HTTP {response.status_code}")
        data = response.json()
        model_count = len(data.get("models", []))
        return ProviderTestResult(ok=True, message=f"Ollama reachable. {model_count} model(s) installed.")

    async def _test_anthropic(self, api_key: str) -> ProviderTestResult:
        if not api_key:
            return ProviderTestResult(ok=False, message="API key not configured.")
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://api.anthropic.com/v1/models",
                headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"},
            )
        if response.status_code == 401:
            return ProviderTestResult(ok=False, message="Invalid API key.")
        if not response.is_success:
            return ProviderTestResult(ok=False, message=f"Anthropic returned HTTP {response.status_code}")
        return ProviderTestResult(ok=True, message="Anthropic API key is valid.")

    async def _test_openai(self, api_key: str, base_url: str | None) -> ProviderTestResult:
        if not api_key:
            return ProviderTestResult(ok=False, message="API key not configured.")
        url = f"{(base_url or 'https://api.openai.com').rstrip('/')}/v1/models"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, headers={"Authorization": f"Bearer {api_key}"})
        if response.status_code == 401:
            return ProviderTestResult(ok=False, message="Invalid API key.")
        if not response.is_success:
            return ProviderTestResult(ok=False, message=f"OpenAI returned HTTP {response.status_code}")
        return ProviderTestResult(ok=True, message="OpenAI API key is valid.")

    async def _test_gemini(self, api_key: str) -> ProviderTestResult:
        if not api_key:
            return ProviderTestResult(ok=False, message="API key not configured.")
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
        if response.status_code == 400 or response.status_code == 403:
            return ProviderTestResult(ok=False, message="Invalid API key.")
        if not response.is_success:
            return ProviderTestResult(ok=False, message=f"Gemini returned HTTP {response.status_code}")
        return ProviderTestResult(ok=True, message="Google Gemini API key is valid.")

    async def _test_groq(self, api_key: str) -> ProviderTestResult:
        if not api_key:
            return ProviderTestResult(ok=False, message="API key not configured.")
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://api.groq.com/openai/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
            )
        if response.status_code == 401:
            return ProviderTestResult(ok=False, message="Invalid API key.")
        if not response.is_success:
            return ProviderTestResult(ok=False, message=f"Groq returned HTTP {response.status_code}")
        return ProviderTestResult(ok=True, message="Groq API key is valid.")

    # ------------------------------------------------------------------
    # Model catalog sync
    # ------------------------------------------------------------------

    async def _sync_models(
        self, provider_id: str, api_key: str | None, base_url: str | None
    ) -> int:
        models_to_sync: list[dict[str, Any]] = []

        if provider_id == "ollama":
            models_to_sync = await self._discover_ollama_models(base_url or "http://localhost:11434")
        else:
            models_to_sync = PROVIDER_DEFAULT_MODELS.get(provider_id, [])

        source = ModelSource.LOCAL if provider_id == "ollama" else ModelSource.CLOUD
        count = 0
        for entry in models_to_sync:
            await self.model_repo.upsert(
                ModelCatalogUpsert(
                    provider=provider_id,
                    model=entry["model"],
                    label=entry["label"],
                    source=source,
                    available=True,
                    status=ModelStatus.CONFIGURED if provider_id != "ollama" else ModelStatus.INSTALLED,
                    tags=[provider_id],
                    recommended_for=ALL_AGENTS,
                )
            )
            count += 1
        return count

    async def _discover_ollama_models(self, base_url: str) -> list[dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{base_url.rstrip('/')}/api/tags")
            if not response.is_success:
                return []
            data = response.json()
            return [
                {"model": m["name"], "label": m["name"]}
                for m in data.get("models", [])
            ]
        except Exception:
            return []
