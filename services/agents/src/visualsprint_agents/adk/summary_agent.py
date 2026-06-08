"""Summary-agent blueprint aligned to the VisualSprint repo contracts."""

from __future__ import annotations

from visualsprint_agents.adk.shared import AgentBlueprint
from visualsprint_agents.adk.tool_contracts import FINALIZE_REPORT_TOOL


def build_summary_agent_blueprint() -> AgentBlueprint:
    return AgentBlueprint(
        agent_id="visualsprint_summary_agent",
        display_name="VisualSprint Summary Agent",
        goal=(
            "Turn the assembled meeting summary packet into a final structured "
            "report that preserves durable outcomes and unresolved risks."
        ),
        input_contract="MeetingSummaryPacket",
        output_contract="FinalReport",
        instructions=(
            "Summarize durable outcomes rather than replaying the full discussion.",
            "Keep commitments explicit with owners and due hints when present.",
            "Preserve unresolved blockers and open questions instead of hiding them in prose.",
            "Use historical memory only when it changes confidence, priority, or urgency.",
            "Return a schema-valid final report payload.",
        ),
        tools=(FINALIZE_REPORT_TOOL,),
    )
