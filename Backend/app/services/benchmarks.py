from __future__ import annotations

import importlib.metadata
import importlib.util
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.algorithms.qaoa import (
    QAOAProblem,
    approximation_ratio,
    brute_force_best,
    build_qaoa_circuit,
    parse_counts,
    qaoa_level1,
    run_transpiled_qaoa,
)
from app.core.config import settings
from app.models import BenchmarkRun, OptimizationRun, Scenario
from app.services.optimize import candidate_rows
from app.services.spatial import neighbors


def _module_available(name: str) -> bool:
    return importlib.util.find_spec(name) is not None


def _version(name: str) -> str | None:
    try:
        return importlib.metadata.version(name)
    except Exception:
        return None


def _build_problem(grid: list[list[str]], reduced_count: int) -> tuple[list[dict], QAOAProblem]:
    candidates = candidate_rows(grid)[:reduced_count]
    weights = [row["score"] for row in candidates]
    penalties: dict[tuple[int, int], float] = {}
    for idx, candidate in enumerate(candidates):
        adjacent = {(r, c) for r, c in neighbors(candidate["row"], candidate["col"], len(grid))}
        for jdx in range(idx + 1, len(candidates)):
            other = candidates[jdx]
            if (other["row"], other["col"]) in adjacent:
                penalties[(idx, jdx)] = 0.28
    budget = max(2, min(5, len(candidates) // 2))
    return candidates, QAOAProblem(weights=weights, pair_penalties=penalties, budget=budget)


def _ibm_runtime_available() -> bool:
    if not (settings.ibm_configured and _module_available("qiskit_ibm_runtime")):
        return False
    try:
        from qiskit_ibm_runtime import QiskitRuntimeService

        service_kwargs = {"token": settings.ibm_token}
        if settings.ibm_instance:
            service_kwargs["instance"] = settings.ibm_instance
        if settings.normalized_ibm_channel:
            service_kwargs["channel"] = settings.normalized_ibm_channel
        service = QiskitRuntimeService(**service_kwargs)
        backends = service.backends(simulator=False)
        return any(backends)
    except Exception:
        return False


def benchmark_availability() -> dict:
    qbraid_installed = _module_available("qbraid")
    qiskit_installed = _module_available("qiskit")
    aer_installed = _module_available("qiskit_aer")
    runtime_installed = _module_available("qiskit_ibm_runtime")
    ibm_execution_ready = _ibm_runtime_available()
    compiler_ready = qbraid_installed and qiskit_installed and aer_installed
    return {
        "qbraid_sdk_installed": qbraid_installed,
        "qbraid_version": _version("qbraid"),
        "qiskit_installed": qiskit_installed,
        "qiskit_version": _version("qiskit"),
        "qiskit_aer_installed": aer_installed,
        "qiskit_aer_version": _version("qiskit-aer"),
        "qiskit_ibm_runtime_installed": runtime_installed,
        "qiskit_ibm_runtime_version": _version("qiskit-ibm-runtime"),
        "qbraid_api_key_configured": settings.qbraid_configured,
        "ibm_token_configured": settings.ibm_configured,
        "compiler_aware_benchmarking_ready": compiler_ready,
        "ibm_execution_ready": ibm_execution_ready,
        "mode": "ready" if compiler_ready else "degraded",
        "reason": None if compiler_ready else "Install qbraid, qiskit, and qiskit-aer to execute compiler-aware benchmark runs.",
    }


def _conversion_path(source: str, target: str) -> list[str]:
    from qbraid import ConversionGraph

    graph = ConversionGraph()
    path = graph.find_shortest_conversion_path(source, target)
    labels: list[str] = []
    for step in path:
        owner = getattr(step, "__self__", None)
        if owner is None:
            labels.append(str(step))
        else:
            labels.append(f"{owner.source} -> {owner.target}")
    return labels


def _qbraid_bridge_to_qiskit(circuit):
    from qbraid import transpile as qbraid_transpile

    qasm2_program = qbraid_transpile(circuit, "qasm2")
    bridged = qbraid_transpile(qasm2_program, "qiskit")
    return bridged, {
        "source_framework": "qiskit",
        "bridge_format": "qasm2",
        "forward_path": _conversion_path("qiskit", "qasm2"),
        "reverse_path": _conversion_path("qasm2", "qiskit"),
    }


def _compile_circuit(circuit, optimization_level: int):
    from qiskit import transpile as qiskit_transpile
    from qiskit.transpiler import CouplingMap

    bridged_circuit, bridge_info = _qbraid_bridge_to_qiskit(circuit)
    compiled = qiskit_transpile(
        bridged_circuit,
        basis_gates=["rz", "sx", "x", "cx"],
        coupling_map=CouplingMap.from_line(bridged_circuit.num_qubits),
        optimization_level=optimization_level,
    )
    gate_breakdown = dict(compiled.count_ops())
    two_qubit_gate_count = gate_breakdown.get("cx", 0) + gate_breakdown.get("cz", 0) + gate_breakdown.get("ecr", 0)
    compiled_metrics = {
        "depth": compiled.depth(),
        "two_qubit_gate_count": two_qubit_gate_count,
        "width": compiled.num_qubits,
        "gate_breakdown": gate_breakdown,
    }
    return compiled, compiled_metrics, bridge_info


def _strategy_label(optimization_level: int) -> str:
    return "Default qBraid bridge + Qiskit opt-level 1" if optimization_level == 1 else "Target-aware qBraid bridge + Qiskit opt-level 3"


def _compile_strategy(problem: QAOAProblem, circuit, shots: int, strategy: str, optimization_level: int) -> list[dict]:
    compiled, compiled_metrics, bridge_info = _compile_circuit(circuit, optimization_level)
    compiled_metrics = {**compiled_metrics, "shots": shots}
    execution = run_transpiled_qaoa(problem, compiled, shots)
    label = _strategy_label(optimization_level)
    return [
        {
            "strategy": strategy,
            "strategy_label": label,
            "environment": environment,
            "conversion_path": bridge_info,
            "compiled_metrics": compiled_metrics,
            "output_quality": {
                "expected_cost": execution[environment]["expected_cost"],
                "success_probability": execution[environment]["success_probability"],
                "approximation_ratio": execution[environment]["approximation_ratio"],
            },
        }
        for environment in ["ideal_simulator", "noisy_simulator"]
    ]


def _select_ibm_backend(required_qubits: int):
    from qiskit_ibm_runtime import QiskitRuntimeService

    service_kwargs = {"token": settings.ibm_token}
    if settings.ibm_instance:
        service_kwargs["instance"] = settings.ibm_instance
    if settings.normalized_ibm_channel:
        service_kwargs["channel"] = settings.normalized_ibm_channel
    service = QiskitRuntimeService(**service_kwargs)
    candidates = service.backends(simulator=False, operational=True, min_num_qubits=required_qubits)
    if not candidates:
        raise RuntimeError(f"No IBM hardware backend available with at least {required_qubits} qubits.")
    backend = min(candidates, key=lambda item: (getattr(item.status(), "pending_jobs", 10**9), item.num_qubits))
    return backend


def _run_on_ibm(problem: QAOAProblem, compiled, shots: int) -> dict:
    from qiskit import transpile as qiskit_transpile
    from qiskit_ibm_runtime import SamplerV2

    backend = _select_ibm_backend(compiled.num_qubits)
    isa_circuit = qiskit_transpile(compiled, backend=backend, optimization_level=1)
    sampler = SamplerV2(mode=backend)
    job = sampler.run([isa_circuit], shots=shots)
    result = job.result()[0]
    data_bin = result.data
    bit_array = None
    for key in data_bin.keys():
        candidate = getattr(data_bin, key)
        if hasattr(candidate, "get_counts"):
            bit_array = candidate
            break
    if bit_array is None:
        raise RuntimeError("IBM Sampler result did not contain a count-bearing classical register.")
    raw_counts = bit_array.get_counts()
    parsed, expected_cost, success_probability = parse_counts(problem, raw_counts)
    return {
        "backend_name": backend.name,
        "job_id": job.job_id(),
        "isa_depth": isa_circuit.depth(),
        "isa_gate_breakdown": dict(isa_circuit.count_ops()),
        "counts": parsed,
        "expected_cost": expected_cost,
        "success_probability": success_probability,
        "approximation_ratio": approximation_ratio(problem, expected_cost),
        "unique_outcomes": len(parsed),
        "queue_depth_at_submission": getattr(backend.status(), "pending_jobs", None),
    }


def _run_real_benchmark(problem: QAOAProblem, candidates: list[dict], shots: int, environments: list[str], availability: dict) -> dict:
    analytical = qaoa_level1(problem)
    exact_bits, exact_cost = brute_force_best(problem)
    circuit = build_qaoa_circuit(problem, analytical["gamma"], analytical["beta"])

    strategy_results = []
    strategy_results.extend(_compile_strategy(problem, circuit, shots, "qbraid_default_bridge", optimization_level=1))
    strategy_results.extend(_compile_strategy(problem, circuit, shots, "qbraid_target_aware_bridge", optimization_level=3))
    strategy_results = [item for item in strategy_results if item["environment"] in environments]

    ibm_execution: dict[str, dict] = {}
    if "ibm_hardware" in environments and availability["ibm_execution_ready"]:
        for strategy_name, opt_level in [("qbraid_default_bridge", 1), ("qbraid_target_aware_bridge", 3)]:
            compiled, compiled_metrics, bridge_info = _compile_circuit(circuit, opt_level)
            ibm_result = _run_on_ibm(problem, compiled, shots)
            strategy_results.append(
                {
                    "strategy": strategy_name,
                    "strategy_label": _strategy_label(opt_level),
                    "environment": "ibm_hardware",
                    "conversion_path": bridge_info,
                    "compiled_metrics": {**compiled_metrics, "shots": shots, "target_backend": ibm_result["backend_name"]},
                    "output_quality": {
                        "expected_cost": ibm_result["expected_cost"],
                        "success_probability": ibm_result["success_probability"],
                        "approximation_ratio": ibm_result["approximation_ratio"],
                    },
                }
            )
            ibm_execution[strategy_name] = ibm_result

    best = max(
        strategy_results,
        key=lambda item: item["output_quality"]["approximation_ratio"] - item["compiled_metrics"]["two_qubit_gate_count"] / 1000,
    )
    return {
        "workload": {
            "name": "reduced_intervention_qaoa",
            "source_framework": "qiskit",
            "compiler": "qbraid",
            "qiskit_version": _version("qiskit"),
            "qbraid_version": _version("qbraid"),
            "candidate_scope": candidates,
            "problem_size": {
                "num_qubits": circuit.num_qubits,
                "num_weights": len(problem.weights),
                "num_pair_penalties": len(problem.pair_penalties),
                "budget": problem.budget,
            },
            "uncompiled_circuit": {
                "depth": circuit.depth(),
                "two_qubit_gate_count": dict(circuit.count_ops()).get("cx", 0),
                "width": circuit.num_qubits,
                "gate_breakdown": dict(circuit.count_ops()),
            },
            "best_known_bitstring": list(exact_bits),
            "best_known_cost": round(float(exact_cost), 4),
            "qaoa_reference": analytical,
        },
        "strategy_results": strategy_results,
        "ibm_execution": ibm_execution,
        "best_strategy": best["strategy"],
        "best_environment": best["environment"],
    }


def create_benchmark_run(
    db: Session,
    scenario: Scenario,
    payload: dict,
    optimization_run: OptimizationRun | None = None,
) -> BenchmarkRun:
    availability = benchmark_availability()
    candidates, problem = _build_problem(scenario.grid, payload["reduced_candidate_count"])
    exact_bits, exact_cost = brute_force_best(problem)
    now = datetime.now(timezone.utc)

    if not availability["compiler_aware_benchmarking_ready"]:
        analytical = qaoa_level1(problem)
        run = BenchmarkRun(
            scenario_id=scenario.id,
            optimization_run_id=optimization_run.id if optimization_run else None,
            scenario_version=scenario.version,
            status="degraded",
            request_json=payload,
            results_json={
                "workload": {
                    "name": "reduced_intervention_qaoa",
                    "candidate_scope": candidates,
                    "best_known_bitstring": list(exact_bits),
                    "best_known_cost": round(float(exact_cost), 4),
                    "qaoa_reference": analytical,
                },
                "note": availability["reason"],
            },
            summary_json={
                "generated_at": now.isoformat(),
                "recommendation": "Compiler-aware benchmark unavailable in current environment.",
                "status_detail": availability["reason"],
            },
            availability_json=availability,
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        return run

    requested_environments = payload["environments"]
    if "ibm_hardware" in requested_environments and not availability["ibm_execution_ready"]:
        requested_environments = [env for env in requested_environments if env != "ibm_hardware"]

    benchmark_data = _run_real_benchmark(problem, candidates, payload["shots"], requested_environments, availability)
    best = next(
        item
        for item in benchmark_data["strategy_results"]
        if item["strategy"] == benchmark_data["best_strategy"] and item["environment"] == benchmark_data["best_environment"]
    )
    recommendation_suffix = " on real IBM hardware." if best["environment"] == "ibm_hardware" else f" on {best['environment']}."
    run = BenchmarkRun(
        scenario_id=scenario.id,
        optimization_run_id=optimization_run.id if optimization_run else None,
        scenario_version=scenario.version,
        status="complete",
        request_json={**payload, "environments": requested_environments},
        results_json=benchmark_data,
        summary_json={
            "generated_at": now.isoformat(),
            "recommendation": f"{best['strategy_label']} preserves the best quality-cost balance{recommendation_suffix}",
            "best_strategy": benchmark_data["best_strategy"],
            "best_environment": benchmark_data["best_environment"],
            "best_approximation_ratio": best["output_quality"]["approximation_ratio"],
            "best_depth": best["compiled_metrics"]["depth"],
            "best_two_qubit_gate_count": best["compiled_metrics"]["two_qubit_gate_count"],
            "qiskit_version": _version("qiskit"),
            "qbraid_version": _version("qbraid"),
            "circuit_type": "real_qiskit_quantumcircuit",
        },
        availability_json=availability,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run
