from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Scenario


def _sample_grid() -> list[list[str]]:
    grid = [["tree" for _ in range(10)] for _ in range(10)]
    for row in range(10):
        grid[row][0] = "water"
    for col in range(3, 8):
        grid[1][col] = "dry_brush"
        grid[2][col] = "dry_brush"
    grid[4][5] = "ignition"
    grid[5][5] = "dry_brush"
    grid[6][5] = "dry_brush"
    grid[8][7] = "protected"
    grid[7][7] = "protected"
    return grid


def _second_grid() -> list[list[str]]:
    grid = [["tree" for _ in range(10)] for _ in range(10)]
    for col in range(10):
        grid[9][col] = "water"
    for row in range(2, 7):
        grid[row][3] = "dry_brush"
        grid[row][4] = "dry_brush"
    grid[3][6] = "ignition"
    grid[4][7] = "dry_brush"
    grid[5][7] = "dry_brush"
    grid[2][8] = "protected"
    return grid


def seed_sample_data(db: Session) -> None:
    existing = db.scalar(select(Scenario.id).limit(1))
    if existing:
        return

    db.add_all(
        [
            Scenario(
                name="Sierra Foothills Wildfire",
                domain="wildfire",
                status="active",
                description="Seeded wildfire resilience scenario with an active ignition pocket and limited protected perimeter.",
                grid=_sample_grid(),
                metadata_json={"region": "California foothills", "owner": "Wildfire West"},
                constraints_json={"intervention_budget_k": 10, "crew_limit": 3, "time_horizon_hours": 72},
                objectives_json={"primary": "minimize propagated ignition exposure", "secondary": "protect eastern ridge corridor"},
            ),
            Scenario(
                name="Front Range Dry Corridor",
                domain="wildfire",
                status="draft",
                description="Seeded draft with a narrow dry corridor that amplifies southbound wind spread.",
                grid=_second_grid(),
                metadata_json={"region": "Colorado front range", "owner": "Resilience Lab"},
                constraints_json={"intervention_budget_k": 8, "crew_limit": 2, "time_horizon_hours": 48},
                objectives_json={"primary": "reduce corridor connectivity", "secondary": "protect northeastern assets"},
            ),
        ]
    )
    db.commit()
