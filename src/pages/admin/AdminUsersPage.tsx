import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Crown,
  Search,
  ShieldAlert,
  Users as UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import type { Role, User } from '@/types'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUsers } from '@/hooks/useUsers'
import { useTeams } from '@/hooks/useTeams'
import { changeTeamMemberRole } from '@/mock/teams'
import { LoadingState } from '@/components/state/LoadingState'
import { ErrorState } from '@/components/state/ErrorState'
import { EmptyState } from '@/components/state/EmptyState'
import { RelativeTime, absoluteTime } from '@/components/RelativeTime'

type RoleFilter = Role | 'all'

const ROLE_TONE: Record<Role, string> = {
  admin: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
  'team-manager': 'text-[#6d28d9] bg-[#ede9fe] border-[#ddd6fe]',
  user: 'text-fg-muted bg-bg border-line',
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  'team-manager': 'Team manager',
  user: 'User',
}

const ROLE_ICON: Record<Role, LucideIcon> = {
  admin: Crown,
  'team-manager': ShieldAlert,
  user: BadgeCheck,
}

function primaryRole(u: User): Role {
  if (u.roles.includes('admin')) return 'admin'
  if (u.roles.includes('team-manager')) return 'team-manager'
  return 'user'
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function AdminUsersPage() {
  const { data: me } = useCurrentUser()
  const [role, setRole] = useState<RoleFilter>('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: usersRes, loading, error, refresh } = useUsers()
  const { data: teamsRes } = useTeams()

  const users = usersRes?.items ?? []

  const teamName = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of teamsRes?.items ?? []) map.set(t.id, t.name)
    return map
  }, [teamsRes])

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return users.filter((u) => {
      if (role !== 'all' && primaryRole(u) !== role) return false
      if (needle) {
        const hay = `${u.displayName} ${u.username} ${u.email} ${u.id}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [users, role, search])

  const summary = useMemo(() => {
    const s = { total: users.length, admins: 0, managers: 0 }
    for (const u of users) {
      const r = primaryRole(u)
      if (r === 'admin') s.admins++
      if (r === 'team-manager') s.managers++
    }
    return s
  }, [users])

  async function onRoleChange(u: User, next: Role) {
    setBusyId(u.id)
    setActionError(null)
    try {
      await changeTeamMemberRole(u.id, next)
      refresh()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-card border border-line rounded-xl p-6">
        <div>
          <h2 className="text-[14px] font-extrabold text-fg">Tenant users</h2>
          <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[520px]">
            Every identity that can sign in to this tenant. Promote to team
            manager or admin here.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatTile label="Total" value={summary.total} tone="text-fg" />
          <StatTile label="Admins" value={summary.admins} tone="text-[#b45309]" />
          <StatTile label="Managers" value={summary.managers} tone="text-[#6d28d9]" />
        </div>
      </section>

      <section className="bg-card border border-line rounded-xl p-[14px] flex flex-wrap items-center gap-3">
        <FilterGroup
          label="Role"
          value={role}
          onChange={(v) => setRole(v as RoleFilter)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'admin', label: 'Admin' },
            { value: 'team-manager', label: 'Manager' },
            { value: 'user', label: 'User' },
          ]}
        />
        <label className="ml-auto relative flex items-center min-w-[220px]">
          <Search size={13} className="absolute left-[10px] text-fg-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, id…"
            className="w-full pl-[30px] pr-3 py-[7px] text-[13px] bg-bg border border-line rounded-[8px] focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-fg-subtle"
          />
        </label>
      </section>

      {actionError && (
        <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[9px] text-[13px] text-[#b91c1c]">
          {actionError}
        </div>
      )}

      {error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : loading && rows.length === 0 ? (
        <LoadingState label="Loading users…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          message="No users match"
          hint="Clear filters or adjust the search."
        />
      ) : (
        <section className="bg-card border border-line rounded-xl overflow-hidden">
          <ul className="divide-y divide-line">
            {rows.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                teamName={teamName}
                onRoleChange={onRoleChange}
                busy={busyId === u.id}
                isSelf={me?.id === u.id}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function UserRow(props: {
  user: User
  teamName: Map<string, string>
  onRoleChange: (u: User, role: Role) => void
  busy: boolean
  isSelf: boolean
}) {
  const { user, teamName, onRoleChange, busy, isSelf } = props
  const current = primaryRole(user)
  const Icon = ROLE_ICON[current]
  return (
    <li className="px-5 py-4">
      <div className="flex items-start gap-4 flex-wrap">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-mono text-[13px] font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #2563eb)' }}
        >
          {initials(user.displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-fg">{user.displayName}</span>
            {isSelf && (
              <span className="inline-flex items-center px-[7px] py-[2px] rounded-[6px] border font-mono text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent-ultra border-line">
                You
              </span>
            )}
            <span
              className={`inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-[7px] border font-mono text-[11px] font-semibold uppercase tracking-wider ${ROLE_TONE[current]}`}
            >
              <Icon size={11} strokeWidth={2} />
              {ROLE_LABEL[current]}
            </span>
          </div>
          <div className="font-mono text-[11.5px] text-fg-muted mt-[3px]">
            {user.email}
            <span className="mx-[6px] text-line">·</span>
            {user.id}
          </div>
          <div className="font-mono text-[10.5px] text-fg-subtle mt-[6px] uppercase tracking-wider flex items-center gap-[6px] flex-wrap">
            <span>Primary: {teamName.get(user.primaryTeamId) ?? user.primaryTeamId}</span>
            {user.teamIds.length > 1 && (
              <>
                <span className="text-line">·</span>
                <span>{user.teamIds.length} teams</span>
              </>
            )}
            <span className="text-line">·</span>
            <span title={absoluteTime(user.createdAt)}>
              Joined <RelativeTime iso={user.createdAt} />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider">
            Role
          </label>
          <select
            value={current}
            disabled={busy || isSelf}
            onChange={(e) => onRoleChange(user, e.target.value as Role)}
            className="text-[12.5px] px-2 py-[6px] rounded-[7px] border border-line bg-bg focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="user">User</option>
            <option value="team-manager">Team manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
    </li>
  )
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-bg border border-line rounded-[9px] px-4 py-3">
      <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-[20px] font-extrabold mt-[2px] ${tone}`}>{value}</div>
    </div>
  )
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider">
        {label}
      </span>
      <div className="inline-flex bg-bg border border-line rounded-[8px] p-[2px] flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-[10px] py-[5px] text-[12px] font-semibold rounded-[6px] transition-colors ${
              value === opt.value
                ? 'bg-card text-accent shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
