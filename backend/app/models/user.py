"""Identity and role models for the FabLab finance API."""

from datetime import datetime, timezone
from enum import StrEnum
from uuid import uuid4

from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


class Role(StrEnum):
    ADMIN = "ADMIN"
    FINANCE_MANAGER = "FINANCE_MANAGER"
    FINANCIAL_ANALYST = "FINANCIAL_ANALYST"
    ACCOUNTANT = "ACCOUNTANT"
    VIEWER = "VIEWER"
    AUDITOR = "AUDITOR"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(32), nullable=False, default=Role.VIEWER.value)
    department = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(32), nullable=False, default="active")
    last_login = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict[str, str | None]:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "status": self.status,
        }
