from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db import Base, SessionLocal, engine
from app.route_benchmarks import router as benchmarks_router
from app.route_forecast import router as forecast_router
from app.route_integrations import router as integrations_router
from app.route_optimize import router as optimize_router
from app.route_overview import router as overview_router
from app.route_reports import router as reports_router
from app.route_risk import router as risk_router
from app.route_scenarios import router as scenarios_router
from app.service_bootstrap import seed_sample_data
from app.service_integrations import sync_integration_statuses


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_sample_data(db)
        sync_integration_statuses(db)

    prefix = settings.api_prefix
    app.include_router(overview_router, prefix=prefix)
    app.include_router(scenarios_router, prefix=prefix)
    app.include_router(risk_router, prefix=prefix)
    app.include_router(forecast_router, prefix=prefix)
    app.include_router(optimize_router, prefix=prefix)
    app.include_router(benchmarks_router, prefix=prefix)
    app.include_router(reports_router, prefix=prefix)
    app.include_router(integrations_router, prefix=prefix)
    return app


app = create_app()
