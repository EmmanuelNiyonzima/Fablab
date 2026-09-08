"""Authentication routes for the API."""

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required

from app.extensions import db
from app.models.user import User


auth_bp = Blueprint("auth", __name__)


def _login_payload(user: User) -> dict:
    token = create_access_token(identity=user.id, additional_claims={"role": user.role})
    return {"success": True, "token": token, "user": user.to_dict()}


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = payload.get("password", "")

    if not email or not isinstance(password, str):
        return jsonify({"error": "Email and password are required."}), 400

    user = db.session.scalar(db.select(User).where(User.email == email))
    if user is None or user.status != "active" or not user.check_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    user.last_login = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(_login_payload(user))


@auth_bp.get("/me")
@jwt_required()
def me():
    user = db.session.get(User, get_jwt_identity())
    if user is None or user.status != "active":
        return jsonify({"error": "User not found or inactive."}), 401
    return jsonify({"user": user.to_dict(), "permissions": []})


@auth_bp.post("/logout")
@jwt_required()
def logout():
    # Access tokens are short-lived. Add a persistent token blocklist when refresh tokens are added.
    get_jwt()
    return jsonify({"success": True})
