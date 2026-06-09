"""Slack action executor for VisualSprint."""

from __future__ import annotations

import json
from urllib import error, request

from visualsprint_api.config import settings
from visualsprint_api.models import ActionRecommendation, SlackRecommendation


def execute_slack_action(recommendation: ActionRecommendation) -> tuple[bool, str]:
    """Execute a Slack action. Returns (success, detail)."""

    slack_details = recommendation.slackDetails
    if slack_details is None:
        return False, "No Slack details found in recommendation."

    if not settings.slack_bot_token_secret:
        return _execute_slack_stub(slack_details)

    return _post_slack_message(slack_details)


def _post_slack_message(slack_details: SlackRecommendation) -> tuple[bool, str]:
    url = "https://slack.com/api/chat.postMessage"
    channel = slack_details.channel or settings.slack_default_channel or "#general"

    # Ensure channel has # prefix if it's a channel name
    if channel and not channel.startswith("#") and not channel.startswith("@") and not channel.startswith("C"):
        channel = f"#{channel}"

    payload = {
        "channel": channel,
        "text": f"*{slack_details.title}*\n{slack_details.message}",
        "unfurl_links": False,
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.slack_bot_token_secret}",
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
        if result.get("ok"):
            ts = result.get("ts", "unknown")
            return True, f"Slack message posted to {channel} (ts={ts})"
        error_msg = result.get("error", "unknown_error")
        return False, f"Slack API error: {error_msg}"
    except error.HTTPError as e:
        body = e.read().decode("utf-8") if hasattr(e, "read") else ""
        return False, f"Slack HTTP error {e.code}: {body}"
    except error.URLError as e:
        return False, f"Slack connection error: {e.reason}"


def _execute_slack_stub(slack_details: SlackRecommendation) -> tuple[bool, str]:
    channel = slack_details.channel or settings.slack_default_channel or "#general"
    detail = (
        f"[SLACK STUB] {slack_details.type}: '{slack_details.title}' "
        f"to channel {channel}"
    )
    return True, detail
