from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


def generate_job_id() -> str:
    return f"job-{uuid4().hex[:12]}"


class NodeStatus(StrEnum):
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"


class JobStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"


class AgentName(StrEnum):
    INVENTORY = "inventory"
    HEARTBEAT = "heartbeat"
    EXECUTION = "execution"
    TELEMETRY = "telemetry"
    ARTIFACT = "artifact"
    PLANNER = "planner"
    REBALANCE = "rebalance"
    POLICY = "policy"


class ModelSource(StrEnum):
    LOCAL = "local"
    CLOUD = "cloud"


class ModelStatus(StrEnum):
    INSTALLED = "installed"
    CONFIGURED = "configured"
    MISSING_KEY = "missing_key"
    NOT_INSTALLED = "not_installed"
    UNKNOWN = "unknown"


class KnowledgeDocumentStatus(StrEnum):
    PENDING = "pending"
    INDEXING = "indexing"
    INDEXED = "indexed"
    FAILED = "failed"


class NodeCapabilities(BaseModel):
    model_config = ConfigDict(extra="allow")

    hostname: str
    operating_system: str
    operating_system_version: str
    architecture: str
    python_version: str
    cpu_cores: int = Field(ge=1)
    memory_bytes: int | None = Field(default=None, ge=0)
    disk_bytes: int | None = Field(default=None, ge=0)
    gpu_count: int = Field(default=0, ge=0)
    npu_count: int = Field(default=0, ge=0)
    labels: list[str] = Field(default_factory=list)
    runtimes: dict[str, str | None] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class NodeHeartbeat(BaseModel):
    cpu_percent: float | None = Field(default=None, ge=0, le=100)
    memory_percent: float | None = Field(default=None, ge=0, le=100)
    gpu_percent: float | None = Field(default=None, ge=0, le=100)
    active_jobs: int = Field(default=0, ge=0)
    message: str | None = None


class NodeRegistration(BaseModel):
    node_id: str = Field(min_length=2)
    name: str = Field(min_length=2)
    address: str = Field(min_length=2)
    tags: list[str] = Field(default_factory=list)
    capabilities: NodeCapabilities


class NodeHeartbeatPayload(BaseModel):
    status: NodeStatus
    heartbeat: NodeHeartbeat


class NodeRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    node_id: str
    name: str
    address: str
    tags: list[str] = Field(default_factory=list)
    status: NodeStatus
    capabilities: NodeCapabilities
    heartbeat: NodeHeartbeat | None = None
    registered_at: datetime
    last_seen_at: datetime


class NodeListResponse(BaseModel):
    items: list[NodeRecord]
    total: int


class ModelCatalogItem(BaseModel):
    provider: str = Field(min_length=2)
    model: str = Field(min_length=1)
    label: str = Field(min_length=2)
    source: ModelSource
    available: bool = True
    status: ModelStatus = ModelStatus.UNKNOWN
    tags: list[str] = Field(default_factory=list)
    recommended_for: list[AgentName] = Field(default_factory=list)


class ModelCatalogUpsert(BaseModel):
    provider: str = Field(min_length=2)
    model: str = Field(min_length=1)
    label: str = Field(min_length=2)
    source: ModelSource
    available: bool = True
    status: ModelStatus = ModelStatus.UNKNOWN
    tags: list[str] = Field(default_factory=list)
    recommended_for: list[AgentName] = Field(default_factory=list)


class ModelCatalogResponse(BaseModel):
    items: list[ModelCatalogItem]
    total: int


class AgentModelConfig(BaseModel):
    agent_name: AgentName
    enabled: bool = True
    provider: str = Field(min_length=2)
    model: str = Field(min_length=1)
    custom_prompt: str | None = None
    system_prompt: str | None = None
    temperature: float = Field(default=0.2, ge=0, le=2)
    manual_override: bool = False


class AgentConfigListResponse(BaseModel):
    items: list[AgentModelConfig]
    total: int


class EmbeddingRuntimeConfig(BaseModel):
    provider: str = Field(default="ollama", min_length=2)
    model: str = Field(default="nomic-embed-text", min_length=2)
    base_url: str = Field(default="http://ollama:11434", min_length=8)
    enabled: bool = True
    dimensions: int | None = Field(default=None, ge=1)


class KnowledgeDocumentRecord(BaseModel):
    document_id: str
    agent_name: AgentName
    filename: str
    content_type: str
    source_path: str
    checksum: str
    status: KnowledgeDocumentStatus
    chunk_count: int = 0
    created_at: datetime
    updated_at: datetime


class KnowledgeDocumentListResponse(BaseModel):
    items: list[KnowledgeDocumentRecord]
    total: int


class KnowledgeSearchResult(BaseModel):
    chunk_id: str
    document_id: str
    agent_name: AgentName
    text: str
    score: float
    metadata: dict[str, Any] = Field(default_factory=dict)


class KnowledgeSearchRequest(BaseModel):
    agent_name: AgentName
    query: str = Field(min_length=3)
    top_k: int = Field(default=5, ge=1, le=20)


class KnowledgeSearchResponse(BaseModel):
    items: list[KnowledgeSearchResult]
    total: int


class JobModelOverride(BaseModel):
    agent_name: AgentName
    provider: str = Field(min_length=2)
    model: str = Field(min_length=1)
    custom_prompt: str | None = None
    system_prompt: str | None = None


class JobRequirements(BaseModel):
    min_cpu_cores: int = Field(default=1, ge=1)
    min_memory_bytes: int | None = Field(default=None, ge=0)
    min_gpu_count: int = Field(default=0, ge=0)
    network_profile: str = "lan"


class JobCreate(BaseModel):
    name: str = Field(min_length=3)
    runtime: str = Field(min_length=2)
    entrypoint: str = Field(min_length=1)
    arguments: list[str] = Field(default_factory=list)
    requirements: JobRequirements = Field(default_factory=JobRequirements)
    model_overrides: list[JobModelOverride] = Field(default_factory=list)


class JobRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: str = Field(default_factory=generate_job_id)
    name: str
    runtime: str
    entrypoint: str
    arguments: list[str] = Field(default_factory=list)
    requirements: JobRequirements
    model_overrides: list[JobModelOverride] = Field(default_factory=list)
    status: JobStatus
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class JobListResponse(BaseModel):
    items: list[JobRecord]
    total: int
