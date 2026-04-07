from __future__ import annotations

from pathlib import Path


class ExecutionAgent:
    def __init__(self, workspace_root: Path | None = None) -> None:
        self.workspace_root = workspace_root or Path.cwd() / ".clusterpilot" / "jobs"
        self.workspace_root.mkdir(parents=True, exist_ok=True)

    def prepare_workspace(self, job_id: str) -> Path:
        workspace = self.workspace_root / job_id
        workspace.mkdir(parents=True, exist_ok=True)
        return workspace
