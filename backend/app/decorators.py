from collections.abc import Callable
from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required

from app.models.user import Role


def roles_required(*roles: Role) -> Callable:
    """Require an authenticated caller with one of the supplied roles."""

    allowed = {role.value for role in roles}

    def decorator(view: Callable) -> Callable:
        @wraps(view)
        @jwt_required()
        def wrapped(*args, **kwargs):
            if get_jwt().get("role") not in allowed:
                return jsonify({"error": "Forbidden."}), 403
            return view(*args, **kwargs)

        return wrapped

    return decorator
