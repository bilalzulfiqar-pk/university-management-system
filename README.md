# University Management System

Backend-first university management system built with FastAPI and PostgreSQL.

## Quick Start

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with `docker compose up -d db`.
3. Install dependencies.
4. Run Alembic migrations.
5. Seed the initial admin account with `seed-admin`.
6. Start the app with `uvicorn app.main:app --reload`.

