import { useState } from 'react'
import type { App, AppManifest } from '@/types'
import { useAppVersions } from '@/hooks/useAppVersions'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { SourceBlock } from './CodeTab'

type View = 'yaml' | 'json'

interface Props {
  app: App
}

export function ManifestTab({ app }: Props) {
  const { data, loading, error, refresh } = useAppVersions({
    appId: app.id,
    sort: 'createdAt-desc',
    size: 1,
  })
  const [view, setView] = useState<View>('yaml')
  const latest = data?.items[0]

  if (error) return <ErrorState error={error} onRetry={refresh} className="p-8" />
  if (loading) return <LoadingState label="Loading manifest…" className="p-8" />
  if (!latest) return <EmptyState message="No version available" className="p-8" />

  const body = view === 'yaml' ? manifestToYaml(latest.manifest) : JSON.stringify(latest.manifest, null, 2)

  return (
    <div className="px-8 py-6 max-w-[980px] mx-auto">
      <div className="flex items-center gap-1 mb-3">
        <ViewToggle active={view === 'yaml'} onClick={() => setView('yaml')}>
          YAML
        </ViewToggle>
        <ViewToggle active={view === 'json'} onClick={() => setView('json')}>
          JSON
        </ViewToggle>
      </div>
      <SourceBlock title={`manifest.${view} · ${latest.version}`} content={body} />
    </div>
  )
}

function ViewToggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-[7px] text-[12.5px] font-semibold rounded-[7px] transition-colors ${
        active ? 'bg-accent-ultra text-accent' : 'text-fg-muted hover:bg-line-soft'
      }`}
    >
      {children}
    </button>
  )
}

export function manifestToYaml(m: AppManifest): string {
  const out: string[] = []
  out.push(`runtime_identity: ${m.runtimeIdentity}`)
  if (m.schedule) out.push(`schedule: ${m.schedule}`)
  if (m.dataRetention) out.push(`data_retention: ${m.dataRetention}`)
  out.push('capabilities:')
  for (const c of m.capabilities) out.push(`  - ${c}`)
  if (m.triggers && m.triggers.length > 0) {
    out.push('triggers:')
    for (const t of m.triggers) {
      out.push(`  - type: ${t.type}`)
      out.push(`    config: ${JSON.stringify(t.config)}`)
    }
  }
  return out.join('\n')
}
