import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { History, RotateCcw, GitFork, ChevronRight } from 'lucide-react'
import type { App, AppVersion } from '@/types'
import { useAppVersions } from '@/hooks/useAppVersions'
import { rollbackToVersion } from '@/mock/appVersions'
import { RelativeTime } from '@/components/RelativeTime'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'

interface Props {
  app: App
}

export function VersionsTab({ app }: Props) {
  const { data, loading, error, refresh } = useAppVersions({
    appId: app.id,
    sort: 'createdAt-desc',
  })
  const versions = data?.items ?? []
  const currentId = versions.find((v) => v.version === app.currentVersion)?.id

  const [target, setTarget] = useState<AppVersion | null>(null)
  const [rolling, setRolling] = useState(false)
  const [rollbackError, setRollbackError] = useState<string | null>(null)

  const confirmRollback = async () => {
    if (!target) return
    setRolling(true)
    setRollbackError(null)
    try {
      await rollbackToVersion(app.id, target.id)
      setTarget(null)
      refresh()
    } catch (e) {
      setRollbackError(e instanceof Error ? e.message : String(e))
    } finally {
      setRolling(false)
    }
  }

  return (
    <div className="px-8 py-6 max-w-[1000px] mx-auto">
      {app.forkedFromAppId && (
        <div className="bg-accent-ultra border border-accent/20 rounded-[12px] p-4 mb-4 flex items-start gap-3">
          <GitFork size={16} className="text-accent mt-[2px]" />
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-fg">
              Forked from <span className="font-mono">{app.forkedFromAppId}</span>
            </div>
            <div className="text-[12px] text-fg-muted mt-[2px]">
              {app.forkedFromVersionId
                ? `Fork point: ${app.forkedFromVersionId}`
                : 'Fork point not recorded'}
            </div>
          </div>
          <button className="px-3 py-[6px] text-[12.5px] font-semibold text-accent border border-accent/20 rounded-[7px] hover:bg-card transition-colors">
            Sync from upstream
          </button>
        </div>
      )}

      {error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : loading && versions.length === 0 ? (
        <LoadingState label="Loading versions…" />
      ) : versions.length === 0 ? (
        <EmptyState message="No version history yet" />
      ) : (
        <div className="bg-card border border-line rounded-[12px] overflow-hidden">
          <div className="px-5 py-[11px] border-b border-line flex items-center gap-2">
            <History size={14} className="text-accent" />
            <div className="font-mono text-[11px] font-bold text-fg-muted uppercase tracking-[0.1em]">
              Version History
            </div>
            <div className="ml-auto font-mono text-[11px] text-fg-subtle">
              {versions.length} total
            </div>
          </div>
          <div className="divide-y divide-line">
            {versions.map((v, i) => {
              const isCurrent = v.id === currentId
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.025, duration: 0.22 }}
                  className="grid grid-cols-[80px_100px_1fr_auto] gap-4 items-center px-5 py-[12px] hover:bg-line-soft transition-colors"
                >
                  <span className="font-mono text-[12px] font-bold text-accent">{v.version}</span>
                  <RelativeTime
                    iso={v.createdAt}
                    className="font-mono text-[11px] text-fg-subtle"
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] text-fg truncate flex items-center gap-2">
                      <span className="truncate">{v.changeNote ?? '—'}</span>
                      {isCurrent && (
                        <span className="font-mono text-[9px] uppercase tracking-wider px-[5px] py-[1px] rounded bg-accent-ultra text-accent font-bold shrink-0">
                          current
                        </span>
                      )}
                      {v.isRollback && (
                        <span className="font-mono text-[9px] uppercase tracking-wider px-[5px] py-[1px] rounded bg-[#fef3c7] text-[#92400e] font-bold shrink-0">
                          rollback
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-fg-subtle mt-[2px] truncate">
                      by {v.createdBy}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isCurrent && (
                      <button
                        onClick={() => setTarget(v)}
                        className="px-[10px] py-[5px] text-[11.5px] font-semibold text-fg-muted border border-line rounded-[7px] hover:border-accent hover:text-accent transition-colors flex items-center gap-[5px]"
                      >
                        <RotateCcw size={11} /> Rollback
                      </button>
                    )}
                    <Link
                      to={`/apps/${app.id}/versions/${v.id}`}
                      className="px-[10px] py-[5px] text-[11.5px] font-semibold text-accent hover:underline flex items-center gap-[3px]"
                    >
                      View <ChevronRight size={12} />
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      <RollbackConfirm
        target={target}
        current={app.currentVersion}
        rolling={rolling}
        error={rollbackError}
        onCancel={() => {
          setTarget(null)
          setRollbackError(null)
        }}
        onConfirm={confirmRollback}
      />
    </div>
  )
}

function RollbackConfirm({
  target,
  current,
  rolling,
  error,
  onCancel,
  onConfirm,
}: {
  target: AppVersion | null
  current: string
  rolling: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-[14px] shadow-2xl max-w-[440px] w-full p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#fef3c7] flex items-center justify-center shrink-0">
                <RotateCcw size={18} className="text-[#92400e]" />
              </div>
              <div>
                <div className="text-[16px] font-extrabold text-fg leading-tight">
                  Rollback to {target.version}?
                </div>
                <div className="text-[13px] text-fg-muted mt-1 leading-[1.5]">
                  Creates a new version copying {target.version} as the current. Your existing {current}{' '}
                  stays in history.
                </div>
              </div>
            </div>

            {target.changeNote && (
              <div className="bg-bg border border-line rounded-[9px] p-3 mb-4">
                <div className="font-mono text-[10px] font-bold text-fg-subtle uppercase tracking-wider mb-[3px]">
                  Target change note
                </div>
                <div className="text-[12.5px] text-fg">{target.changeNote}</div>
              </div>
            )}

            {error && (
              <div className="bg-[#fee2e2] border border-[#fca5a5]/40 rounded-[9px] p-3 mb-4 text-[12.5px] text-[#991b1b] font-mono">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
                disabled={rolling}
                className="px-[14px] py-[8px] text-[13px] font-semibold text-fg-muted border border-line rounded-[9px] hover:bg-line-soft disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={rolling}
                className="px-[14px] py-[8px] text-[13px] font-semibold text-white bg-accent rounded-[9px] hover:bg-[#1d4ed8] disabled:opacity-70 transition-colors flex items-center gap-[6px]"
              >
                {rolling ? 'Rolling back…' : `Rollback to ${target.version}`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
