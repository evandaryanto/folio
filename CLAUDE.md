# Folio

Workspace platform for managing collections, records, APIs, compositions, views, and pages. pnpm monorepo.

## Monorepo Structure

```
apps/api/          — Hono API (Bun dev, Node prod)
apps/web/          — React 19 frontend (Vite)
packages/contract/ — Shared Zod schemas (@folio/contract)
packages/db/       — Drizzle ORM schemas (@folio/db)
packages/eslint-config/ — Shared lint config
packages/shared/   — Shared utils (mostly empty)
```

## Tech Stack

**Backend:** Hono + @hono/zod-openapi, Drizzle ORM, PostgreSQL, Redis, Zod, Jest
**Frontend:** React 19, Vite 7, Tailwind CSS, shadcn/ui, React Router v7, React Query, React Hook Form + Zod
**Runtime:** Bun (dev), Node.js (prod) for API; Vite dev server for web

## Commands

```bash
pnpm dev              # API dev server (bun --watch)
pnpm dev:all          # All apps dev mode
pnpm build            # Build all packages
pnpm lint             # Lint all
pnpm lint:fix         # Fix lint issues

# Database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema to DB (dev)
pnpm db:studio        # Drizzle Studio

# Docker
pnpm docker:up        # Start PostgreSQL + Redis
pnpm docker:down      # Stop containers
pnpm docker:reset     # Reset (down -v && up)

# Testing
pnpm test             # Jest tests (API)
pnpm test:watch       # Watch mode
```

## Backend Architecture (apps/api/)

4-layer pattern: **Repository → Usecase → Service → Router**

- **Repository** — DB queries via Drizzle, returns `ResponseResult<T>`
- **Usecase** — Business logic, authorization, transactions via `txWrapper`, returns `ResponseResult<T>`
- **Service** — Extracts identity from HTTP context, maps errors to HTTP status, returns `ServiceResult<T>`
- **Router** — Hono OpenAPI routes, request validation, response formatting

DI via singleton `Container` class (`src/bootstrap/container.ts`). Each layer has a factory in its `index.ts`.

### Key Patterns

- **IDs:** ULID (26-char, sortable) — never UUID
- **Pagination:** Cursor-based only (no offset). Uses `buildPaginationResult` from `@folio/db`
- **Result types:** `ok(data)` / `err(error)` pattern — see `src/utils/types/result.ts`
- **Transactions:** Write operations use `txWrapper(async (tx) => {...})`, repositories accept `tx` as first param for writes
- **Auth:** Cookie-based sessions, token format `access_<sessionId>`, middleware validates via DB lookup
- **Error codes:** `ErrorCode` enum (NotFound, Forbidden, Unauthorized, etc.)

### Domain Entities

workspaces, users, sessions, roles, user-roles, collections, fields, records, apis, compositions, views, pages, api-keys, access-rules, audit-logs

Schemas in `packages/db/src/schema/`. Contract types in `packages/contract/src/`.

## Frontend Architecture (apps/web/)

- **Routing:** Centralized config in `src/lib/routes.ts` with lazy loading
- **State:** React Query for server state, `useState` for UI state (Zustand installed but unused)
- **Auth:** Cookie-based via `AppProvider`, checks `GET /auth/me` on mount
- **API client:** `src/services/api.ts` base client, domain services in `src/services/`
- **Hooks:** React Query wrappers in `src/hooks/` (use-collections, use-compositions, use-fields, use-records, use-views, use-pages, use-auth)
- **Layouts:** `RootLayout` → `AuthLayout` (public) or `AppLayout` (protected with sidebar)
- **Components:** shadcn/ui in `src/components/ui/`

## Detailed Documentation

- Backend patterns & code examples: `.claude/backend.md`
- Frontend patterns & code examples: `.claude/frontend.md`
