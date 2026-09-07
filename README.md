# AssetOrbit

Enterprise Asset Management (EAM) platform — track assets, assignments, maintenance, tickets, and audit history with role-based access control.

## Stack

- **Client** — React 18 + Vite + Tailwind CSS (`client/`)
- **Server** — Express + TypeScript + Prisma + SQLite (`server/`)

## Local development

```bash
# Server (API on http://localhost:5000)
cd server
npm install
npm run dev

# Client (Vite dev server on http://localhost:3000, proxies /api to the server)
cd client
npm install
npm run dev
```

Set up the database and seed demo data (optional):

```bash
cd server
npx prisma db push
npm run db:seed
```

## Production

In production, Express serves the built React app from `client/dist` alongside the API on a single port.

```bash
cd server && npm ci && npm run build
cd ../client && npm ci && npm run build
NODE_ENV=production JWT_SECRET=<strong-random-secret> node server/dist/index.js
```

Required environment variables:

| Variable     | Description                                              |
| ------------ | -------------------------------------------------------- |
| `JWT_SECRET` | Secret used to sign auth tokens — **required in prod**   |
| `PORT`       | HTTP port (default `5000`)                               |
| `CORS_ORIGIN`| Allowed browser origin(s), comma-separated (default: localhost:3000) |
| `DATABASE_URL`| Optional; Prisma uses `file:./dev.db` (in `server/prisma/`) by default |

## Deployment

- **Render (free)** — `render.yaml` blueprint is included; push this repo to GitHub, then in Render choose **New + → Blueprint** and connect the repo.
