"""Action recommendation and execution routes for the VisualSprint API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from visualsprint_api.models import (
    ActionApprovalRequest,
    ActionExecutionResult,
    ActionRecommendationsResponse,
    ActionRecommendationResponse,
)
from visualsprint_api.repository import repository

router = APIRouter(prefix="/meetings/{meeting_id}/actions", tags=["actions"])


@router.post("/recommendations", response_model=ActionRecommendationsResponse)
def generate_action_recommendations(meeting_id: str) -> ActionRecommendationsResponse:
    recommendations = repository.generate_action_recommendations(meeting_id)
    if recommendations is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return ActionRecommendationsResponse(recommendations=recommendations)


@router.get("/recommendations", response_model=ActionRecommendationsResponse)
def list_action_recommendations(meeting_id: str) -> ActionRecommendationsResponse:
    recommendations = repository.list_action_recommendations(meeting_id)
    if recommendations is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return ActionRecommendationsResponse(recommendations=recommendations)


@router.post(
    "/recommendations/{recommendation_id}/approve",
    response_model=ActionRecommendationResponse,
)
def approve_action(
    meeting_id: str,
    recommendation_id: str,
    payload: ActionApprovalRequest,
) -> ActionRecommendationResponse:
    recommendation = repository.approve_action(meeting_id, recommendation_id, payload)
    if recommendation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting or recommendation not found",
        )
    return ActionRecommendationResponse(recommendation=recommendation)


@router.post(
    "/recommendations/{recommendation_id}/reject",
    response_model=ActionRecommendationResponse,
)
def reject_action(
    meeting_id: str,
    recommendation_id: str,
    payload: ActionApprovalRequest,
) -> ActionRecommendationResponse:
    recommendation = repository.reject_action(meeting_id, recommendation_id, payload)
    if recommendation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting or recommendation not found",
        )
    return ActionRecommendationResponse(recommendation=recommendation)


@router.post(
    "/recommendations/{recommendation_id}/execute",
    response_model=ActionExecutionResult,
)
def execute_action(meeting_id: str, recommendation_id: str) -> ActionExecutionResult:
    result = repository.execute_action(meeting_id, recommendation_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting, recommendation not found, or not approved",
        )
    return result
