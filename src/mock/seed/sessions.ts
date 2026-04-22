import type {
  CapDecision,
  LogLine,
  PolicyCheck,
  SecurityCheck,
  Session,
  SessionStage,
  StageName,
  StageStatus,
} from '@/types'
import { daysAgo, hoursAgo, minutesAgo } from './time'

type StageSeed = Omit<SessionStage, 'name'> & { name: StageName }

interface Row {
  id: string
  prompt: string
  status: Session['status']
  createdBy?: string
  createdAt: string
  finishedAt?: string
  resultAppId?: string
  resultVersionId?: string
  stages: StageSeed[]
}

function mk(row: Row): Session {
  const { createdBy = 'u-samzong', ...rest } = row
  return { tenantId: 'acme', createdBy, ...rest }
}

function passed(
  name: StageName,
  startedAt: string,
  finishedAt: string,
  artifact?: SessionStage['artifact'],
): StageSeed {
  return { name, status: 'passed', startedAt, finishedAt, artifact }
}

function stageWithStatus(
  name: StageName,
  status: StageStatus,
  startedAt: string,
  finishedAt: string | undefined,
  artifact?: SessionStage['artifact'],
  extras: Partial<StageSeed> = {},
): StageSeed {
  return { name, status, startedAt, finishedAt, artifact, ...extras }
}

function pendingStage(name: StageName): StageSeed {
  return { name, status: 'pending' }
}

const defaultGranted: CapDecision[] = [
  { cap: 'dce:alerts:read', reason: 'Prompt references alert data; read-only.' },
  { cap: 'feishu:messages:send', reason: 'Delivery target is a Feishu group.' },
]
const defaultDenied: CapDecision[] = [
  { cap: 'dce:secrets:read', reason: 'Not needed; no secret lookup in prompt.' },
]

const cleanScan: SecurityCheck[] = [
  { label: 'No secrets in code', result: 'pass', detail: 'Static scan found no inline credentials.' },
  { label: 'Egress allowlist', result: 'pass', detail: 'Only whitelisted hosts referenced.' },
  { label: 'Capability drift', result: 'pass', detail: 'Manifest matches inferred scope.' },
]

const warningScan: SecurityCheck[] = [
  { label: 'No secrets in code', result: 'pass', detail: 'Static scan found no inline credentials.' },
  { label: 'Egress allowlist', result: 'warn', detail: 'Unlisted host api.example.internal — auto-added with review note.' },
  { label: 'Capability drift', result: 'pass', detail: 'Manifest matches inferred scope.' },
]

const cleanPolicy: PolicyCheck[] = [
  { key: 'data.residency', value: 'cn', ok: true, note: 'Matches tenant region.' },
  { key: 'egress.domains', value: '*.acme.internal, open.feishu.cn', ok: true, note: 'Within allowlist.' },
  { key: 'cost.estimated_daily', value: '$0.12', ok: true, note: 'Under team budget.' },
]

const deniedPolicy: PolicyCheck[] = [
  { key: 'data.residency', value: 'cn', ok: true, note: 'Matches tenant region.' },
  { key: 'egress.domains', value: 'mail.public.example.com', ok: false, note: 'Not in egress allowlist; public SMTP blocked.' },
  { key: 'cost.estimated_daily', value: '$0.40', ok: true, note: 'Under team budget.' },
]

const cleanLogs: LogLine[] = [
  { t: '+0.02s', tag: 'sandbox', msg: 'bootstrap handler.ts in isolated vm' },
  { t: '+0.14s', tag: 'sandbox', msg: 'mock DCE client connected' },
  { t: '+0.62s', tag: 'runtime', msg: 'handler returned { ok: true, count: 12 }' },
  { t: '+0.65s', tag: 'sandbox', msg: 'exit 0' },
]

const sandboxFailLogs: LogLine[] = [
  { t: '+0.03s', tag: 'sandbox', msg: 'bootstrap handler.ts in isolated vm' },
  { t: '+0.19s', tag: 'runtime', msg: 'resolving crm:customers:read client' },
  { t: '+0.41s', tag: 'runtime', msg: 'TypeError: cannot read property segment of undefined' },
  { t: '+0.42s', tag: 'sandbox', msg: 'exit 1' },
]

