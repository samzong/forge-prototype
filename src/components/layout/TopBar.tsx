import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

interface Props {
  onMenuClick: () => void
  sidebarOpen: boolean
}

export function TopBar({ onMenuClick, sidebarOpen }: Props) {
  return (
    <header className="h-14 bg-card border-b border-line px-5 flex items-center shrink-0 z-50 relative">
      <button
        onClick={onMenuClick}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        className="w-9 h-9 rounded-[8px] flex items-center justify-center text-fg-muted
                   hover:bg-line-soft hover:text-fg transition-colors mr-[14px]"
      >
        {sidebarOpen ? <X size={18} strokeWidth={2.2} /> : <Menu size={18} strokeWidth={2.2} />}
      </button>

      <Link to="/" className="flex items-center gap-[10px]">
        <div className="w-[26px] h-[26px] bg-accent rounded-[6px] flex items-center justify-center text-white font-mono text-[13px] font-extrabold">
          F
        </div>
        <span className="text-fg font-bold text-[15px] tracking-tight">Forge</span>
      </Link>
    </header>
  )
}
