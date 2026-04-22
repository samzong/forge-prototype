import { Inbox, type LucideIcon } from 'lucide-react'

interface Props {
  icon?: LucideIcon
  message: string
  hint?: string
  ctaLabel?: string
  onCta?: () => void
  className?: string
}

export function EmptyState({ icon: Icon = Inbox, message, hint, ctaLabel, onCta, className }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className ?? ''}`}
    >
      <Icon size={28} className="text-fg-subtle" strokeWidth={1.5} />
      <div className="text-[13.5px] text-fg-muted font-medium">{message}</div>
      {hint && <div className="text-[12px] text-fg-subtle max-w-[320px]">{hint}</div>}
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="mt-2 text-[13px] text-accent font-semibold hover:underline"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
