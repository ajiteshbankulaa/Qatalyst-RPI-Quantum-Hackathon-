from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class RiskRunCreate(BaseModel):
    scenario_id: str
    modes: list[str] = Field(default_factory=lambda: ["classical", "quantum", "hybrid"])
    threshold: float = 0.62


class RiskRunResponse(BaseModel):
    id: str
    scenario_id: str
    scenario_version: int
    status: str
    modes: list[str]
    request: dict[str, Any]
    results: dict[str, Any]
    summary: dict[str, Any]
    created_at: str
