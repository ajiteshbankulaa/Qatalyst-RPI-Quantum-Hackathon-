from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


CellState = Literal[
    "empty",
    "dry_brush",
    "tree",
    "water",
    "protected",
    "intervention",
    "ignition",
]


class GridCellScore(BaseModel):
    row: int
    col: int
    state: CellState
    score: float
    confidence: float


class BaseRecord(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class HealthResponse(BaseModel):
    status: str = "ok"
    app: str = "QuantumProj API"
