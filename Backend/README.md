# QuantumProj Backend

FastAPI backend for the QuantumProj MVP. This service owns persisted scenarios, risk runs, propagation forecasts, intervention optimization runs, compiler-aware benchmark records, reports, and integration capability state.

## What it does

- Stores wildfire-first 10x10 spatial scenarios in SQLite
- Runs a real classical-vs-QML wildfire ignition classification study on the same scenario-derived dataset
- Simulates propagation forecasts with time steps, dryness, wind direction, and spread sensitivity
- Produces intervention plans with:
  - full-grid classical planning on the 10x10 adjacency graph
  - strict K=10 intervention handling
  - reduced critical-subgraph quantum study
  - recommended deployable plan with before/after connectivity metrics
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
  - Monte Carlo dataset generation plus classical logistic regression and Qiskit variational quantum classification
- `services/forecast.py`
  - Grid spread simulation plus shift-kernel diagnostics
- `services/optimize.py`
  - Full-grid classical intervention planning plus reduced quantum study
- `algorithms/qaoa.py`
  - QAOA problem formulation, real Qiskit circuit construction, and simulator execution helpers
- `algorithms/shift.py`
  - low-depth shift diagnostics used by the forecast module
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

## Wildfire optimization note

The optimization engine is now explicitly challenge-aligned:

- The deployable plan is built on the full 10x10 grid.
- Spread pathways are defined by orthogonal adjacency between flammable dry-brush cells.
- The enforced deployment budget is `K=10`.
- Better plans are the ones that break more adjacency links, shrink the largest flammable cluster, and reduce ignition-connected spread corridors.

This is split honestly across execution scales:

- Full-scale planning stays classical so the entire hillside can be optimized.
- The quantum study first shortlists the highest-impact cells and then runs on a smaller critical candidate subset derived from the same adjacency-based objective.
- The final result compares the classical full-grid plan to a quantum-informed variant instead of pretending a full 100-qubit NISQ solve is currently practical.

## Risk modeling note

The risk engine now answers the Classical ML vs Quantum ML challenge more directly:

- Binary task:
  - predict whether a cell ignites within the early response window
- Dataset:
  - generated from repeated spread simulations over reproducible scenario variants derived from the selected hillside
- Shared feature set:
  - `state_risk`
  - `ignition_pressure`
  - `distance_risk`
  - `environmental_force`
- Models compared:
  - classical logistic regression via scikit-learn
  - shallow Qiskit variational quantum classifier
  - optional hybrid probability ensemble
- Metrics collected:
  - accuracy
  - precision
  - recall
  - F1
  - runtime

This stays honest: the QML model is a real comparator on the same binary task, but it is not forced to beat the classical baseline.

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

- `qbraid`, `qiskit`, `qiskit-aer`, and `qiskit-qasm3-import` installed
- benchmark engine builds a real Qiskit QAOA workload
- qBraid is used as the conversion and normalization layer in the compile workflow
- two qBraid-centered compilation strategies are compared with real compiled metrics

### IBM-ready

- `QISKIT_IBM_TOKEN` plus a valid instance / CRN when needed
- IBM readiness is surfaced honestly in integrations
- benchmark runs can include real IBM Runtime execution when credentials are valid

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

- `pytest Backend/test_api.py Backend/test_services.py` passes
- local imports verified for:
  - `qbraid`
  - `qiskit`
  - `qiskit-aer`
  - `qiskit-ibm-runtime`
  - `qiskit-qasm3-import`

## Direct benchmark script

For a UI-free benchmark run:

```powershell
cd Backend
python scripts/run_benchmark.py
```

Add `ibm_hardware` to the environment list when IBM Runtime is configured and available.

## Benchmark implementation note

The benchmark engine now answers the qBraid challenge requirements directly:

- Algorithm:
  - reduced-subgraph wildfire intervention QAOA
- Source representation:
  - `qiskit.QuantumCircuit`
- qBraid usage:
  - `ConversionGraph` to expose conversion paths
  - `qbraid.transpile(..., "qasm2")`
  - `qbraid.transpile(..., "qasm3")`
  - qBraid round-trip normalization back into Qiskit before target preparation
- Strategies compared:
  - `Portable OpenQASM 2 bridge`
    - generic line-topology CX preparation
  - `Target-aware OpenQASM 3 bridge`
    - heavy-hex-like constrained preparation with ECR-style basis
- Execution environments:
  - ideal simulator
  - noisy simulator
  - IBM Runtime hardware when credentials are valid
- Metrics collected:
  - approximation ratio
  - success probability
  - expected cost
  - depth
  - two-qubit gate count
  - width
  - total gate count
  - shots
  - gate breakdown

The benchmark summary now produces a direct conclusion string that compares quality preservation against compiled cost instead of reporting raw transpilation numbers only.

## Future extension points

- Replace SQLite with PostgreSQL by swapping the SQLAlchemy database URL
- Add async job execution if runs become long-lived
- Add authenticated user/workspace ownership to the scenario and report models
