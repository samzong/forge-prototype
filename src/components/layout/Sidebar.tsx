import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus, Store, ChevronRight, Settings, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { APPS } from '@/data/apps'
import { SESSIONS } from '@/data/sessions'
import { App, SessionStatus } from '@/types'

interface Props {
  onClose: () => void
}

const sessionDot: Record<SessionStatus, string> = {
  running: 'bg-accent',
  deployed: 'bg-[#10b981]',
  draft: 'bg-fg-subtle',
  shared: 'bg-[#8b5cf6]',
  failed: 'bg-[#ef4444]',
}

export function Sidebar({ onClose }: Props) {
  const location = useLocation()
  const navigate = useNavigate()

  const mine = APPS.filter((a) => a.group === 'mine')
  const shared = APPS.filter((a) => a.group === 'shared')

  const isActive = (id: string) => location.pathname === `/apps/${id}`

  const go = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <aside className="h-full w-full bg-card border-r border-line shadow-[4px_0_24px_rgba(0,0,0,0.06)] flex flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-thin pt-[18px]">
        <button
          onClick={() => go('/')}
          className="mx-4 mb-4 w-[calc(100%-32px)] py-[11px] px-3 border-[1.5px] border-dashed border-line rounded-[10px]
                     text-fg-muted text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer
                     hover:border-accent hover:text-accent hover:bg-accent-ultra hover:border-solid
                     transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} />
          New App
        </button>

        <SidebarGroup title="My Apps" count={mine.length}>
          {mine.map((app) => (
            <SidebarItem key={app.id} app={app} active={isActive(app.id)} onNav={go} />
          ))}
        </SidebarGroup>

        <SidebarGroup title="Shared With Me" count={shared.length}>
          {shared.map((app) => (
            <SidebarItem key={app.id} app={app} active={isActive(app.id)} onNav={go} />
          ))}
        </SidebarGroup>

        <div className="px-3 pb-4">
          <button
            onClick={() => go('/marketplace')}
            className={`w-full flex items-center gap-[11px] px-[11px] py-[10px] rounded-[9px] transition-colors text-left ${
              location.pathname === '/marketplace' ? 'bg-accent-ultra' : 'hover:bg-line-soft'
            }`}
          >
            <div
              className={`w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0 border ${
                location.pathname === '/marketplace'
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg text-fg-muted border-line'
              }`}
            >
              <Store size={15} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={`text-[13px] leading-[1.3] ${
                  location.pathname === '/marketplace' ? 'text-accent font-bold' : 'text-fg font-medium'
                }`}
              >
                Marketplace
              </div>
              <div className="font-mono text-[10px] text-fg-subtle mt-[3px]">132 apps</div>
            </div>
            <ChevronRight size={14} className="text-fg-subtle shrink-0" />
          </button>
        </div>

        <div className="h-px bg-line mx-4 mb-3" />

        <div className="px-3 pb-4">
          <div className="flex items-center justify-between px-3 pt-[6px] pb-[10px]">
            <span className="font-mono text-[11px] font-bold text-fg-subtle uppercase tracking-[0.1em]">
              Recent Sessions
            </span>
            <span className="bg-bg text-fg-subtle font-mono text-[10px] font-medium px-[7px] py-[2px] rounded-full">
              {SESSIONS.length}
            </span>
          </div>

          {SESSIONS.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 + i * 0.03, duration: 0.22 }}
              onClick={() => (s.appId ? go(`/apps/${s.appId}`) : undefined)}
              className="w-full flex items-start gap-[10px] px-[11px] py-[9px] rounded-[9px] mb-[2px]
                         hover:bg-line-soft transition-colors text-left"
            >
              <span
                className={`mt-[6px] w-[6px] h-[6px] rounded-full shrink-0 ${sessionDot[s.status]}`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] text-fg leading-[1.4] line-clamp-2">{s.prompt}</div>
                <div className="font-mono text-[10px] text-fg-subtle mt-[3px] flex items-center gap-[6px]">
                  <span>{s.timeLabel}</span>
                  <span className="text-line">·</span>
                  <span className="uppercase tracking-wider">{s.status}</span>
                </div>
              </div>
            </motion.button>
          ))}

          <button className="mt-1 w-full text-left px-[11px] py-[7px] text-[11px] font-semibold text-accent hover:underline">
            View all →
          </button>
        </div>
      </div>

      <div className="border-t border-line px-3 py-[14px] shrink-0">
        <div className="flex items-center gap-[11px] px-[7px]">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-mono text-[12px] font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #2563eb)' }}
          >
            SZ
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-fg truncate">samzong</div>
            <div className="font-mono text-[10px] text-fg-subtle truncate">platform-team · admin</div>
          </div>
          <button
            aria-label="Settings"
            className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-fg-subtle hover:bg-line-soft hover:text-fg-muted transition-colors"
          >
            <Settings size={15} />
          </button>
          <button
            aria-label="Sign out"
            className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-fg-subtle hover:bg-line-soft hover:text-fg-muted transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function SidebarGroup({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div className="px-3 pb-4">
      <div className="flex items-center justify-between px-3 pt-[6px] pb-[10px]">
        <span className="font-mono text-[11px] font-bold text-fg-subtle uppercase tracking-[0.1em]">
          {title}
        </span>
        <span className="bg-bg text-fg-subtle font-mono text-[10px] font-medium px-[7px] py-[2px] rounded-full">
          {count}
        </span>
      </div>
      {children}
    </div>
  )
}

function SidebarItem({
  app,
  active,
  onNav,
}: {
  app: App
  active: boolean
  onNav: (path: string) => void
}) {
  return (
    <button
      onClick={() => onNav(`/apps/${app.id}`)}
      className={`relative w-full text-left flex items-center gap-[11px] px-[11px] py-[9px] rounded-[9px] mb-[2px] transition-colors ${
        active ? 'bg-accent-ultra' : 'hover:bg-line-soft'
      }`}
    >
      {active && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 top-[10px] bottom-[10px] w-[3px] bg-accent rounded-r-[3px]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <div
        className={`w-[30px] h-[30px] rounded-[7px] flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
          active
            ? 'bg-accent text-white border border-accent'
            : 'bg-bg text-fg-muted border border-line'
        }`}
      >
        {app.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-[13px] truncate leading-[1.3] ${
            active ? 'text-accent font-bold' : 'text-fg font-medium'
          }`}
        >
          {app.name}
        </div>
        <div className="font-mono text-[10px] text-fg-subtle mt-[3px] truncate">
          {getMetaText(app)}
        </div>
      </div>
    </button>
  )
}

function getMetaText(app: App): string {
  if (app.group === 'mine') return `${app.version} · ${app.status}`
  if (app.group === 'shared') return `by ${app.owner} · ${app.relation}`
  if (app.group === 'marketplace') return `★ ${formatStars(app.stars ?? 0)} · ${app.source}`
  return ''
}

function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`
}
