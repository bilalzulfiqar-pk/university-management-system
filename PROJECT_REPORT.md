# University Management System

## Project Report

Prepared for project submission and technical review.

## 1. Project Overview

This project is a full-stack **University Management System** built as a backend-first academic management application. The system supports three main user roles:

- `Admin`
- `Teacher`
- `Student`

The goal of the project was to build a realistic university operations platform that demonstrates:

- backend engineering
- relational database design
- secure authentication and authorization
- role-based access control
- structured frontend development
- production-style security hardening
- testing and documentation discipline

The application allows admins to manage departments, teachers, students, courses, and course offerings. Teachers can view their assigned offerings and student rosters. Students can view their own profile and enrolled course offerings.

## 2. Main Objective

The main objective was to build a secure, practical, and well-structured academic management system that reflects real-world backend and frontend engineering practices.

This project focuses on:

- clean API design
- strong data modeling
- realistic academic workflows
- secure session management
- good operational safeguards
- a role-based frontend dashboard

## 3. Tech Stack

### Backend

- `FastAPI`
- `PostgreSQL`
- `SQLAlchemy`
- `Alembic`
- `Pydantic`
- `Argon2id` password hashing
- `Redis` for security-related state
- `PyOTP` for TOTP / Google Authenticator

### Frontend

- `React`
- `Vite`
- `TypeScript`
- `React Router`
- `TanStack Query`
- `React Hook Form`
- `Zod`
- `Tailwind CSS`

## 4. System Architecture

The system is organized as a backend API plus a dashboard-style frontend.

### Backend structure

- `app/api/v1` for API routes
- `app/core` for security, config, middleware, cookies, logging, and rate limiting
- `app/db` for database setup
- `app/models` for ORM models
- `app/schemas` for request and response schemas
- `app/services` for business logic
- `alembic` for migrations
- `tests` for automated tests

### Frontend structure

- `frontend/src/app` for router, providers, layouts, guards
- `frontend/src/features` for feature-based screens and API hooks
- `frontend/src/components` for reusable UI parts
- `frontend/src/lib` for API client, types, and utilities

## 5. Core Academic Data Model

The project uses a realistic academic model where teaching and enrollment happen on **course offerings**, not directly on base courses.

### Main entities

- `users`
- `students`
- `teachers`
- `departments`
- `courses`
- `course_offerings`
- `course_offering_teachers`
- `enrollments`
- `audit_logs`
- `auth_sessions`

### Important modeling decisions

- `users` hold credentials and security state
- `students` and `teachers` are linked 1:1 with `users`
- `courses` represent catalog-level courses
- `course_offerings` represent actual teachable instances by term, year, and section
- teacher assignment and student enrollment happen on `course_offerings`
- soft-delete is used on major records
- audit history records important admin actions
- refresh sessions are stored server-side in `auth_sessions`

## 6. Roles and Responsibilities

### Admin

Admin is the operational controller of the system.

Admin can:

- manage departments
- create and update teachers
- create and update students
- create and update courses
- create and update course offerings
- assign teachers to offerings
- enroll students into offerings
- archive, restore, and hard delete supported records
- review audit logs

### Teacher

Teacher has a focused workspace.

Teacher can:

- view own profile
- view own department
- view assigned offerings
- open class rosters for assigned offerings

Teacher cannot:

- access admin routes
- manage students globally
- manage courses globally

### Student

Student has a self-service portal.

Student can:

- view own profile
- view own department
- view enrolled course offerings

Student cannot:

- access another student's data
- access teacher/admin functions

## 7. Application Flow

### Admin flow

1. Admin signs in.
2. If it is the first login, password change is enforced.
3. Admin lands on the admin dashboard.
4. Admin manages departments, teachers, students, courses, and offerings.
5. Admin assigns teachers and enrolls students on offering detail pages.
6. Admin can archive or restore records where supported.
7. Admin can review audit log history.

### Teacher flow

1. Teacher signs in.
2. If required, teacher changes password.
3. Teacher lands on teacher dashboard.
4. Teacher views assigned offerings.
5. Teacher opens a roster and sees only students from assigned offerings.

### Student flow

1. Student signs in.
2. If required, student changes password.
3. Student lands on student dashboard.
4. Student views own profile and enrolled offerings.

## 8. Authentication and Session Flow

The project originally used bearer token storage in the frontend, but it was later upgraded to a stronger **cookie-based session architecture**.

### Current authentication model

- short-lived access cookie
- longer-lived refresh cookie
- CSRF cookie for protected write requests
- refresh session stored in database
- token versioning for invalidation
- optional TOTP / Google Authenticator

### Login flow

1. User submits email and password.
2. Backend verifies credentials and account state.
3. If TOTP is enabled, a valid authenticator code is also required.
4. Backend creates a server-side session in `auth_sessions`.
5. Backend sets:
   - access cookie
   - refresh cookie
   - CSRF cookie
