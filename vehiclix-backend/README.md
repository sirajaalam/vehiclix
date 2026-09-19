# Vehiclix Backend

Modular monolith REST API backend for Vehiclix built with Node.js, Express, TypeScript, PostgreSQL (`pg`), and Redis.

## Architecture

- **Framework:** Express + TypeScript
- **Database:** Supabase PostgreSQL via `pg` (parameterized SQL only, no ORM)
- **Migrations:** SQL migrations in `supabase/migrations/` via Supabase CLI
- **Caching & Rate Limiting:** Redis
- **Authentication:** Supabase Auth JWT verification
- **Documentation:** OpenAPI 3.0 / Swagger UI at `/api/docs`

## Available Scripts

- `npm run dev` — Start development server with hot-reload (`tsx watch`)
- `npm run build` — Compile TypeScript to `dist/`
- `npm run start` — Run production build (`node dist/server.js`)
- `npm run test` — Run automated test suite with Vitest
- `npm run typecheck` — Verify strict TypeScript compilation

## Core Endpoints

- `GET /api/v1/health` — System and database dependency health
- `GET /api/docs` — Swagger UI API documentation
