from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from clusterpilot_core.models import AgentName, ModelSource, ModelStatus

from .models import AgentConfigOrm, ModelCatalogOrm


async def seed_initial_data(session: AsyncSession) -> None:
    model_exists = await session.scalar(select(ModelCatalogOrm.key).limit(1))
    if model_exists is None:
        session.add_all(
            [
                ModelCatalogOrm(
                    key="ollama::qwen2.5:3b",
                    provider="ollama",
                    model="qwen2.5:3b",
                    label="Ollama - Qwen 2.5 3B",
                    source=ModelSource.LOCAL.value,
                    available=True,
                    status=ModelStatus.INSTALLED.value,
                    tags=["balanced", "local"],
                    recommended_for=[AgentName.INVENTORY.value, AgentName.HEARTBEAT.value],
                ),
                ModelCatalogOrm(
                    key="openai::gpt-4.1-mini",
                    provider="openai",
                    model="gpt-4.1-mini",
                    label="OpenAI - GPT-4.1 Mini",
                    source=ModelSource.CLOUD.value,
                    available=True,
                    status=ModelStatus.CONFIGURED.value,
                    tags=["cloud", "fast"],
                    recommended_for=[AgentName.EXECUTION.value, AgentName.TELEMETRY.value, AgentName.PLANNER.value],
                ),
            ]
        )

    config_exists = await session.scalar(select(AgentConfigOrm.agent_name).limit(1))
    if config_exists is None:
        session.add_all(
            [
                AgentConfigOrm(
                    agent_name=AgentName.INVENTORY.value,
                    enabled=True,
                    provider="ollama",
                    model="qwen2.5:3b",
                    custom_prompt="Focus on hardware discovery, compatibility and capability normalization.",
                    system_prompt="You are the inventory specialist for ClusterPilot nodes.",
                    temperature=0.1,
                    manual_override=False,
                ),
                AgentConfigOrm(
                    agent_name=AgentName.EXECUTION.value,
                    enabled=True,
                    provider="openai",
                    model="gpt-4.1-mini",
                    custom_prompt="Plan safe workload execution and keep command decisions explicit.",
                    system_prompt="You are the execution planner for ClusterPilot jobs.",
                    temperature=0.2,
                    manual_override=False,
                ),
                AgentConfigOrm(
                    agent_name=AgentName.PLANNER.value,
                    enabled=True,
                    provider="openai",
                    model="gpt-4.1-mini",
                    custom_prompt="Optimize placement using available hardware, memory and network profile.",
                    system_prompt="You are the scheduling planner for ClusterPilot.",
                    temperature=0.2,
                    manual_override=False,
                ),
            ]
        )

    await session.commit()
