# Frontend

Admin-first dashboard frontend for the University Management System.

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form + Zod
- Sonner toasts

## What Is Included

- login and forced password-change screens
- auth bootstrap from `/api/v1/auth/me`
- role-based route guards
- shared app shell with sidebar and top bar
- admin dashboard and CRUD pages
- offering detail page for teacher assignment and student enrollment
- audit log timeline
- teacher portal
- student portal

## Local Run

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

Open:
- [http://127.0.0.1:5173](http://127.0.0.1:5173)

## Environment

The frontend can use the built-in Vite proxy for local development, so `VITE_API_BASE_URL` can stay empty.

If you need to point the frontend at a different backend, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Verification

```powershell
npm run lint
npm run build
```
