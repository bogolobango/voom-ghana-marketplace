# Voom Ghana Marketplace

## Overview
Voom Ghana is a vehicle spare parts marketplace for Ghana. Vendors list auto parts (engine, brakes, suspension, etc.) and buyers search, filter by vehicle make/model/year, add to cart, and place orders. Currency is GHS (Ghana Cedis).

## Tech Stack
- **Runtime**: Node.js + TypeScript (ESM)
- **Frontend**: React 19, Vite 7, wouter (routing), TanStack React Query
- **API**: tRPC v11 over Express, superjson transformer
- **Database**: PostgreSQL via drizzle-orm + pg (converted from MySQL on Replit import)
- **Styling**: Tailwind CSS v4, shadcn/ui (new-york style), Radix primitives
- **Auth**: OAuth (cookie-based sessions, JWT via jose)
- **Package Manager**: pnpm (v10.4.1)

## Project Structure
```
├── client/src/           # React frontend
│   ├── _core/hooks/      # Internal hooks
│   ├── components/       # App components
│   ├── components/ui/    # shadcn/ui primitives (do NOT edit manually)
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities (trpc client, cn() helper)
│   ├── pages/            # Route pages
│   ├── App.tsx           # Router + layout
│   └── main.tsx          # Entry point
├── server/
│   ├── _core/            # Server infrastructure (Express, tRPC, OAuth, env, cookies, LLM, maps)
│   ├── routers.ts        # All tRPC routes
│   ├── db.ts             # Database helpers (PostgreSQL/drizzle)
│   └── storage.ts        # File upload/download
├── shared/               # Shared between client and server
├── drizzle/
│   ├── schema.ts         # Database schema (PostgreSQL pg-core)
│   └── *.sql             # Migration files
├── drizzle.config.ts     # Drizzle Kit config (postgresql dialect)
├── vite.config.ts        # Vite config (port 5000, allowedHosts: true)
└── tsconfig.json
```

## Key Commands
```bash
pnpm dev          # Start dev server (tsx watch + Vite HMR) on port 5000
pnpm build        # Vite build (client) + esbuild (server) → dist/
pnpm start        # Run production build
pnpm db:push      # Generate + run Drizzle migrations
```

## Environment Variables
| Variable | Purpose | Environment |
|----------|---------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Replit-managed, local dev) | runtime secret |
| `SUPABASE_DATABASE_URL` | Supabase PostgreSQL URL (used in production) | production only |
| `JWT_SECRET` | Cookie/session signing | shared |
| `PORT` | Server port (set to 5000) | shared |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for image uploads | shared |
| `CLOUDINARY_API_KEY` | Cloudinary API key | shared |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | shared |
| `VITE_APP_ID` | App identifier (optional - OAuth) | optional |
| `OAUTH_SERVER_URL` | OAuth provider URL (optional) | optional |
| `VITE_OAUTH_PORTAL_URL` | OAuth portal URL (optional) | optional |
| `OWNER_OPEN_ID` | Auto-admin user OpenID (optional) | optional |

## Database Strategy
- **Development**: Uses Replit's built-in PostgreSQL (`DATABASE_URL` runtime secret)
- **Production**: Uses Supabase PostgreSQL (`SUPABASE_DATABASE_URL` production env var)
- `server/db.ts` prefers `SUPABASE_DATABASE_URL` over `DATABASE_URL` when set

## Replit Setup Notes
- **Database**: Migrated from MySQL to PostgreSQL to use Replit's built-in database
  - Schema uses `drizzle-orm/pg-core` imports (serial, integer, pgEnum, pgTable, etc.)
  - `server/db.ts` uses `drizzle-orm/node-postgres` with `pg` Pool
  - `drizzle.config.ts` uses `dialect: "postgresql"`
  - `onDuplicateKeyUpdate` replaced with `onConflictDoUpdate`
  - `$returningId()` replaced with `.returning({ id: table.id })`
- **Vite**: `allowedHosts: true`, `host: "0.0.0.0"`, `port: 5000`
- **Workflow**: `pnpm dev` → port 5000 (webview)
- **Auth**: OAuth is optional; app loads without VITE_OAUTH_PORTAL_URL (login button shows but redirects to #)

## Deployment
- Target: autoscale
- Build: `pnpm build`
- Run: `node dist/index.js`
