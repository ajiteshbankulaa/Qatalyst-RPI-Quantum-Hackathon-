from __future__ import annotations

from collections import deque
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.algorithms.qaoa import QAOAProblem, approximation_ratio, brute_force_best, build_qaoa_circuit, qaoa_level1
from app.models import OptimizationRun, Scenario
from app.services.spatial import apply_placements, neighbors

FLAMMABLE_STATES = {"dry_brush", "ignition"}


def _flammable_cells(grid: list[list[str]]) -> list[tuple[int, int]]:
    return [(row, col) for row, row_values in enumerate(grid) for col, cell in enumerate(row_values) if cell in FLAMMABLE_STATES]


def _adjacency_edges(grid: list[list[str]]) -> list[tuple[tuple[int, int], tuple[int, int]]]:
    size = len(grid)
    edges: list[tuple[tuple[int, int], tuple[int, int]]] = []
    for row, col in _flammable_cells(grid):
        for nr, nc in neighbors(row, col, size):
            if grid[nr][nc] not in FLAMMABLE_STATES:
                continue
            if (nr, nc) > (row, col):
                edges.append(((row, col), (nr, nc)))
    return edges


def _component_map(grid: list[list[str]]) -> tuple[list[dict], dict[tuple[int, int], int]]:
    size = len(grid)
    seen: set[tuple[int, int]] = set()
    components: list[dict] = []
    membership: dict[tuple[int, int], int] = {}

    for row, col in _flammable_cells(grid):
        if (row, col) in seen:
            continue
        queue = deque([(row, col)])
        seen.add((row, col))
        cells: list[tuple[int, int]] = []
        edges = 0
        contains_ignition = False

        while queue:
            cr, cc = queue.popleft()
            cells.append((cr, cc))
            contains_ignition = contains_ignition or grid[cr][cc] == "ignition"
            local_neighbors = 0
            for nr, nc in neighbors(cr, cc, size):
                if grid[nr][nc] not in FLAMMABLE_STATES:
                    continue
                local_neighbors += 1
                if (nr, nc) in seen:
                    continue
                seen.add((nr, nc))
                queue.append((nr, nc))
            edges += local_neighbors

        component_id = len(components)
        for cell in cells:
            membership[cell] = component_id
        components.append(
            {
                "id": component_id,
                "cells": cells,
                "size": len(cells),
                "adjacency_links": edges // 2,
                "contains_ignition": contains_ignition,
            }
        )
    return components, membership


def _connectivity_metrics(grid: list[list[str]]) -> dict:
    components, _ = _component_map(grid)
    adjacency_links = len(_adjacency_edges(grid))
    ignition_components = [component for component in components if component["contains_ignition"]]
    ignition_reachable_cells = sum(component["size"] for component in ignition_components)
    ignition_reachable_links = sum(component["adjacency_links"] for component in ignition_components)
    largest_component = max((component["size"] for component in components), default=0)
    return {
        "flammable_cells": len(_flammable_cells(grid)),
        "adjacency_links": adjacency_links,
        "components": len(components),
        "largest_component": largest_component,
        "ignition_reachable_cells": ignition_reachable_cells,
        "ignition_reachable_links": ignition_reachable_links,
        "spread_corridor_score": ignition_reachable_links + 0.5 * ignition_reachable_cells,
    }


def _objective_score(metrics: dict) -> float:
    return round(
        float(
            metrics["adjacency_links"]
            + 1.25 * metrics["ignition_reachable_links"]
            + 0.55 * metrics["largest_component"]
            + 0.15 * metrics["flammable_cells"]
        ),
        4,
    )


def _delta(before: dict, after: dict) -> dict:
    return {
        "broken_adjacency_links": before["adjacency_links"] - after["adjacency_links"],
        "component_reduction": before["components"] - after["components"],
        "largest_component_reduction": before["largest_component"] - after["largest_component"],
        "spread_corridor_disruption": round(before["spread_corridor_score"] - after["spread_corridor_score"], 4),
        "ignition_reach_reduction": before["ignition_reachable_cells"] - after["ignition_reachable_cells"],
        "objective_improvement": round(_objective_score(before) - _objective_score(after), 4),
    }


def _high_risk_candidate_metrics(grid: list[list[str]], row: int, col: int) -> dict:
    trial_grid = [line[:] for line in grid]
    trial_grid[row][col] = "intervention"
    before = _connectivity_metrics(grid)
    after = _connectivity_metrics(trial_grid)
    improvement = _delta(before, after)
    return {
        "row": row,
        "col": col,
        "cell_state": grid[row][col],
        "blocked_links": improvement["broken_adjacency_links"],
        "spread_corridor_disruption": improvement["spread_corridor_disruption"],
        "largest_component_reduction": improvement["largest_component_reduction"],
        "objective_improvement": improvement["objective_improvement"],
    }


