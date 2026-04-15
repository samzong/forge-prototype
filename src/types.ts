export type AppStatus = 'running' | 'draft' | 'stopped' | 'deployed'

export type AppGroup = 'mine' | 'shared' | 'marketplace'

export interface App {
  id: string
  name: string
  icon: string
  version: string
  status: AppStatus
  group: AppGroup
  description: string
  capabilities: string[]
  owner?: string
  relation?: 'subscribed' | 'forked'
  stars?: number
  source?: 'dce-official' | 'community'
  createdAt?: string
  lastRun?: string
}

export type SessionStatus = 'running' | 'deployed' | 'draft' | 'shared' | 'failed'

export interface Session {
  id: string
  timeLabel: string
  status: SessionStatus
  prompt: string
  appId?: string
}

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
