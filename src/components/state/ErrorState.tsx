import { AlertCircle } from 'lucide-react'

interface Props {
  error: Error
  onRetry?: () => void
  className?: string
}

export function ErrorState({ error, onRetry, className }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className ?? ''}`}
    >
      <AlertCircle size={28} className="text-[#ef4444]" strokeWidth={1.8} />
      <div className="text-[13.5px] text-fg font-semibold">Something went wrong</div>
      <div className="font-mono text-[11.5px] text-fg-muted max-w-[420px] break-words">
        {error.message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-[6px] text-[12.5px] font-semibold text-accent border border-line rounded-[7px] hover:bg-accent-ultra hover:border-accent transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}
