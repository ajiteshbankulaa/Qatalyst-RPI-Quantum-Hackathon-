from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.algorithms.qaoa import QAOAProblem, approximation_ratio, brute_force_best, build_qaoa_circuit, qaoa_level1
from app.models import OptimizationRun, Scenario
from app.services.wildfire_model import (
    CELL_LIBRARY,
    adjacency_metrics,
    build_environment,
    default_environment,
    normalize_grid,
    orthogonal_neighbors,
    run_stochastic_forecast,
)


def _apply_placements(grid: list[list[str]], placements: list[dict]) -> list[list[str]]:
    updated = [row[:] for row in normalize_grid(grid)]
    for placement in placements:
        updated[placement["row"]][placement["col"]] = "intervention"
    return updated


def _candidate_base_rows(grid: list[list[str]], burn_probability_lookup: dict[str, float], ignition_time_lookup: dict[str, float | None]) -> list[dict]:
    normalized = normalize_grid(grid)
    rows: list[dict] = []
    for row, line in enumerate(normalized):
        for col, state in enumerate(line):
            semantics = CELL_LIBRARY[state]
            if not semantics.burnable or state in {"ignition", "burned"}:
                continue
            key = f"{row}-{col}"
            corridor_score = sum(
                burn_probability_lookup.get(f"{nr}-{nc}", 0.0)
                for nr, nc in orthogonal_neighbors(row, col, len(normalized))
            )
            rows.append(
                {
                    "row": row,
                    "col": col,
                    "state": state,
                    "burn_probability": round(float(burn_probability_lookup.get(key, 0.0)), 4),
                    "expected_ignition_time": ignition_time_lookup.get(key),
                    "corridor_pressure": round(float(corridor_score), 4),
                    "component_contains_ignition": bool(burn_probability_lookup.get(key, 0.0) >= 0.45),
                    "treated": state in {"protected", "intervention"},
                }
            )
    return rows


def _evaluate_grid(grid: list[list[str]], environment: dict, seed: int, runs: int) -> dict:
    forecast = run_stochastic_forecast(grid, environment, steps=6, seed=seed, runs=runs)
    metrics = adjacency_metrics(grid)
    return {
        "forecast": forecast,
        "metrics": {
            **metrics,
            "mean_final_burned_area": forecast["summary"]["mean_final_burned_area"],
            "p90_final_burned_area": forecast["summary"]["p90_final_burned_area"],
            "peak_burn_probability": forecast["summary"]["peak_burn_probability"],
        },
    }


def _objective_score(evaluation: dict) -> float:
    metrics = evaluation["metrics"]
    return round(
        float(
            1.15 * metrics["adjacency_links"]
            + 0.95 * metrics["largest_component"]
            + 1.35 * metrics["mean_final_burned_area"]
            + 0.75 * metrics["p90_final_burned_area"]
            + 14.0 * metrics["peak_burn_probability"]
        ),
        4,
    )


def _candidate_impact(grid: list[list[str]], candidate: dict) -> dict:
    neighbor_pressure = sum(
        1
        for nr, nc in orthogonal_neighbors(candidate["row"], candidate["col"], len(grid))
        if CELL_LIBRARY[grid[nr][nc]].burnable
    )
    return {
        **candidate,
        "expected_burned_area_reduction": round(candidate["burn_probability"] * (1.1 + 0.15 * neighbor_pressure), 4),
        "burn_probability_reduction": round(candidate["burn_probability"] * (0.3 + 0.08 * neighbor_pressure), 4),
        "corridor_disruption": round(candidate["corridor_pressure"], 4),
        "connectivity_reduction": neighbor_pressure,
        "blocked_links": neighbor_pressure,
        "ignition_delay": round((candidate["expected_ignition_time"] or 0.0) * 0.1, 4),
        "score": round(
            candidate["burn_probability"] * 2.0
            + candidate["corridor_pressure"] * 0.6
            + candidate["burn_probability"] * (1.1 + 0.15 * neighbor_pressure)
            + neighbor_pressure * 0.4,
            4,
        ),
    }


def candidate_rows(grid: list[list[str]]) -> list[dict]:
    base_environment = build_environment(default_environment(type("ScenarioStub", (), {"grid": grid, "constraints_json": {}, "metadata_json": {}})()))
    baseline = _evaluate_grid(grid, base_environment, seed=17, runs=10)
    base_rows = _candidate_base_rows(
        grid,
        baseline["forecast"]["burn_probability_lookup"],
        baseline["forecast"]["expected_ignition_time_lookup"],
    )
    scored = [_candidate_impact(normalize_grid(grid), candidate) for candidate in base_rows]
    return sorted(scored, key=lambda item: (item["score"], item["burn_probability"]), reverse=True)


