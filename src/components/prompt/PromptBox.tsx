import { useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'

interface QuickPrompt {
  type: string
  text: string
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { type: 'dashboard', text: 'Team performance this week' },
  { type: 'alert', text: 'Notify Feishu when pod crashes' },
  { type: 'cron', text: 'Daily healthcheck at 09:00' },
  { type: 'report', text: 'Weekly PR merge summary' },
]

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
}

const MAX_HEIGHT = 240

export function PromptBox({ value, onChange, onSubmit }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const focus = () => textareaRef.current?.focus()

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT) + 'px'
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="w-full max-w-[640px]">
      <div
        className="bg-card border-[1.5px] border-line rounded-[14px]
                   transition-all focus-within:border-accent"
        style={{
          boxShadow: '0 12px 40px -18px rgba(0, 0, 0, 0.12)',
        }}
      >
        <textarea
          id="prompt-input"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the app you want... e.g. 每周一早 9 点给团队发本周 top 10 告警"
          rows={4}
          className="w-full bg-transparent outline-none resize-none px-4 pt-[16px] pb-2
                     text-[15px] text-fg placeholder:text-fg-subtle leading-relaxed
                     overflow-y-auto"
        />
        <div className="flex items-center justify-between gap-3 pl-4 pr-[10px] pb-[10px]">
          <span className="font-mono text-[11px] text-fg-subtle flex items-center gap-[6px] select-none min-w-0">
            <span className="font-bold text-fg-muted">$</span>
            <span className="truncate">
              One sentence <span className="text-fg-subtle/70">→</span> a running U App
            </span>
            <span className="hidden sm:inline text-line mx-1">·</span>
            <span className="hidden sm:inline text-fg-subtle/80">
              <kbd className="font-mono text-[10px] bg-line-soft px-[5px] py-[1px] rounded border border-line">
                ↵
              </kbd>{' '}
              to build
            </span>
          </span>
          <button
            onClick={onSubmit}
            className="w-[34px] h-[34px] bg-accent hover:bg-[#1d4ed8] active:scale-95 text-white rounded-[10px] flex items-center justify-center transition-all shrink-0"
            aria-label="Build"
          >
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mt-[14px] justify-center">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.type}
            onClick={() => {
              onChange(qp.text)
              focus()
            }}
            className="group px-[13px] py-[7px] bg-card border border-line rounded-[20px]
                       text-fg-muted text-xs font-medium cursor-pointer transition-colors
                       inline-flex items-center gap-[7px]
                       hover:border-accent hover:text-accent hover:bg-accent-ultra"
          >
            <span className="font-mono text-accent text-[10px] font-bold px-[6px] py-[2px] bg-accent-ultra rounded uppercase group-hover:bg-accent group-hover:text-white transition-colors">
              {qp.type}
            </span>
            {qp.text}
          </button>
        ))}
      </div>
    </div>
  )
}
