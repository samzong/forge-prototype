import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  ExternalLink,
  GitBranch,
  Globe,
  MessageSquare,
  Rocket,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Webhook,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type {
  DeliveryChannel,
  Notification,
  NotificationKind,
} from '@/types'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useNotifications } from '@/hooks/useNotifications'
import { useDeliveryChannels } from '@/hooks/useDeliveryChannels'
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/mock/notifications'
import {
  verifyDeliveryChannel,
  toggleDeliveryChannel,
  updateDeliveryChannelEvents,
} from '@/mock/deliveryChannels'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { RelativeTime, absoluteTime } from '@/components/RelativeTime'

type EventKey = 'deploy' | 'execution-failed' | 'policy' | 'share' | 'fork'

const EVENT_INFO: Record<EventKey, { label: string; hint: string; Icon: LucideIcon }> = {
  deploy: { label: 'Deploy', hint: 'App rolled out to tenant', Icon: Rocket },
  'execution-failed': {
    label: 'Execution failed',
    hint: 'Handler errored or timed out',
    Icon: XCircle,
  },
  policy: { label: 'Policy', hint: 'Gate decision or denial', Icon: ShieldAlert },
  share: { label: 'Share', hint: 'App shared with a team or user', Icon: Share2 },
  fork: { label: 'Fork', hint: 'Someone forked your app', Icon: GitBranch },
}

const EVENT_KEYS: EventKey[] = ['deploy', 'execution-failed', 'policy', 'share', 'fork']

const KIND_INFO: Record<NotificationKind, { tone: string; Icon: LucideIcon }> = {
  deploy: {
    tone: 'text-[#1d4ed8] bg-accent-ultra border-accent/20',
    Icon: Rocket,
  },
  'execution-failed': {
    tone: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]',
    Icon: XCircle,
  },
  policy: {
    tone: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
    Icon: ShieldAlert,
  },
  share: {
    tone: 'text-[#6d28d9] bg-[#ede9fe] border-[#ddd6fe]',
    Icon: Share2,
  },
  fork: {
    tone: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]',
    Icon: GitBranch,
  },
  system: {
    tone: 'text-fg-muted bg-bg border-line',
    Icon: Bell,
  },
}

export default function SettingsNotificationsPage() {
  const { data: user } = useCurrentUser()
  const userId = user?.id

  return (
    <div className="space-y-6">
      <InboxSection userId={userId} />
      <ChannelsSection userId={userId} />
    </div>
  )
}

function InboxSection({ userId }: { userId: string | undefined }) {
  const {
    data,
    loading,
    error,
    refresh,
  } = useNotifications(userId ? { userId, sort: 'createdAt-desc', size: 50 } : {})
  const items = data?.items ?? []
  const [busy, setBusy] = useState(false)
  const [markErr, setMarkErr] = useState<string | null>(null)

  const unreadCount = items.filter((n) => !n.read).length

  const markOne = async (id: string) => {
    try {
      await markNotificationRead(id)
      refresh()
    } catch (e) {
      setMarkErr(e instanceof Error ? e.message : String(e))
    }
  }

  const markAll = async () => {
    if (!userId) return
    setBusy(true)
    setMarkErr(null)
    try {
      await markAllNotificationsRead(userId)
      refresh()
    } catch (e) {
      setMarkErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-line flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[14px] font-extrabold text-fg">Notification inbox</h2>
          <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[540px]">
            Events routed to you in-product. Channel settings below control what else gets
            fanned out to Feishu or webhook relays.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-[11px] text-fg-subtle uppercase tracking-wider">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
          </span>
          <button
            onClick={markAll}
            disabled={busy || unreadCount === 0}
            className="inline-flex items-center gap-[6px] px-3 py-[7px] rounded-[8px] border border-line bg-bg text-fg text-[12px] font-semibold hover:bg-line-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCheck size={13} strokeWidth={2} />
            Mark all read
          </button>
        </div>
      </div>

      {markErr && (
        <div className="px-6 py-2 bg-[#fee2e2] border-b border-[#fecaca] text-[12px] text-[#b91c1c] flex items-center gap-2">
          <AlertTriangle size={13} strokeWidth={2} />
          {markErr}
        </div>
      )}

      {loading && items.length === 0 ? (
        <LoadingState label="Loading notifications…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : items.length === 0 ? (
        <EmptyState
          message="No notifications yet"
          hint="Deploys, policy decisions, and share events will show up here."
        />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((n) => (
            <NotificationRow key={n.id} n={n} onMark={() => markOne(n.id)} />
          ))}
        </ul>
      )}
    </section>
  )
}

