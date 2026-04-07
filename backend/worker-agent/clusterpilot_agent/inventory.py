from __future__ import annotations

import os
import platform
import shutil
import socket
from typing import Any

from .bootstrap import configure_local_paths

configure_local_paths()

from clusterpilot_core.models import NodeCapabilities


def _detect_cpu_count() -> int:
    return os.cpu_count() or 1


def _detect_memory_bytes() -> int | None:
    try:
        import psutil  # type: ignore

        return int(psutil.virtual_memory().total)
    except Exception:
        return None


def _detect_disk_bytes() -> int | None:
    try:
        total, _, _ = shutil.disk_usage(os.getcwd())
        return int(total)
    except Exception:
        return None


def _basic_metadata() -> dict[str, Any]:
    return {
        "processor": platform.processor() or None,
        "platform": platform.platform(),
    }


def collect_capabilities() -> NodeCapabilities:
    hostname = socket.gethostname()
    return NodeCapabilities(
        hostname=hostname,
        operating_system=platform.system(),
        operating_system_version=platform.version(),
        architecture=platform.machine(),
        python_version=platform.python_version(),
        cpu_cores=_detect_cpu_count(),
        memory_bytes=_detect_memory_bytes(),
        disk_bytes=_detect_disk_bytes(),
        gpu_count=0,
        npu_count=0,
        labels=["local", "inventory-v1"],
        runtimes={
            "python": platform.python_version(),
            "pytorch": None,
            "ray": None,
        },
        metadata=_basic_metadata(),
    )
