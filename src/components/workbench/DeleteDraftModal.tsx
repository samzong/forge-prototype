import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  open: boolean
  draftTitle: string
  onCancel: () => void
  onConfirm: () => void
  deleting?: boolean
}

export function DeleteDraftModal({ open, draftTitle, onCancel, onConfirm, deleting }: Props) {
  const [typed, setTyped] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTyped('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  const matches = typed.trim() === draftTitle.trim()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="del-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/30 z-50"
          />
          <motion.div
            key="del-modal"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="del-draft-title"
            className="fixed left-1/2 top-[28%] -translate-x-1/2 w-[min(440px,calc(100vw-32px))] z-[51] bg-card rounded-[14px] border border-line shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)] overflow-hidden"
          >
            <div className="flex items-start gap-3 px-5 pt-5">
              <div className="w-9 h-9 shrink-0 rounded-[9px] bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="del-draft-title" className="text-[15px] font-bold text-fg">
                  Delete draft?
                </h3>
                <p className="text-[12.5px] text-fg-muted mt-[3px] leading-[1.55]">
                  This cannot be undone. The draft and all its versions will be
                  permanently removed.
                </p>
              </div>
              <button
                onClick={onCancel}
                aria-label="Close"
                className="w-7 h-7 rounded-[7px] text-fg-muted hover:bg-line-soft flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-5 pt-4 pb-5">
              <label className="block text-[11px] font-mono font-bold text-fg-subtle uppercase tracking-wider mb-[6px]">
                Type the draft name to confirm
              </label>
              <div className="text-[12px] text-fg-muted mb-2 break-all">
                <code className="font-mono text-[12px] px-[5px] py-[1px] bg-line-soft text-fg rounded border border-line">
                  {draftTitle}
                </code>
              </div>
              <input
                ref={inputRef}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !e.nativeEvent.isComposing &&
                    matches &&
                    !deleting
                  ) {
                    e.preventDefault()
                    onConfirm()
                  }
                }}
                placeholder={draftTitle}
                className="w-full h-[34px] px-3 rounded-[8px] border border-line bg-bg focus:border-accent outline-none text-[13px] text-fg placeholder:text-fg-subtle"
              />
            </div>

            <div className="flex items-center justify-end gap-2 px-5 pb-5">
              <button
                onClick={onCancel}
                className="h-[32px] px-[12px] rounded-[8px] text-[12.5px] font-medium text-fg-muted hover:bg-line-soft transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!matches || deleting}
                className="h-[32px] px-[14px] rounded-[8px] text-[12.5px] font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
