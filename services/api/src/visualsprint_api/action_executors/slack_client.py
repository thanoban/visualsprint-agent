"""Slack action executor stub for VisualSprint."""

from __future__ import annotations

from visualsprint_api.config import settings
from visualsprint_api.models import ActionRecommendation, SlackRecommendation


def execute_slack_action(recommendation: ActionRecommendation) -> tuple[bool, str]:
    """Execute a Slack action. Returns (success, detail).

    In local development this is a stub that logs and returns success.
    In production, this would call the Slack API using configured secrets.
    """

    slack_details = recommendation.slackDetails
    if slack_details is None:
        return False, "No Slack details found in recommendation."

    if not settings.slack_bot_token_secret:
        return _execute_slack_stub(slack_details)

    return _execute_slack_stub(slack_details)


def _execute_slack_stub(slack_details: SlackRecommendation) -> tuple[bool, str]:
    channel = slack_details.channel or settings.slack_default_channel or "#general"
    detail = (
        f"[SLACK STUB] {slack_details.type}: '{slack_details.title}' "
        f"to channel {channel}"
    )
    return True, detail
