import { Link } from 'react-router-dom'
import { Home, RefreshCcw, ScrollText } from 'lucide-react'
import { ErrorPageShell } from './ErrorPageShell'

export default function ServerErrorPage() {
  return (
    <ErrorPageShell
      code="500"
      tone="danger"
      title="Forge ran into an unexpected error"
      description={
        <>
          The last action crashed somewhere in Forge's runtime. This is almost certainly
          on our side. Retry once — if it keeps failing, check the audit log and ping
          platform.
        </>
      }
      footer="Forge prototype · Error 500"
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-[10px] bg-accent text-white text-[13px] font-semibold rounded-[9px] border border-accent hover:bg-[#1d4ed8] transition-colors"
        >
          <RefreshCcw size={14} strokeWidth={2.2} />
          Retry
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-[10px] bg-card text-fg text-[13px] font-semibold rounded-[9px] border border-line hover:border-accent hover:text-accent transition-colors"
        >
          <Home size={14} strokeWidth={2.2} />
          Back home
        </Link>
        <Link
          to="/settings/audit"
          className="inline-flex items-center gap-2 px-4 py-[10px] bg-card text-fg-muted text-[13px] font-semibold rounded-[9px] border border-line hover:border-accent hover:text-accent transition-colors"
        >
          <ScrollText size={14} strokeWidth={2.2} />
          Audit log
        </Link>
      </div>
    </ErrorPageShell>
  )
}
