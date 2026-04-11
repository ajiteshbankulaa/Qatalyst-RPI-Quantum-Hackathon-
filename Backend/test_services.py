from __future__ import annotations

from pathlib import Path
import sys
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

sys.path.append(str(Path(__file__).resolve().parent))

from app.models import Base, Scenario  # noqa: E402
from app.services import benchmarks as benchmark_service  # noqa: E402
from app.services import integrations as integration_service  # noqa: E402
from app.services.forecast import create_forecast_run  # noqa: E402
from app.services.optimize import candidate_rows, create_optimization_run  # noqa: E402
from app.services.risk import _build_dataset, create_risk_run  # noqa: E402
from app.services.wildfire_model import default_environment, normalize_grid, run_stochastic_forecast  # noqa: E402


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def scenario(db_session: Session):
    record = Scenario(
        name="Service test wildfire",
        domain="wildfire",
        status="draft",
        description="Service test scenario",
        grid=[["dry_brush" for _ in range(10)] for _ in range(10)],
        metadata_json={"region": "test"},
        constraints_json={"intervention_budget_k": 10},
        objectives_json={"primary": "minimize exposure"},
    )
    record.grid[0][0] = "ignition"
    record.grid[9][9] = "water"
    db_session.add(record)
    db_session.commit()
    db_session.refresh(record)
    return record


def test_risk_dataset_generation_returns_supervised_split(scenario: Scenario):
    dataset = _build_dataset(scenario, horizon_steps=4, sample_count=12, threshold=0.5, seed=17)
    assert dataset.summary["sample_count"] > 0
    assert dataset.summary["train_samples"] > 0
    assert dataset.summary["test_samples"] > 0
    assert dataset.summary["positive_samples"] > 0
    assert dataset.summary["negative_samples"] > 0
    assert dataset.feature_names == ["fuel_load", "base_ignitability", "local_fuel_density", "distance_risk", "wind_exposure", "slope_factor", "treated", "connectivity_proxy"]
    assert dataset.summary["preview_burn_probability_map"]


def test_wildfire_model_normalizes_states_and_builds_ensemble(scenario: Scenario):
    scenario.grid[0][1] = "road_or_firebreak"
    normalized = normalize_grid(scenario.grid)
    assert normalized[0][1] == "road_or_firebreak"
    environment = default_environment(scenario)
    forecast = run_stochastic_forecast(normalized, environment, steps=4, seed=17, runs=8)
    assert forecast["burn_probability_map"]
    assert forecast["expected_ignition_time_map"]
    assert len(forecast["final_burned_area_distribution"]) == 8


def test_risk_service_returns_real_ml_comparison(db_session: Session, scenario: Scenario):
    run = create_risk_run(
        db_session,
        scenario,
        {"scenario_id": scenario.id, "modes": ["classical", "quantum", "hybrid"], "threshold": 0.5, "sample_count": 12, "horizon_steps": 4},
    )
    assert run.status == "complete"
    assert run.summary_json["recommended_mode"] in {"hybrid", "classical", "quantum"}
    assert len(run.summary_json["comparison"]) == 3
    assert "grid_scores" in run.results_json["classical"]
    assert "classification_task" in run.summary_json
    assert run.summary_json["dataset"]["feature_names"]
    assert run.results_json["classical"]["model"]["family"] == "logistic_regression"
    assert run.results_json["quantum"]["model"]["family"] == "variational_quantum_classifier"
    assert "accuracy" in run.results_json["classical"]["metrics"]
    assert "f1" in run.results_json["quantum"]["metrics"]
    assert "top_hotspots" in run.results_json["hybrid"]


def test_forecast_service_returns_snapshots_and_diagnostics(db_session: Session, scenario: Scenario):
    run = create_forecast_run(
        db_session,
        scenario,
        {"scenario_id": scenario.id, "steps": 5, "dryness": 0.8, "spread_sensitivity": 0.65, "wind_direction": "NE"},
    )
    assert run.status == "complete"
    assert len(run.snapshots_json) == 6
    assert run.summary_json["peak_ignited_cells"] >= 1
    assert run.summary_json["ensemble_runs"] >= 1
    assert run.diagnostics_json["ensemble"]["burn_probability_map"]
    assert run.diagnostics_json["optimized_shift"]["depth"] < run.diagnostics_json["baseline_shift"]["depth"]


def test_optimization_service_builds_real_or_labeled_quantum_scope(db_session: Session, scenario: Scenario):
    run = create_optimization_run(
        db_session,
        scenario,
        {"scenario_id": scenario.id, "intervention_budget_k": 10, "reduced_candidate_count": 12},
    )
    assert run.status == "complete"
    assert run.summary_json["recommended_mode"] in {"classical_full_plan", "quantum_informed_plan"}
    assert run.results_json["quantum"]["scope"]["type"] == "reduced_critical_subgraph"
    assert run.results_json["recommended_plan"]["placements"]
    assert run.summary_json["budget_enforced_k"] == 10
    assert len(run.results_json["classical"]["placements"]) == 10
    assert len(run.results_json["recommended_plan"]["placements"]) == 10
    assert run.results_json["baseline"]["metrics"]["adjacency_links"] >= run.results_json["recommended_plan"]["metrics_after"]["adjacency_links"]
    assert run.summary_json["broken_adjacency_links"] >= 0
    assert run.results_json["quantum"]["scope"]["shortlist_count"] == 12
    assert run.results_json["quantum"]["scope"]["candidate_count"] <= 8
    assert "mean_final_burned_area" in run.results_json["baseline"]["metrics"]
    assert run.summary_json["expected_burned_area_reduction"] >= 0


