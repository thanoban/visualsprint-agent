"""Helpers for extracting structured payloads from Vertex runtime responses."""

from __future__ import annotations

import json


def extract_vertex_structured_output(response_payload: dict) -> dict | None:
    """Best-effort extraction for common managed-agent response shapes."""

    direct_output = response_payload.get("output")
    normalized = _normalize_candidate(direct_output)
    if normalized is not None:
        return normalized

    response_node = response_payload.get("response")
    if isinstance(response_node, dict):
        response_output = response_node.get("output")
        normalized = _normalize_candidate(response_output)
        if normalized is not None:
            return normalized

    return None


def _normalize_candidate(candidate: object) -> dict | None:
    if isinstance(candidate, dict):
        if "content" in candidate:
            content_result = _extract_from_content(candidate["content"])
            if content_result is not None:
                return content_result
        return candidate
    if isinstance(candidate, str):
        return _try_parse_json(candidate)
    if isinstance(candidate, list):
        for item in candidate:
            normalized = _normalize_candidate(item)
            if normalized is not None:
                return normalized
        return None
    if isinstance(candidate, tuple):
        for item in candidate:
            normalized = _normalize_candidate(item)
            if normalized is not None:
                return normalized
        return None
    if hasattr(candidate, "get"):
        try:
            text = candidate.get("text")
        except Exception:
            text = None
        if isinstance(text, str):
            return _try_parse_json(text)
    if isinstance(candidate, object) and isinstance(getattr(candidate, "text", None), str):
        return _try_parse_json(getattr(candidate, "text"))
    return None


def _extract_from_content(content: object) -> dict | None:
    if isinstance(content, dict):
        parts = content.get("parts")
        if isinstance(parts, list):
            for part in parts:
                if isinstance(part, dict):
                    if isinstance(part.get("text"), str):
                        parsed = _try_parse_json(part["text"])
                        if parsed is not None:
                            return parsed
    return None


def _try_parse_json(value: str) -> dict | None:
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None
