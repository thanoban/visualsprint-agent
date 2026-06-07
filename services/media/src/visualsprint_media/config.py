"""Configuration for the VisualSprint media service."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Settings:
    service_name: str = "visualsprint-media"
    version: str = "0.1.0"
    selected_track: str = "elastic"


settings = Settings()
