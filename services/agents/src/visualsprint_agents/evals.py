"""Fixture-backed evaluation helpers for the VisualSprint agents service."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from visualsprint_agents.models import (
    ChunkInsightRequest,
    FinalReportDraft,
    ReasoningRunResponse,
    SummaryPacketRequest,
)
from visualsprint_agents.reasoning import run_reasoning_agent
from visualsprint_agents.summary import run_summary_agent


FixtureKind = Literal["reasoning", "summary"]


class ReasoningExpectations(BaseModel):
    minDecisions: int = 0
    minCommitments: int = 0
    minBlockers: int = 0
    minOpenQuestions: int = 0
    minMemoryMatches: int = 0


class SummaryExpectations(BaseModel):
    executiveSummaryIncludes: list[str] = Field(default_factory=list)
    minDecisions: int = 0
    minCommitments: int = 0
    minBlockers: int = 0
    minOpenQuestions: int = 0


class ReasoningEvalFixture(BaseModel):
    fixtureId: str
    kind: Literal["reasoning"] = "reasoning"
    description: str
    payload: ChunkInsightRequest
    expectations: ReasoningExpectations


class SummaryEvalFixture(BaseModel):
    fixtureId: str
    kind: Literal["summary"] = "summary"
    description: str
    payload: SummaryPacketRequest
    expectations: SummaryExpectations


@dataclass(frozen=True)
class EvalResult:
    fixture_id: str
    kind: FixtureKind
    passed: bool
    detail: str


def _service_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _fixture_dir(kind: FixtureKind) -> Path:
    return _service_root() / "evals" / "fixtures" / kind


def load_reasoning_eval_fixtures() -> list[ReasoningEvalFixture]:
    return [
        ReasoningEvalFixture.model_validate_json(path.read_text(encoding="utf-8"))
        for path in sorted(_fixture_dir("reasoning").glob("*.json"))
    ]


def load_summary_eval_fixtures() -> list[SummaryEvalFixture]:
    return [
        SummaryEvalFixture.model_validate_json(path.read_text(encoding="utf-8"))
        for path in sorted(_fixture_dir("summary").glob("*.json"))
    ]


def _validate_reasoning_fixture(
    fixture: ReasoningEvalFixture,
    response: ReasoningRunResponse,
) -> EvalResult:
    failures: list[str] = []
    if response.clientChunkId != fixture.payload.clientChunkId:
        failures.append("clientChunkId mismatch")
    if len(response.decisions) < fixture.expectations.minDecisions:
        failures.append("decisions below minimum")
    if len(response.commitments) < fixture.expectations.minCommitments:
        failures.append("commitments below minimum")
    if len(response.blockers) < fixture.expectations.minBlockers:
        failures.append("blockers below minimum")
    if len(response.openQuestions) < fixture.expectations.minOpenQuestions:
        failures.append("open questions below minimum")
    if len(response.memoryMatches) < fixture.expectations.minMemoryMatches:
        failures.append("memory matches below minimum")

    return EvalResult(
        fixture_id=fixture.fixtureId,
        kind="reasoning",
        passed=not failures,
        detail=", ".join(failures) if failures else "ok",
    )


def _validate_summary_fixture(
    fixture: SummaryEvalFixture,
    response: FinalReportDraft,
) -> EvalResult:
    failures: list[str] = []
    if response.meetingId != fixture.payload.meetingId:
        failures.append("meetingId mismatch")
    if len(response.decisions) < fixture.expectations.minDecisions:
        failures.append("decisions below minimum")
    if len(response.commitments) < fixture.expectations.minCommitments:
        failures.append("commitments below minimum")
    if len(response.blockers) < fixture.expectations.minBlockers:
        failures.append("blockers below minimum")
    if len(response.openQuestions) < fixture.expectations.minOpenQuestions:
        failures.append("open questions below minimum")
    for snippet in fixture.expectations.executiveSummaryIncludes:
        if snippet not in response.executiveSummary:
            failures.append(f"executive summary missing '{snippet}'")

    return EvalResult(
        fixture_id=fixture.fixtureId,
        kind="summary",
        passed=not failures,
        detail=", ".join(failures) if failures else "ok",
    )


def run_agent_eval_smoke() -> list[EvalResult]:
    results: list[EvalResult] = []

    for fixture in load_reasoning_eval_fixtures():
        response = run_reasoning_agent(fixture.payload)
        results.append(_validate_reasoning_fixture(fixture, response))

    for fixture in load_summary_eval_fixtures():
        response = run_summary_agent(fixture.payload)
        results.append(_validate_summary_fixture(fixture, response))

    return results


def run_agent_eval_smoke_as_json() -> str:
    results = run_agent_eval_smoke()
    payload = {
        "fixtureCount": len(results),
        "passed": sum(1 for result in results if result.passed),
        "failed": sum(1 for result in results if not result.passed),
        "results": [
            {
                "fixtureId": result.fixture_id,
                "kind": result.kind,
                "passed": result.passed,
                "detail": result.detail,
            }
            for result in results
        ],
    }
    return json.dumps(payload, indent=2)
