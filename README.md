# AssetOrbit

Enterprise Asset Management (EAM) platform — track assets, assignments, maintenance, tickets, and audit history with role-based access control.

## Stack

### Frontend (`client/`)

- **React 18** — UI framework, component-based pages/forms/modals
- **Vite** — build tool: compiles TypeScript + React, bundles and minifies JS/CSS into `client/dist/`
- **TypeScript** — type safety across client code
- **Tailwind CSS** — utility-first styling
- **Axios** — HTTP client, calls the backend at `/api/*`
- **Lucide React** — icons
- **Recharts** — dashboard charts
- **jsQR** — scans QR codes from the camera

### Backend (`server/`)

- **Node.js + Express** — API server, serves both the API and the static frontend in production
- **TypeScript** — type safety across server code
- **Prisma ORM** — database models, schema, and migrations against SQLite
- **SQLite (`dev.db`)** — stores orgs, users, assets, assignments, tickets, maintenance, and audit logs
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT auth tokens (7-day expiry)
- **helmet** — security HTTP headers
- **express-rate-limit** — brute-force protection on auth endpoints
- **cors** — cross-origin access control
- **dotenv** — loads environment variables from `.env`

## How it works

### Single-process, single-URL deployment

In production Express runs one Node process that does two things:
1. Serves the built React app as static files from `client/dist/`.
2. Handles all API requests at `/api/*`.

That means the deployed URL (e.g. `https://assetorbit.onrender.com`) serves the UI and the API together — no separate frontend host, no reverse proxy. The client Axios calls already point at `/api/...`, so they hit the same Express process.

### Request flow

```
Browser → https://assetorbit.onrender.com/
         → Express serves client/dist/index.html
         → React app loads in the browser

Browser → POST /api/auth/login  { email, password, companyName }
         → Express validates credentials against SQLite
         → If valid, signs a JWT with JWT_SECRET
         → Returns { token, user } → browser saves token in localStorage

Browser → GET /api/assets  (with Authorization: Bearer <token>)
         → authenticateToken middleware verifies JWT
         → route handler queries Prisma / SQLite
         → returns JSON asset list
```

### Auth

- Login sends `email + password + companyName`.
- The backend looks up the user by email in SQLite, verifies the bcrypt password hash, and returns a **JWT** containing `userId`, `orgId`, `orgName`, `email`, `name`, `role`, `department`.
- Every protected API route runs `authenticateToken` middleware before the handler.
- The frontend stores the token in `localStorage` and attaches it to every request via an Axios interceptor.
- On reload, the app reads the stored token and calls `/api/auth/me` to restore the session.

### Roles (RBAC)

Defined in `client/src/config/rbac.ts`. Five roles:

| Role | Access |
|------|--------|
| **ADMIN** | Full access — all pages, all actions, create employees |
| **IT_DEPT** | Hardware lifecycle — assets, maintenance, tickets, assignments, audit |
| **HR_DEPT** | People ops — assign/return assets, create employees, view assets |
| **MANAGER** | Read-only analytics — dashboard, assets, assignments, audit, maintenance |
| **EMPLOYEE** | Self-service — own equipment, file tickets |

`can(role, action)` drives frontend UI visibility and the backend enforces the same rules in route handlers.

### Database

SQLite with Prisma. Tables:

- `Organization` — the company (multi-tenant: each org is isolated)
- `User` — belongs to an org, has a role + department
- `Asset` — unique per org by `assetTag` and `serialNumber`
- `AssetAssignment` — who has what, with assign/return dates and notes
- `MaintenanceRecord` — maintenance history per asset
- `Ticket` — issues filed against an asset
- `AuditLog` — every action logged with who/what/when

On boot, `npx prisma db push` recreates the tables from the schema. The SQLite file lives on the service's disk; on Render's free tier that disk is ephemeral, so the DB (and its data) is recreated after every restart/redeploy.

## Local development

```bash
# Terminal 1 — Server (API on http://localhost:5000)
cd server
npm install
npm run dev

# Terminal 2 — Client (Vite dev server on http://localhost:3000, proxies /api to the server)
cd client
npm install
npm run dev
```

Then open http://localhost:3000.

### Database + sample data

```bash
cd server
npx prisma db push        # create tables from schema
npm run db:seed           # optionally load demo data (2 companies, users, assets)
```

