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

The backend is now organized under `Backend/app/` with package folders for routes, schemas, and services.

- `main.py`
  - FastAPI app creation, CORS, route registration, startup bootstrap
- `db.py`
  - SQLAlchemy engine, session factory, dependency injection helper
- `models.py`
  - ORM models for `Scenario`, `RiskRun`, `ForecastRun`, `OptimizationRun`, `BenchmarkRun`, `Report`, and `IntegrationStatus`
- `schemas/*.py`
  - Pydantic request/response contracts per module
- `services/scenarios.py`
  - Scenario CRUD and version bumps
- `services/risk.py`
  - Classical and analytic quantum-style scoring over shared features
- `services/forecast.py`
  - Grid spread simulation plus shift-kernel diagnostics
- `services/optimize.py`
  - Full-grid classical intervention planning plus reduced quantum study
- `services/qaoa.py`
  - QAOA problem formulation, real Qiskit circuit construction, and simulator execution helpers
- `services/benchmarks.py`
  - qBraid-centered benchmark orchestration, compilation strategy comparison, and execution metric collection
- `services/reports.py`
  - Report assembly and markdown export payload generation
- `services/integrations.py`
  - qBraid / Qiskit / IBM / simulator capability detection
- `services/bootstrap.py`
  - Seeded wildfire scenarios for first launch
- `routes/*.py`
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

Backend variable names are standardized to:

- `QUANTUMPROJ_DB_PATH`
- `QBRAID_API_KEY`
- `QISKIT_IBM_TOKEN`
- `QISKIT_IBM_INSTANCE`
- `CORS_ORIGINS`

Use [`.env.example`](/c:/Users/ajite/OneDrive/Desktop/QuantumProject!/Backend/.env.example) as the canonical backend template.

## Runtime modes

### Simulator-only

- no IBM credentials, invalid IBM credentials, or no hardware connectivity
- ideal and noisy simulator execution remains available
- benchmark runs still execute when the local SDK stack is installed

### qBraid-ready

- `qbraid`, `qiskit`, and `qiskit-aer` installed
- benchmark engine builds a real Qiskit QAOA workload
- qBraid is used as the conversion bridge in the compile workflow
- two compilation strategies are compared with real compiled metrics

### IBM-ready

- `QISKIT_IBM_TOKEN` plus a valid instance / CRN when needed
- IBM readiness is surfaced honestly in integrations
- the current benchmark MVP still prioritizes simulator execution while IBM connectivity is treated as an available extension path

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
- local imports verified for:
  - `qbraid`
  - `qiskit`
  - `qiskit-aer`
  - `qiskit-ibm-runtime`

## Benchmark implementation note

The benchmark engine now uses real quantum code:

- builds a reduced intervention-planning QAOA circuit in Qiskit
- uses qBraid as the circuit conversion bridge through OpenQASM 2
- compares two strategies:
  - qBraid bridge + Qiskit optimization level 1
  - qBraid bridge + Qiskit optimization level 3
- records real:
  - depth
  - two-qubit gate count
  - width
  - shots
  - gate breakdown
  - approximation ratio
  - success probability

## Future extension points

- Replace SQLite with PostgreSQL by swapping the SQLAlchemy database URL
- Add optional IBM-backed benchmark execution once runtime access is validated end to end
- Add async job execution if runs become long-lived
- Add authenticated user/workspace ownership to the scenario and report models