def _greedy_classical_plan(grid: list[list[str]], enforced_budget: int, environment: dict) -> dict:
    working_grid = normalize_grid(grid)
    baseline = _evaluate_grid(working_grid, environment, seed=41, runs=18)
    placements: list[dict] = []
    for step in range(enforced_budget):
        ranked = [item for item in candidate_rows(working_grid) if (item["row"], item["col"]) not in {(p["row"], p["col"]) for p in placements}]
        if not ranked:
            break
        choice = ranked[0]
        placements.append(choice)
        working_grid[choice["row"]][choice["col"]] = "intervention"
    after = _evaluate_grid(working_grid, environment, seed=59, runs=18)
    return {
        "placements": placements,
        "metrics_before": baseline["metrics"],
        "metrics_after": after["metrics"],
        "objective_before": _objective_score(baseline),
        "objective_after": _objective_score(after),
        "forecast_before": baseline["forecast"]["summary"],
        "forecast_after": after["forecast"]["summary"],
    }


def _reduced_quantum_study(grid: list[list[str]], reduced_count: int, enforced_budget: int, environment: dict) -> dict:
    shortlist = candidate_rows(grid)[:reduced_count]
    reduced = shortlist[: min(8, len(shortlist))]
    weights = [round(float(item["score"]), 4) for item in reduced]
    penalties: dict[tuple[int, int], float] = {}
    for idx, item in enumerate(reduced):
        for jdx in range(idx + 1, len(reduced)):
            other = reduced[jdx]
            if abs(item["row"] - other["row"]) + abs(item["col"] - other["col"]) <= 1:
                penalties[(idx, jdx)] = 0.3
    problem = QAOAProblem(weights=weights, pair_penalties=penalties, budget=min(enforced_budget, len(reduced)))
    qaoa = qaoa_level1(problem)
    exact_bits, exact_cost = brute_force_best(problem)
    selected = [reduced[idx] for idx, bit in enumerate(qaoa["best_bitstring"]) if bit == 1]
    circuit = build_qaoa_circuit(problem, qaoa["gamma"], qaoa["beta"])
    return {
        "scope": {
            "type": "reduced_critical_subgraph",
            "candidate_count": len(reduced),
            "shortlist_count": len(shortlist),
            "budget": min(enforced_budget, len(reduced)),
            "note": "Full-grid planning stays classical. The quantum study benchmarks a reduced candidate graph derived from the same burn-probability and corridor model used in forecast and risk.",
        },
        "placements": selected,
        "candidate_shortlist": shortlist,
        "qaoa": qaoa,
        "approximation_ratio": approximation_ratio(problem, qaoa["expected_cost"]),
        "exact_baseline": {"best_bitstring": list(exact_bits), "best_cost": round(float(exact_cost), 4)},
        "circuit": {"num_qubits": circuit.num_qubits, "depth": circuit.depth(), "gate_counts": dict(circuit.count_ops())},
    }


def _placement_reason(placement: dict, shared: bool, environment: dict) -> str:
    reasons = []
    if placement["connectivity_reduction"] > 0:
        reasons.append("blocks a major fuel corridor")
    if placement["burn_probability"] >= 0.55:
        reasons.append("protects a high-probability spread pathway")
    if placement["expected_burned_area_reduction"] > 0.5:
        reasons.append("reduces expected burned area")
    if placement["ignition_delay"] > 0:
        reasons.append("delays the likely ignition front")
    if shared:
        reasons.append("chosen by both classical planning and the reduced quantum study")
    return ", ".join(reasons[:3]).capitalize() + "." if reasons else "Adds modest resilience value under the shared wildfire model."


