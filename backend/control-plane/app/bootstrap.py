from __future__ import annotations

import sys
from pathlib import Path


def configure_local_paths() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    contracts_path = repo_root / "shared" / "core-contracts" / "python"
    contracts_str = str(contracts_path)
    if contracts_str not in sys.path:
        sys.path.insert(0, contracts_str)
