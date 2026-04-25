# University Management System

Secure full-stack University Management System built with FastAPI, PostgreSQL, React, and TypeScript.

This project started as a backend-first internship practice system and evolved into a more complete academic operations platform with:

- secure cookie-based session authentication
- role-based admin, teacher, and student workspaces
- realistic course-offering based academic workflows
- production-style security hardening
- automated testing and security verification

It demonstrates:
- API design with FastAPI
- relational data modeling with PostgreSQL
- authentication and role-based authorization
- secure cookie-backed session handling, CSRF protection, and rate limiting
- migrations with Alembic
- automated testing
- production-style backend and frontend structure

## Project Highlights

- Full-stack role-based dashboard for `ADMIN`, `TEACHER`, and `STUDENT`
- Course offerings modeled as the real operational unit for assignment and enrollment
- Cookie-based access + refresh session architecture with CSRF and trusted-origin enforcement
- Optional TOTP / Google Authenticator two-factor authentication
- Redis-backed rate limiting and token/session security in the hardened profile
- Admin audit history with structured, UI-friendly event descriptions
- Pakistan-focused seeded demo data with HEC-inspired BSCS / BSSE / BSIT sample records

## Core Features

- Admin, teacher, and student roles
- short-lived access cookies plus refresh-session rotation
- Argon2 password hashing
- optional TOTP / Google Authenticator two-factor authentication
- forced first-login password change for teacher and student accounts
- departments, students, teachers, courses, and course offerings
- teacher assignment to course offerings
- student enrollment into course offerings
- student self-service profile and enrolled offerings
- teacher self-service profile, assigned offerings, and offering rosters
- soft delete, restore, and restricted hard delete for students and teachers
- structured error responses
- request logging with request IDs
- general API rate limiting plus auth-specific rate limiting
- CSRF and trusted-origin validation on mutating cookie-authenticated routes
- Redis-backed rate limiting and token/session security in production
- admin audit history with structured action metadata
- frontend dashboard in React + Vite + TypeScript
- OpenAPI/Swagger docs
- automated test suite

## Tech Stack

- Python 3.11+
- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- Redis
- Alembic
- Pydantic Settings
- PyJWT
- Argon2
- Pytest
- Docker Compose for local PostgreSQL and Redis
- React
- Vite
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form + Zod

## Project Structure

```text
university-management-system/
  app/
    api/
      deps.py
      v1/
        admin.py
        auth.py
        me.py
        router.py
    core/
      audit.py
      config.py
      constants.py
      error_handlers.py
      exceptions.py
      logging.py
      middleware.py
      rate_limit.py
      security.py
    db/
      base.py
      session.py
    models/
    schemas/
    scripts/
      seed_admin.py
    services/
    main.py
  alembic/
    versions/
  frontend/
    src/
      app/
      components/
      features/
      lib/
      styles/
  tests/
  .env.example
  docker-compose.yml
  pyproject.toml
  README.md
```

## Domain Model

Main entities:
- `users`
- `auth_sessions`
- `departments`
- `students`
- `teachers`
- `courses`
- `course_offerings`
- `course_offering_teachers`
- `enrollments`
- `admin_audit_logs`

Important modeling decision:
- students and teachers are assigned to `course_offerings`, not directly to `courses`
- this allows the same course to be offered in different terms/years/sections

## Roles And Access

`ADMIN`
- can manage departments, students, teachers, courses, and course offerings
- can assign teachers and enroll students
- can view audit logs

`TEACHER`
- can view own profile
- can view own assigned course offerings
- can view students enrolled in own assigned offerings

`STUDENT`
- can view own profile
- can view own enrolled course offerings

## Authentication And Security

- login creates a cookie-backed session instead of returning a bearer token to the SPA
- access JWTs are short-lived and stored in an `HttpOnly` access cookie
- refresh sessions are stored in `auth_sessions` and rotated through a longer-lived `HttpOnly` refresh cookie
- passwords are hashed with Argon2
- student and teacher accounts are created by admin with a temporary password
- teacher and student must change password on first login
- `token_version` invalidates all older access tokens after logout/password change style events
- logout revokes the current refresh session and deny-lists the current access-token `jti`
- login is rate-limited by IP and by IP+email
- change-password has a dedicated per-user limiter
- refresh has its own limiter and refresh-token reuse revokes the current session
- users can enable or disable Google Authenticator compatible TOTP from the security page
- all mutating cookie-authenticated API routes require a matching `X-CSRF-Token` header and a trusted `Origin`
- all `/api/v1` routes use general read/write rate limiting except login, which uses dedicated login limiters
- admin write actions are stored in `admin_audit_logs`
- production startup fails fast on unsafe defaults such as placeholder secrets, missing Redis, or docs exposed in production

