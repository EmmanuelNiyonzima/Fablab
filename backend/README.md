# FabLab Flask API — Phase 1

This directory contains the new Flask backend foundation. It is intentionally independent from the existing React/Vite frontend so the API can be developed and deployed separately.

## Local setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
# Set DATABASE_URL and a random JWT_SECRET_KEY in .env.
flask --app wsgi:app db init
flask --app wsgi:app db migrate -m "create users"
flask --app wsgi:app db upgrade
flask --app wsgi:app run --debug
```

Run automated tests with:

```bash
pytest
```

## Phase 1 scope

- Application factory and environment-only configuration.
- PostgreSQL-ready SQLAlchemy and Alembic migration integration.
- CORS restricted to configured frontend origins.
- Secure password-hash authentication, JWT identity, and role decorator.
- Health check and authentication endpoints.

No user is auto-provisioned, and no development password or database credential is embedded in the source code.