def candidate_rows(grid: list[list[str]]) -> list[dict]:
    components, membership = _component_map(grid)
    component_lookup = {component["id"]: component for component in components}
    ignition_component_ids = {component["id"] for component in components if component["contains_ignition"]}
    rows: list[dict] = []

    for row, col in _flammable_cells(grid):
        metrics = _high_risk_candidate_metrics(grid, row, col)
        component_id = membership[(row, col)]
        component = component_lookup[component_id]
        ignition_adjacency = sum(1 for nr, nc in neighbors(row, col, len(grid)) if grid[nr][nc] == "ignition")
        corridor_flag = component_id in ignition_component_ids
        score = round(
            float(
                metrics["blocked_links"] * 1.6
                + metrics["spread_corridor_disruption"] * 1.1
                + metrics["largest_component_reduction"] * 0.8
                + (0.6 if corridor_flag else 0.0)
                + 0.3 * ignition_adjacency
            ),
            4,
        )
        rows.append(
            {
                "row": row,
                "col": col,
                "state": grid[row][col],
                "score": score,
                "component_size": component["size"],
                "component_contains_ignition": corridor_flag,
                "blocked_links": metrics["blocked_links"],
                "spread_corridor_disruption": metrics["spread_corridor_disruption"],
                "largest_component_reduction": metrics["largest_component_reduction"],
                "reason": (
                    f"Removes {metrics['blocked_links']} flammable adjacency links"
                    f"{' in an ignition-connected corridor' if corridor_flag else ''}."
                ),
            }
        )
    return sorted(rows, key=lambda item: (item["score"], item["blocked_links"], item["component_size"]), reverse=True)


def _coverage_of_high_risk_cells(candidate_pool: list[dict], placements: list[dict], top_n: int = 10) -> int:
    top_cells = {(item["row"], item["col"]) for item in candidate_pool[:top_n]}
    chosen = {(item["row"], item["col"]) for item in placements}
    return len(top_cells & chosen)


def _select_best_candidate(grid: list[list[str]], candidates: list[dict]) -> dict | None:
    if not candidates:
        return None
    best_choice = None
    for candidate in candidates:
        trial_grid = [line[:] for line in grid]
        trial_grid[candidate["row"]][candidate["col"]] = "intervention"
        before = _connectivity_metrics(grid)
        after = _connectivity_metrics(trial_grid)
        improvement = _delta(before, after)
        objective_gain = improvement["objective_improvement"]
        decorated = {
            **candidate,
            "blocked_links": improvement["broken_adjacency_links"],
            "spread_corridor_disruption": improvement["spread_corridor_disruption"],
            "largest_component_reduction": improvement["largest_component_reduction"],
            "objective_improvement": objective_gain,
        }
        if best_choice is None or (
            decorated["objective_improvement"],
            decorated["blocked_links"],
            decorated["spread_corridor_disruption"],
            decorated["score"],
        ) > (
            best_choice["objective_improvement"],
            best_choice["blocked_links"],
            best_choice["spread_corridor_disruption"],
            best_choice["score"],
        ):
            best_choice = decorated
    return best_choice


def _classical_baseline(grid: list[list[str]], enforced_budget: int) -> dict:
    initial_grid = [row[:] for row in grid]
    before_metrics = _connectivity_metrics(initial_grid)
    working_grid = [row[:] for row in grid]
    placements: list[dict] = []

    for _ in range(enforced_budget):
        candidates = [candidate for candidate in candidate_rows(working_grid) if (candidate["row"], candidate["col"]) not in {(item["row"], item["col"]) for item in placements}]
        choice = _select_best_candidate(working_grid, candidates)
        if choice is None:
            break
        placements.append(choice)
        working_grid[choice["row"]][choice["col"]] = "intervention"

    after_metrics = _connectivity_metrics(working_grid)
    return {
        "placements": placements,
        "metrics_before": before_metrics,
        "metrics_after": after_metrics,
        "improvement": _delta(before_metrics, after_metrics),
        "objective_before": _objective_score(before_metrics),
        "objective_after": _objective_score(after_metrics),
        "coverage_high_risk_cells": _coverage_of_high_risk_cells(candidate_rows(initial_grid), placements),
        "budget_used": len(placements),
    }


