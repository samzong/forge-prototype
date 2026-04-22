import { Hourglass } from 'lucide-react'

interface Props {
  tabLabel: string
  description?: string
}

export function ComingSoonTab({ tabLabel, description }: Props) {
  return (
    <div className="px-8 py-16 max-w-[720px] mx-auto">
      <div className="bg-card border border-line rounded-[12px] p-8 text-center">
        <Hourglass size={28} className="text-fg-subtle mx-auto mb-3" strokeWidth={1.5} />
        <div className="font-mono text-[11px] text-fg-subtle uppercase tracking-[0.12em] mb-2">
          {tabLabel}
        </div>
        <div className="text-[16px] font-bold text-fg mb-2">Landing in a follow-up commit</div>
        <div className="text-[13px] text-fg-muted leading-[1.55] max-w-[440px] mx-auto">
          {description ??
            'The data model is ready; the UI for this tab ships in a subsequent commit on this branch.'}
        </div>
      </div>
    </div>
  )
}
