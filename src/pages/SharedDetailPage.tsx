import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Circle,
  Code2,
  ExternalLink,
  GitFork,
  ShieldCheck,
  UserMinus,
} from 'lucide-react'
import { useApp } from '@/hooks/useApps'
import { useShares } from '@/hooks/useShares'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { forkApp, unsubscribeApp } from '@/mock/apps'
import { LoadingState } from '@/components/state/LoadingState'
import { ErrorState } from '@/components/state/ErrorState'
import { EmptyState } from '@/components/state/EmptyState'
import { RelativeTime } from '@/components/RelativeTime'

type ActionKind = 'fork' | 'unsubscribe' | null

export default function SharedDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const appState = useApp(id)
  const user = useCurrentUser().data
  const shareState = useShares({ sharedWithId: user?.id, appId: id })

  const [action, setAction] = useState<ActionKind>(null)
  const [err, setErr] = useState<Error | null>(null)

  if (appState.loading) {
    return <LoadingState label="Loading shared app…" className="p-8" />
  }
  if (appState.error) {
    return <ErrorState error={appState.error} onRetry={appState.refresh} className="p-8" />
  }
  if (!appState.data) {
    return (
      <EmptyState
        message="Shared app not found"
        ctaLabel="← Back to shared"
        onCta={() => navigate('/shared')}
        className="p-8"
      />
    )
  }

  const app = appState.data
  const share = shareState.data?.items[0]
  const upstream = app.forkedFromAppId
  const originalVersion = app.forkedFromVersionId

  const runFork = async () => {
    if (!user) return
    setAction('fork')
    setErr(null)
    try {
      const newApp = await forkApp({
        sourceAppId: app.id,
        actorId: user.id,
        newName: `${app.name} (Mine)`,
      })
      navigate(`/apps/${newApp.id}/manage?tab=settings`)
    } catch (e) {
      setErr(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setAction(null)
    }
  }

  const runUnsubscribe = async () => {
    if (!user) return
    const confirmMsg = `Unsubscribe from "${app.name}"? You'll no longer see updates.`
    if (!window.confirm(confirmMsg)) return
    setAction('unsubscribe')
    setErr(null)
    try {
      await unsubscribeApp(app.id, user.id)
      navigate('/shared')
    } catch (e) {
      setErr(e instanceof Error ? e : new Error(String(e)))
      setAction(null)
    }
  }

  const relationLabel =
    app.relation === 'forked'
      ? 'Forked copy'
      : app.relation === 'subscribed'
        ? 'Subscription'
        : 'Shared'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-full"
    >
      <div className="px-8 pt-7 pb-5 bg-card border-b border-line">
        <button
          onClick={() => navigate('/shared')}
          className="text-fg-muted hover:text-fg text-sm mb-4 font-medium flex items-center gap-[6px] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Shared
        </button>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-[52px] h-[52px] bg-bg border border-line rounded-[11px] flex items-center justify-center font-mono text-[17px] font-extrabold text-fg-muted shrink-0">
              {app.icon}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-[22px] font-extrabold text-fg tracking-tight leading-tight">
                  {app.name}
                </h1>
                <span className="font-mono text-[11px] px-2 py-[3px] bg-bg border border-line rounded text-fg-muted font-semibold">
                  {app.currentVersion}
                </span>
                <RelationPill relation={app.relation} />
              </div>
              <div className="text-[13px] text-fg-muted mt-[6px] max-w-[640px] leading-[1.55]">
                {app.description}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/apps/${app.id}`)}
              className="px-[14px] py-[9px] bg-card border border-line rounded-[9px] text-[13px] font-semibold text-fg-muted hover:border-accent hover:text-accent flex items-center gap-[6px] transition-colors"
            >
              <ExternalLink size={13} /> Open usage view
            </button>
            {app.relation === 'subscribed' && (
              <button
                onClick={runUnsubscribe}
                disabled={action !== null}
                className="px-[14px] py-[9px] bg-card border border-line rounded-[9px] text-[13px] font-semibold text-fg-muted hover:border-[#ef4444] hover:text-[#ef4444] flex items-center gap-[6px] transition-colors disabled:opacity-60"
              >
                <UserMinus size={13} />
                {action === 'unsubscribe' ? 'Unsubscribing…' : 'Unsubscribe'}
              </button>
            )}
            <button
              onClick={runFork}
              disabled={action !== null}
              className="px-5 py-[9px] bg-accent text-white rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
            >
              <GitFork size={13} />
              {action === 'fork' ? 'Forking…' : 'Fork to mine'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 grid gap-5" style={{ gridTemplateColumns: '1fr 340px' }}>
        <div className="space-y-5">
          {err && (
            <div className="bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] rounded-[10px] p-4 text-[12.5px] font-mono">
              {err.message}
            </div>
          )}

          <Section heading="What does this do?">
            <p className="text-[14px] text-fg leading-[1.65]">{app.description}</p>
          </Section>

          <Section heading="Required capabilities" icon={<ShieldCheck size={13} />}>
            <div className="space-y-[6px]">
              {app.capabilities.map((c) => (
                <div key={c} className="flex items-center gap-2">
                  <Circle size={8} className="text-[#10b981] fill-[#10b981]" />
                  <span className="font-mono text-[12px] text-fg">{c}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-line text-[12px] text-fg-muted leading-[1.55]">
              Running as a {relationLabel.toLowerCase()}, the app inherits your access boundary
              — it cannot see data you cannot.
            </div>
          </Section>

          <Section heading="Source preview" icon={<Code2 size={13} />}>
            <div className="bg-[#0a0a0a] rounded-[10px] p-4 font-mono text-[12px]">
              <div className="space-y-[2px] text-white/85">
                {[
                  `# handler.ts · ${app.id}`,
                  'export async function run(ctx) {',
                  "  const data = await ctx.cli('provider.resource.read', {",
                  '    limit: 25,',
                  '  })',
                  "  return ctx.render('template', { data })",
                  '}',
                ].map((l, i) => (
                  <div key={i} className="flex">
                    <span className="text-white/25 select-none w-8 text-right pr-3">{i + 1}</span>
                    <span className={`whitespace-pre ${l.startsWith('#') ? 'text-white/45' : ''}`}>
                      {l || '\u00A0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <InfoCard title="Shared by">
            <div className="text-[13px] font-semibold text-fg">{app.ownerId}</div>
            {share?.createdAt && (
              <div className="font-mono text-[10px] text-fg-subtle mt-[3px]">
                <RelativeTime iso={share.createdAt} />
              </div>
            )}
          </InfoCard>

          {app.relation === 'forked' && upstream && (
            <InfoCard title="Upstream" icon={<GitFork size={12} />}>
              <div className="text-[12.5px] text-fg font-medium break-all">{upstream}</div>
              <div className="font-mono text-[10px] text-fg-subtle mt-[3px]">
                Forked from version {originalVersion ?? '—'}
              </div>
            </InfoCard>
          )}

          <InfoCard title="Status">
            <div className="text-[12.5px] text-fg font-medium capitalize">{app.status}</div>
            <div className="font-mono text-[10px] text-fg-subtle mt-[3px]">
              Last updated <RelativeTime iso={app.updatedAt} />
            </div>
          </InfoCard>

          <InfoCard title="Your permission">
            <div className="text-[12.5px] text-fg font-medium">{share?.permission ?? 'use'}</div>
            <div className="font-mono text-[10px] text-fg-subtle mt-[3px]">
              as {relationLabel.toLowerCase()}
            </div>
          </InfoCard>
        </div>
      </div>
    </motion.div>
  )
}

function RelationPill({ relation }: { relation: 'subscribed' | 'forked' | undefined }) {
  if (!relation) return null
  const palette =
    relation === 'forked'
      ? 'text-[#0e7490] bg-[#cffafe] border-[#a5f3fc]'
      : 'text-[#0369a1] bg-[#e0f2fe] border-[#bae6fd]'
  return (
    <span
      className={`font-mono text-[10px] px-[7px] py-[2px] rounded border font-bold uppercase tracking-wider ${palette}`}
    >
      {relation}
    </span>
  )
}

function Section({
  heading,
  icon,
  children,
}: {
  heading: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-card border border-line rounded-[12px] p-6">
      <div className="font-mono text-[11px] font-bold text-fg-muted uppercase tracking-[0.1em] mb-3 flex items-center gap-[6px]">
        {icon}
        {heading}
      </div>
      {children}
    </div>
  )
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-card border border-line rounded-[12px] p-4">
      <div className="font-mono text-[10px] font-bold text-fg-subtle uppercase tracking-[0.1em] mb-2 flex items-center gap-[6px]">
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}