6. Frontend uses cookie-based authenticated requests.

### Access token purpose

The access token is short-lived and is used to authenticate normal API requests.

It includes claims such as:

- `sub`
- `role`
- `session_id`
- `token_version`
- `jti`
- `iss`
- `aud`
- `exp`

### Refresh flow

When the access token expires:

1. Frontend calls the refresh endpoint.
2. Browser automatically sends the refresh cookie.
3. Backend validates the refresh session.
4. Backend rotates the refresh token secret.
5. Backend issues a new access cookie.

### Logout flow

When a user logs out:

- current session is revoked
- current access token `jti` is denylisted
- cookies are cleared

### Password change flow

When a user changes password:

- current password is validated
- password hash is updated
- `token_version` is incremented
- all active sessions for that user are revoked

This makes older sessions invalid.

## 9. Security Hardening Implemented

One of the strongest parts of the project is the security hardening phase that was added after the base application was complete.

### 9.1 Password Security

- passwords are hashed using `Argon2id`
- first login can require password change
- older sessions are invalidated on password change

### 9.2 Session Security

- moved from frontend bearer-token storage to `HttpOnly` cookie-based auth
- access token is short-lived
- refresh token is server-tracked through `auth_sessions`
- access tokens include `jti` for targeted invalidation
- `token_version` invalidates older token generations

### 9.3 CSRF Protection

Because the application now uses cookies, CSRF protection was added for mutating requests.

The backend validates:

- CSRF cookie
- `X-CSRF-Token` header
- session-stored CSRF secret

This prevents cross-site abuse of authenticated browser sessions.

### 9.4 Origin Validation

For write requests, the backend checks trusted request origins. This prevents cross-origin state-changing requests from untrusted websites.

### 9.5 Rate Limiting

Rate limiting was implemented as a production-style request defense.

Protected areas include:

- login by IP
- login by IP + email
- refresh endpoint
- change password
- general read requests
- general write requests

This helps reduce:

- brute-force login attacks
- endpoint abuse
- repeated sensitive-action spam

### 9.6 Redis-backed Security State

Redis is used for security-related runtime controls such as:

- rate limiting
- access-token denylisting

This is stronger than simple in-memory-only security state and is more realistic for production-style architecture.

### 9.7 Refresh Reuse Detection

Refresh tokens are rotated. If an older refresh token is used again after it should already be dead, that is treated as suspicious reuse.

In that case, the related session is revoked.

### 9.8 Trusted Runtime Configuration

The application now performs stricter security checks around configuration. The hardened setup is designed to avoid unsafe production-style deployment choices such as:

- weak or placeholder secret values
- missing trusted origins
- insecure cookie settings
- missing Redis in hardened mode

### 9.9 Security Logging

Structured logs were added for security-sensitive events such as:

- login success
- login failure
- refresh success/failure
- logout
- password change
- origin rejection
- CSRF rejection
- rate-limit blocking
- forbidden access attempts

Sensitive values such as passwords and tokens are not logged.

### 9.10 TOTP / Google Authenticator

Users can optionally enable two-factor authentication using TOTP.

Flow:

1. User opens the security settings page.
2. Backend generates a secret and provisioning URI.
3. Frontend renders a QR code.
4. User scans it using Google Authenticator.
5. User enters the 6-digit code to enable TOTP.
6. Future logins require password plus authenticator code.

This provides stronger protection beyond password-only login.

## 10. Authorization and Access Control

Authorization was carefully enforced at both route level and resource level.

### Function-level authorization

- admin-only routes are protected
- teacher-only and student-only spaces are isolated

### Object-level authorization

- student can only see own profile and own offerings
- teacher can only see assigned offerings and those rosters
- deleted or inactive users cannot continue normal authenticated access

This directly addresses one of the biggest real-world API risks: broken access control.

## 11. Validation and Data Integrity

Validation is applied at multiple layers.

### Application validation

- request payload validation using Pydantic
- term validation
- semester validation
- password and input checks
- role and ownership checks

### Database integrity

- foreign keys
- unique constraints
- check constraints
- transactional delete/restore logic

This helps preserve both correctness and safety under concurrent or invalid operations.

## 12. Frontend Design and UX

The frontend was built as a role-based dashboard application.

### Main frontend characteristics

- admin-first dashboard model
- teacher portal
- student portal
- responsive layout
- form-heavy workflow support
- list/filter/table pattern for operational modules
- offering detail page as the action center for assignments and enrollments

### Security-related frontend upgrades

- no auth tokens stored in `localStorage`
- uses cookie-based authenticated requests
- automatic refresh handling
- CSRF header attached on protected write requests
- role-aware route guards
- forced password-change routing
- TOTP setup and login support