def _reduced_quantum_study(grid: list[list[str]], reduced_count: int, enforced_budget: int) -> dict:
    shortlist = candidate_rows(grid)[:reduced_count]
    reduced = shortlist[: min(8, len(shortlist))]
    weights = [
        round(
            float(
                candidate["blocked_links"] * 1.4
                + candidate["spread_corridor_disruption"] * 1.2
                + candidate["largest_component_reduction"] * 0.8
                + (0.6 if candidate["component_contains_ignition"] else 0.0)
            ),
            4,
        )
        for candidate in reduced
    ]
    penalties: dict[tuple[int, int], float] = {}
    for idx, candidate in enumerate(reduced):
        for jdx in range(idx + 1, len(reduced)):
            other = reduced[jdx]
            if abs(candidate["row"] - other["row"]) + abs(candidate["col"] - other["col"]) == 1:
                penalties[(idx, jdx)] = 0.45

    reduced_budget = min(enforced_budget, len(reduced))
    problem = QAOAProblem(weights=weights, pair_penalties=penalties, budget=reduced_budget)
    qaoa = qaoa_level1(problem)
    exact_bits, exact_cost = brute_force_best(problem)
    selected = [reduced[idx] for idx, bit in enumerate(qaoa["best_bitstring"]) if bit == 1]
    circuit = build_qaoa_circuit(problem, qaoa["gamma"], qaoa["beta"])

    circuit_info = {
        "type": "qiskit.quantumcircuit",
        "num_qubits": circuit.num_qubits,
        "depth": circuit.depth(),
        "gate_counts": dict(circuit.count_ops()),
        "two_qubit_gates": circuit.count_ops().get("cx", 0),
    }

    return {
        "scope": {
            "type": "reduced_critical_subgraph",
            "candidate_count": len(reduced),
            "shortlist_count": len(shortlist),
            "budget": reduced_budget,
            "source_note": "This reduced study is derived from the highest-impact flammable cells on the full 10x10 hillside.",
            "note": (
                "Full 10x10 planning stays classical. The quantum study first shortlists the highest-impact flammable cells, then benchmarks a smaller critical subgraph so the workload remains realistic for current NISQ-era resources."
            ),
        },
        "candidate_shortlist": shortlist,
        "candidate_subset": reduced,
        "placements": selected,
        "qaoa": qaoa,
        "circuit": circuit_info,
        "exact_baseline": {"best_bitstring": list(exact_bits), "best_cost": round(float(exact_cost), 4)},
        "approximation_ratio": approximation_ratio(problem, qaoa["expected_cost"]),
    }


def _placement_explanation(placement: dict, in_classical: bool, in_quantum: bool) -> str:
    reasons = [f"blocks {placement['blocked_links']} adjacency links"]
    if placement.get("component_contains_ignition"):
        reasons.append("sits on an ignition-connected corridor")
    if placement.get("largest_component_reduction", 0) > 0:
        reasons.append(f"shrinks the largest flammable cluster by {placement['largest_component_reduction']}")
    if in_classical and in_quantum:
        reasons.append("appears in both the full classical plan and the reduced quantum study")
    elif in_quantum:
        reasons.append("was promoted by the reduced quantum study")
    return ", ".join(reasons).capitalize() + "."