function NotificationRow({ n, onMark }: { n: Notification; onMark: () => void }) {
  const info = KIND_INFO[n.kind]
  const KindIcon = info.Icon
  return (
    <li
      className={`px-6 py-4 flex items-start gap-4 transition-colors ${
        !n.read ? 'bg-accent-ultra/40' : ''
      }`}
    >
      <div
        className={`w-[30px] h-[30px] rounded-[8px] border flex items-center justify-center shrink-0 ${info.tone}`}
      >
        <KindIcon size={13} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {!n.read && (
            <span className="w-[7px] h-[7px] rounded-full bg-accent shrink-0" aria-hidden />
          )}
          <span className="text-[13px] font-bold text-fg">{n.title}</span>
          <span
            className={`font-mono text-[10px] px-[6px] py-[1px] rounded-[5px] border uppercase tracking-wider font-bold ${info.tone}`}
          >
            {n.kind}
          </span>
        </div>
        <div className="text-[12.5px] text-fg-muted mt-[3px] leading-[1.5]">{n.body}</div>
        <div className="flex items-center gap-3 mt-[6px]">
          <span
            className="font-mono text-[10.5px] text-fg-subtle"
            title={absoluteTime(n.createdAt)}
          >
            <RelativeTime iso={n.createdAt} />
          </span>
          {n.link && (
            <Link
              to={n.link}
              className="font-mono text-[10.5px] text-accent hover:underline inline-flex items-center gap-[3px]"
            >
              Open <ExternalLink size={10} strokeWidth={2.5} />
            </Link>
          )}
        </div>
      </div>
      {!n.read && (
        <button
          onClick={onMark}
          className="text-[11px] text-fg-muted hover:text-fg font-semibold shrink-0 px-2 py-1 rounded-[6px] hover:bg-line-soft transition-colors"
        >
          Mark read
        </button>
      )}
    </li>
  )
}

