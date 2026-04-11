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
from app.services.optimize import create_optimization_run  # noqa: E402
from app.services.risk import create_risk_run  # noqa: E402


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


def test_risk_service_returns_comparison(db_session: Session, scenario: Scenario):
    run = create_risk_run(db_session, scenario, {"scenario_id": scenario.id, "modes": ["classical", "quantum", "hybrid"], "threshold": 0.62})
    assert run.status == "complete"
    assert run.summary_json["recommended_mode"] in {"hybrid", "classical", "quantum"}
    assert len(run.summary_json["comparison"]) == 3
    assert "grid_scores" in run.results_json["classical"]


def test_forecast_service_returns_snapshots_and_diagnostics(db_session: Session, scenario: Scenario):
    run = create_forecast_run(
        db_session,
        scenario,
        {"scenario_id": scenario.id, "steps": 5, "dryness": 0.8, "spread_sensitivity": 0.65, "wind_direction": "NE"},
    )
    assert run.status == "complete"
    assert len(run.snapshots_json) == 6
    assert run.summary_json["peak_ignited_cells"] >= 1
    assert run.diagnostics_json["optimized_shift"]["depth"] < run.diagnostics_json["baseline_shift"]["depth"]


def test_optimization_service_builds_real_or_labeled_quantum_scope(db_session: Session, scenario: Scenario):
    run = create_optimization_run(
        db_session,
        scenario,
        {"scenario_id": scenario.id, "intervention_budget_k": 10, "reduced_candidate_count": 8},
    )
    assert run.status == "complete"
    assert run.summary_json["recommended_mode"] == "hybrid"
    assert run.results_json["quantum"]["scope"]["type"] == "reduced_critical_subgraph"
    assert run.results_json["hybrid"]["placements"]


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
