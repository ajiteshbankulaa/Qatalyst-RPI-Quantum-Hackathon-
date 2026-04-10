from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import BenchmarkRun, ForecastRun, OptimizationRun, Report, RiskRun
from app.schema_report import ReportGenerateRequest, ReportResponse
from app.service_reports import create_report, latest_run
from app.service_scenarios import get_scenario_or_404

router = APIRouter(prefix="/reports", tags=["reports"])


def _serialize(report: Report) -> ReportResponse:
    return ReportResponse(
        id=report.id,
        scenario_id=report.scenario_id,
        title=report.title,
        status=report.status,
        sections=report.sections_json,
        export=report.export_json,
        created_at=report.created_at.isoformat(),
    )


@router.post("/generate", response_model=ReportResponse)
def generate_report_endpoint(payload: ReportGenerateRequest, db: Session = Depends(get_db)):
    try:
        scenario = get_scenario_or_404(db, payload.scenario_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    risk_run = db.get(RiskRun, payload.risk_run_id) if payload.risk_run_id else latest_run(db, RiskRun, scenario.id)
    forecast_run = db.get(ForecastRun, payload.forecast_run_id) if payload.forecast_run_id else latest_run(db, ForecastRun, scenario.id)
    optimization_run = db.get(OptimizationRun, payload.optimization_run_id) if payload.optimization_run_id else latest_run(db, OptimizationRun, scenario.id)
    benchmark_run = db.get(BenchmarkRun, payload.benchmark_run_id) if payload.benchmark_run_id else latest_run(db, BenchmarkRun, scenario.id)
    return _serialize(create_report(db, scenario, payload.title, risk_run, forecast_run, optimization_run, benchmark_run))


@router.get("", response_model=list[ReportResponse])
def list_reports_endpoint(db: Session = Depends(get_db)):
    stmt = select(Report).order_by(desc(Report.created_at))
    return [_serialize(report) for report in db.scalars(stmt)]


@router.get("/{report_id}", response_model=ReportResponse)
def get_report_endpoint(report_id: str, db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return _serialize(report)
