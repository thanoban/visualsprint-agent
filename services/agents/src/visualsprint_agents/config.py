"""Configuration for the VisualSprint agents service."""

from __future__ import annotations

from dataclasses import dataclass, field
import os
from typing import Literal, Mapping


AgentAdapterMode = Literal["mock", "configured_cloud"]


def _get(environ: Mapping[str, str], key: str) -> str | None:
    value = environ.get(key)
    return value.strip() if value and value.strip() else None


def _resolve_agent_mode(environ: Mapping[str, str]) -> AgentAdapterMode:
    raw_value = environ.get("VISUALSPRINT_AGENT_MODE", "").strip().lower()
    if raw_value == "configured_cloud":
        return "configured_cloud"
    return "mock"


@dataclass(frozen=True, slots=True)
class Settings:
    service_name: str = "visualsprint-agents"
    version: str = "0.1.0"
    environment: str = "development"
    selected_track: str = "elastic"
    agent_mode: AgentAdapterMode = "mock"
    google_cloud_project_id: str | None = None
    google_cloud_location: str | None = None
    agent_application_id: str | None = None
    reasoning_agent_id: str | None = None
    summary_agent_id: str | None = None
    elastic_mcp_endpoint: str | None = None
    elastic_api_key_secret_name: str | None = None
    service_account_email: str | None = None

    @property
    def reasoning_agent_configured(self) -> bool:
        return bool(self.google_cloud_project_id and self.reasoning_agent_id)

    @property
    def summary_agent_configured(self) -> bool:
        return bool(self.google_cloud_project_id and self.summary_agent_id)

    @property
    def elastic_mcp_configured(self) -> bool:
        return bool(self.elastic_mcp_endpoint and self.elastic_api_key_secret_name)

    @property
    def cloud_adapter_ready(self) -> bool:
        return (
            self.agent_mode == "configured_cloud"
            and self.reasoning_agent_configured
            and self.summary_agent_configured
        )

    @property
    def health_note(self) -> str:
        if self.agent_mode == "mock":
            return (
                "The agents service is running in deterministic mock mode while the real "
                "Google Cloud Agent Builder adapter is still being wired."
            )
        if self.cloud_adapter_ready:
            return (
                "Cloud adapter configuration is present. The next slice should replace the "
                "local fallback stubs with real Google Cloud agent invocations."
            )
        return (
            "Configured cloud mode was selected, but one or more Google Cloud agent ids are "
            "still missing. Local deterministic fallback remains active."
        )


def build_settings(environ: Mapping[str, str] | None = None) -> Settings:
    source = os.environ if environ is None else environ
    return Settings(
        environment=source.get("VISUALSPRINT_ENV", "development"),
        selected_track=source.get("VISUALSPRINT_TRACK", "elastic"),
        agent_mode=_resolve_agent_mode(source),
        google_cloud_project_id=_get(source, "VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID"),
        google_cloud_location=_get(source, "VISUALSPRINT_GOOGLE_CLOUD_LOCATION"),
        agent_application_id=_get(source, "VISUALSPRINT_AGENT_APPLICATION_ID"),
        reasoning_agent_id=_get(source, "VISUALSPRINT_REASONING_AGENT_ID"),
        summary_agent_id=_get(source, "VISUALSPRINT_SUMMARY_AGENT_ID"),
        elastic_mcp_endpoint=_get(source, "VISUALSPRINT_ELASTIC_MCP_ENDPOINT"),
        elastic_api_key_secret_name=_get(source, "VISUALSPRINT_ELASTIC_API_KEY_SECRET_NAME"),
        service_account_email=_get(source, "VISUALSPRINT_SERVICE_ACCOUNT_EMAIL"),
    )


settings = build_settings()
