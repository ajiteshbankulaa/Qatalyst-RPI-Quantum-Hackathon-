# QuantumProj Backend

FastAPI backend for the QuantumProj MVP. This service owns persisted scenarios, risk runs, propagation forecasts, intervention optimization runs, compiler-aware benchmark records, reports, and integration capability state.

## What it does

- Stores wildfire-first 10x10 spatial scenarios in SQLite
- Runs classical, quantum, and hybrid risk scoring on the same scenario-derived features
- Simulates propagation forecasts with time steps, dryness, wind direction, and spread sensitivity
- Produces intervention plans with:
  - full-grid classical screening
  - reduced critical-subgraph quantum study
  - hybrid recommendation output
- Exposes qBraid-centered benchmark records and labels degraded mode honestly when qBraid and Qiskit are missing
- Generates markdown-friendly decision reports from persisted run artifacts

## Architecture

The backend is intentionally modular but flat under `Backend/app/` because nested directory creation was blocked in this workspace.

- `main.py`
  - FastAPI app creation, CORS, route registration, startup bootstrap
- `db.py`
  - SQLAlchemy engine, session factory, dependency injection helper
- `models.py`
  - ORM models for `Scenario`, `RiskRun`, `ForecastRun`, `OptimizationRun`, `BenchmarkRun`, `Report`, and `IntegrationStatus`
- `schema_*.py`
  - Pydantic request/response contracts per module
- `service_scenarios.py`
  - Scenario CRUD and version bumps
- `service_risk.py`
  - Classical and analytic quantum-style scoring over shared features
- `service_forecast.py`
  - Grid spread simulation plus shift-kernel diagnostics
- `service_optimize.py`
  - Full-grid classical intervention planning plus reduced quantum study
- `service_qaoa.py`
  - Lightweight analytic QAOA-style routines for reduced subproblems
- `service_benchmarks.py`
  - Benchmark orchestration, availability detection, degraded-mode handling
- `service_reports.py`
  - Report assembly and markdown export payload generation
- `service_integrations.py`
  - qBraid / Qiskit / IBM / simulator capability detection
- `service_bootstrap.py`
  - Seeded wildfire scenarios for first launch
- `route_*.py`
  - FastAPI route modules mapped to product areas

## Honesty rules implemented here

- No fake hardware availability
- No fake qBraid benchmark results
- If `qbraid` or `qiskit` is missing, benchmark runs are stored as degraded and explicitly say why
- If IBM credentials are missing, the platform remains usable in simulator-only mode
- Optimization labels full-scale classical versus reduced quantum study scope separately

## API surface

Core product endpoints:

- `POST /api/scenarios`
- `GET /api/scenarios`
- `GET /api/scenarios/{id}`
- `PATCH /api/scenarios/{id}`
- `DELETE /api/scenarios/{id}`
- `POST /api/risk/run`
- `GET /api/risk/runs/{id}`
- `POST /api/forecast/run`
- `GET /api/forecast/runs/{id}`
- `POST /api/optimize/run`
- `GET /api/optimize/runs/{id}`
- `POST /api/benchmarks/run`
- `GET /api/benchmarks`
- `GET /api/benchmarks/{id}`
- `POST /api/reports/generate`
- `GET /api/reports`
- `GET /api/reports/{id}`
- `GET /api/integrations/status`
- `GET /api/overview`
- `GET /api/health`

## Environment variables

Optional:

- `QUANTUMPROJ_DB_PATH`
  - Override the SQLite file location
- `QBRAID_API_KEY`
  - Enables qBraid account-backed capability detection
- `QISKIT_IBM_TOKEN`
  - Enables IBM Quantum hardware-ready status
- `QISKIT_IBM_CHANNEL`
  - Optional IBM channel metadata
- `QISKIT_IBM_INSTANCE`
  - Optional IBM instance metadata

Current local behavior without extra setup:

- Backend launches successfully
- Seeded wildfire scenarios are created on first run
- Benchmarks remain degraded because `qbraid` and `qiskit` are not installed in this environment

## Launch guide

From `Backend/`:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If you need to install dependencies first:

```powershell
python -m pip install -r requirements.txt
```

Health check:

```powershell
curl http://127.0.0.1:8000/api/health
```

## Tests

From the repository root:

```powershell
pytest Backend/test_api.py
```

Current verification status:

- `pytest Backend/test_api.py` passes

## Future extension points

- Replace SQLite with PostgreSQL by swapping the SQLAlchemy database URL
- Move analytic benchmark placeholders to real qBraid + Qiskit execution once those packages are installed
- Add async job execution if runs become long-lived
- Add authenticated user/workspace ownership to the scenario and report models
