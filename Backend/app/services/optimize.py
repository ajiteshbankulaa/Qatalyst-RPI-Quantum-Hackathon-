from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.algorithms.qaoa import QAOAProblem, approximation_ratio, brute_force_best, build_qaoa_circuit, qaoa_level1
from app.models import OptimizationRun, Scenario
from app.services.spatial import STATE_BASE_RISK, apply_placements, count_high_risk_components, largest_component, neighbors

logger = logging.getLogger(__name__)


def candidate_rows(grid: list[list[str]]) -> list[dict]:
    size = len(grid)
    rows: list[dict] = []
    for row in range(size):
        for col in range(size):
            state = grid[row][col]
            if state in {"water", "intervention"}:
                continue
            adjacency = sum(1 for nr, nc in neighbors(row, col, size) if grid[nr][nc] == "ignition")
            neighborhood = sum(STATE_BASE_RISK[grid[nr][nc]] for nr, nc in neighbors(row, col, size))
            score = STATE_BASE_RISK[state] * 0.6 + adjacency * 0.28 + neighborhood * 0.12
            rows.append(
                {
                    "row": row,
                    "col": col,
                    "state": state,
                    "score": round(score, 4),
                    "reason": f"High-risk fuel pocket with adjacency pressure {adjacency}.",
                }
            )
    return sorted(rows, key=lambda item: item["score"], reverse=True)


def _classical_baseline(grid: list[list[str]], budget: int) -> dict:
    placements = candidate_rows(grid)[:budget]
    updated = apply_placements(grid, placements)
    return {
        "placements": placements,
        "before_connectivity": {
            "components": count_high_risk_components(grid),
            "largest_component": largest_component(grid),
        },
        "after_connectivity": {
            "components": count_high_risk_components(updated),
            "largest_component": largest_component(updated),
        },
    }


def _quantum_study(grid: list[list[str]], reduced_count: int, budget: int) -> dict:
    reduced = candidate_rows(grid)[:reduced_count]
    weights = [candidate["score"] for candidate in reduced]
    penalties: dict[tuple[int, int], float] = {}
    for idx, candidate in enumerate(reduced):
        for jdx in range(idx + 1, len(reduced)):
            other = reduced[jdx]
            if abs(candidate["row"] - other["row"]) + abs(candidate["col"] - other["col"]) <= 1:
                penalties[(idx, jdx)] = 0.22

    reduced_budget = min(budget, max(3, min(6, len(reduced) // 2 or 1)))
    problem = QAOAProblem(weights=weights, pair_penalties=penalties, budget=reduced_budget)
    qaoa = qaoa_level1(problem)
    exact_bits, exact_cost = brute_force_best(problem)
    selected = [reduced[idx] for idx, bit in enumerate(qaoa["best_bitstring"]) if bit == 1]

    # Build the real circuit if Qiskit is available for transparency
    circuit_info = None
    circuit = build_qaoa_circuit(problem, qaoa["gamma"], qaoa["beta"])
    if circuit is not None:
        circuit_info = {
            "type": "real_qiskit_quantumcircuit",
            "num_qubits": circuit.num_qubits,
            "depth": circuit.depth(),
            "gate_counts": dict(circuit.count_ops()),
            "two_qubit_gates": circuit.count_ops().get("cx", 0),
        }
        logger.info(
            "Optimization QAOA circuit: %d qubits, depth=%d, CX=%d",
            circuit.num_qubits, circuit.depth(), circuit.count_ops().get("cx", 0),
        )

    return {
        "scope": {
            "type": "reduced_critical_subgraph",
            "candidate_count": len(reduced),
            "budget": reduced_budget,
            "note": (
                "Quantum analysis is restricted to a reduced critical subgraph "
                f"({len(reduced)} of {len(candidate_rows(grid))} candidates) "
                "to stay within realistic NISQ qubit budgets."
            ),
        },
        "placements": selected,
        "qaoa": qaoa,
        "circuit": circuit_info,
        "exact_baseline": {"best_bitstring": list(exact_bits), "best_cost": round(float(exact_cost), 4)},
        "approximation_ratio": approximation_ratio(problem, qaoa["expected_cost"]),
    }


def create_optimization_run(db: Session, scenario: Scenario, payload: dict) -> OptimizationRun:
    budget = payload["intervention_budget_k"]
    classical = _classical_baseline(scenario.grid, budget)
    quantum = _quantum_study(scenario.grid, payload["reduced_candidate_count"], budget)
    hybrid = {
        "placements": classical["placements"][: max(0, budget - len(quantum["placements"]))] + quantum["placements"],
        "explanation": "Classical full-grid screening selects the broad intervention envelope; reduced quantum study reorders the most critical subset.",
    }
    results = {"classical": classical, "quantum": quantum, "hybrid": hybrid}
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "recommended_mode": "hybrid",
        "full_scale_scope": f"10x10 full grid with intervention budget K={budget}",
        "reduced_quantum_scope": quantum["scope"],
        "connectivity_reduction": classical["before_connectivity"]["largest_component"]
        - classical["after_connectivity"]["largest_component"],
        "circuit_available": quantum.get("circuit") is not None,
    }
    run = OptimizationRun(
        scenario_id=scenario.id,
        scenario_version=scenario.version,
        request_json=payload,
        results_json=results,
        summary_json=summary,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run
