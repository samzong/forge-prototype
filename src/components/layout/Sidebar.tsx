import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Plus,
  Store,
  ChevronRight,
  Settings,
  LogOut,
  Users2,
  Shield,
  Check,
  ChevronUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApps } from '@/hooks/useApps'
import { useSessions } from '@/hooks/useSessions'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUsers } from '@/hooks/useUsers'
import { useTeams } from '@/hooks/useTeams'
import { setActiveUserId } from '@/mock/users'
import { App, SessionStatus, type User, type Team } from '@/types'
import { RelativeTime } from '@/components/RelativeTime'

interface Props {
  onClose: () => void
}

const sessionDot: Record<SessionStatus, string> = {
  running: 'bg-accent',
  'awaiting-confirm': 'bg-[#f59e0b]',
  completed: 'bg-[#10b981]',
  failed: 'bg-[#ef4444]',
  cancelled: 'bg-fg-subtle',
}

export function Sidebar({ onClose }: Props) {
  const location = useLocation()
  const navigate = useNavigate()

  const { data: mineRes } = useApps({ group: 'mine' })
  const { data: sharedRes } = useApps({ group: 'shared' })
  const { data: marketRes } = useApps({ group: 'marketplace' })
  const { data: sessionsRes } = useSessions({ sort: 'createdAt-desc' })
  const { data: me } = useCurrentUser()

  const mine = mineRes?.items ?? []
  const shared = sharedRes?.items ?? []
  const marketTotal = marketRes?.total ?? 0
  const sessions = sessionsRes?.items ?? []
  const isAdmin = me?.roles.includes('admin') ?? false

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
          <button
            onClick={() => go('/shared')}
            className="mt-1 w-full text-left px-[11px] py-[7px] text-[11px] font-semibold text-accent hover:underline"
          >
            View all →
          </button>
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
              <div className="font-mono text-[10px] text-fg-subtle mt-[3px]">
                {marketTotal} apps
              </div>
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
              {sessions.length}
            </span>
          </div>

          {sessions.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 + i * 0.03, duration: 0.22 }}
              onClick={() => go(`/generate/${s.id}`)}
              className="w-full flex items-start gap-[10px] px-[11px] py-[9px] rounded-[9px] mb-[2px]
                         hover:bg-line-soft transition-colors text-left"
            >
              <span
                className={`mt-[6px] w-[6px] h-[6px] rounded-full shrink-0 ${sessionDot[s.status]}`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] text-fg leading-[1.4] line-clamp-2">{s.prompt}</div>
                <div className="font-mono text-[10px] text-fg-subtle mt-[3px] flex items-center gap-[6px]">
                  <RelativeTime iso={s.createdAt} />
                  <span className="text-line">·</span>
                  <span className="uppercase tracking-wider">{s.status}</span>
                </div>
              </div>
            </motion.button>
          ))}

          <button
            onClick={() => go('/sessions')}
            className="mt-1 w-full text-left px-[11px] py-[7px] text-[11px] font-semibold text-accent hover:underline"
          >
            View all →
          </button>
        </div>
      </div>

      <UserSwitcherFooter
        me={me ?? null}
        isAdmin={isAdmin}
        onNav={go}
      />
    </aside>
  )
}