Demo seed users (password for all: `password123`):

| Company | Email | Role |
|---------|-------|------|
| Acme Corporation | `admin@acme.com` | ADMIN |
| Acme Corporation | `it@acme.com` | IT_DEPT |
| Acme Corporation | `hr@acme.com` | HR_DEPT |
| Acme Corporation | `manager@acme.com` | MANAGER |
| Acme Corporation | `employee@acme.com` | EMPLOYEE |
| Stark Industries | `tony@starktech.com` | ADMIN |
| Stark Industries | `friday@starktech.com` | IT_DEPT |
| Stark Industries | `peter@starktech.com` | EMPLOYEE |

## Production

### Build

```bash
cd server && npm ci --include=dev && npm run build   # compile server
cd ../client && npm ci --include=dev && npm run build # build React into client/dist
```

Note: `--include=dev` is required when `NODE_ENV=production`, because `npm ci` otherwise skips dev dependencies (the `@types/*` packages and `typescript`). Without them, `tsc` fails.

### Run

```bash
cd server
npx prisma db push                       # ensure SQLite tables exist
NODE_ENV=production JWT_SECRET=<secret>  # needed — server refuses to start without it
node server/dist/index.js                 # serves client/dist + API on PORT (default 5000)
```

### Environment variables

| Variable | Description | Required |
| -------- | ----------- | -------- |
| `NODE_ENV` | Set to `production` for static-file serving + production behavior | yes (in prod) |
| `JWT_SECRET` | Secret used to sign auth tokens — server throws if missing in production | yes (in prod) |
| `PORT` | HTTP port (default `5000`) | no |
| `CORS_ORIGIN` | Allowed browser origin(s), comma-separated. Set to your public URL in production (e.g. `https://assetorbit.onrender.com`). Default is `http://localhost:3000`. | yes (in prod, or set to your origin) |
| `DATABASE_URL` | Optional override; defaults to `file:./dev.db` relative to the server working directory (the `prisma/` folder copies alongside `dist/` on deploy) | no |

## Deployment

### Render (free tier)

A Blueprint file (`render.yaml`) is included at the repo root.

1. Push this repo to GitHub.
2. In Render's dashboard, click **New + → Blueprint**, connect the repo.
3. Render reads `render.yaml` and creates one web service (`assetorbit`).

What Render runs:

- **Build command:** `cd server && npm ci --include=dev && npm run build && cd ../client && npm ci --include=dev && npm run build`
- **Start command:** `cd server && npx prisma db push && cd .. && node server/dist/index.js`
- **Environment:** `NODE_ENV=production`, `JWT_SECRET` auto-generated, plus `CORS_ORIGIN` set to the live URL.

Caveats on the free tier:
- The service **sleeps after 15 minutes** of inactivity — first request after idle restarts it (takes ~30–60s).
- The **SQLite database resets** on every restart/redeploy because the disk is ephemeral — register a fresh org each time you demo it, or add persistent storage.

To keep data across restarts you can either:
- Upgrade the Render service and attach a persistent disk, or
- Deploy to a free Always-Free VM (Oracle Cloud) instead.

## Major files

| Path | Purpose |
| ---- | ------- |
| `client/src/App.tsx` | Root React app: auth provider, routing/tabs, modals, global refresh signal |
| `client/src/services/api.ts` | Axios instance configured with baseURL `/api` and token header interceptor |
| `client/src/config/rbac.ts` | Single source of truth for roles, page access, and action permissions |
| `client/src/context/AuthContext.tsx` | Auth state: login, register, logout, session restore from stored token |
| `server/src/index.ts` | Express app: security headers, CORS, routes, static frontend serving in production |
| `server/src/middleware/auth.ts` | JWT verification middleware used by protected routes |
| `server/src/utils/jwt.ts` | Token generation + verification |
| `server/src/controllers/*Controller.ts` | Route handlers for each domain (auth, assets, assignments, tickets, maintenance, dashboard, users, audit) |
| `server/prisma/schema.prisma` | Prisma data model (SQLite) |
| `server/prisma/seed.ts` | Demo data script: two companies, users, assets, assignments |
| `render.yaml` | Render Blueprint (build + start commands, env vars) |
