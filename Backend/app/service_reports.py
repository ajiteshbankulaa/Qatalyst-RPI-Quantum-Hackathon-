from __future__ import annotations

from datetime import datetime

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models import BenchmarkRun, ForecastRun, OptimizationRun, Report, RiskRun, Scenario


def latest_run(db: Session, model, scenario_id: str):
    stmt = select(model).where(model.scenario_id == scenario_id).order_by(desc(model.created_at)).limit(1)
    return db.scalar(stmt)


def create_report(
    db: Session,
    scenario: Scenario,
    title: str,
    risk_run: RiskRun | None,
    forecast_run: ForecastRun | None,
    optimization_run: OptimizationRun | None,
    benchmark_run: BenchmarkRun | None,
) -> Report:
    risk_summary = risk_run.summary_json if risk_run else {"recommended_mode": "Not run"}
    forecast_summary = forecast_run.summary_json if forecast_run else {"containment_outlook": "Not run"}
    optimization_summary = optimization_run.summary_json if optimization_run else {"recommended_mode": "Not run"}
    benchmark_summary = benchmark_run.summary_json if benchmark_run else {"recommendation": "No benchmark available"}

    executive_lines = [
        f"Scenario {scenario.name} is currently version {scenario.version}.",
        f"Risk modeling recommends {risk_summary.get('recommended_mode', 'no mode')} execution under present constraints.",
        f"Forecast outlook is {forecast_summary.get('containment_outlook', 'unknown')} with peak ignition pressure at {forecast_summary.get('peak_ignited_cells', 'n/a')} cells.",
        f"Optimization recommends {optimization_summary.get('recommended_mode', 'no mode')} planning with connectivity reduction of {optimization_summary.get('connectivity_reduction', 'n/a')}.",
        benchmark_summary.get("recommendation", "Compiler-aware benchmark not available."),
    ]

    methodology = [
        "Risk scores compare classical, quantum, and hybrid paths over the same scenario-derived spatial features.",
        "Propagation forecast uses discrete wildfire spread steps with wind, dryness, and sensitivity controls.",
        "Optimization combines full-grid classical screening with reduced critical-subgraph quantum study.",
        "Compiler-aware benchmarking is only reported when the local environment can execute qBraid-centered runs without fabricating metrics.",
    ]

    markdown = "\n".join(
        [
            f"# {title}",
            "",
            "## Executive summary",
            *[f"- {line}" for line in executive_lines],
            "",
            "## Methodology",
            *[f"- {line}" for line in methodology],
            "",
            "## Scenario details",
            f"- Domain: {scenario.domain}",
            f"- Description: {scenario.description or 'No description provided.'}",
            "",
        ]
    )

    report = Report(
        scenario_id=scenario.id,
        risk_run_id=risk_run.id if risk_run else None,
        forecast_run_id=forecast_run.id if forecast_run else None,
        optimization_run_id=optimization_run.id if optimization_run else None,
        benchmark_run_id=benchmark_run.id if benchmark_run else None,
        title=title,
        sections_json={
            "executive_summary": executive_lines,
            "methodology": methodology,
            "risk": risk_summary,
            "forecast": forecast_summary,
            "optimization": optimization_summary,
            "benchmark": benchmark_summary,
        },
        export_json={
            "format": "markdown",
            "content": markdown,
            "generated_at": datetime.utcnow().isoformat(),
            "filename": f"{scenario.name.lower().replace(' ', '-')}-report.md",
        },
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
