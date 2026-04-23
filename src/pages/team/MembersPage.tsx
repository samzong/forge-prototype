import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  Crown,
  Mail,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { Role, User } from '@/types'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTeam } from '@/hooks/useTeams'
import { useTeamMembers } from '@/hooks/useTeamMembers'
import { listUsers } from '@/mock/users'
import {
  addTeamMember,
  changeTeamMemberRole,
  removeTeamMember,
} from '@/mock/teams'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'

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

function canManage(u: User | undefined): boolean {
  if (!u) return false
  return u.roles.includes('admin') || u.roles.includes('team-manager')
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function MembersPage() {
  const { data: user } = useCurrentUser()
  const teamId = user?.primaryTeamId
  const { data: team } = useTeam(teamId)
  const { data, loading, error, refresh } = useTeamMembers(teamId, {
    page: 1,
    size: 100,
  })

  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<User | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const rows = data?.items ?? []
  const manage = canManage(user)

  async function onRoleChange(u: User, role: Role) {
    setBusyId(u.id)
    setActionError(null)
    try {
      await changeTeamMemberRole(u.id, role)
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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[14px] font-extrabold text-fg">Members</h2>
            <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[520px]">
              Everyone on {team?.name ?? 'this team'} can see shared apps,
              sessions, and audit trails.{' '}
              {manage
                ? 'You can invite members and change roles.'
                : 'Only team managers and admins can change membership.'}
            </p>
          </div>
          {manage && (
            <button
              onClick={() => setAddOpen(true)}
              disabled={!teamId}
              className="inline-flex items-center gap-[6px] px-3 py-[8px] bg-accent text-white text-[13px] font-semibold rounded-[8px] hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UserPlus size={14} strokeWidth={2.5} />
              Add member
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatTile label="Members" value={rows.length} tone="text-fg" />
          <StatTile
            label="Managers"
            value={rows.filter((r) => r.roles.includes('team-manager')).length}
            tone="text-[#6d28d9]"
          />
          <StatTile
            label="Admins"
            value={rows.filter((r) => r.roles.includes('admin')).length}
            tone="text-[#b45309]"
          />
        </div>
      </section>

      {actionError && (
        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[9px] px-4 py-3 text-[13px] text-[#b91c1c] flex items-start justify-between gap-3">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-[#b91c1c] hover:text-[#7f1d1d] shrink-0"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : loading && rows.length === 0 ? (
        <LoadingState label="Loading members…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          message="No members yet"
          hint="Add someone to get started."
          ctaLabel={manage ? 'Add a member →' : undefined}
          onCta={manage ? () => setAddOpen(true) : undefined}
        />
      ) : (
        <section className="bg-card border border-line rounded-xl overflow-hidden">
          <ul className="divide-y divide-line">
            {rows.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                isMe={m.id === user?.id}
                isOwner={team?.ownerId === m.id}
                manage={manage}
                busy={busyId === m.id}
                onChangeRole={(r) => onRoleChange(m, r)}
                onRemove={() => setRemoveTarget(m)}
              />
            ))}
          </ul>
        </section>
      )}

      <AnimatePresence>
        {addOpen && teamId && (
          <AddMemberModal
            teamId={teamId}
            existingIds={new Set(rows.map((r) => r.id))}
            onClose={() => setAddOpen(false)}
            onDone={() => {
              setAddOpen(false)
              refresh()
            }}
          />
        )}
        {removeTarget && teamId && (
          <RemoveMemberModal
            teamId={teamId}
            member={removeTarget}
            onCancel={() => setRemoveTarget(null)}
            onDone={() => {
              setRemoveTarget(null)
              refresh()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="bg-bg border border-line rounded-[9px] px-4 py-3">
      <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-[20px] font-extrabold mt-[2px] ${tone}`}>
        {value}
      </div>
    </div>
  )
}

function MemberRow(props: {
  member: User
  isMe: boolean
  isOwner: boolean
  manage: boolean
  busy: boolean
  onChangeRole: (r: Role) => void
  onRemove: () => void
}) {
  const { member, isMe, isOwner, manage, busy, onChangeRole, onRemove } = props
  const role = primaryRole(member)
  const Icon = ROLE_ICON[role]
  const editable = manage && !isOwner
  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-mono text-[12px] font-black shrink-0"
        style={{ background: 'linear-gradient(135deg, #a78bfa, #2563eb)' }}
      >
        {initials(member.displayName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold text-fg truncate">
            {member.displayName}
          </span>
          {isMe && (
            <span className="font-mono text-[10px] px-[6px] py-[1px] rounded-[4px] bg-accent-ultra text-accent uppercase tracking-wider">
              You
            </span>
          )}
          {isOwner && (
            <span className="font-mono text-[10px] px-[6px] py-[1px] rounded-[4px] bg-[#fef3c7] text-[#b45309] uppercase tracking-wider">
              Owner
            </span>
          )}
        </div>
        <div className="flex items-center gap-[8px] mt-[3px] text-fg-subtle min-w-0">
          <Mail size={11} className="shrink-0" />
          <span className="font-mono text-[12px] truncate">{member.email}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {editable ? (
          <select
            value={role}
            disabled={busy}
            onChange={(e) => onChangeRole(e.target.value as Role)}
            className={`text-[12px] font-semibold px-[8px] py-[5px] rounded-[7px] border cursor-pointer ${ROLE_TONE[role]} focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60 disabled:cursor-wait`}
          >
            <option value="user">User</option>
            <option value="team-manager">Team manager</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <span
            className={`inline-flex items-center gap-[5px] px-[9px] py-[4px] rounded-[7px] border font-mono text-[11px] font-semibold uppercase tracking-wider ${ROLE_TONE[role]}`}
          >
            <Icon size={11} strokeWidth={2} />
            {ROLE_LABEL[role]}
          </span>
        )}
        {editable && !isMe && (
          <button
            onClick={onRemove}
            disabled={busy}
            aria-label={`Remove ${member.displayName}`}
            className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-fg-subtle hover:bg-[#fef2f2] hover:text-[#b91c1c] transition-colors disabled:opacity-50"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </li>
  )
}

function AddMemberModal(props: {
  teamId: string
  existingIds: Set<string>
  onClose: () => void
  onDone: () => void
}) {
  const { teamId, existingIds, onClose, onDone } = props
  const [candidates, setCandidates] = useState<User[] | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listUsers({ page: 1, size: 200 })
      .then((res) => {
        if (cancelled) return
        const list = res.items.filter((u) => !existingIds.has(u.id))
        setCandidates(list)
        if (list[0]) setSelectedId(list[0].id)
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : String(e))
        }
      })
    return () => {
      cancelled = true
    }
  }, [existingIds])

  async function submit() {
    if (!selectedId) return
    setSubmitting(true)
    setSubmitErr(null)
    try {
      await addTeamMember(teamId, selectedId)
      onDone()
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="Add member" onClose={onClose}>
      {loadErr ? (
        <div className="text-[13px] text-[#b91c1c]">{loadErr}</div>
      ) : candidates === null ? (
        <LoadingState label="Loading candidates…" />
      ) : candidates.length === 0 ? (
        <div className="text-[13px] text-fg-muted">
          Every known user is already on this team.
        </div>
      ) : (
        <>
          <label className="block">
            <span className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider">
              User
            </span>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={submitting}
              className="mt-[6px] w-full text-[13px] px-3 py-[8px] rounded-[8px] border border-line bg-card focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
            >
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName} — {u.email}
                </option>
              ))}
            </select>
          </label>
          {submitErr && (
            <div className="mt-3 text-[13px] text-[#b91c1c]">{submitErr}</div>
          )}
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-[7px] text-[13px] font-semibold text-fg-muted rounded-[8px] hover:bg-line-soft transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || !selectedId}
              className="px-3 py-[7px] bg-accent text-white text-[13px] font-semibold rounded-[8px] hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Adding…' : 'Add'}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  )
}

function RemoveMemberModal(props: {
  teamId: string
  member: User
  onCancel: () => void
  onDone: () => void
}) {
  const { teamId, member, onCancel, onDone } = props
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    setSubmitting(true)
    setErr(null)
    try {
      await removeTeamMember(teamId, member.id)
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="Remove member" onClose={onCancel}>
      <p className="text-[13px] text-fg-muted">
        Remove{' '}
        <span className="text-fg font-semibold">{member.displayName}</span> from
        the team? They will lose access to shared apps and sessions. If this is
        their primary team, another team becomes primary.
      </p>
      {err && <div className="mt-3 text-[13px] text-[#b91c1c]">{err}</div>}
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="px-3 py-[7px] text-[13px] font-semibold text-fg-muted rounded-[8px] hover:bg-line-soft transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          className="px-3 py-[7px] bg-[#b91c1c] text-white text-[13px] font-semibold rounded-[8px] hover:bg-[#991b1b] disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </ModalShell>
  )
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.16 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] bg-card border border-line rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.18)] p-6"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-[15px] font-extrabold text-fg">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-fg-subtle hover:bg-line-soft hover:text-fg-muted transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
