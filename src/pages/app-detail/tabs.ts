export type TabName =
  | 'overview'
  | 'code'
  | 'manifest'
  | 'executions'
  | 'versions'
  | 'logs'
  | 'audit'
  | 'settings'

export const TABS: Array<{ id: TabName; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'code', label: 'Code' },
  { id: 'manifest', label: 'Manifest' },
  { id: 'executions', label: 'Executions' },
  { id: 'versions', label: 'Versions' },
  { id: 'logs', label: 'Logs' },
  { id: 'audit', label: 'Audit' },
  { id: 'settings', label: 'Settings' },
]

export const DEFAULT_TAB: TabName = 'overview'

const ALL: Set<string> = new Set(TABS.map((t) => t.id))

export function isTab(s: string | null | undefined): s is TabName {
  return typeof s === 'string' && ALL.has(s)
}
