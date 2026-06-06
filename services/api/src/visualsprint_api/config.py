"""Configuration helpers for the VisualSprint API."""

from __future__ import annotations

from dataclasses import dataclass, field
import os


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    service_name: str = "visualsprint-api"
    environment: str = field(default_factory=lambda: os.getenv("VISUALSPRINT_ENV", "development"))
    version: str = "0.1.0"
    selected_track: str = field(default_factory=lambda: os.getenv("VISUALSPRINT_TRACK", "elastic"))
    supported_tracks: tuple[str, ...] = (
        "arize",
        "elastic",
        "fivetran",
        "gitlab",
        "mongodb",
        "dynatrace",
    )
    allowed_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            _split_csv(os.getenv("VISUALSPRINT_ALLOWED_ORIGINS"))
            or [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]
        )
    )


settings = Settings()
