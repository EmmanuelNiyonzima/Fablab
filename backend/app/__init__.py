"""FabLab Finance Flask application factory."""

from flask import Flask, jsonify

from app.api.auth import auth_bp
from app.api.health import health_bp
from app.config import Config
from app.extensions import cors, db, jwt, migrate


def create_app(config_object: type[Config] | None = None) -> Flask:
    """Create and configure the Flask API application."""
    if config_object is None:
        Config.validate()

    app = Flask(__name__)
    app.config.from_object(config_object or Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=False,
    )

    # Import model modules so Alembic can discover SQLAlchemy metadata.
    from app import models  # noqa: F401

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")

    @app.get("/api/v1")
    def api_index():
        return jsonify({"service": "fablab-finance-api", "version": "v1"})

    return app
