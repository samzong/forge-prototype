import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Check,
  Mail,
  Rocket,
  Sparkles,
  Webhook,
} from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { LoadingState } from '@/components/state/LoadingState'

type ChannelKind = 'feishu' | 'webhook' | 'email'

interface ChannelOption {
  id: ChannelKind
  label: string
  hint: string
  Icon: typeof Bell
}

const CHANNEL_OPTIONS: ChannelOption[] = [
  {
    id: 'feishu',
    label: 'Feishu',
    hint: 'Push to your primary chat · recommended',
    Icon: Bell,
  },
  {
    id: 'webhook',
    label: 'Webhook',
    hint: 'POST to your own endpoint',
    Icon: Webhook,
  },
  { id: 'email', label: 'Email digest', hint: 'Daily summary at 08:00', Icon: Mail },
]

const STEPS = [
  { title: 'Welcome', hint: 'What Forge does' },
  { title: 'Your team', hint: 'Confirm primary scope' },
  { title: 'Notifications', hint: 'Where deliveries go' },
] as const

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { data: user, loading } = useCurrentUser()
  const [step, setStep] = useState(0)
  const [primaryTeam, setPrimaryTeam] = useState<string | null>(null)
  const [channels, setChannels] = useState<Set<ChannelKind>>(
    () => new Set<ChannelKind>(['feishu']),
  )

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState label="Loading profile…" />
      </div>
    )
  }
  if (!user) return null

  const effectivePrimary = primaryTeam ?? user.primaryTeamId
  const canAdvance =
    step === 0 ||
    (step === 1 && !!effectivePrimary) ||
    (step === 2 && channels.size > 0)

  const toggleChannel = (id: ChannelKind) => {
    setChannels((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleFinish = () => navigate('/', { replace: true })
  const handleSkip = () => navigate('/', { replace: true })

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-[680px]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white font-black text-[16px]"
              style={{ background: 'linear-gradient(135deg, #2563eb, #a78bfa)' }}
            >
              F
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
              Forge · Getting started
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-subtle hover:text-accent transition-colors"
          >
            Skip
          </button>
        </div>

        <Stepper step={step} />

        <div className="bg-card border border-line rounded-[14px] p-8 mt-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.section
                key="welcome"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-[10px] bg-accent-ultra border border-accent/20 flex items-center justify-center">
                    <Sparkles size={16} className="text-accent" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
                      Step 1
                    </div>
                    <h2 className="text-[22px] font-black text-fg tracking-[-0.015em] leading-tight">
                      Hi {user.displayName.split(' ')[0]}, welcome to Forge
                    </h2>
                  </div>
                </div>
                <p className="text-[13.5px] text-fg-muted leading-[1.75]">
                  Forge is the in-app builder embedded inside your host system. Describe
                  what you need in plain language; Forge parses intent, scopes
                  capabilities, scans generated code, and deploys a versioned U App that
                  runs under your identity.
                </p>
                <ul className="mt-5 space-y-2">
                  {[
                    'Every run uses your own roles — no service accounts by default',
                    'Generate, scan, policy-check, sandbox, deploy — all visible',
                    'Share or publish apps to your team or the marketplace',
                  ].map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2 text-[13px] text-fg-muted"
                    >
                      <Check
                        size={14}
                        className="text-accent mt-[3px] shrink-0"
                        strokeWidth={2.4}
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}

            {step === 1 && (
              <motion.section
                key="team"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-[10px] bg-accent-ultra border border-accent/20 flex items-center justify-center">
                    <Building2 size={16} className="text-accent" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
                      Step 2
                    </div>
                    <h2 className="text-[22px] font-black text-fg tracking-[-0.015em] leading-tight">
                      Confirm your primary team
                    </h2>
                  </div>
                </div>
                <p className="text-[13.5px] text-fg-muted leading-[1.65] mb-5">
                  Shared apps, quotas, and team-wide audit flows use this team by
                  default. You can change it later in Settings.
                </p>
                <div className="space-y-2">
                  {user.teamIds.map((t) => {
                    const selected = effectivePrimary === t
                    return (
                      <button
                        key={t}
                        onClick={() => setPrimaryTeam(t)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-[13px] rounded-[10px] border text-left transition-colors ${
                          selected
                            ? 'bg-accent-ultra border-accent'
                            : 'bg-bg border-line hover:border-accent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0 ${
                              selected
                                ? 'bg-accent text-white'
                                : 'bg-card border border-line text-fg-muted'
                            }`}
                          >
                            <Building2 size={14} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <div
                              className={`font-mono text-[13px] truncate ${
                                selected
                                  ? 'text-accent font-bold'
                                  : 'text-fg font-semibold'
                              }`}
                            >
                              {t}
                            </div>
                            {t === user.primaryTeamId && (
                              <div className="font-mono text-[10px] text-fg-subtle mt-[2px] uppercase tracking-wider">
                                Current primary
                              </div>
                            )}
                          </div>
                        </div>
                        {selected && (
                          <Check
                            size={15}
                            className="text-accent shrink-0"
                            strokeWidth={2.4}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                key="channels"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-[10px] bg-accent-ultra border border-accent/20 flex items-center justify-center">
                    <Bell size={16} className="text-accent" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
                      Step 3
                    </div>
                    <h2 className="text-[22px] font-black text-fg tracking-[-0.015em] leading-tight">
                      Where should we deliver?
                    </h2>
                  </div>
                </div>
                <p className="text-[13.5px] text-fg-muted leading-[1.65] mb-5">
                  Pick at least one channel. Deploy results, policy alerts, and shared
                  app updates go here. Configure details later in Settings →
                  Notifications.
                </p>
                <div className="space-y-2">
                  {CHANNEL_OPTIONS.map((c) => {
                    const selected = channels.has(c.id)
                    const Icon = c.Icon
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleChannel(c.id)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-[13px] rounded-[10px] border text-left transition-colors ${
                          selected
                            ? 'bg-accent-ultra border-accent'
                            : 'bg-bg border-line hover:border-accent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0 ${
                              selected
                                ? 'bg-accent text-white'
                                : 'bg-card border border-line text-fg-muted'
                            }`}
                          >
                            <Icon size={14} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <div
                              className={`text-[13.5px] ${
                                selected
                                  ? 'text-accent font-bold'
                                  : 'text-fg font-semibold'
                              }`}
                            >
                              {c.label}
                            </div>
                            <div className="font-mono text-[10.5px] text-fg-subtle mt-[2px] truncate">
                              {c.hint}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 ${
                            selected
                              ? 'bg-accent border-accent'
                              : 'bg-card border-line'
                          }`}
                        >
                          {selected && (
                            <Check size={12} className="text-white" strokeWidth={3} />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-line-soft">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-2 px-3 py-[9px] text-[12.5px] font-semibold text-fg-muted hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft size={13} strokeWidth={2.4} />
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance}
                className="inline-flex items-center gap-2 px-4 py-[10px] bg-accent text-white text-[13px] font-semibold rounded-[9px] border border-accent hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight size={13} strokeWidth={2.4} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canAdvance}
                className="inline-flex items-center gap-2 px-4 py-[10px] bg-accent text-white text-[13px] font-semibold rounded-[9px] border border-accent hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Rocket size={14} strokeWidth={2.4} />
                Enter Forge
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
          Prototype · selections are not persisted
        </div>
      </div>
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-stretch gap-2">
      {STEPS.map((s, i) => {
        const state: 'done' | 'active' | 'pending' =
          i < step ? 'done' : i === step ? 'active' : 'pending'
        return (
          <li key={s.title} className="flex-1 min-w-0">
            <div
              className={`h-[3px] rounded-full mb-3 ${
                state === 'pending' ? 'bg-line' : 'bg-accent'
              }`}
            />
            <div className="flex items-center gap-2">
              <div
                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center font-mono text-[10.5px] font-black shrink-0 ${
                  state === 'done'
                    ? 'bg-accent text-white'
                    : state === 'active'
                      ? 'bg-accent-ultra border border-accent text-accent'
                      : 'bg-card border border-line text-fg-subtle'
                }`}
              >
                {state === 'done' ? <Check size={12} strokeWidth={2.8} /> : i + 1}
              </div>
              <div className="min-w-0">
                <div
                  className={`text-[12.5px] font-bold truncate ${
                    state === 'pending' ? 'text-fg-subtle' : 'text-fg'
                  }`}
                >
                  {s.title}
                </div>
                <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider truncate">
                  {s.hint}
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
