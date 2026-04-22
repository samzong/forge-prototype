import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, Mail, Sparkles } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'

type SsoProvider = 'feishu' | 'google' | 'saml'

const SSO_PROVIDERS: { id: SsoProvider; label: string; hint: string }[] = [
  { id: 'feishu', label: 'Continue with Feishu', hint: 'Host-system SSO (recommended)' },
  { id: 'google', label: 'Continue with Google', hint: 'Workspace identity' },
  { id: 'saml', label: 'Continue with SAML', hint: 'Enterprise IdP' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const [email, setEmail] = useState('samzong@acme.com')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const gotoNext = () => {
    if (user && user.onboarded === false) {
      navigate('/onboarding', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim() || submitting) return
    setSubmitting(true)
    window.setTimeout(gotoNext, 420)
  }

  const handleSso = (_provider: SsoProvider) => {
    if (submitting) return
    setSubmitting(true)
    window.setTimeout(gotoNext, 420)
  }

  return (
    <div className="min-h-screen bg-bg grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#111827] to-[#1e293b] text-white">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            background:
              'radial-gradient(circle at 20% 30%, rgba(37,99,235,0.35), transparent 55%), radial-gradient(circle at 75% 85%, rgba(167,139,250,0.28), transparent 60%)',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white font-black text-[16px]"
              style={{ background: 'linear-gradient(135deg, #2563eb, #a78bfa)' }}
            >
              F
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
              Forge
            </div>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-[440px]"
        >
          <h1 className="text-[42px] font-black tracking-[-0.025em] leading-[1.05]">
            Build <span className="text-[#93c5fd] italic">U Apps</span>
            <br />
            from a single sentence.
          </h1>
          <p className="mt-5 text-[14px] leading-[1.7] text-white/75">
            Forge turns natural-language intent into scanned, policy-checked,
            version-pinned apps that run with your own identity inside your host system.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['DCE', 'CRM', 'HR', 'Feishu', 'Webhook'].map((t) => (
              <span
                key={t}
                className="font-mono text-[10.5px] uppercase tracking-[0.14em] px-[10px] py-[5px] rounded-[6px] bg-white/10 border border-white/15"
              >
                {t}
              </span>
            ))}
          </div>
        </motion.div>
        <div className="relative font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/50">
          Prototype build · mock identity only
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white font-black text-[16px]"
              style={{ background: 'linear-gradient(135deg, #2563eb, #a78bfa)' }}
            >
              F
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
              Forge
            </div>
          </div>

          <div className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.14em] mb-3">
            Sign in
          </div>
          <h2 className="text-[28px] font-black tracking-[-0.02em] text-fg leading-[1.1]">
            Welcome back
          </h2>
          <p className="mt-2 text-[13.5px] text-fg-muted">
            Use your host-system identity, or a local credential for prototype review.
          </p>

          <div className="mt-7 space-y-2">
            {SSO_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSso(p.id)}
                disabled={submitting}
                className="w-full flex items-center justify-between gap-3 px-4 py-[13px] bg-card border border-line rounded-[10px] text-left hover:border-accent hover:bg-accent-ultra transition-colors disabled:opacity-60 group"
              >
                <div>
                  <div className="text-[13.5px] font-semibold text-fg group-hover:text-accent">
                    {p.label}
                  </div>
                  <div className="font-mono text-[10.5px] text-fg-subtle mt-[2px]">
                    {p.hint}
                  </div>
                </div>
                <ArrowRight
                  size={15}
                  strokeWidth={2.2}
                  className="text-fg-subtle group-hover:text-accent transition-colors"
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-line" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
              Or with password
            </span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <label className="block">
              <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle mb-[6px]">
                <Mail size={11} strokeWidth={2.2} />
                Email
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-[11px] bg-card border border-line rounded-[9px] text-[13.5px] text-fg focus:border-accent focus:outline-none transition-colors"
                placeholder="you@company.com"
              />
            </label>
            <label className="block">
              <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle mb-[6px]">
                <Lock size={11} strokeWidth={2.2} />
                Password
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-[11px] bg-card border border-line rounded-[9px] text-[13.5px] text-fg focus:border-accent focus:outline-none transition-colors"
                placeholder="Any value works in prototype"
              />
            </label>
            <button
              type="submit"
              disabled={submitting || !email.trim() || !password.trim()}
              className="w-full flex items-center justify-center gap-2 mt-1 px-4 py-[12px] bg-accent text-white text-[13.5px] font-semibold rounded-[9px] border border-accent hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
              {!submitting && <ArrowRight size={14} strokeWidth={2.4} />}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
            <Sparkles size={11} strokeWidth={2.2} />
            Prototype · any credential accepted
          </div>
        </motion.div>
      </main>
    </div>
  )
}
