"""ADK-facing runtime scaffolds for deployable VisualSprint agents."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel


ToolCallable = Callable[..., Any]


@dataclass(frozen=True, slots=True)
class AdkAgentScaffold:
    agent_id: str
    display_name: str
    description: str
    model: str
    instruction: str
    input_model: type[BaseModel]
    output_model: type[BaseModel]
    input_schema: dict[str, Any]
    output_schema: dict[str, Any]
    tools: tuple[ToolCallable, ...] = field(default_factory=tuple)
    output_key: str | None = None
    include_contents: str = "none"
    enforce_output_schema: bool = False
    notes: tuple[str, ...] = field(default_factory=tuple)


def create_root_agent(scaffold: AdkAgentScaffold) -> object:
    """Build a real ADK agent when the dependency is installed, else return the scaffold."""

    try:
        from google.adk.agents import LlmAgent  # type: ignore
    except ImportError:
        return scaffold

    kwargs: dict[str, Any] = {
        "name": scaffold.agent_id,
        "description": scaffold.description,
        "model": scaffold.model,
        "instruction": scaffold.instruction,
        "tools": list(scaffold.tools),
        "input_schema": scaffold.input_model,
        "include_contents": scaffold.include_contents,
    }
    if scaffold.output_key is not None:
        kwargs["output_key"] = scaffold.output_key
    if scaffold.enforce_output_schema:
        kwargs["output_schema"] = scaffold.output_model
    return LlmAgent(**kwargs)
