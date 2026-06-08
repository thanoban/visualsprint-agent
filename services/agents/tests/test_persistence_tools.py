"""Tests for the ADK persistence tools and configurable agent models.

- persistence tools POST to the control plane when VISUALSPRINT_CONTROL_PLANE_URL
  is configured, and stay in safe "deferred" mode otherwise;
- the ADK reasoning/summary/action scaffolds use env-configurable model ids.
"""

from __future__ import annotations

import sys
from pathlib import Path

AGENTS_SRC = Path(__file__).resolve().parents[1] / "src"
if str(AGENTS_SRC) not in sys.path:
    sys.path.insert(0, str(AGENTS_SRC))

from visualsprint_agents.adk import action_agent, reasoning_agent, summary_agent  # noqa: E402
from visualsprint_agents.adk.tools import persistence  # noqa: E402
from visualsprint_agents.config import build_settings  # noqa: E402


class _FakeResponse:
    status = 200


def test_register_outputs_deferred_without_control_plane(monkeypatch):
    monkeypatch.setattr(persistence, "settings", build_settings({}))
    result = persistence.register_outputs("mtg_x", "chunk_x", {"decisions": [], "blockers": []})
    assert result["status"] == "deferred"
    assert result["acceptedKeys"] == ["blockers", "decisions"]


def test_register_outputs_posts_when_control_plane_configured(monkeypatch):
    configured = build_settings({"VISUALSPRINT_CONTROL_PLANE_URL": "https://api.example"})
    monkeypatch.setattr(persistence, "settings", configured)

    captured: dict[str, object] = {}

    def fake_urlopen(req, timeout=None):
        captured["url"] = req.full_url
        captured["method"] = req.method
        return _FakeResponse()

    monkeypatch.setattr(persistence.request, "urlopen", fake_urlopen)

    result = persistence.register_outputs("mtg_x", "chunk_x", {"decisions": []})
    assert result["status"] == "ok"
    assert captured["url"] == "https://api.example/api/meetings/mtg_x/outputs/register"
    assert captured["method"] == "POST"


def test_finalize_report_posts_when_control_plane_configured(monkeypatch):
    configured = build_settings({"VISUALSPRINT_CONTROL_PLANE_URL": "https://api.example/"})
    monkeypatch.setattr(persistence, "settings", configured)

    captured: dict[str, object] = {}

    def fake_urlopen(req, timeout=None):
        captured["url"] = req.full_url
        return _FakeResponse()

    monkeypatch.setattr(persistence.request, "urlopen", fake_urlopen)

    result = persistence.finalize_report("mtg_x", {"executiveSummary": "Done"})
    assert result["status"] == "ok"
    assert captured["url"] == "https://api.example/api/meetings/mtg_x/final-report"


def test_register_outputs_error_when_control_plane_unreachable(monkeypatch):
    from urllib import error as urllib_error

    configured = build_settings({"VISUALSPRINT_CONTROL_PLANE_URL": "https://api.example"})
    monkeypatch.setattr(persistence, "settings", configured)

    def fake_urlopen(req, timeout=None):
        raise urllib_error.URLError("connection refused")

    monkeypatch.setattr(persistence.request, "urlopen", fake_urlopen)

    result = persistence.register_outputs("mtg_x", "chunk_x", {"decisions": []})
    assert result["status"] == "error"


def test_reasoning_model_is_env_configurable(monkeypatch):
    monkeypatch.setattr(
        reasoning_agent,
        "settings",
        build_settings({"VISUALSPRINT_REASONING_MODEL": "gemini-2.5-pro"}),
    )
    assert reasoning_agent.build_reasoning_agent_scaffold().model == "gemini-2.5-pro"


def test_summary_model_is_env_configurable(monkeypatch):
    monkeypatch.setattr(
        summary_agent,
        "settings",
        build_settings({"VISUALSPRINT_SUMMARY_MODEL": "gemini-2.5-flash"}),
    )
    assert summary_agent.build_summary_agent_scaffold().model == "gemini-2.5-flash"


def test_action_model_is_env_configurable(monkeypatch):
    monkeypatch.setattr(
        action_agent,
        "settings",
        build_settings({"VISUALSPRINT_ACTION_MODEL": "gemini-2.5-flash"}),
    )
    assert action_agent.build_action_agent_scaffold().model == "gemini-2.5-flash"
