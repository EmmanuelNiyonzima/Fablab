from flask import Blueprint, jsonify
from sqlalchemy import text

from app.extensions import db


health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    """Return service health without exposing configuration or secrets."""
    db.session.execute(text("SELECT 1"))
    return jsonify({"status": "ok"})
