"""Reasoning-agent blueprint aligned to the VisualSprint repo contracts."""

from __future__ import annotations

from visualsprint_agents.adk.shared import AgentBlueprint
from visualsprint_agents.adk.tool_contracts import (
    REGISTER_OUTPUTS_TOOL,
    SEARCH_PRIOR_OUTCOMES_TOOL,
)


def build_reasoning_agent_blueprint() -> AgentBlueprint:
    return AgentBlueprint(
        agent_id="visualsprint_reasoning_agent",
        display_name="VisualSprint Reasoning Agent",
        goal=(
            "Turn assembled chunk context into durable structured outputs while "
            "avoiding duplicate or weak signals."
        ),
        input_contract="ChunkInsight",
        output_contract="RegisterAgentOutputsRequest",
        instructions=(
            "Read transcript and screen evidence together before deciding whether a signal is durable.",
            "Prefer updates, resolutions, or reopen events over duplicate net-new records when the running state already contains the issue.",
            "Use historical retrieval before assigning recurring or reopened memory relations.",
            "Return schema-valid structured outputs only.",
            "Do not invent evidence that is not present in the supplied chunk context.",
        ),
        tools=(
            SEARCH_PRIOR_OUTCOMES_TOOL,
            REGISTER_OUTPUTS_TOOL,
        ),
    )
