import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  FileText,
  History,
  ScanEye,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTeam } from '@/hooks/useTeams'

interface NavItem {
  to: string
  label: string
  hint: string
  Icon: LucideIcon
}

const NAV: NavItem[] = [
  { to: 'members', label: 'Members', hint: 'Who is on the team', Icon: Users },
  {
    to: 'policies',
    label: 'Policies',
    hint: 'Data, egress, cost rules',
    Icon: ShieldCheck,
  },
  { to: 'audit', label: 'Audit', hint: 'Team activity log', Icon: History },
  { to: 'roles', label: 'Roles', hint: 'Who can do what', Icon: ScanEye },
]

export default function TeamLayout() {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const { data: team } = useTeam(user?.primaryTeamId)

  return (
    <div className="px-8 py-8">
      <div className="max-w-[1180px] mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-fg-muted hover:text-fg text-sm mb-4 font-medium flex items-center gap-[6px] transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="mb-8">
          <div className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.12em] mb-3">
            Team
          </div>
          <h1 className="text-[36px] font-black tracking-[-0.02em] leading-none">
            Members &amp; policies
          </h1>
          {team && (
            <p className="text-fg-muted mt-3 text-[14px] flex items-center gap-[8px] flex-wrap">
              <Building2 size={13} className="text-fg-subtle" />
              <span className="text-fg font-semibold">{team.name}</span>
              <span className="text-fg-subtle">·</span>
              <span className="font-mono text-[12px] text-fg-subtle">{team.id}</span>
            </p>
          )}
        </div>

        <div className="grid gap-8" style={{ gridTemplateColumns: '220px 1fr' }}>
          <aside>
            <nav className="flex flex-col gap-1 sticky top-6">
              {NAV.map((item) => (
                <SubNavLink key={item.to} item={item} />
              ))}
              <div className="mt-3 px-3 py-3 bg-card border border-line rounded-[10px]">
                <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider mb-[6px]">
                  Prototype
                </div>
                <div className="flex items-start gap-2">
                  <FileText size={13} className="text-fg-muted mt-[3px] shrink-0" />
                  <div className="text-[12px] text-fg-muted leading-[1.5]">
                    Team mutations live in memory. Reload to reset.
                  </div>
                </div>
              </div>
            </nav>
          </aside>

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

function SubNavLink({ item }: { item: NavItem }) {
  const { to, label, hint, Icon } = item
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-[10px] rounded-[9px] transition-colors group ${
          isActive ? 'bg-accent-ultra' : 'hover:bg-line-soft'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="team-nav-indicator"
              className="absolute left-0 top-[10px] bottom-[10px] w-[3px] bg-accent rounded-r-[3px]"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <div
            className={`w-[28px] h-[28px] rounded-[7px] flex items-center justify-center border shrink-0 ${
              isActive
                ? 'bg-accent text-white border-accent'
                : 'bg-bg text-fg-muted border-line'
            }`}
          >
            <Icon size={14} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className={`text-[13px] leading-[1.2] ${
                isActive ? 'text-accent font-bold' : 'text-fg font-semibold'
              }`}
            >
              {label}
            </div>
            <div className="font-mono text-[10px] text-fg-subtle mt-[3px] truncate">
              {hint}
            </div>
          </div>
        </>
      )}
    </NavLink>
  )
}
