from __future__ import annotations

from types import SimpleNamespace

import pytest

from visualsprint_agents.adk import engine_wrappers as wrappers_module
from visualsprint_agents.adk.engine_wrappers import (
    VisualSprintActionEngine,
    VisualSprintReasoningEngine,
    VisualSprintSummaryEngine,
    _coalesce_summary_output,
    _extract_structured_output,
)
from visualsprint_agents.models import (
    ActionAgentRequest,
    ChunkInsightRequest,
    FinalReportDraft,
    SummaryPacketRequest,
)


class _FakeEvent:
    """Minimal stand-in for an ADK event for extraction tests."""

    def __init__(self, *, text=None, function_calls=None, function_responses=None, state_delta=None):
        self.content = None
        if text is not None:
            self.content = SimpleNamespace(parts=[SimpleNamespace(text=text, function_response=None)])
        self._function_calls = function_calls or []
        self._function_responses = function_responses or []
        self.actions = SimpleNamespace(state_delta=state_delta or {})

    def get_function_calls(self):
        return [SimpleNamespace(args=args) for args in self._function_calls]

    def get_function_responses(self):
        return [SimpleNamespace(response=resp) for resp in self._function_responses]


_SUMMARY_INPUT = {
    "meetingId": "mtg_extract_001",
    "draftExecutiveSummary": "Draft exec summary.",
}


def _extract_summary(events):
    return _extract_structured_output(
        events,
        output_model=FinalReportDraft,
        input_payload=_SUMMARY_INPUT,
        coalesce=_coalesce_summary_output,
        output_key="final_report_draft",
    )


def test_extract_handles_prose_wrapped_json():
    text = "Here is the report:\n```json\n{\"executiveSummary\": \"Done.\"}\n```\nThanks!"
    result = _extract_summary([_FakeEvent(text=text)])
    assert result["meetingId"] == "mtg_extract_001"
    assert result["executiveSummary"] == "Done."


def test_extract_handles_state_delta_output_key():
    event = _FakeEvent(state_delta={"final_report_draft": {"executiveSummary": "From state."}})
    result = _extract_summary([event])
    assert result["executiveSummary"] == "From state."


def test_extract_handles_finalize_report_tool_args():
    event = _FakeEvent(
        function_calls=[{"meetingId": "mtg_extract_001", "report": {"executiveSummary": "From tool."}}]
    )
    result = _extract_summary([event])
    assert result["executiveSummary"] == "From tool."


def test_extract_raises_with_diagnostic_when_nothing_matches():
    with pytest.raises(ValueError) as exc:
        _extract_summary([_FakeEvent(text="no structured output here")])
    assert "Diagnostic" in str(exc.value)


def test_engine_wrappers_register_query_operation():
    engine = VisualSprintReasoningEngine()
    assert engine.register_operations() == {"": ["query"]}


def test_reasoning_engine_query_accepts_vertex_kwargs(monkeypatch):
    captured: dict[str, object] = {}

    def fake_run(*, root_agent, app_name, input_payload, output_model, coalesce):
        captured["input_payload"] = input_payload
        return {
            "clientChunkId": input_payload["clientChunkId"],
            "decisions": [],
            "commitments": [],
            "blockers": [],
            "openQuestions": [],
            "memoryMatches": [],
            "resolvedDecisionIds": [],
            "resolvedCommitmentIds": [],
            "resolvedBlockerIds": [],
            "resolvedOpenQuestionIds": [],
        }

    monkeypatch.setattr(wrappers_module, "run_structured_adk_query", fake_run)

    engine = VisualSprintReasoningEngine()
    result = engine.query(
        meetingId="mtg_wrapper_001",
        meetingTitle="Wrapper sync",
        meetingNotes="",
        clientChunkId="client-chunk-wrapper-kwargs",
        focusSummary="Vertex passes kwargs.",
        attentionFlags=[],
        reasoningChecklist=[],
        focusAreas=[],
    )

    assert result["clientChunkId"] == "client-chunk-wrapper-kwargs"


def test_reasoning_engine_query_returns_structured_dict(monkeypatch):
    captured: dict[str, object] = {}

    def fake_run(*, root_agent, app_name, input_payload, output_model, coalesce):
        captured["app_name"] = app_name
        captured["input_payload"] = input_payload
        return {
            "clientChunkId": input_payload["clientChunkId"],
            "decisions": [],
            "commitments": [],
            "blockers": [],
            "openQuestions": [],
            "memoryMatches": [],
            "resolvedDecisionIds": [],
            "resolvedCommitmentIds": [],
            "resolvedBlockerIds": [],
            "resolvedOpenQuestionIds": [],
        }

    monkeypatch.setattr(wrappers_module, "run_structured_adk_query", fake_run)

    engine = VisualSprintReasoningEngine()
    result = engine.query(
        **ChunkInsightRequest(
            meetingId="mtg_wrapper_001",
            meetingTitle="Wrapper sync",
            meetingNotes="",
            clientChunkId="client-chunk-wrapper-001",
            focusSummary="Wrapper path should expose query().",
            attentionFlags=[],
            reasoningChecklist=[],
            focusAreas=[],
        ).model_dump(mode="json")
    )

    assert result["clientChunkId"] == "client-chunk-wrapper-001"
    assert captured["app_name"] == "visualsprint_reasoning_agent"


def test_summary_engine_query_returns_structured_dict(monkeypatch):
    def fake_run(*, root_agent, app_name, input_payload, output_model, coalesce):
        return {
            "meetingId": input_payload["meetingId"],
            "generatedAt": "2026-06-10T00:00:00Z",
            "executiveSummary": "Summary from wrapper query().",
            "decisions": [],
            "commitments": [],
            "blockers": [],
            "openQuestions": [],
            "memoryHighlights": [],
        }

    monkeypatch.setattr(wrappers_module, "run_structured_adk_query", fake_run)

    engine = VisualSprintSummaryEngine()
    result = engine.query(
        **SummaryPacketRequest(
            meetingId="mtg_wrapper_001",
            meetingTitle="Wrapper sync",
            meetingStatus="closed",
            draftExecutiveSummary="Draft summary",
        ).model_dump(mode="json")
    )

    assert result["meetingId"] == "mtg_wrapper_001"
    assert result["executiveSummary"] == "Summary from wrapper query()."


def test_action_engine_query_returns_structured_dict(monkeypatch):
    def fake_run(*, root_agent, app_name, input_payload, output_model, coalesce):
        return {
            "meetingId": input_payload["meetingId"],
            "recommendations": [],
        }

    monkeypatch.setattr(wrappers_module, "run_structured_adk_query", fake_run)

    engine = VisualSprintActionEngine()
    result = engine.query(
        **ActionAgentRequest(
            meetingId="mtg_wrapper_001",
            meetingTitle="Wrapper sync",
            executiveSummary="Action summary",
        ).model_dump(mode="json")
    )

    assert result["meetingId"] == "mtg_wrapper_001"
    assert result["recommendations"] == []
