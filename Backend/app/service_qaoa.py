from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np


@dataclass
class QAOAProblem:
    weights: list[float]
    pair_penalties: dict[tuple[int, int], float]
    budget: int


def bitstrings(num_qubits: int) -> list[tuple[int, ...]]:
    return [tuple((idx >> bit) & 1 for bit in range(num_qubits)) for idx in range(2**num_qubits)]


def cost_of(problem: QAOAProblem, bits: tuple[int, ...]) -> float:
    weight_term = sum(w * b for w, b in zip(problem.weights, bits, strict=True))
    penalty_term = sum(problem.pair_penalties[pair] * bits[pair[0]] * bits[pair[1]] for pair in problem.pair_penalties)
    budget_penalty = 0.7 * (sum(bits) - problem.budget) ** 2
    return weight_term - penalty_term - budget_penalty


def brute_force_best(problem: QAOAProblem) -> tuple[tuple[int, ...], float]:
    evaluated = [(bits, cost_of(problem, bits)) for bits in bitstrings(len(problem.weights))]
    return max(evaluated, key=lambda item: item[1])


def qaoa_level1(problem: QAOAProblem) -> dict:
    num_qubits = len(problem.weights)
    states = bitstrings(num_qubits)
    basis_costs = np.array([cost_of(problem, state) for state in states], dtype=float)
    best_bits, best_cost = brute_force_best(problem)
    uniform = np.ones(2**num_qubits, dtype=complex) / math.sqrt(2**num_qubits)
    best_result = None

    for gamma in np.linspace(0.1, 1.2, 12):
        phase = np.exp(-1j * gamma * basis_costs)
        phased = uniform * phase
        for beta in np.linspace(0.1, 1.2, 12):
            mixer = np.array(
                [[math.cos(beta), -1j * math.sin(beta)], [-1j * math.sin(beta), math.cos(beta)]],
                dtype=complex,
            )
            full = np.array([[1]], dtype=complex)
            for _ in range(num_qubits):
                full = np.kron(full, mixer)
            mixed = full @ phased
            probabilities = np.abs(mixed) ** 2
            expected_cost = float(np.dot(probabilities, basis_costs))
            success_probability = float(
                sum(probabilities[index] for index, bits in enumerate(states) if bits == best_bits)
            )
            candidate = {
                "beta": round(float(beta), 4),
                "gamma": round(float(gamma), 4),
                "expected_cost": round(expected_cost, 4),
                "success_probability": round(success_probability, 4),
                "best_bitstring": list(best_bits),
                "best_cost": round(float(best_cost), 4),
            }
            if best_result is None or candidate["expected_cost"] > best_result["expected_cost"]:
                best_result = candidate

    assert best_result is not None
    return best_result


def approximation_ratio(problem: QAOAProblem, observed_cost: float) -> float:
    _, optimum = brute_force_best(problem)
    if optimum == 0:
        return 0.0
    return round(float(observed_cost / optimum), 4)