## 13. Testing and Verification

The project includes automated tests for both application behavior and security behavior.

### Tested areas include

- login success/failure
- logout invalidation
- password-change invalidation
- role restrictions
- object-level access control
- soft-delete behavior
- restore behavior
- hard-delete restrictions
- invalid validation cases
- TOTP setup and login flow
- CSRF protection
- trusted-origin enforcement
- refresh/session security

Recent backend test status:

- `23 passed`

### Security verification tooling

Security audit tooling was also added:

- `bandit`
- `pip-audit`
- `npm audit --omit=dev`
- `security-check`

These help detect:

- insecure Python coding patterns
- vulnerable Python dependencies
- vulnerable frontend runtime packages
- accidental regression of old auth-token storage behavior

## 14. Developer and Operational Readiness

The project was also prepared with good engineering workflow support, not only user-facing features.

Key readiness elements include:

- Alembic-based schema migrations from the start
- Docker-based local infrastructure for PostgreSQL and Redis
- environment-based configuration
- seeded demo data for realistic presentation
- Swagger / OpenAPI documentation for API review
- security audit tooling for repeatable checks

This makes the project easier to run, review, test, and present in a professional environment.

## 15. Sample Data and Realistic Domain Setup

The project includes seeded demo data based on realistic Pakistani academic context and HEC-inspired course structure.

Current seeded data includes:

- `BSCS`
- `BSSE`
- `BSIT`
- multiple semesters of courses
- teachers
- students
- offerings
- assignments
- enrollments

This makes the system easier to demonstrate in a realistic university-style scenario.

## 16. Important Design Decisions

### Why synchronous SQLAlchemy was used

The project intentionally uses synchronous database operations for the MVP.

Reasons:

- simpler implementation
- easier debugging
- cleaner transactional reasoning
- lower complexity for this scale of application

This was a deliberate engineering decision, not a mistake.

### Why course offerings were used

Teacher assignment and enrollment are modeled on `course_offerings` rather than plain `courses`.

This is more realistic because real universities operate on term, year, and section offerings, not only catalog entries.

### Why cookie-based session auth replaced frontend token storage

The project originally worked with frontend-managed bearer tokens, but it was intentionally upgraded to a cookie-based session model.

Reasons:

- reduces frontend exposure to authentication tokens
- supports stronger browser-session security
- fits refresh-session rotation more naturally
- creates a stronger foundation for future MFA growth

### Why security was implemented in layers

The security design was intentionally layered instead of relying on one control only.

Examples:

- password hashing protects credentials at rest
- cookie sessions protect browser-side authentication flow
- CSRF protects mutating requests
- origin validation protects cross-site writes
- rate limiting protects against automated abuse
- Redis-backed denylisting supports revocation
- TOTP adds stronger optional login verification

This layered approach is closer to real production security design.

### Why PostgreSQL + Alembic-first development was important

The database layer was treated as a first-class part of the system from the beginning.

Reasons:

- schema changes are tracked through migrations
- constraints are enforced at database level
- data integrity is stronger and more reproducible
- changes are easier to review and apply safely across environments

### Why the frontend was built as role-specific workspaces

The frontend was designed as role-specific dashboard spaces rather than one generic interface for all users.

Reasons:

- reduces cognitive load for each role
- keeps admin actions isolated from teacher and student spaces
- avoids exposing irrelevant UI actions
- aligns cleanly with the backend permission model

## 17. Current Scope and Limitations

The project is strong and feature-rich, but some items are intentionally out of scope for now.

Not included in current scope:

- grading module
- attendance module
- file uploads
- notifications
- parent portal
- multi-campus support
- timetable engine
- advanced analytics
- social login / OAuth

## 18. Future Enhancements

Possible future improvements:

- advanced dashboard analytics
- export features
- richer audit filtering
- attendance and grading modules
- optional "logout from all devices" UI
- recovery codes for TOTP
- admin control over more security settings
- multi-department or multi-program relationships if needed

## 19. Conclusion

This project evolved from a standard academic CRUD system into a much stronger full-stack application with serious attention to:

- role-based architecture
- secure session handling
- realistic data modeling
- operational workflows
- frontend usability
- production-style security hardening

The final system demonstrates not only that the application works, but also that it has been designed with attention to correctness, security, and maintainability.

## 20. Short Summary

This project is a secure, role-based University Management System built with FastAPI, PostgreSQL, React, and TypeScript. It supports admin management of academic records, focused teacher workflows, and student self-service access. A major enhancement phase added production-style security features including cookie-based sessions, refresh rotation, CSRF protection, trusted-origin validation, Redis-backed rate limiting, token and session revocation, structured security logging, and optional TOTP-based two-factor authentication. The project demonstrates both software engineering fundamentals and security-aware application design.
