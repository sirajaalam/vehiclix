# Vehiclix — Vehicle & Fuel Intelligence

> Production-ready vehicle and fuel intelligence management platform.

## Architecture Overview

Vehiclix is built as a two-project architecture with a modular monolith backend:

```text
Vehiclix/
├── vehiclix-frontend/     # Next.js, TypeScript, Tailwind CSS, shadcn/ui, Motion
└── vehiclix-backend/      # Node.js, Express, TypeScript, pg, Redis, Supabase
```

### High-Level Request Flow

```text
                         INTERNET
                            │
                            ▼
                     ┌─────────────┐
                     │ Cloudflare  │
                     │ TLS / DDoS  │
                     │ WAF / Limit │
                     └──────┬──────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ Next.js Frontend     │
                 │ TypeScript           │
                 │ Tailwind CSS         │
                 │ shadcn/ui + Motion   │
                 └──────────┬───────────┘
                            │
                       HTTPS / REST
                            │
                            ▼
                 ┌──────────────────────┐
                 │ Express Backend      │
                 │ TypeScript           │
                 │ Modular Monolith     │
                 └──────────┬───────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
           Redis       PostgreSQL    Supabase Storage
         (Rate limit,   (Permanent      (Documents,
          targeted       source of       invoices,
          caching)         truth)         avatars)
```

## Technology Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, Motion, Supabase Auth client
- **Backend:** Node.js, Express, TypeScript, `pg` (parameterized SQL), Redis, OpenAPI / Swagger UI
- **Database & Services:** Supabase PostgreSQL, Supabase Auth, Supabase Storage
- **Security:** Cloudflare edge proxy, Helmet, CORS, rate limiting, Zod validation, parameterized SQL

## Project Structure Conventions

- **Frontend & Backend remain separate projects.**
- **No ORMs:** Raw parameterized SQL only using `pg`.
- **Database schema migrations:** Managed via Supabase CLI in `supabase/migrations/`.
- **Currency & Money:** Stored as `numeric(12,2)` in PostgreSQL; calculated in integer paise in TypeScript.
- **Completed trips:** Immutable / read-only.
- **Environment variables:** Never committed; use `.env.example` templates.

## Quick Start & Running Locally

### 1. Start Backend

```bash
cd vehiclix-backend
npm install
npm run dev
```

- Server runs on: `http://localhost:9090`
- Health check: `http://localhost:9090/api/v1/health`
- Swagger Docs: `http://localhost:9090/api/docs`
- Run test suite: `npm test`

### 2. Start Frontend

```bash
cd vehiclix-frontend
npm install
npm run dev
```

- Web App: `http://localhost:3000`
- Trip Calculator: `http://localhost:3000/calculator`
- Dashboard: `http://localhost:3000/dashboard`
- Garage: `http://localhost:3000/garage`
- Fuel & Energy: `http://localhost:3000/fuel`
- Maintenance Services: `http://localhost:3000/services`
- Trips & Split: `http://localhost:3000/trips`
- Admin Console: `http://localhost:3000/admin`
- Build production bundle: `npm run build`