function ChannelsSection({ userId }: { userId: string | undefined }) {
  const {
    data,
    loading,
    error,
    refresh,
  } = useDeliveryChannels(userId ? { userId, sort: 'createdAt-desc' } : {})
  const items = data?.items ?? []

  const summary = useMemo(() => {
    let enabled = 0
    let unverified = 0
    for (const c of items) {
      if (c.enabled) enabled++
      if (!c.verifiedAt) unverified++
    }
    return { enabled, unverified, total: items.length }
  }, [items])

  return (
    <section className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-line">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[14px] font-extrabold text-fg">Delivery channels</h2>
            <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[540px]">
              Fan events out to Feishu chats and webhook endpoints. Unverified channels stay
              off until you trigger verification.
            </p>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-fg-subtle uppercase tracking-wider shrink-0">
            <span>{summary.total} channels</span>
            <span>{summary.enabled} enabled</span>
            {summary.unverified > 0 && (
              <span className="text-[#b45309]">{summary.unverified} unverified</span>
            )}
          </div>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <LoadingState label="Loading channels…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : items.length === 0 ? (
        <EmptyState
          message="No delivery channels"
          hint="Ask your admin to wire up a Feishu chat or webhook relay."
        />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((c) => (
            <ChannelRow key={c.id} channel={c} onChanged={refresh} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ChannelRow({
  channel,
  onChanged,
}: {
  channel: DeliveryChannel
  onChanged: () => void
}) {
  const [busy, setBusy] = useState<null | 'verify' | 'toggle' | 'events'>(null)
  const [err, setErr] = useState<string | null>(null)

  const verified = !!channel.verifiedAt
  const ChannelIcon = channel.kind === 'feishu' ? MessageSquare : Webhook

  const verify = async () => {
    setBusy('verify')
    setErr(null)
    try {
      await verifyDeliveryChannel(channel.id)
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const toggle = async () => {
    if (!verified) return
    setBusy('toggle')
    setErr(null)
    try {
      await toggleDeliveryChannel(channel.id, !channel.enabled)
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const toggleEvent = async (key: EventKey) => {
    const next = channel.events.includes(key)
      ? channel.events.filter((e) => e !== key)
      : [...channel.events, key]
    setBusy('events')
    setErr(null)
    try {
      await updateDeliveryChannelEvents(channel.id, next)
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <li className="px-6 py-5">
      <div className="flex items-start gap-4">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-bg border border-line flex items-center justify-center shrink-0">
          <ChannelIcon size={15} className="text-fg-muted" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-extrabold text-fg">{channel.label}</span>
            <span className="font-mono text-[10px] px-[6px] py-[1px] rounded-[5px] border uppercase tracking-wider font-bold text-fg-muted bg-bg border-line">
              {channel.kind}
            </span>
            {verified ? (
              <span className="font-mono text-[10px] px-[6px] py-[1px] rounded-[5px] border uppercase tracking-wider font-bold text-[#047857] bg-[#d1fae5] border-[#a7f3d0] inline-flex items-center gap-[3px]">
                <ShieldCheck size={10} strokeWidth={2.5} />
                verified
              </span>
            ) : (
              <span className="font-mono text-[10px] px-[6px] py-[1px] rounded-[5px] border uppercase tracking-wider font-bold text-[#b45309] bg-[#fef3c7] border-[#fde68a] inline-flex items-center gap-[3px]">
                <AlertTriangle size={10} strokeWidth={2.5} />
                unverified
              </span>
            )}
            <span
              className={`font-mono text-[10px] px-[6px] py-[1px] rounded-[5px] border uppercase tracking-wider font-bold inline-flex items-center gap-[3px] ${
                channel.enabled
                  ? 'text-[#1d4ed8] bg-accent-ultra border-accent/20'
                  : 'text-fg-muted bg-bg border-line'
              }`}
            >
              {channel.enabled ? <Bell size={10} strokeWidth={2.5} /> : <BellOff size={10} strokeWidth={2.5} />}
              {channel.enabled ? 'on' : 'off'}
            </span>
          </div>
          <div className="mt-[4px] font-mono text-[11.5px] text-fg-subtle flex items-center gap-[6px] min-w-0">
            <Globe size={11} strokeWidth={2} className="shrink-0" />
            <span className="truncate">{formatTarget(channel)}</span>
          </div>
          <div
            className="mt-[4px] font-mono text-[10.5px] text-fg-subtle"
            title={verified ? absoluteTime(channel.verifiedAt!) : undefined}
          >
            {verified ? (
              <>
                Verified <RelativeTime iso={channel.verifiedAt!} />
              </>
            ) : (
              <>Never verified — click “Send test” to confirm ownership</>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {!verified && (
            <button
              onClick={verify}
              disabled={busy !== null}
              className="inline-flex items-center gap-[6px] px-3 py-[7px] rounded-[8px] bg-fg text-card text-[12px] font-semibold hover:bg-fg/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ShieldCheck size={13} strokeWidth={2.5} />
              {busy === 'verify' ? 'Verifying…' : 'Send test & verify'}
            </button>
          )}
          <button
            onClick={toggle}
            disabled={!verified || busy !== null}
            className={`inline-flex items-center gap-[6px] px-3 py-[7px] rounded-[8px] border text-[12px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              channel.enabled
                ? 'bg-bg text-fg border-line hover:bg-line-soft'
                : 'bg-accent text-white border-accent hover:bg-accent/90'
            }`}
          >
            {channel.enabled ? (
              <>
                <BellOff size={13} strokeWidth={2.5} />
                {busy === 'toggle' ? 'Disabling…' : 'Disable'}
              </>
            ) : (
              <>
                <Bell size={13} strokeWidth={2.5} />
                {busy === 'toggle' ? 'Enabling…' : 'Enable'}
              </>
            )}
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-3 px-3 py-2 bg-[#fee2e2] border border-[#fecaca] rounded-[7px] text-[12px] text-[#b91c1c] flex items-center gap-2">
          <AlertTriangle size={13} strokeWidth={2} />
          {err}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-line-soft">
        <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider mb-[8px]">
          Events routed to this channel
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {EVENT_KEYS.map((key) => {
            const info = EVENT_INFO[key]
            const EventIcon = info.Icon
            const checked = channel.events.includes(key)
            const disabled = !verified || busy !== null
            return (
              <label
                key={key}
                className={`flex items-center gap-2 px-[10px] py-[8px] rounded-[8px] border cursor-pointer transition-colors ${
                  checked
                    ? 'bg-accent-ultra border-accent/20'
                    : 'bg-bg border-line hover:bg-line-soft'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleEvent(key)}
                  className="w-[13px] h-[13px] accent-accent shrink-0"
                />
                <EventIcon size={12} strokeWidth={2} className="text-fg-muted shrink-0" />
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-fg leading-tight">
                    {info.label}
                  </div>
                  <div className="font-mono text-[9.5px] text-fg-subtle mt-[1px] truncate">
                    {info.hint}
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </li>
  )
}

function formatTarget(channel: DeliveryChannel): string {
  if (channel.config.kind === 'feishu') {
    return `chat ${channel.config.chatId}`
  }
  return channel.config.url
}
