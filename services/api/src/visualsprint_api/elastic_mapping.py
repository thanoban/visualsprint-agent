"""Helpers for mapping repo-native outcome records to Elastic documents."""

from __future__ import annotations

from datetime import datetime

from visualsprint_api.elastic_models import ElasticOutcomeDocument
from visualsprint_api.models import IndexedOutcomeDocument, MemoryMatch


DEFAULT_TENANT_ID = "default"


def map_indexed_outcome_to_elastic_document(
    *,
    meeting_title: str,
    outcome: IndexedOutcomeDocument,
    tenant_id: str = DEFAULT_TENANT_ID,
) -> ElasticOutcomeDocument:
    return ElasticOutcomeDocument(
        id=outcome.id,
        tenant_id=tenant_id,
        meeting_id=outcome.meetingId,
        meeting_title=meeting_title,
        record_type=outcome.recordType,
        summary=outcome.summary,
        detail=outcome.detail,
        status=outcome.status,
        owner_label=outcome.ownerLabel,
        speaker_label=outcome.speakerLabel,
        due_hint=outcome.dueHint,
        severity=outcome.severity,
        first_seen_chunk_id=outcome.firstSeenChunkId,
        last_updated_chunk_id=outcome.lastUpdatedChunkId,
        created_at=outcome.createdAt,
        updated_at=outcome.updatedAt,
        evidence=[reference.model_copy(deep=True) for reference in outcome.evidence],
    )


def build_elasticsearch_document_body(document: ElasticOutcomeDocument) -> dict:
    return {
        "id": document.id,
        "tenant_id": document.tenant_id,
        "meeting_id": document.meeting_id,
        "meeting_title": document.meeting_title,
        "record_type": document.record_type,
        "summary": document.summary,
        "detail": document.detail,
        "status": document.status,
        "owner_label": document.owner_label,
        "speaker_label": document.speaker_label,
        "due_hint": document.due_hint,
        "severity": document.severity,
        "first_seen_chunk_id": document.first_seen_chunk_id,
        "last_updated_chunk_id": document.last_updated_chunk_id,
        "created_at": document.created_at.isoformat(),
        "updated_at": document.updated_at.isoformat(),
        "evidence": [reference.model_dump(mode="json") for reference in document.evidence],
    }


def map_elastic_document_to_memory_match(
    *,
    document: ElasticOutcomeDocument,
    score: float,
    recorded_at: datetime,
) -> MemoryMatch:
    relation = "resolved_previously"
    if document.status == "reopened":
        relation = "reopened"
    elif document.status != "resolved":
        relation = "recurring"

    strength = "critical"
    if score < 0.9:
        strength = "recurring"
    if score < 0.75:
        strength = "related"

    snippet = document.detail
    if document.evidence and document.evidence[0].note:
        snippet = document.evidence[0].note

    return MemoryMatch(
        id=document.id,
        sourceMeetingId=document.meeting_id,
        summary=document.summary,
        sourceMeetingTitle=document.meeting_title,
        strength=strength,
        relation=relation,
        score=max(0.0, min(score, 1.0)),
        snippet=snippet,
        recordedAt=recorded_at,
    )
