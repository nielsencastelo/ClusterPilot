from __future__ import annotations

import json
from urllib import request

from clusterpilot_core.models import EmbeddingRuntimeConfig


class OllamaEmbeddingClient:
    def __init__(self, config: EmbeddingRuntimeConfig) -> None:
        self.config = config

    async def embed(self, text: str) -> list[float]:
        payload = json.dumps({"model": self.config.model, "prompt": text}).encode("utf-8")
        req = request.Request(
            f"{self.config.base_url}/api/embeddings",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
        return data.get("embedding", [])
