"""Elastic document models used by the VisualSprint API."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from visualsprint_api.models import (
    BlockerSeverity,
    EvidenceReference,
    ReasoningRecordStatus,
    ReasoningRecordType,
)


class ElasticOutcomeDocument(BaseModel):
    id: str = Field(min_length=4, max_length=180)
    tenant_id: str = Field(min_length=1, max_length=120)
    meeting_id: str = Field(min_length=4, max_length=120)
    meeting_title: str = Field(min_length=3, max_length=120)
    record_type: ReasoningRecordType
    summary: str = Field(min_length=4, max_length=240)
    detail: str = Field(min_length=6, max_length=600)
    status: ReasoningRecordStatus
    owner_label: str | None = Field(default=None, min_length=2, max_length=60)
    speaker_label: str | None = Field(default=None, min_length=2, max_length=60)
    due_hint: str | None = Field(default=None, min_length=2, max_length=60)
    severity: BlockerSeverity | None = None
    first_seen_chunk_id: str = Field(min_length=8, max_length=120)
    last_updated_chunk_id: str = Field(min_length=8, max_length=120)
    created_at: datetime
    updated_at: datetime
    evidence: list[EvidenceReference] = Field(default_factory=list, max_length=4)

    @property
    def document_id(self) -> str:
        return f"{self.tenant_id}:{self.meeting_id}:{self.id}"
