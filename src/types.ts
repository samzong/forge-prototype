// ============================================================================
// Tenant
// ============================================================================

export type HostSystemKind = 'dce' | 'crm' | 'hr'
export type TenantStatus = 'active' | 'suspended'

export interface Tenant {
  id: string
  name: string
  hostSystemKind: HostSystemKind
  status: TenantStatus
  createdAt: string
}

// ============================================================================
// User
// ============================================================================

export type Role = 'user' | 'team-manager' | 'admin'

export interface User {
  id: string
  tenantId: string
  username: string
  displayName: string
  email: string
  avatar?: string
  primaryTeamId: string
  teamIds: string[]
  roles: Role[]
  createdAt: string
}

// ============================================================================
// App
// ============================================================================

export type AppViewKind = 'dashboard' | 'notifier' | 'report' | 'form' | 'bot'
export type AppStatus = 'draft' | 'running' | 'stopped' | 'failed' | 'deployed'
export type AppGroup = 'mine' | 'shared' | 'marketplace'
export type AppSource = 'dce-official' | 'community' | 'private'

export interface App {
  id: string
  tenantId: string
  name: string
  icon: string
  description: string
  status: AppStatus
  group: AppGroup
  viewKind: AppViewKind

  ownerId: string
  teamId?: string

  currentVersion: string
  capabilities: string[]

  createdAt: string
  updatedAt: string
  lastRunAt?: string

  sharedWithUserIds?: string[]
  sharedWithTeamIds?: string[]
  relation?: 'subscribed' | 'forked'
  forkedFromAppId?: string
  forkedFromVersionId?: string

  stars?: number
  source?: AppSource
  publishedAt?: string

  /** @deprecated Remove in Sprint 3.5 when cockpit is rewritten as a dashboard renderer. */
  embedUrl?: string
}

// ============================================================================
// AppVersion + AppManifest
// ============================================================================

export interface TriggerDef {
  type: 'webhook' | 'schedule' | 'event'
  config: Record<string, unknown>
}

export interface AppManifest {
  runtimeIdentity: 'invoker' | 'service-account'
  capabilities: string[]
  schedule?: string
  triggers?: TriggerDef[]
  dataRetention?: 'none' | '7d' | '30d' | '90d'
}

export interface AppVersion {
  id: string
  tenantId: string
  appId: string
  version: string
  createdAt: string
  createdBy: string
  sessionId?: string

  manifest: AppManifest
  handlerSource: string

  changeNote?: string
  isRollback?: boolean
  rolledBackFromVersionId?: string
}

// ============================================================================
// Execution + ExecutionLog
// ============================================================================

export type ExecutionStatus = 'running' | 'succeeded' | 'failed' | 'timeout' | 'cancelled'
export type ExecutionTrigger = 'manual' | 'schedule' | 'webhook' | 'test'
export type ExecutionLogLevel = 'debug' | 'info' | 'warn' | 'error'
export type ExecutionLogTag = 'sandbox' | 'runtime' | 'cli' | 'render' | 'result' | 'user'

export interface Execution {
  id: string
  tenantId: string
  appId: string
  versionId: string
  status: ExecutionStatus
  trigger: ExecutionTrigger
  triggeredBy?: string
  startedAt: string
  finishedAt?: string
  durationMs?: number
  exitCode?: number
  outputSummary?: string
  errorMessage?: string
}

export interface ExecutionLog {
  id: string
  executionId: string
  timestamp: string
  level: ExecutionLogLevel
  tag: ExecutionLogTag
  message: string
}

// ============================================================================
// Session + SessionStage
// ============================================================================

export type SessionStatus =
  | 'running'
  | 'awaiting-confirm'
  | 'completed'
  | 'failed'
  | 'cancelled'
export type StageName =
  | 'parse'
  | 'scope'
  | 'generate'
  | 'scan'
  | 'policy'
  | 'sandbox'
  | 'deploy'
export type StageStatus = 'pending' | 'running' | 'passed' | 'warning' | 'failed'

export interface CapDecision {
  cap: string
  reason: string
}

export interface SecurityCheck {
  label: string
  result: 'pass' | 'warn' | 'fail'
  detail: string
}

export interface PolicyCheck {
  key: string
  value: string
  ok: boolean
  note: string
}

export interface LogLine {
  t: string
  tag: string
  msg: string
}

export type StageArtifact =
  | { type: 'intent'; json: Record<string, unknown> }
  | { type: 'scope'; granted: CapDecision[]; denied: CapDecision[] }
  | { type: 'code'; manifestYaml: string; handlerTs: string }
  | { type: 'scan'; checks: SecurityCheck[] }
  | { type: 'policy'; checks: PolicyCheck[]; verdict: 'auto' | 'manual' | 'denied' }
  | { type: 'sandbox'; logs: LogLine[]; exitCode: number; durationMs: number }
  | { type: 'deploy'; buildId: string; artifactUri: string; signed: boolean }

export interface SessionStage {
  name: StageName
  status: StageStatus
  startedAt?: string
  finishedAt?: string
  artifact?: StageArtifact
  warnings?: string[]
  errorMessage?: string
}

export interface Session {
  id: string
  tenantId: string
  prompt: string
  status: SessionStatus
  createdBy: string
  createdAt: string
  finishedAt?: string
  resultAppId?: string
  resultVersionId?: string
  stages: SessionStage[]
  /** @deprecated Legacy UI label; Sprint 1 replaces with <RelativeTime createdAt/>. */
  timeLabel?: string
}

// ============================================================================
// Capability
// ============================================================================

export type CapAction = 'read' | 'write' | 'watch' | 'send' | 'delete'
export type CapRisk = 'low' | 'medium' | 'high'

export interface Capability {
  id: string
  tenantId: string
  displayName: string
  category: string
  action: CapAction
  description: string
  integrationId: string
  risk: CapRisk
  deprecated?: boolean
}

// ============================================================================
// AuditEvent
// ============================================================================

export type AuditAction =
  | 'deploy'
  | 'rollback'
  | 'update'
  | 'delete'
  | 'share'
  | 'unshare'
  | 'fork'

export interface AuditEvent {
  id: string
  tenantId: string
  appId: string
  action: AuditAction
  actorId: string
  createdAt: string
  targetVersionId?: string
  fromVersionId?: string
  note?: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// Satellite (UI-only, not a tenant-scoped business entity)
// ============================================================================

export interface SatelliteDef {
  id: string
  icon: string
  label: string
  angle: number
  radius: number
  duration: number
  reverse: boolean
  hintPrompt: string
}
