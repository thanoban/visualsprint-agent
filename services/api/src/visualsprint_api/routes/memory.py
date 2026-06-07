"""Memory retrieval routes for the VisualSprint API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from visualsprint_api.models import (
    IndexedOutcomeDocumentsResponse,
    SearchPriorOutcomesRequest,
    SearchPriorOutcomesResponse,
)
from visualsprint_api.repository import repository

router = APIRouter(prefix="/meetings/{meeting_id}/memory", tags=["memory"])


@router.post("/search-prior-outcomes", response_model=SearchPriorOutcomesResponse)
def search_prior_outcomes(
    meeting_id: str,
    payload: SearchPriorOutcomesRequest,
) -> SearchPriorOutcomesResponse:
    matches = repository.search_prior_outcomes(meeting_id, payload)
    if matches is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return SearchPriorOutcomesResponse(matches=matches)


@router.get("/index-documents", response_model=IndexedOutcomeDocumentsResponse)
def list_index_documents(meeting_id: str) -> IndexedOutcomeDocumentsResponse:
    documents = repository.list_indexed_outcomes(meeting_id)
    if documents is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return IndexedOutcomeDocumentsResponse(documents=documents)
