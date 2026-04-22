import { BadgeCheck, Building2, Crown, Mail, ShieldAlert, UserCircle2 } from 'lucide-react'
import type { Role, User } from '@/types'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { LoadingState } from '@/components/state/LoadingState'
import { ErrorState } from '@/components/state/ErrorState'
import { RelativeTime, absoluteTime } from '@/components/RelativeTime'

const ROLE_INFO: Record<Role, { label: string; tone: string; icon: typeof BadgeCheck }> = {
  admin: {
    label: 'Admin',
    tone: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
    icon: Crown,
  },
  'team-manager': {
    label: 'Team manager',
    tone: 'text-[#6d28d9] bg-[#ede9fe] border-[#ddd6fe]',
    icon: ShieldAlert,
  },
  user: {
    label: 'User',
    tone: 'text-fg-muted bg-bg border-line',
    icon: BadgeCheck,
  },
}

export default function SettingsProfilePage() {
  const { data, loading, error, refresh } = useCurrentUser()

  if (loading && !data) return <LoadingState label="Loading profile…" />
  if (error) return <ErrorState error={error} onRetry={refresh} />
  if (!data) return null

  return (
    <div className="space-y-6">
      <section className="bg-card border border-line rounded-xl p-6">
        <div className="flex items-start gap-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-mono text-[16px] font-black shrink-0"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #2563eb)' }}
          >
            {initials(data.displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[20px] font-extrabold text-fg leading-tight">
              {data.displayName}
            </div>
            <div className="font-mono text-[12px] text-fg-subtle mt-1">@{data.username}</div>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 max-w-[540px]">
              <Field icon={Mail} label="Email" value={data.email} />
              <Field icon={UserCircle2} label="User id" value={data.id} mono />
              <Field icon={Building2} label="Tenant" value={data.tenantId} mono />
              <Field
                icon={BadgeCheck}
                label="Joined"
                value={<RelativeTime iso={data.createdAt} />}
                hoverTitle={absoluteTime(data.createdAt)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card border border-line rounded-xl p-6">
        <SectionHeader
          title="Roles"
          hint="Tenant-scoped grants. Only an admin can change these."
        />
        <div className="flex flex-wrap gap-2">
          {data.roles.map((r) => {
            const info = ROLE_INFO[r]
            const Icon = info.icon
            return (
              <span
                key={r}
                className={`inline-flex items-center gap-[6px] px-[10px] py-[5px] rounded-[7px] border font-mono text-[11px] font-semibold uppercase tracking-wider ${info.tone}`}
              >
                <Icon size={12} strokeWidth={2} />
                {info.label}
              </span>
            )
          })}
        </div>
      </section>

      <section className="bg-card border border-line rounded-xl p-6">
        <SectionHeader
          title="Teams"
          hint="Shared apps and sessions respect team membership."
        />
        <ul className="space-y-2">
          {data.teamIds.map((t) => (
            <li
              key={t}
              className="flex items-center justify-between gap-3 px-3 py-[10px] bg-bg border border-line rounded-[9px]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-[28px] h-[28px] rounded-[7px] bg-card border border-line flex items-center justify-center shrink-0">
                  <Building2 size={13} className="text-fg-muted" />
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-[12.5px] text-fg font-semibold truncate">
                    {t}
                  </div>
                  {t === data.primaryTeamId && (
                    <div className="font-mono text-[10px] text-fg-subtle mt-[2px] uppercase tracking-wider">
                      Primary
                    </div>
                  )}
                </div>
              </div>
              {t === data.primaryTeamId && (
                <span className="font-mono text-[10px] px-[7px] py-[2px] rounded-[5px] bg-accent-ultra text-accent border border-accent/20 font-bold uppercase tracking-wider shrink-0">
                  Primary
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[14px] font-extrabold text-fg">{title}</h2>
      <p className="text-[12.5px] text-fg-muted mt-[3px]">{hint}</p>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  value,
  mono,
  hoverTitle,
}: {
  icon: typeof BadgeCheck
  label: string
  value: React.ReactNode
  mono?: boolean
  hoverTitle?: string
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-[6px] font-mono text-[10px] text-fg-subtle uppercase tracking-wider mb-[3px]">
        <Icon size={11} strokeWidth={2} />
        {label}
      </div>
      <div
        title={hoverTitle}
        className={`text-[13px] text-fg truncate ${mono ? 'font-mono text-[12.5px]' : 'font-medium'}`}
      >
        {value}
      </div>
    </div>
  )
}

function initials(displayName: User['displayName']): string {
  return displayName
    .split(/\s+/)
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
