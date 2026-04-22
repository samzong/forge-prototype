import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, ChevronRight, Globe, Shield } from 'lucide-react'
import type { App } from '@/types'
import { useApps } from '@/hooks/useApps'
import { useMarketplaceListings } from '@/hooks/useMarketplaceListings'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { publishApp } from '@/mock/apps'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'

type Step = 'pick' | 'describe' | 'review'

export default function MarketplacePublishPage() {
  const navigate = useNavigate()
  const appsState = useApps({ group: 'mine' })
  const listingsState = useMarketplaceListings({})
  const user = useCurrentUser().data

  const publishedIds = useMemo(() => {
    const s = new Set<string>()
    for (const l of listingsState.data?.items ?? []) s.add(l.appId)
    return s
  }, [listingsState.data])

  const candidates = useMemo(() => {
    return (appsState.data?.items ?? []).filter((a) => !publishedIds.has(a.id))
  }, [appsState.data, publishedIds])

  const [step, setStep] = useState<Step>('pick')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [about, setAbout] = useState('')
  const [highlightsRaw, setHighlightsRaw] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<Error | null>(null)

  const selected = useMemo(
    () => candidates.find((a) => a.id === selectedAppId) ?? null,
    [candidates, selectedAppId],
  )

  const highlights = highlightsRaw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  const canDescribe = !!selected
  const canReview = canDescribe && about.trim().length > 20 && highlights.length >= 1
  const canSubmit = canReview && !submitting

  const submit = async () => {
    if (!selected || !canSubmit) return
    setSubmitting(true)
    setErr(null)
    try {
      await publishApp({
        sourceAppId: selected.id,
        about: about.trim(),
        highlights,
        tags,
        actorId: user?.id,
      })
      navigate(`/marketplace/${selected.id}`)
    } catch (e) {
      setErr(e instanceof Error ? e : new Error(String(e)))
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-[820px] mx-auto">
        <button
          onClick={() => navigate('/marketplace')}
          className="text-fg-muted hover:text-fg text-sm mb-4 font-medium flex items-center gap-[6px] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Marketplace
        </button>

        <div className="mb-7">
          <div className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.12em] mb-3">
            Marketplace · Publish
          </div>
          <h1 className="text-[32px] font-black tracking-[-0.02em] leading-tight">
            Publish an app to the marketplace
          </h1>
          <p className="text-fg-muted mt-3 max-w-[620px] text-[14.5px]">
            Make one of your apps discoverable by every team in the tenant. Once published, other
            users can subscribe or fork it freely.
          </p>
        </div>

        <Stepper step={step} />

        {err && (
          <div className="bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] rounded-[10px] p-4 text-[12.5px] font-mono my-4">
            {err.message}
          </div>
        )}

        {step === 'pick' && (
          <PickStep
            loading={appsState.loading || listingsState.loading}
            candidates={candidates}
            selectedId={selectedAppId}
            onSelect={setSelectedAppId}
            onNext={() => selected && setStep('describe')}
            canNext={canDescribe}
          />
        )}

        {step === 'describe' && selected && (
          <DescribeStep
            app={selected}
            about={about}
            setAbout={setAbout}
            highlightsRaw={highlightsRaw}
            setHighlightsRaw={setHighlightsRaw}
            tagsRaw={tagsRaw}
            setTagsRaw={setTagsRaw}
            onBack={() => setStep('pick')}
            onNext={() => setStep('review')}
            canNext={canReview}
          />
        )}

        {step === 'review' && selected && (
          <ReviewStep
            app={selected}
            about={about}
            highlights={highlights}
            tags={tags}
            onBack={() => setStep('describe')}
            onSubmit={submit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  )
}

function Stepper({ step }: { step: Step }) {
  const steps: Array<{ id: Step; label: string }> = [
    { id: 'pick', label: 'Choose app' },
    { id: 'describe', label: 'Describe' },
    { id: 'review', label: 'Review & publish' },
  ]
  const activeIndex = steps.findIndex((s) => s.id === step)
  return (
    <div className="flex items-center gap-3 mb-6">
      {steps.map((s, i) => {
        const active = i === activeIndex
        const done = i < activeIndex
        return (
          <div key={s.id} className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[12px] font-extrabold border ${
                active
                  ? 'bg-accent text-white border-accent'
                  : done
                    ? 'bg-accent-ultra text-accent border-accent/30'
                    : 'bg-bg text-fg-subtle border-line'
              }`}
            >
              {done ? <Check size={13} /> : i + 1}
            </div>
            <span
              className={`text-[12.5px] font-semibold ${
                active ? 'text-fg' : done ? 'text-fg-muted' : 'text-fg-subtle'
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <ChevronRight size={14} className="text-fg-subtle" />}
          </div>
        )
      })}
    </div>
  )
}

function PickStep({
  loading,
  candidates,
  selectedId,
  onSelect,
  onNext,
  canNext,
}: {
  loading: boolean
  candidates: App[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNext: () => void
  canNext: boolean
}) {
  if (loading && candidates.length === 0) {
    return <LoadingState label="Loading your apps…" className="py-20" />
  }
  if (candidates.length === 0) {
    return (
      <EmptyState
        message="All your apps are already published"
        hint="Publish becomes available again after an unpublish."
      />
    )
  }
  return (
    <div className="space-y-3">
      {candidates.map((app) => (
        <button
          key={app.id}
          onClick={() => onSelect(app.id)}
          className={`w-full flex items-center gap-4 bg-card border-2 rounded-[12px] p-4 text-left transition-colors ${
            selectedId === app.id ? 'border-accent' : 'border-line hover:border-accent/40'
          }`}
        >
          <div className="w-11 h-11 bg-bg border border-line rounded-[10px] flex items-center justify-center font-mono text-sm font-extrabold text-fg-muted shrink-0">
            {app.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-bold text-fg truncate">{app.name}</div>
              <span className="font-mono text-[10px] text-fg-subtle">{app.currentVersion}</span>
              <span className="font-mono text-[10px] text-fg-subtle">·</span>
              <span className="font-mono text-[10px] text-fg-subtle capitalize">{app.viewKind}</span>
            </div>
            <p className="text-[12.5px] text-fg-muted mt-1 line-clamp-2">{app.description}</p>
          </div>
          {selectedId === app.id && (
            <div className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center">
              <Check size={14} />
            </div>
          )}
        </button>
      ))}
      <div className="flex justify-end pt-3">
        <button
          disabled={!canNext}
          onClick={onNext}
          className="px-5 py-[9px] bg-accent text-white rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] hover:bg-[#1d4ed8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function DescribeStep({
  app,
  about,
  setAbout,
  highlightsRaw,
  setHighlightsRaw,
  tagsRaw,
  setTagsRaw,
  onBack,
  onNext,
  canNext,
}: {
  app: App
  about: string
  setAbout: (v: string) => void
  highlightsRaw: string
  setHighlightsRaw: (v: string) => void
  tagsRaw: string
  setTagsRaw: (v: string) => void
  onBack: () => void
  onNext: () => void
  canNext: boolean
}) {
  return (
    <div className="space-y-5">
      <div className="bg-accent-ultra border border-accent/20 rounded-[10px] p-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-accent text-white rounded-[9px] flex items-center justify-center font-mono text-[13px] font-extrabold shrink-0">
          {app.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-fg truncate">
            {app.name} <span className="font-mono text-[10px] text-fg-subtle">({app.currentVersion})</span>
          </div>
          <div className="text-[11.5px] text-fg-muted line-clamp-1">{app.description}</div>
        </div>
      </div>

      <Field
        label="About"
        hint="Long-form description visible on the listing. At least 20 characters."
      >
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={6}
          placeholder="What does your app do? Who should install it?"
          className="w-full px-3 py-2 bg-card border border-line rounded-[9px] text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent leading-[1.55]"
        />
      </Field>

      <Field
        label="Highlights"
        hint="One bullet per line — 3 to 5 is ideal."
      >
        <textarea
          value={highlightsRaw}
          onChange={(e) => setHighlightsRaw(e.target.value)}
          rows={5}
          placeholder={'Multi-language coverage\nInline suggestions\nAudited decisions'}
          className="w-full px-3 py-2 bg-card border border-line rounded-[9px] text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent leading-[1.55]"
        />
      </Field>

      <Field label="Tags" hint="Comma-separated. Use lowercase. e.g. github, release, community">
        <input
          type="text"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="github, release, automation"
          className="w-full px-3 py-[9px] bg-card border border-line rounded-[9px] text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent"
        />
      </Field>

      <div className="bg-card border border-line rounded-[10px] p-4 flex items-start gap-3">
        <Shield size={15} className="text-fg-muted mt-[2px] shrink-0" />
        <div className="text-[12.5px] text-fg-muted leading-[1.55]">
          Publishing makes <span className="font-mono text-fg">{app.capabilities.length}</span>{' '}
          capability requirements public. Subscribers will inherit these capabilities under their
          own identity at install time.
        </div>
      </div>

      <div className="flex justify-between pt-3">
        <button
          onClick={onBack}
          className="px-[14px] py-[9px] text-[13px] font-semibold text-fg-muted hover:text-fg flex items-center gap-[6px] transition-colors"
        >
          <ArrowLeft size={13} /> Back
        </button>
        <button
          disabled={!canNext}
          onClick={onNext}
          className="px-5 py-[9px] bg-accent text-white rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] hover:bg-[#1d4ed8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Review <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function ReviewStep({
  app,
  about,
  highlights,
  tags,
  onBack,
  onSubmit,
  submitting,
}: {
  app: App
  about: string
  highlights: string[]
  tags: string[]
  onBack: () => void
  onSubmit: () => void
  submitting: boolean
}) {
  return (
    <div className="space-y-5">
      <div className="bg-card border border-line rounded-[12px] p-5">
        <div className="font-mono text-[11px] font-bold text-fg-muted uppercase tracking-[0.1em] mb-3">
          Listing preview
        </div>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 bg-bg border border-line rounded-[10px] flex items-center justify-center font-mono text-sm font-extrabold text-fg-muted shrink-0">
            {app.icon}
          </div>
          <div>
            <div className="font-bold text-fg">{app.name}</div>
            <div className="font-mono text-[10px] text-fg-subtle mt-[2px]">
              {app.currentVersion} · {app.capabilities.length} capabilities
            </div>
          </div>
        </div>
        <p className="text-[13px] text-fg leading-[1.6] whitespace-pre-line">{about}</p>
        {highlights.length > 0 && (
          <ul className="mt-3 space-y-[4px]">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-[12.5px] text-fg">
                <Check size={13} className="text-accent mt-[3px] shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-[6px] mt-3">
            {tags.map((t) => (
              <span
                key={t}
                className="font-mono text-[10px] px-2 py-[3px] bg-bg border border-line rounded text-fg-muted"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-line rounded-[12px] p-5">
        <div className="font-mono text-[11px] font-bold text-fg-muted uppercase tracking-[0.1em] mb-3">
          Capabilities to disclose
        </div>
        <div className="space-y-[6px]">
          {app.capabilities.map((c) => (
            <div key={c} className="flex items-center gap-2 text-[12px]">
              <Shield size={11} className="text-fg-muted" />
              <span className="font-mono text-fg">{c}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-3">
        <button
          onClick={onBack}
          className="px-[14px] py-[9px] text-[13px] font-semibold text-fg-muted hover:text-fg flex items-center gap-[6px] transition-colors"
        >
          <ArrowLeft size={13} /> Back
        </button>
        <button
          disabled={submitting}
          onClick={onSubmit}
          className="px-5 py-[9px] bg-accent text-white rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
        >
          <Globe size={14} />
          {submitting ? 'Publishing…' : 'Publish to marketplace'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="font-mono text-[11px] font-bold text-fg-muted uppercase tracking-[0.1em] mb-2">
        {label}
      </div>
      {children}
      {hint && <div className="text-[11px] text-fg-subtle mt-[5px] leading-[1.5]">{hint}</div>}
    </motion.div>
  )
}