function successStages(params: {
  base: string
  intent: Record<string, unknown>
  granted?: CapDecision[]
  denied?: CapDecision[]
  manifestYaml: string
  handlerTs: string
  scan?: SecurityCheck[]
  policy?: PolicyCheck[]
  logs?: LogLine[]
  buildId: string
  versionId: string
  scanStatus?: StageStatus
}): StageSeed[] {
  const t0 = params.base
  const t = (sec: number) => new Date(new Date(t0).getTime() + sec * 1000).toISOString()
  return [
    passed('parse', t0, t(2), { type: 'intent', json: params.intent }),
    passed('scope', t(2), t(6), {
      type: 'scope',
      granted: params.granted ?? defaultGranted,
      denied: params.denied ?? defaultDenied,
    }),
    passed('generate', t(6), t(22), {
      type: 'code',
      manifestYaml: params.manifestYaml,
      handlerTs: params.handlerTs,
    }),
    stageWithStatus(
      'scan',
      params.scanStatus ?? 'passed',
      t(22),
      t(30),
      { type: 'scan', checks: params.scan ?? cleanScan },
      params.scanStatus === 'warning'
        ? { warnings: ['Egress allowlist auto-extended; review before next deploy.'] }
        : {},
    ),
    passed('policy', t(30), t(34), {
      type: 'policy',
      checks: params.policy ?? cleanPolicy,
      verdict: 'auto',
    }),
    passed('sandbox', t(34), t(60), {
      type: 'sandbox',
      logs: params.logs ?? cleanLogs,
      exitCode: 0,
      durationMs: 650,
    }),
    passed('deploy', t(60), t(72), {
      type: 'deploy',
      buildId: params.buildId,
      artifactUri: `oci://registry.acme.internal/apps/${params.buildId}`,
      signed: true,
    }),
  ]
}