def _quantum_informed_plan(grid: list[list[str]], classical: dict, quantum: dict, environment: dict, enforced_budget: int) -> dict:
    classical_map = {(item["row"], item["col"]): item for item in classical["placements"]}
    quantum_keys = {(item["row"], item["col"]) for item in quantum["placements"]}
    placements: list[dict] = []
    used: set[tuple[int, int]] = set()
    for key in list(classical_map.keys() & quantum_keys):
        choice = {**classical_map[key], "selected_by_classical": True, "selected_by_quantum": True}
        choice["reason"] = _placement_reason(choice, True, environment)
        placements.append(choice)
        used.add(key)
    for item in quantum["placements"]:
        key = (item["row"], item["col"])
        if key in used or len(placements) >= enforced_budget:
            continue
        enriched = {**classical_map.get(key, item), "selected_by_classical": key in classical_map, "selected_by_quantum": True}
        enriched["reason"] = _placement_reason(enriched, key in classical_map, environment)
        placements.append(enriched)
        used.add(key)
    for item in classical["placements"]:
        key = (item["row"], item["col"])
        if key in used or len(placements) >= enforced_budget:
            continue
        enriched = {**item, "selected_by_classical": True, "selected_by_quantum": False}
        enriched["reason"] = _placement_reason(enriched, False, environment)
        placements.append(enriched)
        used.add(key)
    updated = _apply_placements(grid, placements)
    after = _evaluate_grid(updated, environment, seed=83, runs=18)
    baseline_metrics = classical["metrics_before"]
    return {
        "placements": placements,
        "metrics_before": baseline_metrics,
        "metrics_after": after["metrics"],
        "objective_before": classical["objective_before"],
        "objective_after": _objective_score(after),
        "forecast_after": after["forecast"]["summary"],
        "agreement_count": len(classical_map.keys() & quantum_keys),
    }


def create_optimization_run(db: Session, scenario: Scenario, payload: dict) -> OptimizationRun:
    requested_budget = payload["intervention_budget_k"]
    enforced_budget = min(10, requested_budget, len(normalize_grid(scenario.grid)) * len(normalize_grid(scenario.grid)[0]))
    environment = build_environment(default_environment(scenario))
    classical = _greedy_classical_plan(scenario.grid, enforced_budget, environment)
    quantum = _reduced_quantum_study(scenario.grid, payload["reduced_candidate_count"], enforced_budget, environment)
    for placement in classical["placements"]:
        placement["selected_by_classical"] = True
        placement["selected_by_quantum"] = (placement["row"], placement["col"]) in {(p["row"], p["col"]) for p in quantum["placements"]}
        placement["reason"] = _placement_reason(placement, placement["selected_by_quantum"], environment)
    quantum_informed = _quantum_informed_plan(scenario.grid, classical, quantum, environment, enforced_budget)
    recommended_mode = "quantum_informed_plan" if quantum_informed["objective_after"] < classical["objective_after"] else "classical_full_plan"
    recommended = quantum_informed if recommended_mode == "quantum_informed_plan" else classical
    baseline_area = classical["metrics_before"]["mean_final_burned_area"]
    after_area = recommended["metrics_after"]["mean_final_burned_area"]
    results = {
        "objective": {
            "name": "planning_grade_resilience_gain",
            "description": "Combine connectivity disruption with forecast-aware reduction in expected burned area and spread-corridor pressure.",
            "budget_enforced_k": enforced_budget,
            "environment": {key: value for key, value in environment.items() if key != "slope_layer"},
        },
        "baseline": {"metrics": classical["metrics_before"], "forecast": classical["forecast_before"], "objective_score": classical["objective_before"]},
        "classical": classical,
        "quantum": quantum,
        "quantum_informed": quantum_informed,
        "recommended_plan": recommended,
    }
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "recommended_mode": recommended_mode,
        "budget_requested_k": requested_budget,
        "budget_enforced_k": enforced_budget,
        "expected_burned_area_reduction": round(baseline_area - after_area, 4),
        "corridor_disruption": round(classical["metrics_before"]["adjacency_links"] - recommended["metrics_after"]["adjacency_links"], 4),
        "burn_probability_reduction": round(classical["metrics_before"]["peak_burn_probability"] - recommended["metrics_after"]["peak_burn_probability"], 4),
        "ignition_time_delay_note": "Expected ignition-time delay is approximated through the ensemble impact score rather than a deterministic front.",
        "classical_plan_score": classical["objective_after"],
        "quantum_informed_plan_score": quantum_informed["objective_after"],
        "agreement_between_classical_and_quantum": quantum_informed["agreement_count"],
        "full_scale_scope": "Full 10x10 planning is solved classically with the shared wildfire forecast model in the objective loop.",
        "reduced_quantum_scope": quantum["scope"],
        "planning_grade_note": "This is comparative pre-season planning support. It is not a live fire operations optimizer.",
        "broken_adjacency_links": classical["metrics_before"]["adjacency_links"] - recommended["metrics_after"]["adjacency_links"],
        "spread_corridor_disruption": round(classical["metrics_before"]["adjacency_links"] - recommended["metrics_after"]["adjacency_links"], 4),
        "coverage_high_risk_cells": sum(1 for item in recommended["placements"] if item["burn_probability"] >= 0.45),
    }
    run = OptimizationRun(
        scenario_id=scenario.id,
        scenario_version=scenario.version,
        request_json={**payload, "intervention_budget_k": enforced_budget},
        results_json=results,
        summary_json=summary,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run
