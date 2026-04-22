import { useState } from 'react'
import { Copy, CheckCircle2 } from 'lucide-react'
import type { App } from '@/types'
import { useAppVersions } from '@/hooks/useAppVersions'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'

interface Props {
  app: App
}

export function CodeTab({ app }: Props) {
  const { data, loading, error, refresh } = useAppVersions({
    appId: app.id,
    sort: 'createdAt-desc',
    size: 1,
  })
  const latest = data?.items[0]

  if (error) return <ErrorState error={error} onRetry={refresh} className="p-8" />
  if (loading) return <LoadingState label="Loading source…" className="p-8" />
  if (!latest) return <EmptyState message="No version available" className="p-8" />

  return (
    <div className="px-8 py-6 max-w-[980px] mx-auto">
      <SourceBlock
        title={`handler.ts · ${latest.version}`}
        content={latest.handlerSource}
      />
    </div>
  )
}

export function SourceBlock({ title, content }: { title: string; content: string }) {
  const [copied, setCopied] = useState(false)
  const lines = content.split('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="bg-[#0a0a0a] rounded-[12px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-[10px] border-b border-white/10">
        <div className="font-mono text-[10px] uppercase tracking-wider text-white/60 font-semibold">
          {title}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-[5px] text-[11.5px] text-white/60 hover:text-white/85 font-mono transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle2 size={12} /> Copied
            </>
          ) : (
            <>
              <Copy size={12} /> Copy
            </>
          )}
        </button>
      </div>
      <div className="p-5 font-mono text-[12px] text-white overflow-auto max-h-[620px]">
        {lines.map((l, i) => (
          <div key={i} className="flex">
            <span className="text-white/25 select-none w-10 text-right pr-3 shrink-0">
              {i + 1}
            </span>
            <span className="whitespace-pre break-words">{l || '\u00A0'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
