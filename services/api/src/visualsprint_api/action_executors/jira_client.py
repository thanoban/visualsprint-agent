"""Jira action executor for VisualSprint."""

from __future__ import annotations

import base64
import json
from urllib import error, request

from visualsprint_api.config import settings
from visualsprint_api.models import ActionRecommendation, JiraRecommendation


def execute_jira_action(recommendation: ActionRecommendation) -> tuple[bool, str]:
    """Execute a Jira action. Returns (success, detail)."""

    jira_details = recommendation.jiraDetails
    if jira_details is None:
        return False, "No Jira details found in recommendation."

    if not settings.jira_base_url or not settings.jira_api_token_secret:
        return _execute_jira_stub(jira_details)

    if jira_details.action == "create_issue":
        return _create_jira_issue(jira_details)
    if jira_details.action == "update_issue":
        return _update_jira_issue(jira_details)
    if jira_details.action == "resolve_issue":
        return _resolve_jira_issue(jira_details)

    return False, f"Unsupported Jira action: {jira_details.action}"


def _jira_auth_header() -> str:
    """Build Basic Auth header using email:api_token."""
    # Jira uses email as the username and API token as the password.
    # We use a placeholder email if none is configured; in production
    # you should set VISUALSPRINT_JIRA_EMAIL or similar.
    email = getattr(settings, "jira_email", "api@visualsprint.dev")
    credentials = f"{email}:{settings.jira_api_token_secret}"
    encoded = base64.b64encode(credentials.encode("utf-8")).decode("ascii")
    return f"Basic {encoded}"


def _create_jira_issue(jira_details: JiraRecommendation) -> tuple[bool, str]:
    base_url = settings.jira_base_url.rstrip("/")
    url = f"{base_url}/rest/api/2/issue"

    # Map VisualSprint issue types to Jira issue types
    issue_type_mapping = {
        "task": "Task",
        "story": "Story",
        "bug": "Bug",
    }
    jira_issue_type = issue_type_mapping.get(jira_details.issueType, "Task")

    # Priority mapping
    priority_mapping = {
        "lowest": "Lowest",
        "low": "Low",
        "medium": "Medium",
        "high": "High",
        "highest": "Highest",
    }
    jira_priority = priority_mapping.get(jira_details.priority, "Medium")

    payload = {
        "fields": {
            "project": {"key": _resolve_project_key()},
            "summary": jira_details.title,
            "description": jira_details.description,
            "issuetype": {"name": jira_issue_type},
            "priority": {"name": jira_priority},
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": _jira_auth_header(),
    }

    try:
        response = request.urlopen(
            request.Request(
                url=url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            ),
            timeout=10,
        )
        result = json.loads(response.read().decode("utf-8"))
        issue_key = result.get("key", "unknown")
        return True, f"Jira issue created: {issue_key}"
    except error.HTTPError as e:
        body = e.read().decode("utf-8") if hasattr(e, "read") else ""
        return False, f"Jira API error {e.code}: {body}"
    except error.URLError as e:
        return False, f"Jira connection error: {e.reason}"


def _update_jira_issue(jira_details: JiraRecommendation) -> tuple[bool, str]:
    # Placeholder: requires issue key in jira_details.description or title
    return False, "Jira update not yet implemented."


def _resolve_jira_issue(jira_details: JiraRecommendation) -> tuple[bool, str]:
    # Placeholder: requires issue key
    return False, "Jira resolve not yet implemented."


def _resolve_project_key() -> str:
    """Resolve Jira project key from settings or fallback."""
    project_key = getattr(settings, "jira_project_key", None)
    if project_key:
        return project_key
    # Fallback to the confirmed project from testing
    return "SCRUM"


def _execute_jira_stub(jira_details: JiraRecommendation) -> tuple[bool, str]:
    action_label = jira_details.action.replace("_", " ").title()
    detail = (
        f"[JIRA STUB] {action_label}: '{jira_details.title}' "
        f"(type={jira_details.issueType}, priority={jira_details.priority}, "
        f"owner={jira_details.ownerLabel})"
    )
    return True, detail
