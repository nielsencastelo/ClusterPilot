from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class NodeOrm(Base):
    __tablename__ = "nodes"

    node_id: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    address: Mapped[str] = mapped_column(String(200))
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(40))
    capabilities: Mapped[dict] = mapped_column(JSON)
    heartbeat: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class JobOrm(Base):
    __tablename__ = "jobs"

    job_id: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(240))
    runtime: Mapped[str] = mapped_column(String(120))
    entrypoint: Mapped[str] = mapped_column(String(255))
    arguments: Mapped[list[str]] = mapped_column(JSON, default=list)
    requirements: Mapped[dict] = mapped_column(JSON)
    model_overrides: Mapped[list[dict]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ModelCatalogOrm(Base):
    __tablename__ = "model_catalog"

    key: Mapped[str] = mapped_column(String(255), primary_key=True)
    provider: Mapped[str] = mapped_column(String(120))
    model: Mapped[str] = mapped_column(String(200))
    label: Mapped[str] = mapped_column(String(240))
    source: Mapped[str] = mapped_column(String(40))
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(40))
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    recommended_for: Mapped[list[str]] = mapped_column(JSON, default=list)


class AgentConfigOrm(Base):
    __tablename__ = "agent_model_config"

    agent_name: Mapped[str] = mapped_column(String(120), primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    provider: Mapped[str] = mapped_column(String(120))
    model: Mapped[str] = mapped_column(String(200))
    custom_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    temperature: Mapped[float] = mapped_column(Float, default=0.2)
    manual_override: Mapped[bool] = mapped_column(Boolean, default=False)
