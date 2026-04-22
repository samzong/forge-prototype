# Forge Prototype — Project Instructions

## Mission

Forge is an **in-app builder framework** embedded inside enterprise business
systems (DCE, CRM, HR, etc.). End users describe an outcome in natural
language; Forge generates, scans, deploys, and versions a small-surface "U
App" that runs with the user's own identity and capabilities.

This repo is an **interactive product prototype**. Its purpose: every page,
flow, data shape, and permission boundary that will exist in production must
exist here first, in mockable form, so the product model can be validated
before any real backend is built.

**Prototype boundary**: we build UI + mock data only. Wiring real APIs is
explicitly **out of scope**. No HTTP clients, no service-interface
indirection, no "real backend" adapter layer. The mock is the data layer —
full stop. If the urge to abstract appears, stop. It's a prototype.

## Stack

- Vite 5 + React 18 + TypeScript (strict)
- Tailwind CSS · Framer Motion · React Router v6 · Lucide icons
- Package manager: **pnpm**
- Deploy: Cloudflare Pages (`wrangler.toml` → `dist/`)

## Canonical verification command

```bash
pnpm build
```

Runs `tsc -b && vite build`. Green build = types check + production bundle
generates. There is no test suite; the product model must settle before
tests earn their keep. Do **not** claim "done" without a clean `pnpm build`
unless the change is pure markdown.

## Directory layout

```
src/
├── mock/                # Data layer — the only source of truth
│   ├── store.ts         # In-memory Map<id, entity> per resource
│   ├── delay.ts         # 50–300ms jitter helper
│   ├── seed/            # Initial seed data per resource
│   │   ├── apps.ts
│   │   ├── sessions.ts
│   │   └── …
│   ├── apps.ts          # Async functions: listApps, getApp, createApp, …
│   ├── sessions.ts
│   └── …
├── hooks/               # useApps, useApp, … — wrap mock fns, own loading/error
├── pages/               # Import hooks or types — never mock/seed/* directly
├── components/
├── types.ts             # All TypeScript types (App, Session, Execution, …)
├── App.tsx
└── main.tsx
```

### Hard rules

1. **Pages and components never do `APPS.filter()` on a module-scope array.**
   All data access goes through hooks. If the needed hook doesn't exist
   yet, write it first.
2. **All mock functions are `async` and return `Promise<T>`.** Synchronous
   data access is banned, even in mock.
3. **All mock data is strictly typed** in `types.ts`. New field → update
   the type, then seed data, then consumers. Drift = bugs.
4. **IDs, timestamps, and pagination are real in mock.** `list({ page,
   size, filter, sort })` honors its arguments. `create()` assigns an ID
   and returns the created entity. `update()` bumps `updatedAt`. The store
   survives for the page session only — reload resets.

## Mock discipline

The mock IS the spec. If behavior here is wrong, the product is wrong.

- Seed ≥20 entities per resource unless inherently bounded (e.g. capability
  kinds, integration types).
- Cover edges deliberately: long names, empty fields, `failed` / `denied`
  states, multi-language, counts > 1000, missing optional fields,
  over-budget teams.
- Every call gets 50–300ms jitter. Pages must render loading / empty /
  error states. Instant-data assumptions hide real-world problems.
- Error injection: `?mockError=<resource>.<method>` returns a typed error
  instead of data. Every hook must handle it cleanly.
- Never hardcode IDs like `"team-alert-dashboard"` as nav targets. Resolve
  from the store.

## Workflow

1. **Types first.** New entity or field → update `types.ts` before seed or
   UI. The type is the contract everything else binds to.
2. **Cluster by resource.** Adding `Executions` touches `types.ts`,
   `mock/executions.ts`, `mock/seed/executions.ts`, `hooks/useExecutions.ts`,
   and any pages consuming it. Keep the cluster in one commit.
3. **Migration from current state** (current `src/mock/*.ts` is read-only
   arrays — needs upgrading):
   1. Add `mock/store.ts` + `mock/delay.ts`
   2. Convert existing `mock/apps.ts`, `mock/sessions.ts`, `mock/satellites.ts`
      to async functions backed by the store
   3. Add `hooks/useApps`, `useApp`, `useSessions`, etc.
   4. Migrate `Sidebar`, `MarketplacePage`, `AppDetailPage`, `HomePage` to
      consume hooks instead of importing seed arrays
   5. Add new entities (Execution, Version, Capability, …) as pages need them
4. **New routes / pages must be agreed before implementation.** Don't
   invent routes ad hoc.

## Routing conventions

- Route params: `:id`, `:sessionId`, `:executionId`, `:versionId`
- Sub-views inside a detail page: query param `?tab=<name>`, not nested
  routes. Tab state must survive refresh.
- Unknown route → `/404`. Unauthorized → `/403`. Never white screen.

## Do not

- No test framework yet. Premature tests pin down a moving contract.
- No state-management libs (Redux / Zustand / Jotai). React Context + hooks
  suffice for this surface area.
- No splitting `pitch.html` into React. It's a standalone one-file deck via
  `vite.config.ts` multi-input. Leave it alone.
- No `src/api/`, no service interfaces, no repository pattern, no DI
  containers. The mock layer is the whole data layer.
- No real HTTP calls. If a feature needs one, mock it first and revisit
  when the shape is validated.

## Git

- Commit with `-s` (DCO signoff).
- Conventional prefixes: `feat / fix / chore / refactor / docs`.
- `.claude/` is local-only.
- `git commit` and `git push` are never trivial — always require explicit
  user approval (per global CLAUDE.md).