function UserSwitcherFooter({
  me,
  isAdmin,
  onNav,
}: {
  me: User | null
  isAdmin: boolean
  onNav: (path: string) => void
}) {
  const [open, setOpen] = useState(false)
  const popRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const { data: usersRes } = useUsers()
  const { data: teamsRes } = useTeams()
  const users = usersRes?.items ?? []
  const teams = teamsRes?.items ?? []

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (popRef.current?.contains(t)) return
      if (triggerRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const teamLabel = me ? teamNameFor(teams, me.primaryTeamId) : ''
  const roleLabel = me ? primaryRole(me) : ''

  const switchTo = (id: string) => {
    if (!me || id === me.id) {
      setOpen(false)
      return
    }
    setActiveUserId(id)
    setOpen(false)
  }

  return (
    <div className="border-t border-line px-3 py-[14px] shrink-0 relative">
      <div className="flex items-center gap-[11px] px-[7px]">
        <button
          ref={triggerRef}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-[11px] flex-1 min-w-0 rounded-[9px] px-[3px] py-[3px] -mx-[3px] hover:bg-line-soft transition-colors text-left"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-mono text-[12px] font-bold shrink-0"
            style={{ background: avatarGradient(me?.id) }}
          >
            {me ? initials(me.displayName) : '–'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-fg truncate flex items-center gap-[6px]">
              {me?.username ?? '…'}
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-fg-subtle border border-line rounded-[3px] px-[4px] py-[1px]">
                DEV
              </span>
            </div>
            <div className="font-mono text-[10px] text-fg-subtle truncate">
              {teamLabel ? `${teamLabel} · ${roleLabel}` : roleLabel || '—'}
            </div>
          </div>
          <ChevronUp
            size={14}
            className={`text-fg-subtle shrink-0 transition-transform ${open ? '' : 'rotate-180'}`}
          />
        </button>
        <button
          aria-label="Team"
          onClick={() => onNav('/team')}
          className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-fg-subtle hover:bg-line-soft hover:text-fg-muted transition-colors"
        >
          <Users2 size={15} />
        </button>
        {isAdmin && (
          <button
            aria-label="Admin console"
            onClick={() => onNav('/admin')}
            className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-fg-subtle hover:bg-line-soft hover:text-fg-muted transition-colors"
          >
            <Shield size={15} />
          </button>
        )}
        <button
          aria-label="Settings"
          onClick={() => onNav('/settings')}
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

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popRef}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.14 }}
            role="menu"
            className="absolute left-3 right-3 bottom-[68px] z-20 bg-card border border-line rounded-[10px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] overflow-hidden"
          >
            <div className="px-3 pt-[10px] pb-[6px] font-mono text-[10px] uppercase tracking-[0.1em] text-fg-subtle">
              Switch identity
            </div>
            <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
              {users.map((u) => {
                const active = u.id === me?.id
                return (
                  <button
                    key={u.id}
                    role="menuitem"
                    onClick={() => switchTo(u.id)}
                    className={`w-full text-left flex items-center gap-[10px] px-3 py-[9px] transition-colors ${
                      active ? 'bg-accent-ultra' : 'hover:bg-line-soft'
                    }`}
                  >
                    <div
                      className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-white font-mono text-[10px] font-bold shrink-0"
                      style={{ background: avatarGradient(u.id) }}
                    >
                      {initials(u.displayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[12.5px] truncate ${active ? 'text-accent font-bold' : 'text-fg font-medium'}`}>
                        {u.displayName}
                      </div>
                      <div className="font-mono text-[10px] text-fg-subtle truncate">
                        {teamNameFor(teams, u.primaryTeamId)} · {primaryRole(u)}
                      </div>
                    </div>
                    {active && <Check size={14} className="text-accent shrink-0" />}
                  </button>
                )
              })}
            </div>
            <div className="px-3 py-[8px] border-t border-line font-mono text-[10px] text-fg-subtle leading-[1.5]">
              Prototype-only. Persists in localStorage; reload keeps choice.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function avatarGradient(userId: string | undefined): string {
  switch (userId) {
    case 'u-samzong':
      return 'linear-gradient(135deg, #a78bfa, #2563eb)'
    case 'u-marcus':
      return 'linear-gradient(135deg, #f59e0b, #ef4444)'
    case 'u-leah':
      return 'linear-gradient(135deg, #10b981, #0ea5e9)'
    case 'u-sasha':
      return 'linear-gradient(135deg, #ec4899, #8b5cf6)'
    default:
      return 'linear-gradient(135deg, #94a3b8, #475569)'
  }
}

function teamNameFor(teams: Team[], id: string | undefined): string {
  if (!id) return ''
  return teams.find((t) => t.id === id)?.name ?? id
}

function primaryRole(u: User): string {
  if (u.roles.includes('admin')) return 'admin'
  if (u.roles.includes('team-manager')) return 'team-manager'
  return u.roles[0] ?? 'user'
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
  if (app.group === 'mine') return `${app.currentVersion} · ${app.status}`
  if (app.group === 'shared') return `by ${app.ownerId} · ${app.relation ?? 'shared'}`
  if (app.group === 'marketplace') return `★ ${formatStars(app.stars ?? 0)} · ${app.source ?? 'community'}`
  return ''
}

function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`
}
