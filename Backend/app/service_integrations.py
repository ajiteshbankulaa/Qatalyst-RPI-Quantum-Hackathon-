from __future__ import annotations

import importlib.util
import os

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import IntegrationStatus


def _module_available(name: str) -> bool:
    return importlib.util.find_spec(name) is not None


def collect_provider_statuses() -> list[dict]:
    qbraid_installed = _module_available("qbraid")
    qiskit_installed = _module_available("qiskit")
    qbraid_api_key = bool(os.getenv("QBRAID_API_KEY"))
    ibm_token = bool(os.getenv("QISKIT_IBM_TOKEN"))
    ibm_channel = os.getenv("QISKIT_IBM_CHANNEL")
    ibm_instance = os.getenv("QISKIT_IBM_INSTANCE")

    return [
        {
            "provider": "qbraid",
            "available": qbraid_installed,
            "mode": "ready" if qbraid_installed and qbraid_api_key else "sdk_only" if qbraid_installed else "missing",
            "details": {
                "sdk_installed": qbraid_installed,
                "api_key_configured": qbraid_api_key,
                "note": "Compiler-aware benchmarking depends on qBraid conversion/transpilation tooling.",
            },
        },
        {
            "provider": "qiskit",
            "available": qiskit_installed,
            "mode": "ready" if qiskit_installed else "missing",
            "details": {
                "sdk_installed": qiskit_installed,
                "role": "Primary source framework for benchmark workloads when available.",
            },
        },
        {
            "provider": "ibm_quantum",
            "available": bool(qiskit_installed and ibm_token),
            "mode": "hardware_ready" if qiskit_installed and ibm_token else "simulator_only",
            "details": {
                "token_configured": ibm_token,
                "channel": ibm_channel or "not_configured",
                "instance": ibm_instance or "not_configured",
            },
        },
        {
            "provider": "local_simulators",
            "available": True,
            "mode": "ready",
            "details": {
                "ideal_simulator": True,
                "noisy_simulator": True,
                "noise_model": "analytical_nisq_penalty",
            },
        },
    ]


def sync_integration_statuses(db: Session) -> list[IntegrationStatus]:
    records: list[IntegrationStatus] = []
    for item in collect_provider_statuses():
        existing = db.scalar(select(IntegrationStatus).where(IntegrationStatus.provider == item["provider"]))
        if existing is None:
            existing = IntegrationStatus(
                provider=item["provider"],
                available=item["available"],
                mode=item["mode"],
                details_json=item["details"],
            )
            db.add(existing)
        else:
            existing.available = item["available"]
            existing.mode = item["mode"]
            existing.details_json = item["details"]
        records.append(existing)
    db.commit()
    for record in records:
        db.refresh(record)
    return records