## Rate Limiting Summary

`POST /api/v1/auth/login`
- login IP-only limiter
- login IP+email limiter

`POST /api/v1/auth/change-password`
- general middleware write limiter
- dedicated per-user change-password limiter

`POST /api/v1/auth/refresh`
- general middleware write limiter
- dedicated refresh limiter

Other `GET /api/v1/...`
- general middleware read limiter

Other `POST/PATCH/DELETE /api/v1/...`
- general middleware write limiter

## API Base URL

All API routes are grouped under:

```text
/api/v1
```

Examples:
- `/api/v1/auth/login`
- `/api/v1/admin/students`
- `/api/v1/me/student`

## Environment Setup

1. Copy the example file:

```powershell
Copy-Item .env.example .env
```

2. Review the important values in `.env`:
- `DATABASE_URL`
- `REDIS_URL`
- `SECRET_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CORS_ORIGINS`
- `TRUSTED_ORIGINS`
- cookie and rate-limit settings if needed

### Important Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by the backend | `postgresql+psycopg://postgres:postgres@localhost:5432/university_management` |
| `REDIS_URL` | Redis connection string for rate limiting and token/session security | `redis://127.0.0.1:6379/0` |
| `SECRET_KEY` | Random secret used for signing tokens and security-sensitive values | `change-me-to-a-long-random-secret-key-at-least-32-chars` |
| `JWT_ISSUER` | JWT issuer claim | `ums-api` |
| `JWT_AUDIENCE` | JWT audience claim | `ums-spa` |
| `ADMIN_EMAIL` | Seeded initial admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | Seeded initial admin password | `ChangeMe123!` |
| `CORS_ORIGINS` | Allowed frontend origins for browser access | `http://localhost:5173,http://127.0.0.1:5173` |
| `TRUSTED_ORIGINS` | Trusted origins for mutating cookie-authenticated requests | `http://localhost:5173,http://127.0.0.1:5173` |
| `COOKIE_SAME_SITE` | SameSite policy for auth cookies | `lax` |
| `COOKIE_SECURE` | Whether auth cookies require HTTPS | `false` for local development |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access-cookie lifetime in minutes | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh-session lifetime in days | `7` |

Other values in `.env.example` cover:

- cookie names and cookie path/domain
- login, refresh, read, write, and CSRF-failure rate limits
- app environment flags such as `ENVIRONMENT`, `DEBUG`, and `SHOW_DOCS`

Example defaults:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

## Installation

