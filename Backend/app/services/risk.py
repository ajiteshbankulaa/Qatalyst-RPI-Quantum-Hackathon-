from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from datetime import datetime, timezone
from time import perf_counter

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from scipy.optimize import minimize
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session

from app.models import RiskRun, Scenario
from app.schemas.common import GridCellScore
from app.services.forecast import _step_spread
from app.services.spatial import STATE_BASE_RISK, diagonal_neighbors, neighbors

logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "state_risk",
    "ignition_pressure",
    "distance_risk",
    "environmental_force",
]

FLAMMABLE_STATES = {"dry_brush", "tree", "ignition"}
BLOCKING_STATES = {"water", "intervention"}
DEFAULT_HORIZON_STEPS = 2
DEFAULT_SAMPLE_COUNT = 24
QML_TRAIN_LIMIT = 96


@dataclass
class DatasetBundle:
    feature_names: list[str]
    train_x: np.ndarray
    test_x: np.ndarray
    train_y: np.ndarray
    test_y: np.ndarray
    scoring_x: np.ndarray
    scoring_refs: list[tuple[int, int, str]]
    profiles: list[dict]
    summary: dict


def _clip(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _nearest_ignition_distance(grid: list[list[str]], row: int, col: int) -> float:
    ignition_cells = [(r, c) for r, line in enumerate(grid) for c, state in enumerate(line) if state == "ignition"]
    if not ignition_cells:
        return float(len(grid) * 2)
    return min(abs(row - ir) + abs(col - ic) for ir, ic in ignition_cells)


def _wind_alignment(grid: list[list[str]], row: int, col: int, wind_direction: str) -> float:
    wind_vectors = {
        "N": (-1, 0),
        "S": (1, 0),
        "E": (0, 1),
        "W": (0, -1),
        "NE": (-1, 1),
        "NW": (-1, -1),
        "SE": (1, 1),
        "SW": (1, -1),
    }
    ignition_cells = [(r, c) for r, line in enumerate(grid) for c, state in enumerate(line) if state == "ignition"]
    if not ignition_cells:
        return 0.0
    nearest = min(ignition_cells, key=lambda item: abs(item[0] - row) + abs(item[1] - col))
    dr = row - nearest[0]
    dc = col - nearest[1]
    norm = math.sqrt(dr * dr + dc * dc)
    if norm == 0:
        return 1.0
    wr, wc = wind_vectors[wind_direction]
    alignment = ((dr / norm) * wr + (dc / norm) * wc + 1.0) / 2.0
    return float(_clip(alignment, 0.0, 1.0))


def _cell_feature_vector(grid: list[list[str]], row: int, col: int, profile: dict) -> np.ndarray:
    size = len(grid)
    state = grid[row][col]
    direct = neighbors(row, col, size)
    diagonal = diagonal_neighbors(row, col, size)
    direct_ignition = sum(1 for nr, nc in direct if grid[nr][nc] == "ignition")
    diagonal_ignition = sum(1 for nr, nc in diagonal if grid[nr][nc] == "ignition")
    ignition_pressure = _clip((direct_ignition + 0.5 * diagonal_ignition) / 6.0, 0.0, 1.0)
    distance = _nearest_ignition_distance(grid, row, col)
    distance_risk = 1.0 - _clip(distance / max(1.0, (size - 1) * 2.0), 0.0, 1.0)
    wind_alignment = _wind_alignment(grid, row, col, profile["wind_direction"])
    environmental_force = _clip(
        0.4 * profile["dryness"] + 0.35 * profile["spread_sensitivity"] + 0.25 * wind_alignment,
        0.0,
        1.0,
    )
    return np.array(
        [
            STATE_BASE_RISK[state],
            ignition_pressure,
            distance_risk,
            environmental_force,
        ],
        dtype=float,
    )


def _sample_profiles(sample_count: int, horizon_steps: int, seed: int) -> list[dict]:
    rng = np.random.default_rng(seed)
    winds = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    profiles: list[dict] = []
    for idx in range(sample_count):
        profiles.append(
            {
                "profile_id": idx,
                "horizon_steps": horizon_steps,
                "dryness": round(float(rng.uniform(0.45, 0.95)), 3),
                "spread_sensitivity": round(float(rng.uniform(0.45, 0.9)), 3),
                "wind_direction": str(rng.choice(winds)),
            }
        )
    return profiles


def _variant_grid(base_grid: list[list[str]], seed: int) -> list[list[str]]:
    rng = np.random.default_rng(seed)
    grid = [row[:] for row in base_grid]
    for row, line in enumerate(grid):
        for col, state in enumerate(line):
            roll = float(rng.random())
            if state == "dry_brush":
                if roll < 0.08:
                    grid[row][col] = "protected"
                elif roll < 0.18:
                    grid[row][col] = "tree"
                elif roll < 0.22:
                    grid[row][col] = "empty"
            elif state == "tree":
                if roll < 0.08:
                    grid[row][col] = "protected"
                elif roll < 0.16:
                    grid[row][col] = "dry_brush"
            elif state == "empty" and roll < 0.08:
                grid[row][col] = "dry_brush"
    return grid


def _simulate_ignition_labels(grid: list[list[str]], profile: dict, horizon_steps: int) -> np.ndarray:
    size = len(grid)
    current = [row[:] for row in grid]
    first_ignition = np.full((size, size), fill_value=horizon_steps + 1, dtype=int)
    for row in range(size):
        for col in range(size):
            if current[row][col] == "ignition":
                first_ignition[row, col] = 0

    for step in range(1, horizon_steps + 1):
        next_grid = _step_spread(current, profile["dryness"], profile["spread_sensitivity"], profile["wind_direction"])
        for row in range(size):
            for col in range(size):
                if first_ignition[row, col] <= horizon_steps:
                    continue
                if current[row][col] != "ignition" and next_grid[row][col] == "ignition":
                    first_ignition[row, col] = step
        current = next_grid

    return (first_ignition <= horizon_steps).astype(int)


def _build_dataset(
    scenario: Scenario,
    horizon_steps: int,
    sample_count: int,
    threshold: float,
    seed: int,
) -> DatasetBundle:
    profiles = _sample_profiles(sample_count, horizon_steps, seed)
    effective_horizon = horizon_steps
    scoring_samples: list[np.ndarray] = []
    scoring_refs: list[tuple[int, int, str]] = []
    features: list[np.ndarray]
    labels: list[int]

    while True:
        features = []
        labels = []
        for profile in profiles:
            training_grid = _variant_grid(scenario.grid, seed + profile["profile_id"] * 101)
            labels_grid = _simulate_ignition_labels(training_grid, profile, effective_horizon)
            for row, line in enumerate(training_grid):
                for col, state in enumerate(line):
                    vector = _cell_feature_vector(training_grid, row, col, profile)
                    features.append(vector)
                    labels.append(int(labels_grid[row, col]))
        class_counts = np.bincount(np.asarray(labels, dtype=int), minlength=2)
        if (len(np.unique(labels)) > 1 and int(class_counts.min()) >= 2) or effective_horizon <= 1:
            break
        effective_horizon -= 1

    for profile in profiles:
        for row, line in enumerate(scenario.grid):
            for col, state in enumerate(line):
                vector = _cell_feature_vector(scenario.grid, row, col, profile)
                scoring_samples.append(vector)
                scoring_refs.append((row, col, state))

    x = np.asarray(features, dtype=float)
    y = np.asarray(labels, dtype=int)
    train_x, test_x, train_y, test_y = train_test_split(
        x,
        y,
        test_size=0.3,
        random_state=seed,
        stratify=y if len(np.unique(y)) > 1 else None,
    )
    scoring_x = np.asarray(scoring_samples, dtype=float)
    summary = {
        "classification_task": f"Predict whether a cell ignites within the early response window (up to {effective_horizon} steps).",
        "effective_label_horizon_steps": effective_horizon,
        "label_definition": f"label=1 when a cell enters ignition state by step {effective_horizon} under the sampled spread profile.",
        "feature_names": FEATURE_NAMES,
        "sample_count": int(len(y)),
        "positive_samples": int(y.sum()),
        "negative_samples": int(len(y) - int(y.sum())),
        "positive_rate": round(float(y.mean()), 4) if len(y) else 0.0,
        "train_samples": int(len(train_y)),
        "test_samples": int(len(test_y)),
        "scenario_cell_count": int(len(scenario.grid) * len(scenario.grid[0])),
        "sampled_profiles": profiles,
        "dataset_generation": "Monte Carlo wildfire spread simulations on reproducible scenario variants derived from the selected hillside.",
        "requested_horizon_steps": horizon_steps,
        "decision_threshold": threshold,
    }
    return DatasetBundle(
        feature_names=FEATURE_NAMES,
        train_x=train_x,
        test_x=test_x,
        train_y=train_y,
        test_y=test_y,
        scoring_x=scoring_x,
        scoring_refs=scoring_refs,
        profiles=profiles,
        summary=summary,
    )


def _classification_metrics(y_true: np.ndarray, probabilities: np.ndarray, threshold: float, runtime_ms: float) -> dict:
    predictions = (probabilities >= threshold).astype(int)
    return {
        "accuracy": round(float(accuracy_score(y_true, predictions)), 4),
        "precision": round(float(precision_score(y_true, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, predictions, zero_division=0)), 4),
        "f1": round(float(f1_score(y_true, predictions, zero_division=0)), 4),
        "positive_prediction_rate": round(float(predictions.mean()), 4),
        "runtime_ms": round(float(runtime_ms), 2),
    }


def _grid_scores_from_probabilities(
    probabilities: np.ndarray,
    refs: list[tuple[int, int, str]],
    profile_count: int,
) -> tuple[list[dict], list[dict]]:
    cell_scores: dict[tuple[int, int, str], list[float]] = {}
    for probability, ref in zip(probabilities, refs, strict=False):
        cell_scores.setdefault(ref, []).append(float(probability))

    scores: list[GridCellScore] = []
    for (row, col, state), values in cell_scores.items():
        score = float(np.mean(values[:profile_count]))
        confidence = float(min(1.0, abs(score - 0.5) * 2.0))
        scores.append(
            GridCellScore(
                row=row,
                col=col,
                state=state,
                score=round(score, 4),
                confidence=round(confidence, 4),
            )
        )

    top_hotspots = sorted(scores, key=lambda item: item.score, reverse=True)[:8]
    return [item.model_dump() for item in scores], [item.model_dump() for item in top_hotspots]


def _balanced_subset(x: np.ndarray, y: np.ndarray, limit: int, seed: int) -> tuple[np.ndarray, np.ndarray]:
    positives = np.where(y == 1)[0]
    negatives = np.where(y == 0)[0]
    if len(positives) == 0 or len(negatives) == 0 or len(y) <= limit:
        return x, y
    rng = np.random.default_rng(seed)
    class_take = max(1, min(len(positives), len(negatives), limit // 2))
    chosen = np.concatenate(
        [
            rng.choice(positives, size=class_take, replace=False),
            rng.choice(negatives, size=class_take, replace=False),
        ]
    )
    rng.shuffle(chosen)
    return x[chosen], y[chosen]


class VariationalQuantumClassifier:
    def __init__(self, seed: int):
        self.seed = seed
        self.scaler = StandardScaler()
        self.parameters = np.zeros(6, dtype=float)
        self.training_samples = 0

    def _normalize(self, x: np.ndarray) -> np.ndarray:
        return np.clip(np.tanh(self.scaler.transform(x)), -1.0, 1.0)

    def _probability(self, vector: np.ndarray, parameters: np.ndarray) -> float:
        circuit = QuantumCircuit(2)
        circuit.ry(math.pi * vector[0], 0)
        circuit.rz(math.pi * vector[1], 0)
        circuit.ry(math.pi * vector[2], 1)
        circuit.rz(math.pi * vector[3], 1)
        circuit.cz(0, 1)
        circuit.ry(parameters[0], 0)
        circuit.rz(parameters[1], 0)
        circuit.ry(parameters[2], 1)
        circuit.rz(parameters[3], 1)
        circuit.cx(0, 1)
        circuit.ry(parameters[4], 0)
        circuit.ry(parameters[5], 1)
        probabilities = Statevector.from_instruction(circuit).probabilities()
        return float(probabilities[2] + probabilities[3])

    def fit(self, x: np.ndarray, y: np.ndarray) -> None:
        self.scaler.fit(x)
        normalized = self._normalize(x)
        rng = np.random.default_rng(self.seed)
        self.parameters = rng.uniform(-math.pi, math.pi, size=6)
        self.training_samples = int(len(y))

        def objective(parameters: np.ndarray) -> float:
            predictions = np.array([self._probability(vector, parameters) for vector in normalized], dtype=float)
            bounded = np.clip(predictions, 1e-5, 1 - 1e-5)
            losses = -(y * np.log(bounded) + (1 - y) * np.log(1 - bounded))
            return float(np.mean(losses))

        result = minimize(
            objective,
            self.parameters,
            method="COBYLA",
            options={"maxiter": 40, "rhobeg": 0.6},
        )
        if result.success:
            self.parameters = result.x
        else:
            logger.warning("QML optimization did not fully converge: %s", result.message)
            self.parameters = result.x

    def predict_proba(self, x: np.ndarray) -> np.ndarray:
        normalized = self._normalize(x)
        return np.array([self._probability(vector, self.parameters) for vector in normalized], dtype=float)


def _run_classical(dataset: DatasetBundle, threshold: float) -> dict:
    started = perf_counter()
    model = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            ("classifier", LogisticRegression(max_iter=400, class_weight="balanced")),
        ]
    )
    model.fit(dataset.train_x, dataset.train_y)
    test_probabilities = model.predict_proba(dataset.test_x)[:, 1]
    scoring_probabilities = model.predict_proba(dataset.scoring_x)[:, 1]
    metrics = _classification_metrics(dataset.test_y, test_probabilities, threshold, (perf_counter() - started) * 1000)
    grid_scores, top_hotspots = _grid_scores_from_probabilities(scoring_probabilities, dataset.scoring_refs, len(dataset.profiles))
    return {
        "mode": "classical",
        "task": dataset.summary["classification_task"],
        "feature_names": dataset.feature_names,
        "model": {
            "family": "logistic_regression",
            "source": "scikit-learn",
            "notes": "Linear probabilistic baseline trained on the wildfire ignition classification dataset.",
        },
        "grid_scores": grid_scores,
        "top_hotspots": top_hotspots,
        "metrics": {
            **metrics,
            "training_samples": int(len(dataset.train_y)),
            "test_samples": int(len(dataset.test_y)),
            "practicality": "Most practical baseline for repeat planning runs.",
        },
        "_test_probabilities": test_probabilities.tolist(),
        "_scoring_probabilities": scoring_probabilities.tolist(),
    }


def _run_quantum(dataset: DatasetBundle, threshold: float, seed: int) -> dict:
    started = perf_counter()
    train_x, train_y = _balanced_subset(dataset.train_x, dataset.train_y, QML_TRAIN_LIMIT, seed)
    model = VariationalQuantumClassifier(seed=seed)
    model.fit(train_x, train_y)
    test_probabilities = model.predict_proba(dataset.test_x)
    scoring_probabilities = model.predict_proba(dataset.scoring_x)
    metrics = _classification_metrics(dataset.test_y, test_probabilities, threshold, (perf_counter() - started) * 1000)
    grid_scores, top_hotspots = _grid_scores_from_probabilities(scoring_probabilities, dataset.scoring_refs, len(dataset.profiles))
    return {
        "mode": "quantum",
        "task": dataset.summary["classification_task"],
        "feature_names": dataset.feature_names,
        "model": {
            "family": "variational_quantum_classifier",
            "source": "qiskit",
            "qubits": 2,
            "ansatz_depth": 2,
            "notes": "Shallow Qiskit variational classifier trained on the same task using a balanced reduced training subset for near-term practicality.",
        },
        "grid_scores": grid_scores,
        "top_hotspots": top_hotspots,
        "metrics": {
            **metrics,
            "training_samples": int(model.training_samples),
            "test_samples": int(len(dataset.test_y)),
            "practicality": "Meaningful QML baseline, but slower and trained on a reduced subset to stay practical.",
        },
        "_test_probabilities": test_probabilities.tolist(),
        "_scoring_probabilities": scoring_probabilities.tolist(),
    }


def _run_hybrid(classical: dict, quantum: dict, dataset: DatasetBundle, threshold: float) -> dict:
    started = perf_counter()
    hybrid_test_probabilities = np.clip(
        (
            np.asarray(classical["_test_probabilities"], dtype=float)
            + np.asarray(quantum["_test_probabilities"], dtype=float)
        )
        / 2.0,
        0.0,
        1.0,
    )
    metrics = _classification_metrics(dataset.test_y, hybrid_test_probabilities, threshold, (perf_counter() - started) * 1000)
    hybrid_scoring = np.clip(
        (
            np.asarray(classical["_scoring_probabilities"], dtype=float)
            + np.asarray(quantum["_scoring_probabilities"], dtype=float)
        )
        / 2.0,
        0.0,
        1.0,
    )
    combined_scores, top_hotspots = _grid_scores_from_probabilities(
        hybrid_scoring,
        dataset.scoring_refs,
        len(dataset.profiles),
    )
    return {
        "mode": "hybrid",
        "task": dataset.summary["classification_task"],
        "feature_names": dataset.feature_names,
        "model": {
            "family": "probability_ensemble",
            "source": "classical+qiskit",
            "notes": "Average of classical and quantum ignition probabilities on the same cells.",
        },
        "grid_scores": combined_scores,
        "top_hotspots": top_hotspots,
        "metrics": {
            **metrics,
            "training_samples": int(dataset.summary["train_samples"]),
            "test_samples": int(len(dataset.test_y)),
            "practicality": "Useful reconciliation layer when teams want agreement between the two baselines.",
        },
        "_test_probabilities": hybrid_test_probabilities.tolist(),
        "_scoring_probabilities": hybrid_scoring.tolist(),
    }


def _public_result(result: dict) -> dict:
    return {key: value for key, value in result.items() if not key.startswith("_")}


def create_risk_run(db: Session, scenario: Scenario, payload: dict) -> RiskRun:
    modes = payload.get("modes") or ["classical", "quantum", "hybrid"]
    threshold = float(payload.get("threshold", 0.5))
    horizon_steps = int(payload.get("horizon_steps", DEFAULT_HORIZON_STEPS))
    sample_count = int(payload.get("sample_count", DEFAULT_SAMPLE_COUNT))
    seed = int(payload.get("seed", 17))
    logger.info("Running ML/QML risk analysis for scenario %s with modes %s", scenario.id, modes)

    dataset = _build_dataset(scenario, horizon_steps, sample_count, threshold, seed)

    classical_result = _run_classical(dataset, threshold) if "classical" in modes or "hybrid" in modes else None
    quantum_result = _run_quantum(dataset, threshold, seed) if "quantum" in modes or "hybrid" in modes else None

    results: dict[str, dict] = {}
    if classical_result is not None and "classical" in modes:
        results["classical"] = _public_result(classical_result)
    if quantum_result is not None and "quantum" in modes:
        results["quantum"] = _public_result(quantum_result)
    if "hybrid" in modes and classical_result is not None and quantum_result is not None:
        results["hybrid"] = _public_result(_run_hybrid(classical_result, quantum_result, dataset, threshold))

    comparison = []
    for mode, result in results.items():
        comparison.append(
            {
                "mode": mode,
                "accuracy": result["metrics"]["accuracy"],
                "precision": result["metrics"]["precision"],
                "recall": result["metrics"]["recall"],
                "f1": result["metrics"]["f1"],
                "runtime_ms": result["metrics"]["runtime_ms"],
                "practicality": result["metrics"]["practicality"],
            }
        )

    best_accuracy_mode = max(comparison, key=lambda item: (item["f1"], item["accuracy"]))["mode"]
    classical_item = next((item for item in comparison if item["mode"] == "classical"), None)
    best_item = next(item for item in comparison if item["mode"] == best_accuracy_mode)
    if classical_item and best_item["f1"] - classical_item["f1"] <= 0.03:
        recommended_mode = "classical"
    else:
        recommended_mode = best_accuracy_mode
    most_practical_mode = "classical" if classical_item else best_accuracy_mode
    conclusion = (
        f"{recommended_mode.title()} delivered the strongest ignition classification on the held-out test split. "
        f"Classical logistic regression remains the most practical operational baseline, while the Qiskit QML model provides a real near-term comparator rather than a handcrafted quantum-style score."
    )
    summary = {
        "recommended_mode": recommended_mode,
        "most_practical_mode": most_practical_mode,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "classification_task": dataset.summary["classification_task"],
        "dataset": dataset.summary,
        "comparison": comparison,
        "conclusion": conclusion,
    }
    request_payload = {
        "scenario_id": scenario.id,
        "modes": modes,
        "threshold": threshold,
        "horizon_steps": horizon_steps,
        "sample_count": sample_count,
        "seed": seed,
    }
    run = RiskRun(
        scenario_id=scenario.id,
        scenario_version=scenario.version,
        modes_json=modes,
        request_json=request_payload,
        results_json=results,
        summary_json=summary,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    logger.info("Risk run %s complete", run.id)
    return run
