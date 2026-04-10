from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    app_name: str = "QuantumProj API"
    api_prefix: str = "/api"
    sqlite_path: str = os.getenv(
        "QUANTUMPROJ_DB_PATH",
        str(Path(__file__).resolve().parents[2] / "quantumproj.db"),
    )
    cors_origins: tuple[str, ...] = (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    )

    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.sqlite_path}"


settings = Settings()
