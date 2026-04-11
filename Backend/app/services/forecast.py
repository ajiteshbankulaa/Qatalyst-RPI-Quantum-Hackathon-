from __future__ import annotations

import logging
from collections import Counter
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.algorithms.shift import build_shift_diagnostics
from app.models import ForecastRun, Scenario
from app.services.spatial import diagonal_neighbors, neighbors

logger = logging.getLogger(__name__)

WIND_VECTORS = {
    "N": (-1, 0),
    "S": (1, 0),
    "E": (0, 1),
    "W": (0, -1),
    "NE": (-1, 1),
    "NW": (-1, -1),
    "SE": (1, 1),
    "SW": (1, -1),
}


def _step_spread(grid: list[list[str]], dryness: float, sensitivity: float, wind_direction: str) -> list[list[str]]:
    size = len(grid)
    next_grid = [row[:] for row in grid]
    wr, wc = WIND_VECTORS[wind_direction]
    for row in range(size):
        for col in range(size):
            state = grid[row][col]
            if state in {"water", "intervention"}:
                continue
            direct = neighbors(row, col, size)
            diagonal = diagonal_neighbors(row, col, size)
            burning_pressure = sum(1 for nr, nc in direct if grid[nr][nc] == "ignition")
            burning_pressure += 0.5 * sum(1 for nr, nc in diagonal if grid[nr][nc] == "ignition")
            prev_row, prev_col = row - wr, col - wc
            wind_bonus = 0.18 if (prev_row, prev_col) in direct + diagonal else 0.0
            base = 0.1 if state == "tree" else 0.18 if state == "dry_brush" else 0.03 if state == "protected" else 0.0
            threshold = base + burning_pressure * 0.24 + dryness * 0.18 + sensitivity * 0.2 + wind_bonus
            if threshold >= 0.42:
                next_grid[row][col] = "ignition"
    return next_grid


def _snapshot(step: int, grid: list[list[str]]) -> dict:
    counts = Counter(cell for row in grid for cell in row)
    return {
        "step": step,
        "grid": grid,
        "metrics": {
            "ignited_cells": counts.get("ignition", 0),
            "protected_cells": counts.get("protected", 0) + counts.get("intervention", 0),
            "exposed_fuel": counts.get("dry_brush", 0) + counts.get("tree", 0),
        },
    }


def create_forecast_run(db: Session, scenario: Scenario, payload: dict) -> ForecastRun:
    logger.info("Running forecast for scenario %s (%d steps, wind=%s)", scenario.id, payload["steps"], payload["wind_direction"])
    grid = [row[:] for row in scenario.grid]
    snapshots = [_snapshot(0, grid)]
    for step in range(1, payload["steps"] + 1):
        grid = _step_spread(grid, payload["dryness"], payload["spread_sensitivity"], payload["wind_direction"])
        snapshots.append(_snapshot(step, grid))

    final_metrics = snapshots[-1]["metrics"]
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "time_to_threshold": next((snap["step"] for snap in snapshots if snap["metrics"]["ignited_cells"] >= 25), None),
        "peak_ignited_cells": max(snap["metrics"]["ignited_cells"] for snap in snapshots),
        "final_affected_cells": final_metrics["ignited_cells"],
        "containment_outlook": "stressed" if final_metrics["ignited_cells"] > 18 else "manageable",
    }
    run = ForecastRun(
        scenario_id=scenario.id,
        scenario_version=scenario.version,
        request_json=payload,
        snapshots_json=snapshots,
        diagnostics_json=build_shift_diagnostics(len(scenario.grid), payload["steps"]),
        summary_json=summary,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    logger.info("Forecast run %s complete — peak ignition: %d cells", run.id, summary["peak_ignited_cells"])
    return run
