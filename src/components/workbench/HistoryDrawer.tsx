import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock, Eye, X } from 'lucide-react'
import type { RefineTurn } from '@/types'

interface Props {
  open: boolean
  turns: RefineTurn[]
  selectedTurnId: string | null
  onClose: () => void
  onSelect: (turnId: string | null) => void
}

export function HistoryDrawer({ open, turns, selectedTurnId, onClose, onSelect }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const versions = turns.filter((t) => t.specSnapshot)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="hist-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 z-30"
          />
          <motion.aside
            key="hist-drawer"
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            className="absolute right-0 top-0 bottom-0 w-[340px] z-40 bg-card border-l border-line shadow-[-8px_0_24px_rgba(0,0,0,0.08)] flex flex-col"
          >
            <div className="shrink-0 h-[44px] border-b border-line flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-fg-subtle" />
                <span className="font-mono text-[10px] font-bold text-fg uppercase tracking-[0.12em]">
                  History
                </span>
                <span className="font-mono text-[10px] text-fg-subtle">
                  · {versions.length}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close history"
                className="w-7 h-7 rounded-[7px] text-fg-muted hover:bg-line-soft flex items-center justify-center"
              >
                <X size={13} />
              </button>
            </div>

            <div className="px-4 py-2 border-b border-line bg-bg">
              <button
                onClick={() => onSelect(null)}
                className={`w-full text-left px-3 py-2 rounded-[8px] border transition-colors flex items-center gap-2 ${
                  selectedTurnId === null
                    ? 'border-accent bg-accent-ultra text-accent'
                    : 'border-line bg-card text-fg-muted hover:border-accent/40'
                }`}
              >
                {selectedTurnId === null ? (
                  <Check size={13} className="shrink-0" />
                ) : (
                  <Eye size={12} className="shrink-0" />
                )}
                <span className="text-[12.5px] font-semibold">Latest</span>
                <span className="font-mono text-[10px] text-fg-subtle ml-auto">live</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
              {versions.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[12.5px] text-fg-subtle">No versions yet</p>
                  <p className="text-[11px] text-fg-subtle/70 mt-1">
                    Every refine turn becomes a version
                  </p>
                </div>
              ) : (
                <ol className="px-4 py-3 space-y-2">
                  {versions
                    .slice()
                    .reverse()
                    .map((t, idx) => {
                      const num = versions.length - idx
                      const active = t.id === selectedTurnId
                      return (
                        <li key={t.id}>
                          <button
                            onClick={() => onSelect(t.id)}
                            className={`w-full text-left px-3 py-[10px] rounded-[9px] border transition-colors ${
                              active
                                ? 'border-accent bg-accent-ultra'
                                : 'border-line bg-bg hover:border-accent/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-[10px] font-bold text-accent tabular-nums">
                                v{String(num).padStart(2, '0')}
                              </span>
                              <span className="font-mono text-[9px] text-fg-subtle">
                                {formatTime(t.createdAt)}
                              </span>
                              {active && (
                                <Check size={11} className="text-accent ml-auto" />
                              )}
                            </div>
                            <div className="text-[12px] text-fg leading-[1.45] line-clamp-2">
                              {t.specSnapshot?.name ?? '—'}
                            </div>
                            {t.specSnapshot?.description && (
                              <div className="text-[11px] text-fg-muted mt-[2px] line-clamp-2">
                                {t.specSnapshot.description}
                              </div>
                            )}
                          </button>
                        </li>
                      )
                    })}
                </ol>
              )}
            </div>

            <div className="shrink-0 border-t border-line px-4 py-3 bg-bg">
              <p className="font-mono text-[10px] text-fg-subtle leading-[1.5]">
                Switching versions only affects the preview — the current build
                state is not reverted. Send a new refine to change it.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  } catch {
    return ''
  }
}
