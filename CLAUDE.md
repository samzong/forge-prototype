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

## North Star

> 我最终想要的效果，不是一个周末项目，而是会决定我们公司接下来 10 年
> 以及整个应用软件开发范式出现革命性变化的重要产品定义，重要程度不低
> 于 ChatGPT 的问世。

This is not a skunkworks demo. Every page, interaction, and data model is
a claim about how enterprise software will be built and used for the next
decade. Ship accordingly. **No workarounds, no throwaway UI, no "good
enough for now."** If a proposed implementation is a workaround, stop and
redesign — even if it means scrapping work already in flight.

## Core Positioning

**Forge collapses "using software" and "building software" into the same
surface.** A business user inside a host system (DCE / CRM / HR) describes
an outcome in one sentence; Forge produces a running, signed,
policy-bound micro-application that the user **uses**, not reviews.

- The app **is** the UI. It is not a configuration page about an app.
- Management / audit / versions are **second-class surfaces**, reserved
  for occasional inspection. They do not get equal billing with "using
  the app."
- Every interaction — create, fix, evolve — is conversational. Forms and
  tabs are fallbacks, not the path.
- Build ↔ use is a continuous loop. A user noticing "this should also do
  X" while using their app must be one sentence away from X being true.

## Decision Filter

Every feature proposal must answer: **"Does this tighten the use ↔ build
loop, or loosen it?"** If it loosens the loop, cut it. If it is orthogonal
to the loop (generic SaaS admin / settings / audit plumbing), it lives in
a second-class surface and must not distract from the primary one.

Reject these smells aggressively:
- "Let's add a tab for X" when X is not a daily action
- "Configure X before you can use the app" onboarding friction
- "Go to settings to change X" instead of "say what you want changed"
- Any IDE-shaped UI (file tree / tab bar / inspector panes) presented as
  the primary way to interact with an app

## Surface Architecture

Every app lives in three distinct surfaces. They are **not** tabs in the
same shell — they are separate routes with different shapes:

| Surface | Route | When | Shape |
|---|---|---|---|
| **Use** | `/apps/:id` | User owns the app; opens it to use it | Full-screen app itself (viewKind renderer). No tab bar. A small "Manage" entry lives in the corner. |
| **Install** | `/marketplace/:id`, `/shared/:id` (pre-install) | User does not yet own the app | Preview + capability review + "Install / Subscribe / Fork" CTA. |
| **Manage** | `/apps/:id/manage[?tab=…]` | User is maintaining / configuring / auditing | Tab shell: overview, code, manifest, executions, versions, logs, audit, settings. |

Hard rules:
1. **Never put the Use Surface inside a tab.** If a user's daily
   interaction requires clicking a tab to reach the thing they came for,
   the IA is wrong.
2. **`/apps/:id` renders the app, not metadata about the app.** The
   viewKind renderer is the page body.
3. **Manage is opt-in.** The entry point is a small icon / menu on the
   Use Surface — not a persistent tab bar.
4. **Install → Use transition**: once a user installs / subscribes /
   forks, subsequent opens go straight to `/apps/:id` (Use). The Install
   Surface never re-appears for owned apps.
5. **Deep links respect the surface.** A shared link to a specific
   execution or version is a Manage-Surface link (`/apps/:id/manage?tab=…`
   or `/apps/:id/executions/:eid`), not a Use-Surface hijack.

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
