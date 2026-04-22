import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Circle,
  Code2,
  Download,
  FlaskConical,
  GitFork,
  History,
  ShieldCheck,
  Star,
  Tag,
  UserPlus,
  Users,
} from 'lucide-react'
import { useMarketplaceListing } from '@/hooks/useMarketplaceListings'
import { useApp } from '@/hooks/useApps'
import { useShares } from '@/hooks/useShares'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { forkApp, subscribeApp } from '@/mock/apps'
import { LoadingState } from '@/components/state/LoadingState'
import { ErrorState } from '@/components/state/ErrorState'
import { EmptyState } from '@/components/state/EmptyState'
import { RelativeTime } from '@/components/RelativeTime'

type ActionKind = 'subscribe' | 'fork' | null

export default function MarketplaceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const listingState = useMarketplaceListing(id)
  const appState = useApp(id)
  const user = useCurrentUser().data
  const sharesState = useShares({ sharedWithId: user?.id, appId: id })

  const [action, setAction] = useState<ActionKind>(null)
  const [err, setErr] = useState<Error | null>(null)

  if (listingState.loading || appState.loading) {
    return <LoadingState label="Loading marketplace entry…" className="p-8" />
  }
  if (listingState.error) {
    return <ErrorState error={listingState.error} onRetry={listingState.refresh} className="p-8" />
  }
  if (!listingState.data || !appState.data) {
    return (
      <EmptyState
        message="Marketplace entry not found"
        ctaLabel="← Back to marketplace"
        onCta={() => navigate('/marketplace')}
        className="p-8"
      />
    )
  }

  const listing = listingState.data
  const app = appState.data
  const existingSubscription =
    sharesState.data?.items.find((s) => s.relation === 'subscribed') ?? null
  const existingFork = sharesState.data?.items.find((s) => s.relation === 'forked') ?? null

  const runSubscribe = async () => {
    if (!user) return
    setAction('subscribe')
    setErr(null)
    try {
      const newApp = await subscribeApp({ sourceAppId: app.id, actorId: user.id })
      navigate(`/apps/${newApp.id}`)
    } catch (e) {
      setErr(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setAction(null)
    }
  }

  const runFork = async () => {
    if (!user) return
    setAction('fork')
    setErr(null)
    try {
      const newApp = await forkApp({ sourceAppId: app.id, actorId: user.id })
      navigate(`/apps/${newApp.id}?tab=settings`)
    } catch (e) {
      setErr(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setAction(null)
    }
  }

  const officialTag = listing.tags.includes('official')
  const formattedStars =
    listing.stars >= 1000 ? `${(listing.stars / 1000).toFixed(1)}k` : String(listing.stars)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-full"
    >
      <div className="px-8 pt-7 pb-5 bg-card border-b border-line">
        <button
          onClick={() => navigate('/marketplace')}
          className="text-fg-muted hover:text-fg text-sm mb-4 font-medium flex items-center gap-[6px] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Marketplace
        </button>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-[56px] h-[56px] bg-gradient-to-br from-[#6366f1] to-accent text-white rounded-[12px] flex items-center justify-center font-mono text-[17px] font-extrabold shrink-0">
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
                {officialTag && (
                  <span className="font-mono text-[10px] px-[7px] py-[2px] bg-accent-ultra text-accent border border-accent/20 rounded font-bold uppercase tracking-wider">
                    Official
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-[6px] text-[12px] text-fg-muted">
                <Stat icon={<Star size={12} className="text-[#f59e0b] fill-[#f59e0b]" />}>
                  {formattedStars}
                </Stat>
                <Stat icon={<GitFork size={12} />}>
                  {listing.forks} forks
                </Stat>
                <Stat icon={<Users size={12} />}>
                  {listing.subscribers} subscribers
                </Stat>
                <Stat icon={<Circle size={8} className="fill-current text-fg-subtle" />}>
                  <RelativeTime iso={listing.publishedAt} />
                </Stat>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-[14px] py-[9px] bg-card border border-line rounded-[9px] text-[13px] font-semibold text-fg-muted hover:border-accent hover:text-accent flex items-center gap-[6px] transition-colors">
              <FlaskConical size={14} /> Try in Sandbox
            </button>
            <button
              onClick={runSubscribe}
              disabled={action !== null || existingSubscription !== null}
              className="px-[14px] py-[9px] bg-card border border-line rounded-[9px] text-[13px] font-semibold text-fg-muted hover:border-accent hover:text-accent flex items-center gap-[6px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-fg-muted"
            >
              <UserPlus size={14} />
              {existingSubscription
                ? 'Subscribed'
                : action === 'subscribe'
                  ? 'Subscribing…'
                  : 'Subscribe'}
            </button>
            <button
              onClick={runFork}
              disabled={action !== null}
              className="px-5 py-[9px] bg-accent text-white rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
            >
              <Download size={14} />
              {action === 'fork' ? 'Forking…' : existingFork ? 'Fork again' : 'Fork to mine'}
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

          <Section heading="About">
            <p className="text-[14px] text-fg leading-[1.65]">{listing.about}</p>
            <p className="text-[13px] text-fg-muted mt-4 leading-[1.6]">{app.description}</p>
          </Section>

          <Section heading="Highlights">
            <ul className="space-y-2 mt-1">
              {listing.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-[13px] text-fg">
                  <Circle size={8} className="mt-[7px] text-accent fill-accent shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section heading="Version History" icon={<History size={13} />}>
            <div className="space-y-3 mt-1">
              {listing.versionLog.map((v) => (
                <div key={v.version} className="flex items-start gap-3 text-[12.5px]">
                  <span className="font-mono font-bold text-accent w-[42px] shrink-0">
                    {v.version}
                  </span>
                  <span className="font-mono text-fg-subtle w-[96px] shrink-0">
                    <RelativeTime iso={v.date} />
                  </span>
                  <span className="text-fg-muted flex-1">{v.note}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section heading="Source Preview" icon={<Code2 size={13} />}>
            <CodePreview appId={app.id} />
          </Section>
        </div>

        <div className="space-y-4">
          <InfoCard title="Publisher">
            <div className="text-[13px] font-semibold text-fg">{listing.publisherId}</div>
            <div className="font-mono text-[10px] text-fg-subtle mt-[3px]">
              Published <RelativeTime iso={listing.publishedAt} />
            </div>
          </InfoCard>

          <InfoCard title="Reviews">
            <div className="flex items-baseline gap-2">
              <span className="text-[18px] font-extrabold text-fg">
                {listing.reviews.avg.toFixed(1)}
              </span>
              <span className="text-[11px] text-fg-subtle">/ 5.0</span>
            </div>
            <div className="font-mono text-[10px] text-fg-subtle mt-[3px]">
              {listing.reviews.count} reviews
            </div>
          </InfoCard>

          <InfoCard title="Required capabilities" icon={<ShieldCheck size={12} />}>
            <div className="space-y-[6px] mt-1">
              {app.capabilities.map((c) => (
                <div key={c} className="flex items-center gap-2">
                  <Circle size={8} className="text-[#10b981] fill-[#10b981]" />
                  <span className="font-mono text-[11px] text-fg">{c}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-line text-[11px] text-fg-muted leading-[1.5]">
              Granted under <span className="font-mono">runtime_identity: invoker</span>.
            </div>
          </InfoCard>

          <InfoCard title="Tags" icon={<Tag size={12} />}>
            <div className="flex flex-wrap gap-[6px] mt-1">
              {listing.tags.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[10px] px-2 py-[3px] bg-bg border border-line rounded text-fg-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </InfoCard>

          {existingSubscription && (
            <InfoCard title="Your subscription">
              <div className="text-[12px] text-fg-muted leading-[1.5]">
                Subscribed <RelativeTime iso={existingSubscription.createdAt} />
              </div>
            </InfoCard>
          )}
          {existingFork && (
            <InfoCard title="Your fork">
              <div className="text-[12px] text-fg-muted leading-[1.5]">
                Forked from <span className="font-mono">{existingFork.forkedFromVersionId}</span>{' '}
                <RelativeTime iso={existingFork.createdAt} />
              </div>
            </InfoCard>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function Stat({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[5px]">
      {icon}
      <span className="font-mono font-semibold">{children}</span>
    </div>
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

function CodePreview({ appId }: { appId: string }) {
  const lines = useMemo(
    () => [
      `# handler.ts · ${appId} · read-only preview`,
      'export async function run(ctx) {',
      "  const data = await ctx.cli('provider.resource.read', {",
      '    limit: 50,',
      '  })',
      "  return ctx.render('template', { data })",
      '}',
    ],
    [appId],
  )
  return (
    <div className="bg-[#0a0a0a] rounded-[10px] p-4 font-mono text-[12px]">
      <div className="space-y-[2px]">
        {lines.map((l, i) => (
          <div key={i} className="flex text-white/85">
            <span className="text-white/25 select-none w-8 text-right pr-3">{i + 1}</span>
            <span className={`whitespace-pre ${l.startsWith('#') ? 'text-white/45' : ''}`}>
              {l || '\u00A0'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
