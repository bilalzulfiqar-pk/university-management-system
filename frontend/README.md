# Frontend

A premium, role-based operations dashboard for the University Management System — built for fast, trustworthy admin/teacher/student workflows.

## Stack

- React 19 + TypeScript
- Vite (with per-route code-splitting via `React.lazy`)
- Tailwind CSS (custom `ink` design-token system)
- React Router 7 (data router)
- TanStack Query
- React Hook Form + Zod
- Sonner toasts
- lucide-react icons

## What is included

- Split-screen brand auth layout (login, forced password-change, security/2FA)
- Auth bootstrap from `/api/v1/auth/me` with silent cookie refresh
- Automatic CSRF header injection for mutating requests
- Optional Google Authenticator / TOTP setup and login verification
- Role-based route guards (Admin / Teacher / Student)
- **Collapsible sidebar with a real mobile drawer** (closes on navigation, backdrop, Escape)
- **⌘K / Ctrl+K command palette** for quick navigation and actions
- **Breadcrumbs + document-title sync** driven by a central route registry
- Admin dashboard with KPI cards, an onboarding checklist, quick actions, and an audit timeline
- Full CRUD pages for departments, students, teachers, courses, and course offerings
- Offering detail page with teacher assignment and student enrollment
- Audit log timeline with method/status badges and relative timestamps
- Teacher portal (dashboard, offerings, roster)
- Student portal (dashboard, enrollments, offering detail)
- Skeleton loading states (per-page shapes), empty states with CTAs, and error states with retry + request id
- Fully responsive (360px → 1536px+) and accessible (focus-visible rings, keyboard-navigable menus/dialogs, `aria-current`, reduced-motion support)

## Local run

From the repo root, keep the backend running first:

```powershell
uvicorn app.main:app --reload
```

Then start the frontend:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

> The login page no longer ships with pre-filled credentials. Click **“Use demo credentials”** under the form to auto-fill the admin demo account (values come from `VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD`).

## Environment

The frontend uses the built-in Vite proxy in local dev, so `VITE_API_BASE_URL` can stay empty. To point at a different backend, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_CSRF_COOKIE_NAME=ums_csrf
VITE_DEMO_EMAIL=admin@example.com
VITE_DEMO_PASSWORD=ChangeMe123!!
```

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend base URL (empty in dev → Vite proxy) |
| `VITE_CSRF_COOKIE_NAME` | Cookie name read to build the `X-CSRF-Token` header |
| `VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD` | Optional demo credentials for the login “Use demo credentials” link |

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Open the command palette |
| `↑` / `↓` | Move selection in the palette |
| `Enter` | Navigate to the selected item |
| `Esc` | Close palette / drawer / dialog |

## Verification

```powershell
npm run lint
npm run build
```
