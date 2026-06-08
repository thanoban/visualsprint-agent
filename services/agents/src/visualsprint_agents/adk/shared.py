"""Shared blueprint helpers for future ADK-backed agent implementations."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class AgentToolBlueprint:
    name: str
    purpose: str
    required: bool = True


@dataclass(frozen=True, slots=True)
class AgentBlueprint:
    agent_id: str
    display_name: str
    goal: str
    input_contract: str
    output_contract: str
    instructions: tuple[str, ...]
    tools: tuple[AgentToolBlueprint, ...] = field(default_factory=tuple)
