import { ArrowUp, Paperclip, Shield } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled: boolean
  placeholder: string
  topSlot?: ReactNode
  footerHint: ReactNode
}

export function ChatInputShell({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
  topSlot,
  footerHint,
}: Props) {
  return (
    <div className="shrink-0 border-t border-line bg-card px-3 pt-3 pb-3">
      {topSlot}
      <div className="rounded-[11px] border border-line bg-bg focus-within:border-accent focus-within:bg-card transition-colors">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder={placeholder}
          rows={2}
          disabled={disabled}
          className="w-full resize-none bg-transparent px-3 pt-[9px] pb-1 text-[13px] text-fg placeholder:text-fg-subtle outline-none leading-[1.5] disabled:opacity-60"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="h-6 px-[7px] rounded-[6px] text-fg-subtle hover:text-fg hover:bg-line-soft text-[11px] font-medium flex items-center gap-[5px] transition-colors"
              title="Attach context"
            >
              <Paperclip size={11} /> context
            </button>
            <button
              type="button"
              className="h-6 px-[7px] rounded-[6px] text-fg-subtle hover:text-fg hover:bg-line-soft text-[11px] font-medium flex items-center gap-[5px] transition-colors"
              title="Capabilities"
            >
              <Shield size={11} /> caps
            </button>
          </div>
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="h-7 w-7 rounded-[7px] bg-accent text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1d4ed8] transition-colors"
            title="Send (Enter)"
          >
            <ArrowUp size={13} strokeWidth={3} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 px-1 font-mono text-[10px] text-fg-subtle">
        {footerHint}
        <span>⏎ send · ⇧⏎ newline</span>
      </div>
    </div>
  )
}
