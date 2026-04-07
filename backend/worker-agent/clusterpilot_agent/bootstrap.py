from __future__ import annotations

import sys
from pathlib import Path


def configure_local_paths() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    core_path = repo_root / "backend" / "core"
    core_str = str(core_path)
    if core_str not in sys.path:
        sys.path.insert(0, core_str)