Recommended setup with a virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
```

## Run Locally

Start PostgreSQL:

```powershell
docker compose up -d db redis
```

Apply migrations:

```powershell
alembic upgrade head
```

Seed the initial admin:

```powershell
seed-admin
```

Start the FastAPI app:

```powershell
uvicorn app.main:app --reload
```

Start the frontend app in a second terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Useful URLs:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Frontend app: [http://127.0.0.1:5173](http://127.0.0.1:5173)

Stop local PostgreSQL:

```powershell
docker compose down
```

## Database Migrations

Create a new migration after schema changes:

```powershell
alembic revision -m "describe change"
```

Upgrade to latest migration:

```powershell
alembic upgrade head
```

Downgrade one step:

```powershell
alembic downgrade -1
```

## Seed Command

The project includes two seed commands:

- `seed-admin` creates the first admin user if it does not already exist
- `seed-demo-data` loads a Pakistan-focused demo dataset with BS Computer Science, BS Software Engineering, and BS Information Technology sample data

Admin command:

```powershell
seed-admin
```

Demo data command:

```powershell
seed-demo-data --reset
```

What `seed-admin` does:
- reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment
- creates an admin user if missing
- stores the password as an Argon2 hash

What `seed-demo-data --reset` does:
- clears existing non-admin academic data and audit logs
- seeds HEC-aligned demo departments, courses, offerings, teachers, students, assignments, and enrollments
- uses a shared temporary password for seeded teacher/student accounts

## Testing

Run the automated test suite:

```powershell
pytest -q
```

Run the security verification script:

```powershell
security-check
```

Run frontend lint and production build:

```powershell
Set-Location frontend
npm run lint
npm run build
```

Current tests cover:
- admin login
- invalid login rejection
- first-login password change flow
- refresh rotation and refresh-token reuse revocation
- logout/password token invalidation behavior
- role-based access control
- CSRF and trusted-origin enforcement on authenticated writes
- duplicate assignment and enrollment protection
- soft delete, restore, and restricted hard delete
- audit log capture
- rate limiting behavior

## Manual Testing Flow

Recommended order:

1. Login as admin
2. Create department
3. Create course
4. Create course offering
5. Create teacher
6. Create student
7. Assign teacher to offering
8. Enroll student into offering
9. Login as teacher and change password
10. Verify teacher can view own offerings and roster
11. Login as student and change password
12. Verify student can view own profile and offerings
13. Verify forbidden access for teacher/student on admin routes
14. Verify audit logs

## Swagger Testing Notes

The API now uses secure cookies instead of bearer tokens in the SPA flow.

What works well in Swagger:
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- other same-origin `GET` requests after login

For mutating requests in Swagger/Postman:
- send the `X-CSRF-Token` header with the value of the `ums_csrf` cookie
- keep the request `Origin` trusted

For day-to-day testing, the frontend app or Postman is usually more convenient than Swagger for the authenticated write flow.

## Postman Testing Notes

Suggested collection order:
- admin login
- auth me
- create department
- create course
- create offering
- create teacher
- create student
- assign teacher
- enroll student
- teacher login and password change
- teacher self-service endpoints
- student login and password change
- student self-service endpoints
- audit logs

## Audit History

Admin write actions are stored with both technical and UI-friendly fields.

Example:

```json
{
  "action": "CREATE_STUDENT",
  "entity_type": "student",
  "entity_id": 7,
  "entity_label": "Bilal Khan (ST-001)",
  "description": "Admin created student Bilal Khan (ST-001)."
}
```

This allows the frontend to display readable history without guessing from route paths.

## Frontend Overview

The frontend lives in `frontend/` and currently includes:
- login and forced change-password flow
- role-aware routing and route guards
- admin dashboard plus CRUD pages for departments, students, teachers, courses, and course offerings
- offering detail page with assignment and enrollment actions
- teacher dashboard, profile, offerings, and roster screens
- student dashboard, profile, and enrollment screens
- audit log timeline using backend `description`

Frontend auth behavior:
- bootstraps current user from `GET /api/v1/auth/me`
- uses `credentials: "include"` with the backend's cookie session model
- automatically refreshes expired access sessions through `POST /api/v1/auth/refresh`
- attaches `X-CSRF-Token` automatically on mutating requests
- never stores auth tokens in localStorage
- supports optional Google Authenticator login by prompting for the 6-digit code only when the backend requires it
- redirects users by role after login
- forces `must_change_password` users to `/change-password`
- includes a shared `/security` page where users can set up or disable TOTP with a QR code
- uses a Vite proxy by default so local API calls work against `http://127.0.0.1:8000`

## Important Defaults

- backend-first MVP
- single campus only
- cookie-backed access + refresh session auth for the SPA
- CSRF is required for mutating authenticated requests
- Redis is required for the hardened production profile and optional in local development
- no attendance, grades, uploads, or notifications in MVP
- course offerings use allowed terms: `SPRING`, `SUMMER`, `FALL`

## Demo Scenario

1. Admin logs in
2. Admin creates department, course, offering, teacher, and student
3. Admin assigns teacher and enrolls student
4. Teacher logs in, changes password, and views only assigned roster
5. Student logs in, changes password, and views only own offerings
6. Admin reviews audit history
7. Unauthorized route access is rejected

## Future Improvements

- richer audit log filtering and dashboard views
- stronger OpenAPI examples for every endpoint
- broader edge-case test coverage
- recovery codes and expanded account-security controls
