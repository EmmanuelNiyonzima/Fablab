"""Environment-backed configuration for the Flask API."""

import os
from datetime import timedelta


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.environ.get("TOKEN_EXPIRES_MINUTES", "60"))
    )
    JSON_SORT_KEYS = False
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]

    @classmethod
    def validate(cls) -> None:
        if not cls.SQLALCHEMY_DATABASE_URI:
            raise RuntimeError("DATABASE_URL must be configured.")
        if not cls.JWT_SECRET_KEY or len(cls.JWT_SECRET_KEY) < 32:
            raise RuntimeError("JWT_SECRET_KEY must be at least 32 characters long.")
