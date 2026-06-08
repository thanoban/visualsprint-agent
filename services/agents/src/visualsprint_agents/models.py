"""Pydantic models for the VisualSprint agents service."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


AgentAdapterMode = Literal["mock", "configured_cloud"]
AgentRuntimeBackend = Literal["bridge", "vertex_ai_reasoning_engine"]
BlockerSeverity = Literal["low", "medium", "high"]
MemoryMatchStrength = Literal["related", "recurring", "critical"]
MemoryMatchRelation = Literal["new", "recurring", "reopened", "resolved_previously"]
ReasoningRecordType = Literal["decision", "commitment", "blocker", "open_question"]
InvocationAgentKind = Literal["reasoning", "summary"]
InvocationExecutionMode = Literal[
    "mock",
    "bridge",
    "bridge_fallback",
    "vertex_ai",
    "vertex_ai_fallback",
]
InvocationStatus = Literal["success", "fallback", "error"]


class ChunkInsightFocus(BaseModel):
    recordType: ReasoningRecordType
    summary: str
    detail: str
    evidence: list[str] = Field(default_factory=list)


class ChunkInsightRequest(BaseModel):
    meetingId: str
    meetingTitle: str
    meetingNotes: str = ""
    clientChunkId: str
    focusSummary: str
    attentionFlags: list[str] = Field(default_factory=list)
    reasoningChecklist: list[str] = Field(default_factory=list)
    focusAreas: list[ChunkInsightFocus] = Field(default_factory=list)


class AgentDecisionInput(BaseModel):
    title: str
    rationale: str
    speakerLabel: str


class AgentCommitmentInput(BaseModel):
    ownerLabel: str
    action: str
    dueHint: str


class AgentBlockerInput(BaseModel):
    summary: str
    severity: BlockerSeverity
    ownerLabel: str


class AgentOpenQuestionInput(BaseModel):
    question: str
    speakerLabel: str


class AgentMemoryMatchInput(BaseModel):
    sourceMeetingId: str
    summary: str
    sourceMeetingTitle: str
    strength: MemoryMatchStrength
    relation: MemoryMatchRelation
    score: float = Field(ge=0.0, le=1.0)
    snippet: str


class ReasoningRunResponse(BaseModel):
    clientChunkId: str
    decisions: list[AgentDecisionInput] = Field(default_factory=list)
    commitments: list[AgentCommitmentInput] = Field(default_factory=list)
    blockers: list[AgentBlockerInput] = Field(default_factory=list)
    openQuestions: list[AgentOpenQuestionInput] = Field(default_factory=list)
    memoryMatches: list[AgentMemoryMatchInput] = Field(default_factory=list)
    resolvedDecisionIds: list[str] = Field(default_factory=list)
    resolvedCommitmentIds: list[str] = Field(default_factory=list)
    resolvedBlockerIds: list[str] = Field(default_factory=list)
    resolvedOpenQuestionIds: list[str] = Field(default_factory=list)


class DecisionRecord(BaseModel):
    title: str
    rationale: str
    speakerLabel: str
    status: str


class CommitmentRecord(BaseModel):
    ownerLabel: str
    action: str
    dueHint: str
    status: str


class BlockerRecord(BaseModel):
    summary: str
    severity: BlockerSeverity
    ownerLabel: str
    status: str


class OpenQuestionRecord(BaseModel):
    question: str
    speakerLabel: str
    status: str


class MemoryMatch(BaseModel):
    summary: str
    relation: MemoryMatchRelation
    score: float


class SummaryPacketRequest(BaseModel):
    meetingId: str
    meetingTitle: str
    meetingStatus: str
    draftExecutiveSummary: str
    decisions: list[DecisionRecord] = Field(default_factory=list)
    commitments: list[CommitmentRecord] = Field(default_factory=list)
    blockers: list[BlockerRecord] = Field(default_factory=list)
    openQuestions: list[OpenQuestionRecord] = Field(default_factory=list)
    memoryHighlights: list[MemoryMatch] = Field(default_factory=list)


class FinalReportDraft(BaseModel):
    meetingId: str
    generatedAt: datetime
    executiveSummary: str
    decisions: list[DecisionRecord] = Field(default_factory=list)
    commitments: list[CommitmentRecord] = Field(default_factory=list)
    blockers: list[BlockerRecord] = Field(default_factory=list)
    openQuestions: list[OpenQuestionRecord] = Field(default_factory=list)
    memoryHighlights: list[MemoryMatch] = Field(default_factory=list)


class ServiceHealth(BaseModel):
    service: str
    status: Literal["ok"] = "ok"
    version: str
    track: str
    mode: AgentAdapterMode
    runtimeBackend: AgentRuntimeBackend
    deploymentTarget: Literal["local_dev", "cloud_run"]
    deploymentReady: bool
    reasoningAgentConfigured: bool
    summaryAgentConfigured: bool
    reasoningEngineResourceConfigured: bool
    summaryEngineResourceConfigured: bool
    reasoningEndpointConfigured: bool
    summaryEndpointConfigured: bool
    bridgeAuthConfigured: bool
    googleAccessTokenConfigured: bool
    secretManagerConfigured: bool
    cloudRunServiceConfigured: bool
    elasticMcpConfigured: bool
    allowedOriginsConfigured: int
    missingConfiguration: list[str] = Field(default_factory=list)
    note: str


class InvocationAuditEntry(BaseModel):
    invokedAt: datetime
    agentKind: InvocationAgentKind
    executionMode: InvocationExecutionMode
    status: InvocationStatus
    targetAgentId: str | None = None
    requestKey: str
    detail: str


class InvocationAuditSummary(BaseModel):
    total: int = 0
    reasoningRuns: int = 0
    summaryRuns: int = 0
    bridgeRuns: int = 0
    bridgeFallbackRuns: int = 0
    mockRuns: int = 0


class InvocationAuditResponse(BaseModel):
    summary: InvocationAuditSummary
    invocations: list[InvocationAuditEntry] = Field(default_factory=list)
