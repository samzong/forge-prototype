import type {
  CapDecision,
  LogLine,
  PolicyCheck,
  SecurityCheck,
  Session,
  SessionStage,
  StageArtifact,
  StageName,
} from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { sessionsSeed } from './seed/sessions'
import { createApp } from './apps'
import { createAppVersion } from './appVersions'
import { recordAuditEvent } from './auditEvents'
import {
  type DriverHooks,
  resumeAfterConfirm,
  startDriver,
  stopDriver,
} from './sessionDriver'

const store = createStore<Session>(sessionsSeed)

export interface SessionQuery {
  page?: number
  size?: number
  status?: Session['status']
  createdBy?: string
  resultAppId?: string
  search?: string
  sort?: 'createdAt-desc' | 'createdAt-asc'
}

function buildListQuery(q: SessionQuery = {}): ListQuery<Session> {
  const needle = q.search?.trim().toLowerCase()
  return {
    page: q.page,
    size: q.size,
    filter: (s) => {
      if (q.status && s.status !== q.status) return false
      if (q.createdBy && s.createdBy !== q.createdBy) return false
      if (q.resultAppId && s.resultAppId !== q.resultAppId) return false
      if (needle && !s.prompt.toLowerCase().includes(needle)) return false
      return true
    },
    sort: (a, b) => {
      const cmp = a.createdAt.localeCompare(b.createdAt)
      return q.sort === 'createdAt-asc' ? cmp : -cmp
    },
  }
}