def test_optimization_service_enforces_k10_cap(db_session: Session, scenario: Scenario):
    run = create_optimization_run(
        db_session,
        scenario,
        {"scenario_id": scenario.id, "intervention_budget_k": 14, "reduced_candidate_count": 12},
    )
    assert run.summary_json["budget_enforced_k"] == 10
    assert run.request_json["intervention_budget_k"] == 10


def test_candidate_rows_are_adjacency_aligned(db_session: Session, scenario: Scenario):
    ranked = candidate_rows(scenario.grid)
    assert ranked
    top = ranked[0]
    assert top["state"] in {"dry_brush", "ignition", "tree", "protected"}
    assert "blocked_links" in top
    assert "component_contains_ignition" in top


def test_optimization_recommendations_include_explanations(db_session: Session, scenario: Scenario):
    run = create_optimization_run(
        db_session,
        scenario,
        {"scenario_id": scenario.id, "intervention_budget_k": 10, "reduced_candidate_count": 12},
    )
    placement = run.results_json["recommended_plan"]["placements"][0]
    assert "reason" in placement
    assert "expected_burned_area_reduction" in placement
    assert "selected_by_quantum" in placement
    assert run.results_json["quantum"]["scope"]["shortlist_count"] >= run.results_json["quantum"]["scope"]["candidate_count"]


def test_benchmark_service_degraded_mode_is_explicit(db_session: Session, scenario: Scenario, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        benchmark_service,
        "_module_available",
        lambda name: False if name in {"qbraid", "qiskit", "qiskit_aer", "qiskit_ibm_runtime"} else False,
    )
    monkeypatch.setattr(
        benchmark_service,
        "settings",
        SimpleNamespace(qbraid_configured=False, ibm_configured=False),
    )

    run = benchmark_service.create_benchmark_run(
        db_session,
        scenario,
        {"scenario_id": scenario.id, "shots": 256, "reduced_candidate_count": 6, "environments": ["ideal_simulator", "noisy_simulator"]},
    )
    assert run.status == "degraded"
    assert run.availability_json["mode"] == "degraded"
    assert "Compiler-aware benchmark unavailable" in run.summary_json["recommendation"]


def test_benchmark_service_returns_strategy_comparison_and_metrics(db_session: Session, scenario: Scenario):
    run = benchmark_service.create_benchmark_run(
        db_session,
        scenario,
        {"scenario_id": scenario.id, "shots": 128, "reduced_candidate_count": 4, "environments": ["ideal_simulator", "noisy_simulator"]},
    )
    assert run.status == "complete"
    assert run.summary_json["best_strategy"] in {"qbraid_qasm2_portable", "qbraid_qasm3_target_aware"}
    assert "recommendation" in run.summary_json
    assert len(run.results_json["strategies"]) == 2
    assert set(run.results_json["environments"]) == {"ideal_simulator", "noisy_simulator"}
    assert len(run.results_json["strategy_results"]) == 4
    for result in run.results_json["strategy_results"]:
        assert result["strategy"]["intermediate_representation"] in {"qasm2", "qasm3"}
        assert result["compiled_metrics"]["depth"] >= 0
        assert result["compiled_metrics"]["two_qubit_gate_count"] >= 0
        assert result["compiled_metrics"]["total_gates"] >= result["compiled_metrics"]["two_qubit_gate_count"]
        assert "shots" in result["compiled_metrics"]
        assert "approximation_ratio" in result["output_quality"]
        assert "success_probability" in result["output_quality"]
    assert "noisy_simulator" in run.results_json["environment_summary"]


def test_integration_status_behavior_without_credentials(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(integration_service, "_module_available", lambda name: name in {"qiskit", "qiskit_aer"})
    monkeypatch.setattr(
        integration_service,
        "settings",
        SimpleNamespace(
            qbraid_configured=False,
            qbraid_api_key="",
            ibm_configured=False,
            ibm_token="",
            ibm_channel="ibm_quantum_platform",
            normalized_ibm_channel="ibm_quantum_platform",
            ibm_instance="ibm-q/open/main",
        ),
    )
    statuses = integration_service.collect_provider_statuses()
    by_provider = {item["provider"]: item for item in statuses}
    assert by_provider["qbraid"]["mode"] in {"missing", "sdk_only"}
    assert by_provider["ibm_quantum"]["mode"] == "simulator_only"
    assert by_provider["local_simulators"]["available"] is True


def test_integration_status_behavior_with_credentials(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(integration_service, "_module_available", lambda name: True)
    monkeypatch.setattr(
        integration_service,
        "_check_ibm_connectivity",
        lambda: {
            "connected": True,
            "channel": "ibm_quantum_platform",
            "normalized_channel": "ibm_quantum_platform",
            "instance": "ibm-q/open/main",
            "available_backends": ["fake_backend"],
            "total_backends": 1,
        },
    )
    monkeypatch.setattr(
        integration_service,
        "settings",
        SimpleNamespace(
            qbraid_configured=True,
            qbraid_api_key="configured",
            ibm_configured=True,
            ibm_token="configured",
            ibm_channel="ibm_quantum_platform",
            normalized_ibm_channel="ibm_quantum_platform",
            ibm_instance="ibm-q/open/main",
        ),
    )
    statuses = integration_service.collect_provider_statuses()
    by_provider = {item["provider"]: item for item in statuses}
    assert by_provider["qbraid"]["mode"] == "ready"
    assert by_provider["ibm_quantum"]["mode"] == "hardware_ready"
