# Maintenance Checklist & Shift Verification System

Role-based full-stack application to manage shift-based maintenance and cleaning checklist operations for station/facility environments.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL + Prisma ORM
- Authentication: JWT (Bearer token)

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

Set local DB URL (XAMPP default no-password root example):

```env
DATABASE_URL="mysql://root:@localhost:3306/maintenance_checklist"
```

Then run:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

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

## Current Completion

- Phase 1: completed
- Phase 2: completed
- Phase 3: completed (backend + frontend dashboards)
- Phase 4: in progress (deployment + demo assets + optional final polish)

## Suggested Final Submission Additions

- Demo video (1-2 min) or 6-8 screenshots
- Public Postman collection export (optional if Swagger link provided)
- Deployment links:
  - Frontend (Vercel/Netlify)
  - Backend (Render/Railway)
  - MySQL host (Railway/PlanetScale depending on free tier availability)
