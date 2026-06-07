"""Configuration for the VisualSprint ingest service."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Settings:
    service_name: str = "visualsprint-ingest"
    version: str = "0.1.0"
    selected_track: str = "elastic"


settings = Settings()
