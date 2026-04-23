import { motion } from 'framer-motion'
import {
  Check,
  Crown,
  Eye,
  Minus,
  ShieldCheck,
  User as UserIcon,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTeam } from '@/hooks/useTeams'

interface RoleMeta {
  label: string
  tagline: string
  Icon: LucideIcon
  tone: string
  chip: string
}

const ROLE_META: Record<Role, RoleMeta> = {
  user: {
    label: 'User',
    tagline: 'Builds and runs own apps',
    Icon: UserIcon,
    tone: 'text-fg-muted bg-bg border-line',
    chip: 'text-fg-muted bg-bg border-line',
  },
  'team-manager': {
    label: 'Team manager',
    tagline: 'Manages roster and policies for one team',
    Icon: ShieldCheck,
    tone: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]',
    chip: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]',
  },
  admin: {
    label: 'Admin',
    tagline: 'Tenant-wide settings and integrations',
    Icon: Crown,
    tone: 'text-[#6d28d9] bg-[#ede9fe] border-[#ddd6fe]',
    chip: 'text-[#6d28d9] bg-[#ede9fe] border-[#ddd6fe]',
  },
}

const ROLE_ORDER: Role[] = ['user', 'team-manager', 'admin']

type Cell = 'yes' | 'scoped' | 'no'

interface CapabilityRow {
  area: string
  action: string
  note: string
  cells: Record<Role, Cell>
}

const CAPABILITIES: CapabilityRow[] = [
  {
    area: 'Apps',
    action: 'Generate an app',
    note: 'Anyone can start a session and ship an app they own.',
    cells: { user: 'yes', 'team-manager': 'yes', admin: 'yes' },
  },
  {
    area: 'Apps',
    action: 'Run + view own apps',
    note: 'Includes preview, execution history, version timeline.',
    cells: { user: 'yes', 'team-manager': 'yes', admin: 'yes' },
  },
  {
    area: 'Apps',
    action: 'Fork a shared / marketplace app',
    note: 'Creates a private copy tied to the forker.',
    cells: { user: 'yes', 'team-manager': 'yes', admin: 'yes' },
  },
  {
    area: 'Apps',
    action: 'Publish to marketplace',
    note: 'Only the app owner decides. Role does not gate.',
    cells: { user: 'scoped', 'team-manager': 'scoped', admin: 'scoped' },
  },
  {
    area: 'Team',
    action: 'View team members',
    note: 'Visible to every member of the team.',
    cells: { user: 'yes', 'team-manager': 'yes', admin: 'yes' },
  },
  {
    area: 'Team',
    action: 'Add / remove members',
    note: 'Manager controls the roster of their own team.',
    cells: { user: 'no', 'team-manager': 'scoped', admin: 'yes' },
  },
  {
    area: 'Team',
    action: 'Change member role',
    note: 'Cannot demote the team owner; cannot grant admin.',
    cells: { user: 'no', 'team-manager': 'scoped', admin: 'yes' },
  },
  {
    area: 'Team',
    action: 'View team audit log',
    note: 'Every team member can read. Write is system-driven.',
    cells: { user: 'yes', 'team-manager': 'yes', admin: 'yes' },
  },
  {
    area: 'Policies',
    action: 'View policies',
    note: 'Read-only for every member.',
    cells: { user: 'yes', 'team-manager': 'yes', admin: 'yes' },
  },
  {
    area: 'Policies',
    action: 'Create / edit / delete policies',
    note: 'Manager owns policy CRUD for their team scope.',
    cells: { user: 'no', 'team-manager': 'scoped', admin: 'yes' },
  },
  {
    area: 'Tenant',
    action: 'Manage integrations',
    note: 'Wire host systems (DCE, CRM, HR) and OAuth apps.',
    cells: { user: 'no', 'team-manager': 'no', admin: 'yes' },
  },
  {
    area: 'Tenant',
    action: 'Suspend / restore tenant',
    note: 'Break-glass only. Logged to the audit trail.',
    cells: { user: 'no', 'team-manager': 'no', admin: 'yes' },
  },
]

