from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schema_integration import IntegrationStatusResponse, IntegrationSummaryResponse
from app.service_integrations import sync_integration_statuses

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/status", response_model=IntegrationSummaryResponse)
def get_integration_status_endpoint(db: Session = Depends(get_db)):
    records = sync_integration_statuses(db)
    providers = [
        IntegrationStatusResponse(
            provider=record.provider,
            available=record.available,
            mode=record.mode,
            details=record.details_json,
            updated_at=record.updated_at.isoformat(),
        )
        for record in records
    ]
    hardware = next((item for item in providers if item.provider == "ibm_quantum"), None)
    qbraid = next((item for item in providers if item.provider == "qbraid"), None)
    return IntegrationSummaryResponse(
        simulator_only=not (hardware.available if hardware else False),
        hardware_available=hardware.available if hardware else False,
        qbraid_ready=bool(qbraid and qbraid.details.get("sdk_installed")),
        providers=providers,
    )
