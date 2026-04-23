import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Clock, Pencil, Trash2 } from 'lucide-react'
import type { SpecDraft } from '@/types'

interface Props {
  draft: SpecDraft
  onRename: (next: string) => void
  onOpenHistory: () => void
  onRequestDelete: () => void
  onPublish: () => void
  publishing?: boolean
}

export function WorkbenchTopBar({
  draft,
  onRename,
  onOpenHistory,
  onRequestDelete,
  onPublish,
  publishing,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(draft.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(draft.title)
  }, [draft.title])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commit = () => {
    const next = value.trim()
    setEditing(false)
    if (next && next !== draft.title) onRename(next)
    else setValue(draft.title)
  }

  const versions = draft.turns.filter((t) => t.specSnapshot).length

  return (
    <div className="h-[52px] shrink-0 bg-card border-b border-line flex items-center gap-3 px-4">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="font-mono text-[10px] font-bold text-fg-subtle uppercase tracking-[0.14em] shrink-0">
          Draft
        </span>
        <span className="text-line shrink-0">·</span>
        {editing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
                commit()
              } else if (e.key === 'Escape') {
                setEditing(false)
                setValue(draft.title)
              }
            }}
            className="bg-bg border border-accent rounded-[7px] px-2 h-[28px] text-[13.5px] font-semibold text-fg outline-none min-w-0 flex-1 max-w-[520px]"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="group flex items-center gap-[6px] min-w-0 text-left hover:text-accent transition-colors"
            title="Rename draft"
          >
            <span className="text-[13.5px] font-semibold text-fg truncate">
              {draft.title}
            </span>
            <Pencil
              size={11}
              className="text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            />
          </button>
        )}
        <span className="font-mono text-[10px] px-[5px] py-[1px] bg-accent-ultra text-accent rounded font-bold uppercase tracking-wider shrink-0">
          {draft.currentSpec.viewKind}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onOpenHistory}
          className="h-[30px] px-[10px] rounded-[7px] text-[12px] font-medium text-fg-muted hover:bg-line-soft hover:text-fg transition-colors flex items-center gap-[6px]"
          title="View refine history"
        >
          <Clock size={12} />
          History
          <span className="font-mono text-[10px] text-fg-subtle">· {versions}</span>
        </button>
        <button
          onClick={onRequestDelete}
          className="h-[30px] px-[10px] rounded-[7px] text-[12px] font-medium text-fg-muted hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-[6px]"
          title="Delete draft"
        >
          <Trash2 size={12} />
          Delete
        </button>
        <span className="w-px h-5 bg-line mx-1" />
        <button
          onClick={onPublish}
          disabled={publishing}
          className="h-[30px] px-[14px] bg-accent hover:bg-[#1d4ed8] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-[8px] text-[12.5px] font-semibold flex items-center gap-[6px] transition-all"
          title="Publish — hand off to the generation pipeline"
        >
          {publishing ? 'Publishing…' : 'Publish'}
          <ArrowRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