def _quantum_informed_plan(grid: list[list[str]], classical: dict, quantum: dict, enforced_budget: int) -> dict:
    classical_map = {(item["row"], item["col"]): item for item in classical["placements"]}
    quantum_map = {(item["row"], item["col"]): item for item in quantum["placements"]}

    combined: list[dict] = []
    used: set[tuple[int, int]] = set()

    overlap = [classical_map[key] for key in classical_map.keys() & quantum_map.keys()]
    overlap = sorted(overlap, key=lambda item: (item["score"], item["blocked_links"]), reverse=True)
    for item in overlap:
        key = (item["row"], item["col"])
        if key in used or len(combined) >= enforced_budget:
            continue
        enriched = {**item, "selected_by_classical": True, "selected_by_quantum": True}
        enriched["reason"] = _placement_explanation(enriched, True, True)
        combined.append(enriched)
        used.add(key)

    promoted_quantum = sorted(quantum["placements"], key=lambda item: (item["score"], item["blocked_links"]), reverse=True)
    for item in promoted_quantum:
        key = (item["row"], item["col"])
        if key in used or len(combined) >= enforced_budget:
            continue
        source = classical_map.get(key, item)
        enriched = {**source, "selected_by_classical": key in classical_map, "selected_by_quantum": True}
        enriched["reason"] = _placement_explanation(enriched, key in classical_map, True)
        combined.append(enriched)
        used.add(key)

    remaining_classical = classical["placements"]
    for item in remaining_classical:
        key = (item["row"], item["col"])
        if key in used or len(combined) >= enforced_budget:
            continue
        enriched = {**item, "selected_by_classical": True, "selected_by_quantum": False}
        enriched["reason"] = _placement_explanation(enriched, True, False)
        combined.append(enriched)
        used.add(key)

    updated_grid = apply_placements(grid, combined)
    before_metrics = _connectivity_metrics(grid)
    after_metrics = _connectivity_metrics(updated_grid)
    return {
        "placements": combined,
        "metrics_before": before_metrics,
        "metrics_after": after_metrics,
        "improvement": _delta(before_metrics, after_metrics),
        "objective_before": _objective_score(before_metrics),
        "objective_after": _objective_score(after_metrics),
        "coverage_high_risk_cells": _coverage_of_high_risk_cells(candidate_rows(grid), combined),
        "budget_used": len(combined),
        "explanation": "The final deployable plan stays full-scale and classical, but it prioritizes cells that also appear in the reduced quantum study where doing so improves the full-grid objective.",
    }


def _decorate_classical_plan(classical: dict, quantum: dict) -> dict:
    quantum_keys = {(item["row"], item["col"]) for item in quantum["placements"]}
    placements: list[dict] = []
    for item in classical["placements"]:
        key = (item["row"], item["col"])
        enriched = {**item, "selected_by_classical": True, "selected_by_quantum": key in quantum_keys}
        enriched["reason"] = _placement_explanation(enriched, True, key in quantum_keys)
        placements.append(enriched)
    return {**classical, "placements": placements}


def create_optimization_run(db: Session, scenario: Scenario, payload: dict) -> OptimizationRun:
    available_flammable = len(_flammable_cells(scenario.grid))
    requested_budget = payload["intervention_budget_k"]
    enforced_budget = min(requested_budget, 10, available_flammable)

    classical = _classical_baseline(scenario.grid, enforced_budget)
    quantum = _reduced_quantum_study(scenario.grid, payload["reduced_candidate_count"], enforced_budget)
    classical = _decorate_classical_plan(classical, quantum)
    quantum_informed = _quantum_informed_plan(scenario.grid, classical, quantum, enforced_budget)

    classical_score = classical["objective_after"]
    quantum_informed_score = quantum_informed["objective_after"]
    recommended_mode = "quantum_informed_plan" if quantum_informed_score < classical_score else "classical_full_plan"
    recommended_plan = quantum_informed if recommended_mode == "quantum_informed_plan" else classical

    results = {
        "objective": {
            "name": "wildfire_connectivity_disruption",
            "description": "Minimize remaining flammable adjacency pathways after placing up to K=10 fire-resistant interventions on the 10x10 grid.",
            "better_means": "Lower remaining adjacency connectivity, smaller ignition-connected corridors, and reduced largest flammable component.",
            "budget_enforced_k": enforced_budget,
            "adjacency_model": "4-neighbor orthogonal adjacency between dry_brush and ignition cells.",
        },
        "baseline": {
            "metrics": classical["metrics_before"],
            "objective_score": classical["objective_before"],
        },
        "classical": classical,
        "quantum": quantum,
        "quantum_informed": quantum_informed,
        "recommended_plan": recommended_plan,
    }
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "recommended_mode": recommended_mode,
        "challenge_alignment": "10x10 wildfire grid, adjacency-defined spread pathways, and strict intervention budget K=10.",
        "objective": results["objective"]["description"],
        "budget_requested_k": requested_budget,
        "budget_enforced_k": enforced_budget,
        "available_flammable_cells": available_flammable,
        "full_scale_scope": f"Full 10x10 grid solved classically with enforced budget K={enforced_budget}.",
        "reduced_quantum_scope": quantum["scope"],
        "broken_adjacency_links": recommended_plan["improvement"]["broken_adjacency_links"],
        "connectivity_reduction": recommended_plan["improvement"]["largest_component_reduction"],
        "spread_corridor_disruption": recommended_plan["improvement"]["spread_corridor_disruption"],
        "coverage_high_risk_cells": recommended_plan["coverage_high_risk_cells"],
        "classical_plan_score": classical_score,
        "quantum_informed_plan_score": quantum_informed_score,
        "circuit_available": quantum.get("circuit") is not None,
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
