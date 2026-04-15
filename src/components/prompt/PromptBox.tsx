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

export function PromptBox({ value, onChange, onSubmit }: Props) {
  const focus = () => document.getElementById('prompt-input')?.focus()

  return (
    <div className="w-full max-w-[640px]">
      <div
        className="bg-card border-[1.5px] border-line rounded-[14px] py-[14px] px-4 flex items-center gap-3
                   transition-all
                   focus-within:border-accent"
        style={{
          boxShadow: '0 12px 40px -18px rgba(0, 0, 0, 0.12)',
        }}
      >
        <span className="font-mono font-bold text-[14px] text-fg-subtle select-none">$</span>
        <input
          id="prompt-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="Describe the app you want... e.g. 每周一早 9 点给团队发本周 top 10 告警"
          className="flex-1 bg-transparent outline-none text-[15px] text-fg placeholder:text-fg-subtle min-w-0"
        />
        <button
          onClick={onSubmit}
          className="w-[38px] h-[38px] bg-accent hover:bg-[#1d4ed8] active:scale-95 text-white rounded-[10px] flex items-center justify-center transition-all shrink-0"
        >
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>
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
