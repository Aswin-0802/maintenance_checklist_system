# Deployment Guide — Render (backend + DB) + Vercel (frontend)

This guide assumes the repo is pushed to GitHub. Free tiers used:
- **Vercel** — React/Vite frontend
- **Render** — Node/Express backend (Web Service) + PostgreSQL database

> Render's free web service sleeps after ~15 minutes of inactivity. First request after sleep takes ~30–60 s to wake. Fine for a demo/portfolio.

---

## 0. Push to GitHub

```bash
git add .
git commit -m "Prep for deploy: switch to Postgres, env-driven URLs"
git push origin main
```

---

## 1. Create the Postgres database on Render

1. Go to https://dashboard.render.com → **New +** → **PostgreSQL**.
2. Name: `maintenance-checklist-db` · Region: closest to you · Plan: **Free**.
3. Click **Create Database**. Wait until status is "Available".
4. Open the DB page → copy the **Internal Database URL** (used by the Render web service) and the **External Database URL** (used from your laptop to generate migrations).

The free tier expires after 90 days — you can spin up a new one when it does.

---

## 2. Generate Postgres migrations locally

The old MySQL migrations were deleted. You need to generate Postgres ones once, commit them, then Render will replay them on every deploy.

In `server/.env`, set:
```
DATABASE_URL=<paste the EXTERNAL Postgres URL from Render>
```

Then from the `server/` folder:
```bash
npm install
npx prisma migrate dev --name init
npm run seed
```

Verify locally:
```bash
npm run dev
# in another terminal
curl http://localhost:5000/api/health
```

Commit the new migration files:
```bash
git add server/prisma/migrations
git commit -m "Add initial Postgres migration"
git push
```

---

## 3. Deploy the backend on Render

1. Render dashboard → **New +** → **Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free
3. Environment variables (Render → service → Environment):
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = a long random string (use a password generator)
   - `JWT_EXPIRES_IN` = `1d`
   - `DATABASE_URL` = the **Internal** Postgres URL from step 1
   - `CLIENT_URL` = leave blank for now (we'll fill it after Vercel deploy)
4. Click **Create Web Service**. Watch the build log — `prisma migrate deploy` should run during build.
5. Once live, note the URL — something like `https://maintenance-checklist-api.onrender.com`.
6. Test: open `https://<your-render-url>/api/health` in a browser.

---

## 4. Deploy the frontend on Vercel

1. Go to https://vercel.com → **Add New** → **Project** → import your GitHub repo.
2. Settings:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
3. Environment variables:
   - `VITE_API_BASE_URL` = `https://<your-render-url>/api`
4. Click **Deploy**. Wait for the build to finish.
5. Note the URL — something like `https://maintenance-checklist.vercel.app`.

---

## 5. Wire CORS — tell the backend about Vercel

Back on Render → your web service → Environment:
- `CLIENT_URL` = `https://maintenance-checklist.vercel.app`

If you want preview deployments to work too, comma-separate them:
```
CLIENT_URL=https://maintenance-checklist.vercel.app,https://maintenance-checklist-git-main-yourname.vercel.app
```

Save → Render auto-redeploys.

---

## 6. Smoke test

1. Open your Vercel URL.
2. Click **Sign in** → use seeded admin: `admin@example.com` / `Admin@123`.
3. Confirm admin dashboard loads (first request will be slow if Render service was asleep).
4. Visit `https://<your-render-url>/api-docs` to confirm Swagger UI.

---

## Troubleshooting

- **CORS error in browser console** → `CLIENT_URL` on Render must exactly match the Vercel origin (no trailing slash).
- **`PrismaClientInitializationError` on Render** → `DATABASE_URL` is wrong or the DB isn't reachable. Use the **Internal** URL.
- **`relation "User" does not exist`** → migrations didn't run. Check Render build log; you can re-trigger with **Manual Deploy → Clear build cache & deploy**.
- **First request hangs ~30 s** → that's the free-tier cold start. Subsequent requests are fast for ~15 min.
- **Seed not running on Render** → the seed script isn't part of the build. To seed once, open Render **Shell** on the web service and run `node prisma/seed.js`.

---

## Future redeploys

- Push to `main` → Vercel and Render both redeploy automatically.
- Schema changes: run `npx prisma migrate dev --name <change>` locally, commit the new migration folder, push. Render runs `prisma migrate deploy` in its build step.
