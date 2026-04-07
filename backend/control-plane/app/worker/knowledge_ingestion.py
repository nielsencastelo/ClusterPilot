from __future__ import annotations

import json
from pathlib import Path

from pypdf import PdfReader


def extract_text(path: str, content_type: str) -> str:
    suffix = Path(path).suffix.lower()
    if content_type == "application/pdf" or suffix == ".pdf":
        reader = PdfReader(path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if content_type == "application/json" or suffix == ".json":
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        return json.dumps(data, indent=2, ensure_ascii=True)
    with open(path, "r", encoding="utf-8", errors="ignore") as handle:
        return handle.read()


def chunk_text(text: str, chunk_size: int = 900, overlap: int = 120) -> list[str]:
    normalized = " ".join(text.split())
    if not normalized:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(normalized):
        end = min(len(normalized), start + chunk_size)
        chunks.append(normalized[start:end])
        if end == len(normalized):
            break
        start = max(0, end - overlap)
    return chunks
