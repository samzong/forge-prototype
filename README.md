# Forge Prototype

Interactive product prototype for **Forge** — the in-app builder framework
embedded in enterprise business systems. This prototype exists to show
investors, teams, and users what the product actually looks and feels like.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS (design tokens match the companion pitch deck)
- Framer Motion — used for the real orbit animation of the App Galaxy
- React Router v6 — four routes, full flow from home → generate → app detail

## Quick Start

```bash
cd forge-prototype
pnpm install      # or: npm install / yarn
pnpm dev          # opens http://localhost:5173
```

Build:

```bash
pnpm build && pnpm preview
```

## Routes

| Path              | Purpose                                                         |
| ----------------- | --------------------------------------------------------------- |
| `/`               | Home — animated App Galaxy + "Build U Apps" prompt              |
| `/generate?q=...` | 4-stage generation flow: parse → capabilities → code → ready    |
| `/apps/:id`       | App detail — code / manifest / versions tabs + live preview     |
| `/marketplace`    | Enterprise marketplace grid (fork / subscribe / publish)        |

## Interaction map

- **Galaxy** — 8 satellites orbit the Forge core on 3 different orbits with
  different speeds and directions. Click any satellite to seed the prompt.
- **Quick chips** — 4 categorized quick-start prompts below the input.
- **Sidebar** — three groups (`My Apps` / `Shared With Me` / `Marketplace`);
  clicking routes to `/apps/:id`. Active indicator uses a shared `layoutId`
  for a smooth transition between items.
- **Bottom sessions** — 6 recent generation sessions, clickable, horizontal
  scroll.
- **Prompt submit** — Enter or → button routes to `/generate?q=...` which
  animates the generation pipeline end-to-end.

## Structure

```
src/
├── components/
│   ├── galaxy/         # Core (pulsing), Orbit (static ring), Satellite (animated)
│   ├── layout/         # TopBar, Sidebar, BottomSessions, Layout
│   └── prompt/         # PromptBox
├── data/               # Static mock data (apps, sessions, satellites)
├── pages/              # HomePage, GeneratePage, AppDetailPage, MarketplacePage
├── types.ts
├── App.tsx
├── index.css
└── main.tsx
```

## Design tokens

All colors live in `tailwind.config.js` under `theme.extend.colors`.
The accent blue `#2563eb` is the single spotlight color — everything else
is black / white / line gray. To rebrand the prototype, change `accent`
and the whole app follows.

## Notes on the Galaxy animation

The orbit animation is **not** a CSS keyframe — it's computed every frame
from `framer-motion`'s `useTime` motion value. Each `Satellite` independently
calculates its `x` / `y` position:

```ts
const x = useTransform(time, t => Math.sin(angle(t)) * radius)
const y = useTransform(time, t => -Math.cos(angle(t)) * radius)
```

This lets every satellite have its own radius, speed, and direction without
any CSS choreography. The inner button never rotates, so the 2-char icon
always stays upright.
