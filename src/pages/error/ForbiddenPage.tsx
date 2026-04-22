import { Link } from 'react-router-dom'
import { Home, ShieldAlert } from 'lucide-react'
import { ErrorPageShell } from './ErrorPageShell'

export default function ForbiddenPage() {
  return (
    <ErrorPageShell
      code="403"
      tone="warn"
      title="You don't have access to this"
      description={
        <>
          The resource exists, but your roles or team membership don't grant access. Ask
          the owner to share it, or an admin to widen your grants.
        </>
      }
      footer="Forge prototype · Error 403"
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-[10px] bg-accent text-white text-[13px] font-semibold rounded-[9px] border border-accent hover:bg-[#1d4ed8] transition-colors"
        >
          <Home size={14} strokeWidth={2.2} />
          Back home
        </Link>
        <Link
          to="/settings/capabilities"
          className="inline-flex items-center gap-2 px-4 py-[10px] bg-card text-fg text-[13px] font-semibold rounded-[9px] border border-line hover:border-accent hover:text-accent transition-colors"
        >
          <ShieldAlert size={14} strokeWidth={2.2} />
          Review my capabilities
        </Link>
      </div>
    </ErrorPageShell>
  )
}