export default function RolesPage() {
  const { data: user } = useCurrentUser()
  const { data: team } = useTeam(user?.primaryTeamId)

  const myRoles = new Set<Role>(user?.roles ?? [])

  const grouped = CAPABILITIES.reduce<Record<string, CapabilityRow[]>>((acc, row) => {
    acc[row.area] = acc[row.area] ?? []
    acc[row.area].push(row)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <section className="bg-card border border-line rounded-xl p-6">
        <h2 className="text-[14px] font-extrabold text-fg">Roles in this tenant</h2>
        <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[560px]">
          Three roles gate what you can manage. Your capabilities are the union across every role
          you hold. Roles are assigned by a manager or admin — not self-claimed.
        </p>

        <div
          className="mt-5 grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
        >
          {ROLE_ORDER.map((r, i) => {
            const meta = ROLE_META[r]
            const mine = myRoles.has(r)
            const Icon = meta.Icon
            return (
              <motion.div
                key={r}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                className={`relative rounded-[12px] border p-4 ${
                  mine ? 'border-accent bg-accent-ultra' : 'border-line bg-bg'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center border shrink-0 ${meta.tone}`}
                  >
                    <Icon size={15} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13.5px] font-extrabold text-fg">{meta.label}</span>
                      {mine && (
                        <span className="font-mono text-[9.5px] font-bold text-accent bg-card border border-accent/30 px-[6px] py-[1px] rounded-[4px] uppercase tracking-wider">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-fg-muted mt-[4px] leading-[1.5]">
                      {meta.tagline}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="bg-card border border-line rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h2 className="text-[14px] font-extrabold text-fg">What each role can do</h2>
            <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[560px]">
              Hover a cell to read the constraint.{' '}
              {team && (
                <span>
                  Scoped entries apply to <span className="font-semibold text-fg">{team.name}</span> only.
                </span>
              )}
            </p>
          </div>
          <Legend />
        </div>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left font-mono text-[10.5px] font-bold text-fg-subtle uppercase tracking-wider py-2 pr-3 w-[44%]">
                  Capability
                </th>
                {ROLE_ORDER.map((r) => {
                  const meta = ROLE_META[r]
                  const Icon = meta.Icon
                  return (
                    <th
                      key={r}
                      className="font-mono text-[10.5px] font-bold text-fg-subtle uppercase tracking-wider py-2 px-1"
                    >
                      <span
                        className={`inline-flex items-center gap-[5px] px-[8px] py-[3px] rounded-[6px] border ${meta.chip}`}
                      >
                        <Icon size={11} strokeWidth={2} />
                        {meta.label}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([area, rows]) => (
                <AreaRows key={area} area={area} rows={rows} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function AreaRows({ area, rows }: { area: string; rows: CapabilityRow[] }) {
  return (
    <>
      <tr>
        <td
          colSpan={1 + ROLE_ORDER.length}
          className="pt-4 pb-1 font-mono text-[10px] font-bold text-fg-subtle uppercase tracking-[0.12em]"
        >
          {area}
        </td>
      </tr>
      {rows.map((row) => (
        <tr
          key={`${row.area}-${row.action}`}
          className="border-t border-line hover:bg-line-soft/40 transition-colors"
        >
          <td className="py-[11px] pr-3 align-top">
            <div className="text-[13px] font-semibold text-fg">{row.action}</div>
            <div className="text-[11.5px] text-fg-muted mt-[2px] leading-[1.5]">{row.note}</div>
          </td>
          {ROLE_ORDER.map((r) => (
            <td key={r} className="py-[11px] px-1 text-center align-middle">
              <CellIcon value={row.cells[r]} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function CellIcon({ value }: { value: Cell }) {
  if (value === 'yes') {
    return (
      <span
        title="Allowed"
        className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px] bg-[#dcfce7] border border-[#bbf7d0] text-[#15803d]"
      >
        <Check size={13} strokeWidth={3} />
      </span>
    )
  }
  if (value === 'scoped') {
    return (
      <span
        title="Allowed — scoped to owned team"
        className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px] bg-[#fef3c7] border border-[#fde68a] text-[#b45309]"
      >
        <Eye size={12} strokeWidth={2.4} />
      </span>
    )
  }
  return (
    <span
      title="Not allowed"
      className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px] bg-bg border border-line text-fg-subtle"
    >
      <Minus size={13} strokeWidth={2.4} />
    </span>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <LegendItem value="yes" label="Allowed" />
      <LegendItem value="scoped" label="Scoped" />
      <LegendItem value="no" label="Blocked" />
    </div>
  )
}

function LegendItem({ value, label }: { value: Cell; label: string }) {
  return (
    <span className="inline-flex items-center gap-[6px] text-[11px] text-fg-muted">
      <CellIcon value={value} />
      {label}
    </span>
  )
}
