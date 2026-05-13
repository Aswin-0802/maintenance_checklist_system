# Maintenance Checklist & Shift Verification System

Role-based full-stack application to manage shift-based maintenance and cleaning checklist operations for station/facility environments.

## Live Demo

- Frontend (Vercel): https://maintenance-checklist-system.vercel.app
- Backend API (Render): https://maintenance-checklist-api.onrender.com/api
- Swagger docs: https://maintenance-checklist-api.onrender.com/api-docs

> The backend is on Render's free tier — the first request after ~15 min of inactivity takes ~30 s to wake up.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL + Prisma ORM
- Authentication: JWT (Bearer token)
- Hosting: Vercel (frontend) + Render (backend + Postgres)

## Modules Implemented

### Admin

- Manage stations (create, list, update, delete)
- Manage users and roles (create, list, update, delete)
- Manage shifts and assignments
- Manage dynamic checklist templates
- Checklist reports endpoint with status summary

### Cleaning Staff

- View assigned shifts for current day
- Open shift checklist
- Mark checklist items completed and add remarks
- Submit checklist

Business rule: mandatory checklist items must be completed and shift-expired submissions are blocked.

### Supervisor

- View submitted checklists
- Approve or reject with comments
- View checklist history with filters

Business rule: supervisor approval is blocked for incomplete mandatory checklist items.

## Folder Structure

- `client` - React frontend
- `server` - Express API, Prisma schema/migrations, seed

## Local Setup

### 1) Backend

```bash
cd server
```

Create `.env` from template:

```bash
cp .env.example .env
```

Set the Postgres connection string (you can paste the External URL from your Render Postgres dashboard, or use a local Postgres instance):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME"
```

Then run:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
node prisma/seedDemo.js
npm run dev
```

What each seed does:

- `npm run seed` — creates the three login users (admin / staff / supervisor)
- `node prisma/seedDemo.js` — creates today's stations, shifts, templates, assignments, and a couple of sample submissions so the dashboards have real data

Backend URLs:

- API base: `http://localhost:5000/api`
- Swagger docs: `http://localhost:5000/api-docs`
- Health check: `http://localhost:5000/api/health`

### 2) Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

## Role Login Credentials (Seeded)

- Admin: `admin@example.com` / `Admin@123`
- Staff: `staff@example.com` / `Staff@123`
- Supervisor: `supervisor@example.com` / `Supervisor@123`

## Main API Groups

- Auth: `/api/auth/*`
- Admin: `/api/admin/*`
- Staff: `/api/staff/*`
- Supervisor: `/api/supervisor/*`

Use Swagger for quick endpoint browsing and manual testing:

- `http://localhost:5000/api-docs`

## Database Schema Summary

Core entities:

- `users`
- `stations`
- `shifts`
- `shift_assignments`
- `checklist_templates`
- `checklist_template_items`
- `checklist_submissions`
- `checklist_submission_items`

Relationships:

- Station has many shifts and templates
- Shift has many assignments and submissions
- Template has many template items
- Submission has many submission items
- Users are mapped by role and assignment type

## Deployment

Full step-by-step deploy guide is in [DEPLOY.md](DEPLOY.md). Quick summary:

- Frontend → **Vercel**, Root Directory `client`, env var `VITE_API_BASE_URL`
- Backend → **Render** Web Service, Root Directory `server`, Build `npm install && npm run build`, Start `npm run start`
- Database → **Render PostgreSQL** (free tier)
- The `build` script on Render automatically runs `prisma migrate deploy` and both seed scripts on every deploy, so the database is always provisioned and populated.

## Current Completion

- Phase 1: completed
- Phase 2: completed
- Phase 3: completed (backend + frontend dashboards)
- Phase 4: completed (deployed to Vercel + Render)
