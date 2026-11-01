# University Management System (UMS)

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=0A0A0A)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-23%2F23%20Passing-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)
![Security](https://img.shields.io/badge/Security-Hardened%20%7C%202FA%20%7C%20CSRF-blue?style=for-the-badge&logo=shield&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

<p align="center">
  <strong>An enterprise-grade, security-hardened academic operations platform built with FastAPI, PostgreSQL 16, Redis 7, React 19, and TypeScript.</strong>
</p>

<p align="center">
  <a href="#-live-showcase--demo-credentials">Demo Credentials</a> •
  <a href="#-system-architecture--security-model">Security Model</a> •
  <a href="#-feature-matrix">Feature Matrix</a> •
  <a href="#-quickstart--local-setup">Quickstart</a> •
  <a href="#-responsive-multi-screen-design">Responsive UI</a> •
  <a href="#-testing--verification">Verification</a>
</p>

</div>

---

## 🌟 Executive Overview

The **University Management System (UMS)** is a production-ready, full-stack academic operations platform modeled on realistic higher-education requirements. Moving beyond conventional CRUD tutorials, UMS models **Course Offerings** as the central operational entity—allowing courses to have multiple term-specific, section-controlled, and capacity-constrained instances taught by designated faculty and enrolled by students.

The application is engineered with a strict **security-first philosophy**:
- **HttpOnly Cookie Sessions:** Zero storage of JWT tokens in browser `localStorage` or `sessionStorage`.
- **Stateful Double-Submit CSRF:** Cryptographically verified CSRF cookies matched against `X-CSRF-Token` headers and PostgreSQL session secrets.
- **Refresh Token Rotation (RTR):** Automatic single-use refresh token rotation with family revocation on reuse attempts.
- **Time-based One-Time Passwords (TOTP):** In-app 2FA setup with real-time SVG QR code generation (Google Authenticator / 1Password compatible).
- **Strict Role-Based Access Control (RBAC):** Three distinct role workspaces (`ADMIN`, `TEACHER`, `STUDENT`) with server-enforced route guards and forced temporary credential quarantine.
- **Adaptive Multi-Screen UX:** Responsive design audited across Mobile (`375px`), Tablet (`768px`), Laptop (`1280px`), and Widescreen (`1920px`) with zero document overflow.

---

## 🔑 Live Showcase & Demo Credentials

When running the application locally (`http://localhost:5173`), you can test every persona using pre-seeded, HEC-aligned demo accounts:

| Role | Email | Password | Landing Workspace | Capabilities Demonstrated |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `ChangeMe123!` | `/admin/dashboard` | Full university administration: CRUD, relational deletion blocks, capacity ceilings, audit logs, and 2FA. |
| **Teacher** | `ahmed.raza.bscs@example.com` | `Welcome123!` | `/teacher/dashboard` | Assigned faculty portal: view assigned offerings, browse section rosters, update profile, strict RBAC isolation. |
| **Student** | `abdullah.khan.bscs@example.com` | `Welcome123!` | `/student/dashboard` | Enrolled student portal: view current term schedule, enrolled course sections, profile self-service. |
| **Quarantine Demo** | `areeba.raza.bscs@example.com` | `Welcome123!` | `/change-password` | **Forced First-Login Quarantine:** Temporary credentials immediately lock all routes and force a password update. |

### Application Endpoints:
- **Frontend Web Application:** [http://localhost:5173](http://localhost:5173)
- **FastAPI OpenAPI Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Technical Specification:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check Probe:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 🛡️ System Architecture & Security Model

```
 ─────────────────────────────────────────────────────────────────────────────
                          UMS SECURITY ARCHITECTURE
 ─────────────────────────────────────────────────────────────────────────────

   [ Browser Client (React 19 SPA) ]
             │
             │  1. Credentials + Origin Header
             ▼
   [ FastAPI Security Gateway ]
             │
             ├──► [ Argon2id Password Verification ]
             ├──► [ Optional TOTP 2FA Verification (PyOTP) ]
             │
             │  2. Issue Stateful Session
             ▼
   [ Cookie & Session Engine ]
             ├──► Set Cookie: `ums_access`  (HttpOnly, Secure, SameSite=Lax, 15m)
             ├──► Set Cookie: `ums_refresh` (HttpOnly, Secure, SameSite=Lax, 7d)
             ├──► Set Cookie: `ums_csrf`    (Readable, Secure, SameSite=Lax)
             └──► PostgreSQL `auth_sessions`: Record Session ID + CSRF Secret
             │
             │  3. Mutating API Requests (POST / PATCH / DELETE)
             ▼
   [ Security Middleware Pipeline ]
             ├──► Origin Verification (Matches TRUSTED_ORIGINS)
             ├──► Fixed-Window Rate Limiting (Redis 7)
             ├──► Double-Submit CSRF Check (ums_csrf cookie == X-CSRF-Token header == db.csrf_secret)
             └──► Token Version Denylist Check (db.users.token_version)
             │
             ▼
   [ Protected Academic Business Logic ]
 ─────────────────────────────────────────────────────────────────────────────
```

### Security Defenses Implemented:
1. **Zero-localStorage Token Architecture:** Tokens are never exposed to JavaScript storage APIs, eliminating token exfiltration via Cross-Site Scripting (XSS).
2. **Double-Submit CSRF Defense:** Every mutating request (`POST`, `PATCH`, `DELETE`) requires the client to extract the `ums_csrf` cookie value and submit it via the `X-CSRF-Token` header. The backend validates that both match and correspond to the active `AuthSession.csrf_secret`.
3. **Session Revocation & Token Versioning:** Global password changes and logouts increment `User.token_version`, immediately invalidating all outstanding access tokens across all devices.
4. **Refresh Token Rotation (RTR):** Refreshing an access token revokes the old refresh token and issues a new pair. If a revoked refresh token is re-submitted, the entire session family is instantly destroyed.
5. **Multi-Tier Rate Limiting:** Redis-backed fixed-window limiters safeguard endpoints against abuse:
   - Login IP Rate Limit: 20 attempts / min
   - Login Account Rate Limit: 5 attempts / min
   - Password Change Rate Limit: 5 attempts / min
   - General API Write Limit: 120 requests / min

---

## 🚀 Feature Matrix

### 1. Administrative Controls (`/admin`)
- **Department Management:** Create, search, filter, edit, and soft-delete academic departments. Protected by relational deletion guards that prevent archiving departments with active students, teachers, or courses.
- **Course Catalog:** Standardized curriculum courses (HEC-aligned: BSCS, BSSE, BSIT) with credit hours and code validation (`NAME_PATTERN`, `CODE_PATTERN`).
- **Course Offering Operations:** Real operational sections tied to terms (`SPRING`, `SUMMER`, `FALL`), year, and section identifier.
  - Faculty Assignment: Map instructors to sections.
  - Student Enrollment: Enroll students with immediate duplicate protection.
  - Capacity Ceilings: Enforce physical class capacity limits (`OFFERING_FULL` conflict rejection).
- **Directory Lifecycle:** Provision students and faculty with temporary credentials, perform soft deletes (`DELETE`), inspect archives, restore records (`POST .../restore`), and execute guarded hard deletes (`DELETE .../hard`).
- **Structured Audit Trails:** Filterable administrative compliance history tracking exact actor, entity type, HTTP method, and human-readable event descriptions.

### 2. Teacher Portal (`/teacher`)
- **Dashboard Overview:** Real-time metrics displaying assigned courses and total enrolled students.
- **Assigned Course Sections:** List of term offerings currently assigned to the instructor.
- **Section Rosters:** Isolated roster view displaying enrolled students with names, roll numbers, emails, and current semesters.
- **Faculty Profile:** Self-service profile review with account security status.

### 3. Student Portal (`/student`)
- **Dashboard Overview:** Semester metrics, department affiliation, and enrolled credit summary.
- **My Enrollments:** Enrolled course offerings filtered to the authenticated student.
- **Section Details:** View course section information, term schedule, and assigned instructors.
- **Student Profile:** Self-service profile review.

### 4. Account Security & Credential Quarantine (`/security` & `/change-password`)
- **Quarantine Gate:** Forced first-login password rotation redirects any user with temporary credentials (`must_change_password=True`) to `/change-password` before granting access to protected routes.
- **TOTP Two-Factor Setup:** In-app setup with QR code display, secret key entry, code verification, and persistent session state.

---

## 📱 Responsive Multi-Screen Design

The frontend was built and verified to provide an optimal experience across four standardized device classes:

| Screen Class | Viewport Size | Primary Layout Behavior | Overflow Status |
| :--- | :--- | :--- | :--- |
| **Mobile** | `375 x 812` | Collapsible navigation drawer; data tables transform into stacked touch cards (`MobileRecordCard`); vertical modal action stacking. | **0 Overflows** |
| **Tablet** | `768 x 1024` | Sidebar drawer; responsive two-column grid layouts; contained horizontal scrolling tables (`overflow-x-auto rounded-xl`). | **0 Overflows** |
| **Laptop** | `1280 x 800` | Fixed collapsible sidebar; full data tables; multi-metric KPI hero grids. | **0 Overflows** |
| **Widescreen** | `1920 x 1080` | Max-width centered container (`max-w-[1440px]`); wide typography; full administrative audit tables. | **0 Overflows** |

---

## 💻 Tech Stack

### Backend Stack
- **Framework:** FastAPI 0.115 (Python 3.11 / 3.12)
- **Database:** PostgreSQL 16 (Synchronous SQLAlchemy 2.0.36)
- **Migrations:** Alembic 1.14.0
- **Cache & Rate Limiting:** Redis 7 (`redis-py`)
- **Security & Cryptography:** Argon2-cffi, PyJWT, PyOTP (TOTP 2FA)
- **Validation:** Pydantic 2.x Settings & Schemas
- **Testing:** Pytest, HTTPX, Coverage

### Frontend Stack
- **Framework:** React 19.2.5 + TypeScript 6.0.2
- **Build Tool:** Vite 4.5.14 (Per-route `React.lazy` code-splitting)
- **Styling:** Tailwind CSS 3.4.17 (Custom design token system)
- **Routing:** React Router DOM 7.14.2 (Data router with auth guards)
- **Server State:** TanStack Query v5.100.1
- **Forms & Validation:** React Hook Form 7.73.1 + Zod 4.3.6
- **Notifications & Icons:** Sonner toasts + Lucide-React

---

## 📂 Project Structure

```text
university-management-system/
├── alembic/                      # Database migrations
│   └── versions/                 # Versioned migration scripts (0001 to 0005)
├── app/                          # FastAPI Backend Application
│   ├── api/                      # Routing & dependencies
│   │   ├── deps.py               # Dependency injection (DB, Session, Role)
│   │   └── v1/                   # API v1 routes (admin, auth, me)
│   ├── core/                     # Core system configuration
│   │   ├── audit.py              # Audit logging context manager
│   │   ├── config.py             # Pydantic v2 application settings
│   │   ├── constants.py          # Enums (UserRole, AcademicTerm)
│   │   ├── cookies.py            # HttpOnly cookie helpers
│   │   ├── error_handlers.py     # JSON exception serialization handlers
│   │   ├── exceptions.py         # Custom application exceptions
│   │   ├── middleware.py         # Rate limiting, CSRF & request tracking
│   │   ├── rate_limit.py         # Redis fixed-window rate limiter
│   │   └── security.py           # Argon2 hashing & JWT utilities
│   ├── db/                       # Database engine and SessionLocal
│   ├── models/                   # SQLAlchemy ORM models
│   ├── schemas/                  # Pydantic request/response schemas
│   ├── scripts/                  # Administrative CLI scripts (seed_demo_data, seed_admin)
│   ├── services/                 # Business logic and domain services
│   └── main.py                   # Application entrypoint & middleware mounting
├── frontend/                     # React 19 + TypeScript SPA
│   ├── public/                   # Static assets, brand icons, favicon
│   ├── src/
│   │   ├── app/                  # App shell layouts, router & auth guards
│   │   ├── components/           # Reusable UI components (buttons, modals, tables)
│   │   ├── features/             # Domain modules (auth, dashboard, departments, etc.)
│   │   ├── lib/                  # API client, formatters, utilities, design tokens
│   │   └── styles/               # Tailwind CSS index stylesheet
│   ├── package.json              # Frontend dependencies and npm scripts
│   └── vite.config.ts            # Vite proxy & build configuration
├── tests/                        # Automated Pytest suite (23 suites)
├── docker-compose.yml            # PostgreSQL 16 & Redis 7 container services
├── pyproject.toml                # Python package metadata & dependencies
├── .env.example                  # Environment template
└── README.md                     # Comprehensive project documentation
```

---

## ⚡ Quickstart & Local Setup

### Prerequisites
- **Docker Desktop** (running)
- **Python 3.11+**
- **Node.js 18+** & npm

### 1. Clone the Repository & Configure Environment
```bash
git clone https://github.com/<your-username>/university-management-system.git
cd university-management-system

# Create environment configuration
cp .env.example .env
```

*Note on Redis Port:* If running on Windows with Hyper-V, Redis is mapped to host port `6300` in `docker-compose.yml` (`REDIS_URL=redis://127.0.0.1:6300/0`) to avoid dynamic socket reservation conflicts.

### 2. Start PostgreSQL & Redis Containers
```bash
docker compose up -d db redis
```

### 3. Setup Python Backend Environment
```bash
# Create and activate virtual environment
python -m venv .venv

# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux / macOS:
# source .venv/bin/activate

# Install dependencies in editable mode
pip install --upgrade pip
pip install -e ".[dev]"

# Apply database migrations
alembic upgrade head

# Seed clean HEC academic dataset & Admin user
python -m app.scripts.seed_demo_data --reset
python -m app.scripts.seed_admin

# Start FastAPI development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Setup React Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and log in as `admin@example.com` (`ChangeMe123!`).

---

## 🧪 Testing & Verification

The codebase includes comprehensive automated testing across backend contracts, static security scanning, frontend typechecking, and end-to-end user journeys:

### 1. Backend Unit & Integration Tests (23 Suites)
```bash
pytest -q
```
*Output: `23 passed in ~6.5s` covering authentication, refresh rotation, rate limiting, relational constraints, soft delete/restore, and audit logging.*

### 2. Static Security & Dependency Audit
```bash
python -m app.scripts.security_checks
```
*Executes `bandit -q -r app`, `pip-audit`, `npm run audit:runtime`, and scans the frontend codebase to verify zero `localStorage` token storage.*

### 3. Frontend TypeScript & Linter Verification
```bash
cd frontend
npm run check
```
*Executes ESLint and `tsc -b && vite build` verifying zero TypeScript or bundling errors.*

---

## 📄 License

This project is licensed under the terms of the [MIT License](LICENSE).
