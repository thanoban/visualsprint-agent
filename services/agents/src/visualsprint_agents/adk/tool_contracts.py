"""Tool contracts the future ADK agents should expose or consume."""

from __future__ import annotations

from visualsprint_agents.adk.shared import AgentToolBlueprint


REGISTER_OUTPUTS_TOOL = AgentToolBlueprint(
    name="register_outputs",
    purpose=(
        "Persist durable decisions, commitments, blockers, open questions, "
        "and memory matches back through the deterministic control plane."
    ),
)

FINALIZE_REPORT_TOOL = AgentToolBlueprint(
    name="finalize_report",
    purpose="Persist the final summary report through the deterministic control plane.",
)

SEARCH_PRIOR_OUTCOMES_TOOL = AgentToolBlueprint(
    name="search_prior_outcomes",
    purpose=(
        "Fetch ranked historical candidates from the production memory layer "
        "before labeling a signal as new, recurring, reopened, or resolved_previously."
    ),
)

CREATE_ACTION_RECOMMENDATIONS_TOOL = AgentToolBlueprint(
    name="create_action_recommendations",
    purpose=(
        "Generate structured Jira and Slack action recommendations from a final report. "
        "Only suggest actions when explicit evidence exists. Never execute directly."
    ),
)
