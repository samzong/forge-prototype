import { Link } from 'react-router-dom'
import { Home, LayoutGrid, Sparkles } from 'lucide-react'
import { ErrorPageShell } from './ErrorPageShell'

export default function NotFoundPage() {
  return (
    <ErrorPageShell
      code="404"
      tone="info"
      title="This page drifted off the map"
      description="The URL points to nothing Forge can recognize. It may have been renamed, retired, or mistyped."
      footer="Forge prototype · Error 404"
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
          to="/apps"
          className="inline-flex items-center gap-2 px-4 py-[10px] bg-card text-fg text-[13px] font-semibold rounded-[9px] border border-line hover:border-accent hover:text-accent transition-colors"
        >
          <LayoutGrid size={14} strokeWidth={2.2} />
          My apps
        </Link>
        <Link
          to="/sessions"
          className="inline-flex items-center gap-2 px-4 py-[10px] bg-card text-fg-muted text-[13px] font-semibold rounded-[9px] border border-line hover:border-accent hover:text-accent transition-colors"
        >
          <Sparkles size={14} strokeWidth={2.2} />
          Recent sessions
        </Link>
      </div>
    </ErrorPageShell>
  )
}
