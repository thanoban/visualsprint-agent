"""Action-agent blueprint aligned to the VisualSprint repo contracts."""

from __future__ import annotations

from visualsprint_agents.adk.prompting import render_instruction_text
from visualsprint_agents.adk.runtime import AdkAgentScaffold, create_root_agent
from visualsprint_agents.adk.shared import AgentBlueprint
from visualsprint_agents.adk.tool_contracts import CREATE_ACTION_RECOMMENDATIONS_TOOL
from visualsprint_agents.adk.tools.actions import create_action_recommendations
from visualsprint_agents.config import settings
from visualsprint_agents.models import ActionAgentRequest, ActionAgentResponse, AgentActionRecommendationInput


def build_action_agent_blueprint() -> AgentBlueprint:
    return AgentBlueprint(
        agent_id="visualsprint_action_agent",
        display_name="VisualSprint Action Agent",
        goal=(
            "Turn a final meeting report into structured, approval-based action "
            "recommendations for Jira and Slack without executing them directly."
        ),
        input_contract="ActionAgentRequest",
        output_contract="ActionAgentResponse",
        instructions=(
            "Only suggest actions when explicit evidence exists in the report.",
            "For Jira: create Task for implementation commitments, Story for product features, "
            "Bug for errors, Update when an existing issue is referenced, Resolve only when "
            "completion is explicitly confirmed.",
            "For Slack: post Meeting Summary at close, broadcast significant decisions, "
            "alert high-severity blockers affecting multiple teams, remind commitments "
            "with owners, notify when critical blockers are resolved.",
            "Assign owner_label only when explicitly mentioned; otherwise use 'not mentioned'.",
            "Rank urgency based on severity, number of affected teams, and explicit deadlines.",
            "Assign confidence 0.0-1.0 based on evidence strength; never invent evidence.",
            "Return schema-valid structured recommendations only.",
        ),
        tools=(CREATE_ACTION_RECOMMENDATIONS_TOOL,),
    )


def build_action_agent_scaffold() -> AdkAgentScaffold:
    blueprint = build_action_agent_blueprint()
    return AdkAgentScaffold(
        agent_id=blueprint.agent_id,
        display_name=blueprint.display_name,
        description=(
            "Turn a final meeting report into durable, approval-based Jira and Slack "
            "action recommendations for the VisualSprint control plane."
        ),
        model=settings.action_model,
        instruction=render_instruction_text(
            blueprint,
            input_contract=blueprint.input_contract,
            output_contract=blueprint.output_contract,
            output_schema_enforced=False,
        ),
        input_model=ActionAgentRequest,
        output_model=ActionAgentResponse,
        input_schema=ActionAgentRequest.model_json_schema(),
        output_schema=ActionAgentResponse.model_json_schema(),
        tools=(create_action_recommendations,),
        output_key="action_recommendations_response",
        include_contents="none",
        enforce_output_schema=False,
        notes=(
            "The scaffold keeps output schema metadata for deployment/export, but it "
            "does not enforce output_schema at runtime because this agent uses tools.",
        ),
    )


def build_action_root_agent() -> object:
    return create_root_agent(build_action_agent_scaffold())


root_agent = build_action_root_agent()
