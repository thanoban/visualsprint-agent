"""Jira action executor stub for VisualSprint."""

from __future__ import annotations

from visualsprint_api.config import settings
from visualsprint_api.models import ActionRecommendation, JiraRecommendation


def execute_jira_action(recommendation: ActionRecommendation) -> tuple[bool, str]:
    """Execute a Jira action. Returns (success, detail).

    In local development this is a stub that logs and returns success.
    In production, this would call the Jira REST API using configured secrets.
    """

    jira_details = recommendation.jiraDetails
    if jira_details is None:
        return False, "No Jira details found in recommendation."

    if not settings.jira_base_url or not settings.jira_api_token_secret:
        return _execute_jira_stub(jira_details)

    return _execute_jira_stub(jira_details)


def _execute_jira_stub(jira_details: JiraRecommendation) -> tuple[bool, str]:
    action_label = jira_details.action.replace("_", " ").title()
    detail = (
        f"[JIRA STUB] {action_label}: '{jira_details.title}' "
        f"(type={jira_details.issueType}, priority={jira_details.priority}, "
        f"owner={jira_details.ownerLabel})"
    )
    return True, detail