export const sessionsSeed: Session[] = [
  // ============ 8 full-success (one resultAppId='biz-cockpit') ============
  mk({
    id: 'sess-cockpit-gen',
    prompt:
      'Build a Token Factory operating cockpit: customer health score, risk alerts by severity, SLA compliance, and revenue settlement — single page, auto refresh 60s.',
    status: 'completed',
    createdAt: daysAgo(9),
    finishedAt: daysAgo(9),
    resultAppId: 'biz-cockpit',
    resultVersionId: 'v0.1',
    stages: successStages({
      base: daysAgo(9),
      intent: {
        goal: 'operating-cockpit',
        domain: 'token-factory',
        widgets: ['customer-health', 'risk-alerts', 'sla', 'revenue'],
        refreshSec: 60,
      },
      granted: [
        { cap: 'tf:customers:read', reason: 'Surface customer list and segments.' },
        { cap: 'tf:sla:read', reason: 'Compute SLA compliance.' },
        { cap: 'tf:billing:read', reason: 'Show revenue settlement.' },
        { cap: 'tf:audit:write', reason: 'Record cockpit view events.' },
      ],
      denied: [{ cap: 'tf:customers:write', reason: 'Cockpit is read-only.' }],
      manifestYaml:
        'kind: App\nname: biz-cockpit\nviewKind: dashboard\ncapabilities:\n  - tf:customers:read\n  - tf:sla:read\n  - tf:billing:read\n  - tf:audit:write\n',
      handlerTs:
        "export async function render(ctx) {\n  const [customers, sla, rev] = await Promise.all([\n    ctx.tf.customers.read({ segment: 'all' }),\n    ctx.tf.sla.read({ window: '30d' }),\n    ctx.tf.billing.read({ window: '30d' }),\n  ])\n  return { customers, sla, rev }\n}\n",
      buildId: 'bld-cockpit-001',
      versionId: 'v0.1',
    }),
  }),
  mk({
    id: 'sess-team-alerts',
    prompt: '每周一早 9 点给 platform 团队发本周 top 10 告警 + 当前 pod 健康状态',
    status: 'completed',
    createdAt: daysAgo(170),
    finishedAt: daysAgo(170),
    resultAppId: 'team-alert-dashboard',
    resultVersionId: 'v1.0',
    stages: successStages({
      base: daysAgo(170),
      intent: {
        goal: 'weekly-alert-digest',
        cron: '0 9 * * 1',
        team: 'platform',
        topN: 10,
      },
      manifestYaml:
        'kind: App\nname: team-alert-dashboard\nviewKind: dashboard\ncron: "0 9 * * 1"\ncapabilities:\n  - dce:alerts:read\n  - dce:pods:read\n  - dce:teams:read\n  - feishu:messages:send\n',
      handlerTs:
        "export async function run(ctx) {\n  const alerts = await ctx.dce.alerts.read({ window: '7d', top: 10 })\n  const pods = await ctx.dce.pods.read({ team: 'platform' })\n  await ctx.feishu.messages.send({ chatId: ctx.cfg.chatId, card: renderDigest(alerts, pods) })\n}\n",
      buildId: 'bld-alert-dash-001',
      versionId: 'v1.0',
    }),
  }),
  mk({
    id: 'sess-pr-review',
    prompt: 'When a PR is opened in acme/* repos, post an AI review summary to Feishu.',
    status: 'completed',
    createdAt: daysAgo(215),
    finishedAt: daysAgo(215),
    resultAppId: 'pr-review-bot',
    resultVersionId: 'v1.0',
    stages: successStages({
      base: daysAgo(215),
      intent: { goal: 'pr-review-assistant', trigger: 'github.webhook', orgFilter: 'acme/*' },
      granted: [
        { cap: 'github:pulls:read', reason: 'Fetch PR diff.' },
        { cap: 'github:reviews:write', reason: 'Post review comment.' },
        { cap: 'feishu:messages:send', reason: 'Send digest card.' },
      ],
      denied: [{ cap: 'github:issues:write', reason: 'Review flow does not touch issues.' }],
      manifestYaml:
        'kind: App\nname: pr-review-bot\nviewKind: notifier\ntrigger: github.webhook\ncapabilities:\n  - github:pulls:read\n  - github:reviews:write\n  - feishu:messages:send\n',
      handlerTs:
        "export async function onWebhook(ctx, event) {\n  if (event.action !== 'opened') return\n  const diff = await ctx.github.pulls.read({ number: event.number })\n  const summary = await ctx.llm.summarize(diff)\n  await ctx.github.reviews.write({ number: event.number, body: summary })\n  await ctx.feishu.messages.send({ chatId: ctx.cfg.chatId, text: summary })\n}\n",
      buildId: 'bld-pr-bot-001',
      versionId: 'v1.0',
    }),
  }),
  mk({
    id: 'sess-hr-leave',
    prompt: '快速提交休假申请：选日期 + 类型 + 原因，提交后自动触发飞书审批。',
    status: 'completed',
    createdAt: daysAgo(125),
    finishedAt: daysAgo(125),
    resultAppId: 'hr-leave-request',
    resultVersionId: 'v1.0',
    stages: successStages({
      base: daysAgo(125),
      intent: { goal: 'leave-request-form', fields: ['dateRange', 'type', 'reason'] },
      granted: [
        { cap: 'hr:leave:write', reason: 'Create leave record.' },
        { cap: 'feishu:approvals:send', reason: 'Launch approval flow.' },
      ],
      denied: [{ cap: 'hr:payroll:read', reason: 'Out of scope.' }],
      manifestYaml:
        'kind: App\nname: hr-leave-request\nviewKind: form\ncapabilities:\n  - hr:leave:write\n  - feishu:approvals:send\n',
      handlerTs:
        "export async function onSubmit(ctx, form) {\n  const rec = await ctx.hr.leave.write({ ...form, userId: ctx.user.id })\n  await ctx.feishu.approvals.send({ flowId: ctx.cfg.flowId, recId: rec.id })\n  return { ok: true, recId: rec.id }\n}\n",
      buildId: 'bld-hr-leave-001',
      versionId: 'v1.0',
    }),
  }),
  mk({
    id: 'sess-churn',
    prompt: 'Flag customers whose login drops 40% week-over-week AND open tickets > 3; notify CS lead.',
    status: 'completed',
    createdAt: daysAgo(48),
    finishedAt: daysAgo(48),
    resultAppId: 'customer-churn-early-warning',
    resultVersionId: 'v0.1',
    stages: successStages({
      base: daysAgo(48),
      intent: {
        goal: 'churn-warning',
        signals: ['login_wow_drop_40', 'open_tickets_gt_3'],
        notify: 'cs-lead',
      },
      granted: [
        { cap: 'crm:customers:read', reason: 'Segment customers.' },
        { cap: 'crm:deals:read', reason: 'Cross-check account health.' },
        { cap: 'feishu:messages:send', reason: 'Notify CS lead.' },
      ],
      denied: [{ cap: 'crm:customers:write', reason: 'Read-only warning app.' }],
      manifestYaml:
        'kind: App\nname: customer-churn-early-warning\nviewKind: notifier\ncron: "0 * * * *"\ncapabilities:\n  - crm:customers:read\n  - crm:deals:read\n  - feishu:messages:send\n',
      handlerTs:
        "export async function run(ctx) {\n  const at = await ctx.crm.customers.read({ segment: 'active' })\n  const flagged = at.filter((c) => c.loginWoW < -0.4 && c.openTickets > 3)\n  if (flagged.length) await ctx.feishu.messages.send({ chatId: ctx.cfg.csChatId, card: renderFlagged(flagged) })\n}\n",
      buildId: 'bld-churn-001',
      versionId: 'v0.1',
    }),
  }),
  mk({
    id: 'sess-migration-checklist',
    prompt: 'Create a migration checklist form: pre-check, backup, window, rollback plan.',
    status: 'completed',
    createdAt: daysAgo(95),
    finishedAt: daysAgo(95),
    resultAppId: 'migration-checklist-form',
    resultVersionId: 'v0.3',
    stages: successStages({
      base: daysAgo(95),
      intent: { goal: 'migration-checklist', sections: ['precheck', 'backup', 'window', 'rollback'] },
      granted: [
        { cap: 'dce:events:read', reason: 'Pull recent deploy events for context.' },
        { cap: 'feishu:messages:send', reason: 'Post checklist to oncall chat.' },
      ],
      denied: [],
      manifestYaml:
        'kind: App\nname: migration-checklist-form\nviewKind: form\ncapabilities:\n  - dce:events:read\n  - feishu:messages:send\n',
      handlerTs:
        "export async function onSubmit(ctx, form) {\n  await ctx.feishu.messages.send({ chatId: ctx.cfg.oncallChatId, card: renderChecklist(form) })\n  return { ok: true }\n}\n",
      buildId: 'bld-mig-001',
      versionId: 'v0.3',
    }),
  }),
  mk({
    id: 'sess-release-notes',
    prompt: 'Collect merged PRs in the last 7 days across acme/* and draft release notes grouped by component.',
    status: 'completed',
    createdBy: 'u-leah',
    createdAt: daysAgo(35),
    finishedAt: daysAgo(35),
    resultAppId: 'release-notes-gen',
    resultVersionId: 'v1.0',
    stages: successStages({
      base: daysAgo(35),
      intent: { goal: 'release-notes', window: '7d', groupBy: 'component' },
      granted: [
        { cap: 'github:pulls:read', reason: 'Read merged PR list.' },
        { cap: 'github:commits:read', reason: 'Enrich commit data.' },
      ],
      denied: [],
      manifestYaml:
        'kind: App\nname: release-notes-gen\nviewKind: report\ncron: "0 17 * * 5"\ncapabilities:\n  - github:pulls:read\n  - github:commits:read\n',
      handlerTs:
        "export async function run(ctx) {\n  const prs = await ctx.github.pulls.read({ state: 'merged', window: '7d' })\n  return { markdown: render(prs) }\n}\n",
      buildId: 'bld-rel-notes-001',
      versionId: 'v1.0',
    }),
  }),
  mk({
    id: 'sess-ns-watch',
    prompt: '当 namespace 里的 HPA 扩缩容超过 3 次 / 小时, 推送到飞书 oncall 群',
    status: 'completed',
    createdAt: daysAgo(60),
    finishedAt: daysAgo(60),
    resultAppId: 'k8s-ns-watcher',
    resultVersionId: 'v0.2',
    stages: successStages({
      base: daysAgo(60),
      intent: { goal: 'hpa-thrash-alert', threshold: 3, window: '1h' },
      granted: [
        { cap: 'dce:namespaces:watch', reason: 'Subscribe to namespace events.' },
        { cap: 'dce:events:read', reason: 'Enumerate HPA scaling events.' },
        { cap: 'feishu:messages:send', reason: 'Notify oncall group.' },
      ],
      denied: [{ cap: 'dce:deploys:write', reason: 'Not authorized to mutate deploys.' }],
      manifestYaml:
        'kind: App\nname: k8s-ns-watcher\nviewKind: notifier\ntrigger: stream\ncapabilities:\n  - dce:namespaces:watch\n  - dce:events:read\n  - feishu:messages:send\n',
      handlerTs:
        "export async function onEvent(ctx, ev) {\n  const c = ctx.state.counter.inc(ev.ns, '1h')\n  if (c > 3) await ctx.feishu.messages.send({ chatId: ctx.cfg.oncall, text: `HPA thrash in ${ev.ns}` })\n}\n",
      buildId: 'bld-ns-watch-001',
      versionId: 'v0.2',
    }),
  }),

  // ============ 2 scan warning (completed but with warnings) ============
  mk({
    id: 'sess-warn-egress',
    prompt: 'Summarize MySQL slow query log every hour and push the top offenders to Feishu.',
    status: 'completed',
    createdAt: daysAgo(22),
    finishedAt: daysAgo(22),
    resultAppId: 'slow-query-digest',
    resultVersionId: 'v0.1',
    stages: successStages({
      base: daysAgo(22),
      intent: { goal: 'slow-query-digest', window: '1h' },
      granted: [
        { cap: 'dce:metrics:read', reason: 'Query slow-log aggregates.' },
        { cap: 'feishu:messages:send', reason: 'Deliver digest.' },
      ],
      denied: [],
      manifestYaml:
        'kind: App\nname: slow-query-digest\nviewKind: report\ncron: "0 * * * *"\ncapabilities:\n  - dce:metrics:read\n  - feishu:messages:send\n',
      handlerTs:
        "export async function run(ctx) {\n  const rows = await ctx.dce.metrics.read({ q: 'mysql_slow_top5' })\n  await ctx.feishu.messages.send({ chatId: ctx.cfg.chatId, card: renderTop(rows) })\n}\n",
      scan: warningScan,
      scanStatus: 'warning',
      buildId: 'bld-slow-q-001',
      versionId: 'v0.1',
    }),
  }),
  mk({
    id: 'sess-warn-drift',
    prompt: 'Detect Terraform drift daily across all acme workspaces and summarize diffs.',
    status: 'completed',
    createdBy: 'u-marcus',
    createdAt: daysAgo(14),
    finishedAt: daysAgo(14),
    resultAppId: 'terraform-drift-detector',
    resultVersionId: 'v0.5',
    stages: successStages({
      base: daysAgo(14),
      intent: { goal: 'tf-drift-daily', window: '24h' },
      granted: [
        { cap: 'github:commits:read', reason: 'Cross-reference config commits.' },
        { cap: 'feishu:messages:send', reason: 'Deliver drift summary.' },
      ],
      denied: [{ cap: 'dce:deploys:write', reason: 'Drift detector is read-only.' }],
      manifestYaml:
        'kind: App\nname: terraform-drift-detector\nviewKind: report\ncron: "0 8 * * *"\ncapabilities:\n  - github:commits:read\n  - feishu:messages:send\n',
      handlerTs:
        "export async function run(ctx) {\n  const diffs = await ctx.ext.tf.plan({ workspaces: ctx.cfg.workspaces })\n  if (diffs.length) await ctx.feishu.messages.send({ chatId: ctx.cfg.chatId, card: renderDrift(diffs) })\n}\n",
      scan: [
        { label: 'No secrets in code', result: 'pass', detail: 'Clean.' },
        { label: 'Egress allowlist', result: 'pass', detail: 'All hosts in allowlist.' },
        {
          label: 'Capability drift',
          result: 'warn',
          detail:
            'Manifest lists github:commits:read but handler uses ext.tf.plan — external tool usage noted.',
        },
      ],
      scanStatus: 'warning',
      buildId: 'bld-tf-drift-001',
      versionId: 'v0.5',
    }),
  }),

  // ============ 1 policy denied ============
  mk({
    id: 'sess-policy-denied',
    prompt:
      'Email the weekly CRM pipeline digest to every customer success rep at their personal email address.',
    status: 'failed',
    createdBy: 'u-leah',
    createdAt: daysAgo(6),
    finishedAt: daysAgo(6),
    stages: (() => {
      const base = daysAgo(6)
      const t = (sec: number) => new Date(new Date(base).getTime() + sec * 1000).toISOString()
      return [
        passed('parse', base, t(2), {
          type: 'intent',
          json: { goal: 'weekly-crm-digest', recipients: 'all-cs-personal-email' },
        }),
        passed('scope', t(2), t(6), {
          type: 'scope',
          granted: [
            { cap: 'crm:sales:read', reason: 'Build pipeline digest.' },
            { cap: 'crm:customers:read', reason: 'Enrich with customer names.' },
          ],
          denied: [{ cap: 'crm:customers:write', reason: 'Not needed.' }],
        }),
        passed('generate', t(6), t(24), {
          type: 'code',
          manifestYaml:
            'kind: App\nname: crm-weekly-digest\nviewKind: report\ncron: "0 18 * * 5"\ncapabilities:\n  - crm:sales:read\n  - crm:customers:read\n  - egress: mail.public.example.com\n',
          handlerTs:
            "export async function run(ctx) {\n  const rows = await ctx.crm.sales.read({ window: '7d' })\n  await ctx.ext.smtp.send({ host: 'mail.public.example.com', to: ctx.cfg.emails, body: render(rows) })\n}\n",
        }),
        passed('scan', t(24), t(30), { type: 'scan', checks: cleanScan }),
        stageWithStatus(
          'policy',
          'failed',
          t(30),
          t(36),
          { type: 'policy', checks: deniedPolicy, verdict: 'denied' },
          {
            errorMessage:
              'Policy violation: egress to public SMTP (mail.public.example.com) is not on the allowlist.',
          },
        ),
        pendingStage('sandbox'),
        pendingStage('deploy'),
      ]
    })(),
  }),

  // ============ 2 sandbox failed ============
  mk({
    id: 'sess-sandbox-typeerr',
    prompt: 'Aggregate customer segments from CRM and render a churn heatmap by region.',
    status: 'failed',
    createdAt: daysAgo(11),
    finishedAt: daysAgo(11),
    stages: (() => {
      const base = daysAgo(11)
      const t = (sec: number) => new Date(new Date(base).getTime() + sec * 1000).toISOString()
      return [
        passed('parse', base, t(2), {
          type: 'intent',
          json: { goal: 'churn-heatmap', groupBy: 'region' },
        }),
        passed('scope', t(2), t(6), {
          type: 'scope',
          granted: [
            { cap: 'crm:customers:read', reason: 'Segment customers.' },
            { cap: 'crm:reports:read', reason: 'Reuse saved reports.' },
          ],
          denied: [],
        }),
        passed('generate', t(6), t(22), {
          type: 'code',
          manifestYaml:
            'kind: App\nname: churn-heatmap\nviewKind: dashboard\ncapabilities:\n  - crm:customers:read\n  - crm:reports:read\n',
          handlerTs:
            "export async function render(ctx) {\n  const rows = await ctx.crm.customers.read({ segment: 'active' })\n  return { heatmap: rows.map((r) => r.region.segment) }\n}\n",
        }),
        passed('scan', t(22), t(30), { type: 'scan', checks: cleanScan }),
        passed('policy', t(30), t(34), { type: 'policy', checks: cleanPolicy, verdict: 'auto' }),
        stageWithStatus(
          'sandbox',
          'failed',
          t(34),
          t(40),
          { type: 'sandbox', logs: sandboxFailLogs, exitCode: 1, durationMs: 420 },
          {
            errorMessage:
              'Sandbox: TypeError at handler.ts:3 — `r.region.segment` read on undefined. Regenerate with guard.',
          },
        ),
        pendingStage('deploy'),
      ]
    })(),
  }),
  mk({
    id: 'sess-sandbox-timeout',
    prompt: 'Scrape every GitHub issue across acme/* and cluster by topic using embeddings.',
    status: 'failed',
    createdBy: 'u-marcus',
    createdAt: daysAgo(3),
    finishedAt: daysAgo(3),
    stages: (() => {
      const base = daysAgo(3)
      const t = (sec: number) => new Date(new Date(base).getTime() + sec * 1000).toISOString()
      return [
        passed('parse', base, t(2), {
          type: 'intent',
          json: { goal: 'issue-clustering', orgFilter: 'acme/*' },
        }),
        passed('scope', t(2), t(6), {
          type: 'scope',
          granted: [{ cap: 'github:issues:read', reason: 'Read full issue set.' }],
          denied: [],
        }),
        passed('generate', t(6), t(22), {
          type: 'code',
          manifestYaml:
            'kind: App\nname: issue-clusterer\nviewKind: report\ncapabilities:\n  - github:issues:read\n',
          handlerTs:
            "export async function run(ctx) {\n  const all = await ctx.github.issues.read({ state: 'all' })\n  return { clusters: await ctx.llm.cluster(all) }\n}\n",
        }),
        passed('scan', t(22), t(30), { type: 'scan', checks: cleanScan }),
        passed('policy', t(30), t(34), { type: 'policy', checks: cleanPolicy, verdict: 'auto' }),
        stageWithStatus(
          'sandbox',
          'failed',
          t(34),
          t(94),
          {
            type: 'sandbox',
            logs: [
              { t: '+0.05s', tag: 'sandbox', msg: 'bootstrap handler.ts' },
              { t: '+0.41s', tag: 'runtime', msg: 'fetching issues page 1/?' },
              { t: '+38.2s', tag: 'runtime', msg: 'still fetching (page 42)…' },
              { t: '+60.0s', tag: 'sandbox', msg: 'wall-clock limit exceeded; killing vm' },
            ],
            exitCode: 124,
            durationMs: 60000,
          },
          {
            errorMessage:
              'Sandbox: timed out at 60s. Add pagination cap or run as Execution with longer budget.',
          },
        ),
        pendingStage('deploy'),
      ]
    })(),
  }),

  // ============ 1 cancelled mid-flow ============
  mk({
    id: 'sess-cancelled',
    prompt: 'Draft a mail-merge that sends each customer a custom renewal quote PDF.',
    status: 'cancelled',
    createdAt: hoursAgo(26),
    finishedAt: hoursAgo(25),
    stages: (() => {
      const base = hoursAgo(26)
      const t = (sec: number) => new Date(new Date(base).getTime() + sec * 1000).toISOString()
      return [
        passed('parse', base, t(2), {
          type: 'intent',
          json: { goal: 'renewal-quote-merge', delivery: 'email+pdf' },
        }),
        passed('scope', t(2), t(8), {
          type: 'scope',
          granted: [
            { cap: 'crm:customers:read', reason: 'Read recipient list.' },
            { cap: 'crm:deals:read', reason: 'Pull renewal terms.' },
          ],
          denied: [{ cap: 'crm:customers:write', reason: 'Not needed.' }],
        }),
        stageWithStatus(
          'generate',
          'failed',
          t(8),
          t(14),
          undefined,
          { errorMessage: 'User cancelled during generate review.' },
        ),
        pendingStage('scan'),
        pendingStage('policy'),
        pendingStage('sandbox'),
        pendingStage('deploy'),
      ]
    })(),
  }),

  // ============ 1 draft (only parse) ============
  mk({
    id: 'sess-draft-parse',
    prompt: 'Every morning, remind me of tasks older than 3 days assigned to me in Jira.',
    status: 'running',
    createdAt: minutesAgo(12),
    stages: [
      stageWithStatus(
        'parse',
        'passed',
        minutesAgo(12),
        minutesAgo(11),
        {
          type: 'intent',
          json: {
            goal: 'stale-task-reminder',
            cron: '0 9 * * *',
            filter: { assignee: 'me', olderThanDays: 3 },
          },
        },
      ),
      pendingStage('scope'),
      pendingStage('generate'),
      pendingStage('scan'),
      pendingStage('policy'),
      pendingStage('sandbox'),
      pendingStage('deploy'),
    ],
  }),
]
