# CLAUDE.md — Voom Ghana Marketplace

## Project Overview

Voom Ghana is a **vehicle spare parts marketplace** for Ghana. Vendors list auto parts (engine, brakes, suspension, etc.) and buyers search, filter by vehicle make/model/year, add to cart, and place orders. Currency is GHS (Ghana Cedis). Built as a full-stack TypeScript monorepo.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js + TypeScript (ESM) |
| **Frontend** | React 19, Vite 7, wouter (routing), TanStack React Query |
| **API** | tRPC v11 over Express, superjson transformer |
| **Database** | MySQL via drizzle-orm + mysql2 |
| **Styling** | Tailwind CSS v4, shadcn/ui (new-york style), Radix primitives |
| **Auth** | OAuth (cookie-based sessions, JWT via jose) |
| **Storage** | Forge API proxy (file uploads) |
| **Package Manager** | pnpm (v10.4.1, enforced via packageManager field) |

## Project Structure

```
├── client/src/           # React frontend
│   ├── _core/hooks/      # Internal hooks
│   ├── components/       # App components (Navbar, Footer, ProductCard, etc.)
│   ├── components/ui/    # shadcn/ui primitives (do NOT edit manually)
│   ├── contexts/         # React contexts (ThemeContext)
│   ├── hooks/            # Custom hooks (useMobile, useComposition, usePersistFn)
│   ├── lib/              # Utilities (trpc client, cn() helper)
│   ├── pages/            # Route pages (Home, Products, Cart, VendorDashboard, Admin, etc.)
│   ├── App.tsx           # Router + layout (wouter Switch)
│   └── main.tsx          # Entry point (tRPC + QueryClient setup)
├── server/
│   ├── _core/            # Server infrastructure (Express, tRPC, OAuth, env, cookies, LLM, maps)
│   ├── routers.ts        # All tRPC routes (auth, category, vendor, product, cart, order, notification, review, admin)
│   ├── db.ts             # Database helpers (all CRUD operations)
│   └── storage.ts        # File upload/download via Forge API
├── shared/               # Shared between client and server
│   ├── const.ts          # Constants (cookie name, error messages, timeouts)
│   ├── types.ts          # Re-exports from schema + shared error types
│   └── _core/errors.ts   # Error definitions
├── drizzle/
│   ├── schema.ts         # Database schema (users, vendors, products, categories, cartItems, orders, orderItems, reviews, notifications)
│   ├── relations.ts      # Drizzle relations
│   └── *.sql             # Migration files
├── drizzle.config.ts     # Drizzle Kit config (MySQL dialect)
├── vite.config.ts        # Vite config with aliases and plugins
├── vitest.config.ts      # Test config (node env, server tests only)
└── tsconfig.json         # Strict TS, path aliases (@/ and @shared/)
```

## Key Commands

```bash
pnpm dev          # Start dev server (tsx watch + Vite HMR)
pnpm build        # Vite build (client) + esbuild (server) → dist/
pnpm start        # Run production build
pnpm check        # TypeScript type-check (tsc --noEmit)
pnpm format       # Prettier format all files
pnpm test         # Run vitest (server tests only)
pnpm db:push      # Generate + run Drizzle migrations
```

## Path Aliases

- `@/*` → `client/src/*` (frontend imports)
- `@shared/*` → `shared/*` (shared code)
- `@assets` → `attached_assets/` (static assets)

## Architecture Patterns

### API Layer (tRPC)
- **Router location**: `server/routers.ts` — single file with all route definitions
- **Procedures**: `publicProcedure`, `protectedProcedure` (requires auth), `vendorProcedure` (requires approved vendor), `adminProcedure` (requires admin role)
- **Validation**: Zod schemas inline on each procedure input
- **Transport**: superjson over HTTP batch link at `/api/trpc`
- **Client usage**: `trpc.routerName.procedureName.useQuery()` / `.useMutation()` via `@/lib/trpc`

### Database
- **ORM**: Drizzle with MySQL dialect
- **Schema**: `drizzle/schema.ts` — all tables defined here with type exports
- **Helpers**: `server/db.ts` — all CRUD functions, lazy-initialized connection
- **Migrations**: `drizzle-kit generate` + `drizzle-kit migrate` (run via `pnpm db:push`)
- Tables: `users`, `vendors`, `products`, `categories`, `cart_items`, `orders`, `order_items`, `reviews`, `notifications`

### Frontend
- **Routing**: wouter `<Switch>` in `App.tsx` — file-per-page in `client/src/pages/`
- **State**: TanStack React Query (server state), React context (theme)
- **UI Components**: shadcn/ui (new-york variant) — do NOT manually edit files in `components/ui/`
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Forms**: react-hook-form + @hookform/resolvers + Zod

### Auth Flow
- OAuth-based login via `/api/oauth/callback`
- Session stored in cookie (`app_session_id`), JWT-signed
- Auto-redirect to login on `UNAUTHORIZED` tRPC errors (client-side)
- `OWNER_OPEN_ID` env var auto-assigns admin role

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Cookie/session signing |
| `VITE_APP_ID` | App identifier (client-accessible) |
| `OAUTH_SERVER_URL` | OAuth provider URL |
| `OWNER_OPEN_ID` | Auto-admin user OpenID |
| `BUILT_IN_FORGE_API_URL` | Storage proxy URL |
| `BUILT_IN_FORGE_API_KEY` | Storage proxy auth key |
| `PORT` | Server port (default: 3000) |

## User Roles

- **user** — default, can browse/buy/cart/order
- **vendor** — approved vendor, can manage products and orders
- **admin** — full access, can manage vendors, view stats, seed categories

## Conventions

- All code is TypeScript with strict mode enabled
- Use `pnpm` exclusively (not npm or yarn)
- Server entry: `server/_core/index.ts`
- Database types are inferred from Drizzle schema (`$inferSelect` / `$inferInsert`)
- Shared constants go in `shared/const.ts`
- New tRPC routes go in `server/routers.ts`, new DB helpers in `server/db.ts`
- New pages go in `client/src/pages/`, add route in `App.tsx`
- Use `sonner` for toast notifications (client-side)
- Currency display: `GH₵` prefix (e.g., `GH₵${amount}`)
- Order numbers: `VOM-${nanoid(8).toUpperCase()}`
- Tests: server-side only, `*.test.ts` or `*.spec.ts` in `server/`
