from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class OptimizationRunCreate(BaseModel):
    scenario_id: str
    intervention_budget_k: int = Field(default=10, ge=1, le=20)
    reduced_candidate_count: int = Field(default=8, ge=4, le=12)


class OptimizationRunResponse(BaseModel):
    id: str
    scenario_id: str
    scenario_version: int
    status: str
    request: dict[str, Any]
    results: dict[str, Any]
    summary: dict[str, Any]
    created_at: str
