from __future__ import annotations

from pathlib import Path


class ArtifactAgent:
    def __init__(self, artifact_root: Path | None = None) -> None:
        self.artifact_root = artifact_root or Path.cwd() / ".clusterpilot" / "artifacts"
        self.artifact_root.mkdir(parents=True, exist_ok=True)

    def resolve_artifact_dir(self, job_id: str) -> Path:
        path = self.artifact_root / job_id
        path.mkdir(parents=True, exist_ok=True)
        return path