export async function listSessions(query: SessionQuery = {}): Promise<ListResult<Session>> {
  await jitter()
  const err = shouldInject('sessions', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getSession(id: string): Promise<Session | null> {
  await jitter()
  const err = shouldInject('sessions', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

const DEFAULT_GRANTED: CapDecision[] = [
  { cap: 'dce:alerts:read', reason: 'Prompt references observability data; read-only.' },
  { cap: 'feishu:messages:send', reason: 'Delivery target inferred as Feishu group.' },
]

const DEFAULT_DENIED: CapDecision[] = [
  { cap: 'dce:secrets:read', reason: 'Not referenced in prompt; principle of least privilege.' },
]

const DEFAULT_SCAN: SecurityCheck[] = [
  { label: 'No secrets in code', result: 'pass', detail: 'Static scan found no inline credentials.' },
  { label: 'Egress allowlist', result: 'pass', detail: 'Only whitelisted hosts referenced.' },
  { label: 'Capability drift', result: 'pass', detail: 'Manifest matches inferred scope.' },
]

const DEFAULT_POLICY: PolicyCheck[] = [
  { key: 'data.residency', value: 'cn', ok: true, note: 'Matches tenant region.' },
  { key: 'egress.domains', value: '*.acme.internal, open.feishu.cn', ok: true, note: 'Within allowlist.' },
  { key: 'cost.estimated_daily', value: '$0.18', ok: true, note: 'Under team budget.' },
]

const DEFAULT_LOGS: LogLine[] = [
  { t: '+0.02s', tag: 'sandbox', msg: 'bootstrap handler.ts in isolated vm' },
  { t: '+0.14s', tag: 'sandbox', msg: 'mock DCE client connected' },
  { t: '+0.62s', tag: 'runtime', msg: 'handler returned { ok: true }' },
  { t: '+0.65s', tag: 'sandbox', msg: 'exit 0' },
]

const STAGE_ORDER: StageName[] = [
  'parse',
  'scope',
  'generate',
  'scan',
  'policy',
  'sandbox',
  'deploy',
]

function makePendingStages(): SessionStage[] {
  return STAGE_ORDER.map((name) => ({ name, status: 'pending' }))
}

function slugFromPrompt(prompt: string, seed: string): string {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join('-')
    .slice(0, 32)
  const suffix = seed.slice(-6)
  return slug ? `${slug}-${suffix}` : `custom-app-${suffix}`
}

function titleFromPrompt(prompt: string): string {
  const trimmed = prompt.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= 60) return trimmed
  return `${trimmed.slice(0, 57)}...`
}

function artifactFor(name: StageName, session: Session): StageArtifact | undefined {
  switch (name) {
    case 'parse':
      return {
        type: 'intent',
        json: {
          goal: 'custom-app',
          promptPreview: session.prompt.slice(0, 120),
        },
      }
    case 'scope':
      return {
        type: 'scope',
        granted: DEFAULT_GRANTED,
        denied: DEFAULT_DENIED,
      }
    case 'generate': {
      const slug = slugFromPrompt(session.prompt, session.id)
      const manifestYaml =
        `kind: App\n` +
        `name: ${slug}\n` +
        `viewKind: dashboard\n` +
        `capabilities:\n` +
        DEFAULT_GRANTED.map((g) => `  - ${g.cap}`).join('\n') +
        `\n`
      const handlerTs =
        `export async function run(ctx) {\n` +
        `  // generated from user intent\n` +
        `  const data = await ctx.dce.alerts.read({ window: '1h' })\n` +
        `  await ctx.feishu.messages.send({ chatId: ctx.cfg.chatId, card: data })\n` +
        `  return { ok: true, count: data.length }\n` +
        `}\n`
      return { type: 'code', manifestYaml, handlerTs }
    }
    case 'scan':
      return { type: 'scan', checks: DEFAULT_SCAN }
    case 'policy':
      return { type: 'policy', checks: DEFAULT_POLICY, verdict: 'auto' }
    case 'sandbox':
      return { type: 'sandbox', logs: DEFAULT_LOGS, exitCode: 0, durationMs: 650 }
    case 'deploy': {
      const slug = slugFromPrompt(session.prompt, session.id)
      return {
        type: 'deploy',
        buildId: `bld-${session.id.slice(-8)}`,
        artifactUri: `oci://registry.acme.internal/apps/${slug}`,
        signed: true,
      }
    }
  }
}

async function onDeployComplete(session: Session): Promise<void> {
  const appId = slugFromPrompt(session.prompt, session.id)
  const versionId = `${appId}-v0.1`
  const nowIso = new Date().toISOString()

  const scopeStage = session.stages.find((s) => s.name === 'scope')
  const capabilities =
    scopeStage?.artifact?.type === 'scope'
      ? scopeStage.artifact.granted.map((g) => g.cap)
      : []

  const generateStage = session.stages.find((s) => s.name === 'generate')
  const handlerTs =
    generateStage?.artifact?.type === 'code' ? generateStage.artifact.handlerTs : ''

  await createApp({
    id: appId,
    tenantId: session.tenantId,
    name: titleFromPrompt(session.prompt),
    icon: '⚡',
    description: session.prompt.slice(0, 200),
    status: 'running',
    group: 'mine',
    viewKind: 'dashboard',
    ownerId: session.createdBy,
    currentVersion: 'v0.1',
    capabilities,
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  await createAppVersion({
    id: versionId,
    tenantId: session.tenantId,
    appId,
    version: 'v0.1',
    createdBy: session.createdBy,
    sessionId: session.id,
    manifest: {
      runtimeIdentity: 'invoker',
      capabilities,
    },
    handlerSource: handlerTs,
    changeNote: 'Initial generation',
  })

  store.update(session.id, {
    resultAppId: appId,
    resultVersionId: versionId,
  })

  recordAuditEvent({
    tenantId: session.tenantId,
    appId,
    action: 'deploy',
    actorId: session.createdBy,
    targetVersionId: versionId,
    note: 'Generated via Forge session.',
    metadata: { sessionId: session.id },
  })
}

function driverHooks(): DriverHooks {
  return { store, artifactFor, onDeployComplete }
}

export interface CreateSessionOptions {
  createdBy?: string
  tenantId?: string
}

export async function createSession(
  prompt: string,
  opts: CreateSessionOptions = {},
): Promise<Session> {
  await jitter()
  const err = shouldInject('sessions', 'create')
  if (err) throw err
  const now = new Date().toISOString()
  const id = `sess-${Math.random().toString(36).slice(2, 10)}`
  const session: Session = {
    id,
    tenantId: opts.tenantId ?? 'acme',
    createdBy: opts.createdBy ?? 'u-samzong',
    prompt,
    status: 'running',
    createdAt: now,
    stages: makePendingStages(),
  }
  store.create(session)
  startDriver(id, driverHooks())
  return session
}

export async function confirmScope(sessionId: string): Promise<Session> {
  await jitter()
  const err = shouldInject('sessions', 'confirm')
  if (err) throw err
  const session = store.get(sessionId)
  if (!session) throw new Error(`confirmScope: session "${sessionId}" not found`)
  if (session.status !== 'awaiting-confirm') {
    throw new Error(
      `confirmScope: session "${sessionId}" not awaiting confirm (status=${session.status})`,
    )
  }
  resumeAfterConfirm(sessionId, driverHooks())
  const next = store.get(sessionId)
  if (!next) throw new Error(`confirmScope: session "${sessionId}" vanished after resume`)
  return next
}

export async function cancelSession(sessionId: string): Promise<void> {
  await jitter()
  const err = shouldInject('sessions', 'cancel')
  if (err) throw err
  stopDriver(sessionId)
  const session = store.get(sessionId)
  if (!session) return
  store.update(sessionId, {
    status: 'cancelled',
    finishedAt: new Date().toISOString(),
  })
}
