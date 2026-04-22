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
// Session + SessionStage
// ============================================================================

export type SessionStatus = 'running' | 'completed' | 'failed' | 'cancelled'
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
