import { Loader2 } from 'lucide-react'

interface Props {
  label?: string
  className?: string
}

export function LoadingState({ label, className }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-10 text-fg-muted ${className ?? ''}`}
    >
      <Loader2 size={22} className="animate-spin text-accent" />
      {label && <div className="text-[13px]">{label}</div>}
    </div>
  )
}
