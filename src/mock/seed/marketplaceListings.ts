import type { MarketplaceListing } from '@/types'
import { daysAgo } from './time'

interface MkListingInput {
  appId: string
  publisherId: string
  publishedAt: string
  stars: number
  forks: number
  subscribers: number
  reviews: { count: number; avg: number }
  about: string
  highlights: string[]
  tags: string[]
  versionLog: Array<{ version: string; date: string; note: string }>
}

function mkListing(input: MkListingInput): MarketplaceListing {
  return {
    id: input.appId,
    tenantId: 'acme',
    appId: input.appId,
    publisherId: input.publisherId,
    publishedAt: input.publishedAt,
    stars: input.stars,
    forks: input.forks,
    subscribers: input.subscribers,
    reviews: input.reviews,
    about: input.about,
    highlights: input.highlights,
    tags: input.tags,
    versionLog: input.versionLog,
  }
}

export const marketplaceListingsSeed: MarketplaceListing[] = [
  mkListing({
    appId: 'code-review-helper',
    publisherId: 'u-samzong',
    publishedAt: daysAgo(370),
    stars: 1200,
    forks: 84,
    subscribers: 312,
    reviews: { count: 47, avg: 4.6 },
    about:
      'Code Review Helper pairs your pull requests with an LLM-driven reviewer tuned for enterprise style guides. It inlines suggestions on the diff, flags risky changes, and auto-generates a reviewer checklist for the human to sign off.',
    highlights: [
      'Multi-language coverage (TS/Go/Rust/Python/Java)',
      'Pluggable rule presets — bring your own style guide',
      'Inline suggestions written back to the PR',
      'Audited decisions with per-file rationale',
    ],
    tags: ['github', 'code-review', 'llm', 'official'],
    versionLog: [
      { version: 'v3.4', date: daysAgo(14), note: 'Add Rust preset + Feishu digest' },
      { version: 'v3.3', date: daysAgo(45), note: 'Tune heuristics for monorepo PRs' },
      { version: 'v3.2', date: daysAgo(92), note: 'Add Jira link resolution' },
      { version: 'v3.0', date: daysAgo(180), note: 'New reviewer persona system' },
    ],
  }),
  mkListing({
    appId: 'release-notes-gen',
    publisherId: 'u-leah',
    publishedAt: daysAgo(305),
    stars: 890,
    forks: 61,
    subscribers: 214,
    reviews: { count: 28, avg: 4.4 },
    about:
      'Turn a messy changelog into a clean, marketing-ready release note. Groups commits by type, surfaces breaking changes, and drafts a headline summary you can edit before publish.',
    highlights: [
      'Conventional-commit + squash-merge aware',
      'Headline summary via LLM with tone presets',
      'Diff-level grouping (feat/fix/docs/chore)',
      'One-click publish to GitHub Releases',
    ],
    tags: ['github', 'release', 'automation', 'community'],
    versionLog: [
      { version: 'v2.0', date: daysAgo(20), note: 'Breaking-change callout block' },
      { version: 'v1.6', date: daysAgo(78), note: 'Feishu post-release broadcast' },
      { version: 'v1.4', date: daysAgo(140), note: 'Tone preset: casual / formal / terse' },
    ],
  }),
  mkListing({
    appId: 'bug-triage-bot',
    publisherId: 'u-marcus',
    publishedAt: daysAgo(255),
    stars: 560,
    forks: 38,
    subscribers: 97,
    reviews: { count: 15, avg: 4.1 },
    about:
      'Incoming bug reports get labelled, priority-scored, and assigned to the right squad within seconds. Runs against any GitHub repository and respects your team taxonomy.',
    highlights: [
      'Labels and priorities inferred from reproduction steps',
      'Squad routing via CODEOWNERS + on-call rota',
      'Auto-ping the reporter for missing reproduction info',
    ],
    tags: ['github', 'triage', 'bot', 'community'],
    versionLog: [
      { version: 'v1.5', date: daysAgo(30), note: 'Respect on-call rotation' },
      { version: 'v1.3', date: daysAgo(90), note: 'CODEOWNERS-based routing' },
      { version: 'v1.0', date: daysAgo(255), note: 'Initial release' },
    ],
  }),
  mkListing({
    appId: 'terraform-drift-detector',
    publisherId: 'u-samzong',
    publishedAt: daysAgo(410),
    stars: 3400,
    forks: 186,
    subscribers: 640,
    reviews: { count: 82, avg: 4.8 },
    about:
      'Nightly terraform plan across every registered workspace. Drift is packaged into a diff-annotated PR so humans can approve or remediate in one click.',
    highlights: [
      'Drift digest summarised per workspace',
      'Plan output stored signed and tamper-evident',
      'One-click remediate or ignore per-resource',
      'Escalation to on-call when plan > threshold',
    ],
    tags: ['terraform', 'infra', 'drift', 'official'],
    versionLog: [
      { version: 'v4.1', date: daysAgo(15), note: 'Multi-workspace parallel plans' },
      { version: 'v4.0', date: daysAgo(60), note: 'Signed plan artefacts' },
      { version: 'v3.4', date: daysAgo(140), note: 'One-click remediation flow' },
    ],
  }),
  mkListing({
    appId: 'capacity-planner',
    publisherId: 'u-samzong',
    publishedAt: daysAgo(495),
    stars: 12000,
    forks: 520,
    subscribers: 2180,
    reviews: { count: 240, avg: 4.7 },
    about:
      'Ninety-day compute and storage projections with confidence bands, derived from live metrics. Export an ops-ready plan to Google Docs, Notion, or plain Markdown.',
    highlights: [
      'Heteroscedastic forecast with 80/95/99 CIs',
      'Scenario planner — what-if knobs for growth',
      'Ops-ready export — GDocs / Notion / Markdown',
      'Cost attribution by team and cost-centre',
    ],
    tags: ['capacity', 'forecast', 'finops', 'official'],
    versionLog: [
      { version: 'v2.7', date: daysAgo(25), note: 'Team-level cost attribution' },
      { version: 'v2.5', date: daysAgo(110), note: 'What-if scenario sliders' },
      { version: 'v2.0', date: daysAgo(280), note: 'Heteroscedastic CI bands' },
    ],
  }),
  mkListing({
    appId: 'jira-sync-bridge',
    publisherId: 'u-leah',
    publishedAt: daysAgo(135),
    stars: 180,
    forks: 14,
    subscribers: 46,
    reviews: { count: 9, avg: 3.9 },
    about:
      'Two-way sync between GitHub Issues and a Jira project. Preserves labels, assignees, and comment threads; lets engineers stay in GitHub while PMs stay in Jira.',
    highlights: [
      'Two-way state sync with conflict markers',
      'Comment-thread preservation',
      'Webhook + polling fallback for reliability',
    ],
    tags: ['github', 'jira', 'sync', 'community'],
    versionLog: [
      { version: 'v1.2', date: daysAgo(8), note: 'Conflict marker support' },
      { version: 'v1.1', date: daysAgo(58), note: 'Poll fallback when webhook delayed' },
      { version: 'v1.0', date: daysAgo(135), note: 'Initial release' },
    ],
  }),
  mkListing({
    appId: 'commit-author-heatmap',
    publisherId: 'u-leah',
    publishedAt: daysAgo(78),
    stars: 42,
    forks: 3,
    subscribers: 8,
    reviews: { count: 2, avg: 4.5 },
    about:
      'Visualise commit activity by author and time of day across selected repositories. Great for surfacing hidden contributor patterns or spotting single-points-of-knowledge.',
    highlights: [
      'Author-by-hour heatmap',
      'Per-repo and per-org rollups',
      'PNG / SVG export',
    ],
    tags: ['github', 'visualization', 'report', 'community'],
    versionLog: [
      { version: 'v0.8', date: daysAgo(18), note: 'Org-wide rollup' },
      { version: 'v0.5', date: daysAgo(60), note: 'Per-hour granularity' },
    ],
  }),
  mkListing({
    appId: 'standup-organizer',
    publisherId: 'u-marcus',
    publishedAt: daysAgo(185),
    stars: 720,
    forks: 52,
    subscribers: 168,
    reviews: { count: 22, avg: 4.3 },
    about:
      'Collect async standup updates via a daily Feishu form. Digest is auto-posted in the team channel with a blockers-first ordering.',
    highlights: [
      'Async form collection — no interruption',
      'Blockers surfaced first in the digest',
      'Per-timezone window for distributed teams',
    ],
    tags: ['feishu', 'standup', 'form', 'community'],
    versionLog: [
      { version: 'v1.0', date: daysAgo(35), note: 'Timezone-aware collection windows' },
      { version: 'v0.8', date: daysAgo(120), note: 'Blockers-first digest' },
    ],
  }),
]
