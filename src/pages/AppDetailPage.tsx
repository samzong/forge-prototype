import type { ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Play,
  Pause,
  Share2,
  Code2,
  FileText,
  History,
  X,
  Download,
  FlaskConical,
  Star,
  Users,
  Shield,
  Zap,
  CheckCircle2,
  Circle,
  Bell,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { APPS } from '@/mock/apps'
import { App } from '@/types'
import { VibeChatTrigger, type VibeChatSubject } from '@/components/vibe-chat'

function subjectFromApp(app: App): VibeChatSubject {
  return {
    type: 'app',
    id: app.id,
    name: app.name,
    icon: app.icon,
    description: app.description,
    capabilities: app.capabilities,
  }
}

export default function AppDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const app = APPS.find((a) => a.id === id)

  if (!app) {
    return (
      <div className="p-8 text-center">
        <div className="text-fg-muted">App not found.</div>
        <button onClick={() => navigate('/')} className="mt-4 text-accent">
          ← Back
        </button>
      </div>
    )
  }

  if (app.embedUrl) return <EmbedView app={app} />
  return app.group === 'marketplace' ? <InstallView app={app} /> : <UsageView app={app} />
}

/* ============================================================================
 * EMBED VIEW — 用 iframe 嵌入外部 HTML 原型（例：经营驾驶舱）
 * ========================================================================= */

function EmbedView({ app }: { app: App }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col"
    >
      <div className="px-8 pt-5 pb-4 bg-card border-b border-line shrink-0">
        <button
          onClick={() => navigate('/')}
          className="text-fg-muted hover:text-fg text-sm mb-3 font-medium flex items-center gap-[6px] transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-[48px] h-[48px] bg-accent text-white rounded-[11px] flex items-center justify-center font-mono text-[16px] font-extrabold shrink-0">
              {app.icon}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-[20px] font-extrabold text-fg tracking-tight leading-tight">
                  {app.name}
                </h1>
                <span className="font-mono text-[11px] px-2 py-[3px] bg-bg border border-line rounded text-fg-muted font-semibold">
                  {app.version}
                </span>
                <RunningPulse on />
              </div>
              <div className="text-[12.5px] text-fg-muted mt-[4px] max-w-[720px] leading-[1.5]">
                {app.description}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={app.embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-[14px] py-2 bg-card border border-line rounded-[9px] text-[13px] font-semibold text-fg-muted hover:border-accent hover:text-accent flex items-center gap-[6px] transition-colors"
            >
              <ExternalLink size={13} /> Open in new tab
            </a>
            <button className="px-[14px] py-2 bg-card border border-line rounded-[9px] text-[13px] font-semibold text-fg-muted hover:border-accent hover:text-accent flex items-center gap-[6px] transition-colors">
              <Share2 size={13} /> Share
            </button>
            <VibeChatTrigger subject={subjectFromApp(app)} variant="primary" label="Chat to edit" />
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-bg">
        <iframe
          src={app.embedUrl}
          title={app.name}
          className="w-full h-full border-0 block"
        />
      </div>
    </motion.div>
  )
}

/* ============================================================================
 * USAGE VIEW — "我的应用" 打开后的主场景：看数据 + 操作
 * ========================================================================= */

function UsageView({ app }: { app: App }) {
  const navigate = useNavigate()
  const [showSource, setShowSource] = useState(false)
  const [running, setRunning] = useState(app.status === 'running')

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-full"
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-5 bg-card border-b border-line">
          <button
            onClick={() => navigate('/')}
            className="text-fg-muted hover:text-fg text-sm mb-4 font-medium flex items-center gap-[6px] transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-[52px] h-[52px] bg-accent text-white rounded-[11px] flex items-center justify-center font-mono text-[17px] font-extrabold shrink-0">
                {app.icon}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-[22px] font-extrabold text-fg tracking-tight leading-tight">
                    {app.name}
                  </h1>
                  <span className="font-mono text-[11px] px-2 py-[3px] bg-bg border border-line rounded text-fg-muted font-semibold">
                    {app.version}
                  </span>
                  <RunningPulse on={running} />
                </div>
                <div className="text-[13px] text-fg-muted mt-[6px] max-w-[640px] leading-[1.55]">
                  {app.description}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSource(true)}
                aria-label="View source"
                className="w-9 h-9 rounded-[9px] border border-line text-fg-muted hover:border-accent hover:text-accent flex items-center justify-center transition-colors"
                title="View source"
              >
                <Code2 size={15} />
              </button>
              <button className="px-[14px] py-2 bg-card border border-line rounded-[9px] text-[13px] font-semibold text-fg-muted hover:border-accent hover:text-accent flex items-center gap-[6px] transition-colors">
                <Share2 size={13} /> Share
              </button>
              <button
                onClick={() => setRunning((v) => !v)}
                className="px-[14px] py-2 bg-card border border-line rounded-[9px] text-[13px] font-semibold text-fg-muted hover:border-accent hover:text-accent flex items-center gap-[6px] transition-colors"
              >
                {running ? <Pause size={13} /> : <Play size={13} />}
                {running ? 'Pause' : 'Resume'}
              </button>
              <VibeChatTrigger subject={subjectFromApp(app)} variant="primary" label="Chat to edit" />
              <button className="px-[16px] py-2 bg-accent text-white rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] hover:bg-[#1d4ed8] transition-colors">
                <Zap size={13} /> Run Now
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* Left: Live output */}
          <div className="space-y-5">
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Alerts this week" value="47" delta="+12" accent />
              <StatCard label="Critical" value="3" delta="-1" />
              <StatCard label="Avg MTTR" value="18m" delta="-4m" />
            </div>

            {/* Top alerts */}
            <div className="bg-card border border-line rounded-[12px] overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-[14px] pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-accent" />
                  <div className="font-mono text-[11px] font-bold text-fg-muted uppercase tracking-[0.1em]">
                    Top 10 Alerts · Platform Team
                  </div>
                </div>
                <div className="text-[11px] text-fg-subtle font-mono">7d window</div>
              </div>
              <div className="divide-y divide-line">
                {MOCK_ALERTS.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.22 }}
                    className="flex items-center gap-3 px-5 py-[11px] hover:bg-line-soft transition-colors"
                  >
                    <SeverityDot level={a.severity} />
                    <div className="font-mono text-[11px] text-fg-subtle w-[140px] truncate">
                      {a.namespace}
                    </div>
                    <div className="flex-1 text-[13px] text-fg truncate">{a.name}</div>
                    <div className="font-mono text-[10px] text-fg-subtle w-[48px] text-right">
                      {a.age}
                    </div>
                    <div className="font-mono text-[11px] font-bold text-fg w-[32px] text-right">
                      ×{a.count}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pod health */}
            <div className="bg-card border border-line rounded-[12px] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="font-mono text-[11px] font-bold text-fg-muted uppercase tracking-[0.1em]">
                  Pod Health · 8 Namespaces
                </div>
                <Sparkline />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-[10px]">
                {MOCK_NAMESPACES.map((n, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="font-mono text-[11px] text-fg-muted w-[120px] truncate">
                      {n.name}
                    </div>
                    <div className="flex-1 h-[5px] bg-bg rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${n.healthy}%` }}
                        transition={{ delay: 0.15 + i * 0.04, duration: 0.5, ease: 'easeOut' }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          background: n.healthy >= 95 ? '#10b981' : n.healthy >= 85 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <div className="font-mono text-[10px] font-bold text-fg w-[32px] text-right">
                      {n.healthy}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-fg-subtle px-1">
              <div>
                Generated 2h ago · 1.2s · runtime_identity:{' '}
                <span className="text-fg-muted">invoker</span>
              </div>
              <button className="text-accent font-semibold hover:underline">
                Download as PDF →
              </button>
            </div>
          </div>

          {/* Right: Run info */}
          <div className="space-y-4">
            <InfoPanel title="Schedule" icon={<Clock size={12} />}>
              <div className="text-[13px] text-fg font-medium">Every Monday · 9:00 AM</div>
              <div className="font-mono text-[11px] text-fg-subtle mt-1">cron: 0 9 * * MON</div>
            </InfoPanel>

            <InfoPanel title="Last Run">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-[#10b981]" />
                <span className="text-[13px] text-fg font-semibold">Success</span>
                <span className="text-[11px] text-fg-subtle">· 1.2s</span>
              </div>
              <div className="font-mono text-[11px] text-fg-subtle mt-1">2h ago</div>
            </InfoPanel>

            <InfoPanel title="Next Run">
              <div className="text-[13px] text-fg font-medium">in 5d 14h</div>
              <div className="font-mono text-[11px] text-fg-subtle mt-1">Mon 2026-04-20 09:00</div>
            </InfoPanel>

            <InfoPanel title="Delivery">
              <div className="space-y-[6px]">
                <DeliveryRow label="feishu" target="#platform-oncall" />
                <DeliveryRow label="email" target="platform-team@" />
              </div>
            </InfoPanel>

            <InfoPanel title="This Month">
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-extrabold text-fg">4</span>
                <span className="text-[11px] text-fg-subtle">runs</span>
                <span className="text-[11px] text-fg-subtle ml-auto">100% success</span>
              </div>
            </InfoPanel>

            <InfoPanel title="Permissions" icon={<Shield size={12} />}>
              <div className="flex flex-wrap gap-[5px]">
                {app.capabilities.map((c) => (
                  <span
                    key={c}
                    className="font-mono text-[10px] px-[7px] py-[2px] bg-bg border border-line rounded text-fg-muted font-semibold"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </InfoPanel>

            <InfoPanel title="Sharing" icon={<Users size={12} />}>
              <div className="text-[12px] text-fg">team-only · 3 subscribers</div>
            </InfoPanel>
          </div>
        </div>
      </motion.div>

      <SourceDrawer app={app} open={showSource} onClose={() => setShowSource(false)} />
    </>
  )
}

/* ============================================================================
 * INSTALL VIEW — Marketplace app 的详情/安装视图
 * ========================================================================= */

function InstallView({ app }: { app: App }) {
  const navigate = useNavigate()
  const [installing, setInstalling] = useState(false)

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
                  {app.version}
                </span>
                {app.source === 'dce-official' && (
                  <span className="font-mono text-[10px] px-[7px] py-[2px] bg-accent-ultra text-accent border border-accent/20 rounded font-bold uppercase tracking-wider">
                    Official
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-[6px] text-[12px] text-fg-muted">
                <div className="flex items-center gap-[5px]">
                  <Star size={12} className="text-[#f59e0b] fill-[#f59e0b]" />
                  <span className="font-mono font-semibold">
                    {app.stars && app.stars >= 1000 ? `${(app.stars / 1000).toFixed(1)}k` : app.stars}
                  </span>
                </div>
                <div>by {app.source === 'dce-official' ? 'DCE Team' : 'community'}</div>
                <div className="flex items-center gap-[5px]">
                  <Users size={12} /> 127 teams using
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-[14px] py-[9px] bg-card border border-line rounded-[9px] text-[13px] font-semibold text-fg-muted hover:border-accent hover:text-accent flex items-center gap-[6px] transition-colors">
              <FlaskConical size={14} /> Try in Sandbox
            </button>
            <button
              onClick={() => {
                setInstalling(true)
                setTimeout(() => navigate(`/apps/${app.id}`), 1100)
              }}
              className="px-5 py-[9px] bg-accent text-white rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
              disabled={installing}
            >
              <Download size={14} /> {installing ? 'Installing...' : 'Install'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 grid gap-5" style={{ gridTemplateColumns: '1fr 340px' }}>
        <div className="space-y-5">
          {/* Description */}
          <div className="bg-card border border-line rounded-[12px] p-6">
            <div className="font-mono text-[11px] font-bold text-fg-muted uppercase tracking-[0.1em] mb-3">
              About
            </div>
            <div className="text-[14px] text-fg leading-[1.65]">{app.description}</div>
          </div>

          {/* Screenshot preview */}
          <div className="bg-[#0a0a0a] rounded-[12px] p-[14px] border border-line">
            <div className="aspect-[16/9] bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f172a] rounded-[8px] flex items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 30% 40%, rgba(37,99,235,0.35), transparent 50%), radial-gradient(circle at 70% 60%, rgba(139,92,246,0.3), transparent 50%)',
                }}
              />
              <div className="relative text-center">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40 mb-2">
                  Live Preview
                </div>
                <div className="text-white/85 text-[15px] font-semibold">{app.name}</div>
                <div className="text-white/50 text-[11px] font-mono mt-1">
                  [ {app.icon.toLowerCase()}.preview · mock snapshot ]
                </div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-card border border-line rounded-[12px] p-6">
            <div className="font-mono text-[11px] font-bold text-fg-muted uppercase tracking-[0.1em] mb-4">
              How It Works
            </div>
            <div className="space-y-4">
              <HowStep n={1} title="Install with one click">
                Forge resolves capabilities and provisions an isolated runtime identity per team.
              </HowStep>
              <HowStep n={2} title="Runs under your permissions">
                App inherits your exact access boundary. It can never see data you cannot.
              </HowStep>
              <HowStep n={3} title="Audited end to end">
                Every invocation is logged with prompt, capability calls, and output hash.
              </HowStep>
            </div>
          </div>

          {/* Code preview */}
          <div className="bg-[#0a0a0a] rounded-[12px] p-5 font-mono text-[12px]">
            <div className="flex items-center gap-2 text-white/40 text-[10px] mb-3 uppercase tracking-wider font-semibold">
              <Code2 size={12} /> Source preview · read only
            </div>
            <CodePreviewStatic />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <InfoPanel title="Required Capabilities" icon={<Shield size={12} />}>
            <div className="space-y-[6px] mt-1">
              {app.capabilities.map((c) => (
                <div key={c} className="flex items-center gap-2">
                  <Circle size={8} className="text-[#10b981] fill-[#10b981]" />
                  <span className="font-mono text-[11px] text-fg">{c}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-line text-[11px] text-fg-muted leading-[1.5]">
              All capabilities will be granted under <span className="font-mono">runtime_identity: invoker</span>.
            </div>
          </InfoPanel>

          <InfoPanel title="Cost Estimate">
            <div className="flex items-baseline gap-2">
              <span className="text-[18px] font-extrabold text-fg">$0.16</span>
              <span className="text-[11px] text-fg-subtle">/mo avg</span>
            </div>
            <div className="font-mono text-[10px] text-fg-subtle mt-[3px]">
              $0.04/run × ~4 runs/mo
            </div>
          </InfoPanel>

          <InfoPanel title="Data Retention">
            <div className="text-[12px] text-fg font-medium">none</div>
            <div className="font-mono text-[10px] text-fg-subtle mt-[3px]">
              output streamed, not persisted
            </div>
          </InfoPanel>

          <InfoPanel title="Version History" icon={<History size={12} />}>
            <div className="space-y-2">
              {[
                { v: app.version, d: 'latest', n: 'Stable' },
                { v: 'v2.0', d: '1 month ago', n: 'Dep bump' },
                { v: 'v1.5', d: '3 months ago', n: 'Bug fix' },
              ].map((it) => (
                <div key={it.v} className="flex items-center gap-2 text-[11px]">
                  <span className="font-mono font-bold text-accent w-[36px]">{it.v}</span>
                  <span className="font-mono text-fg-subtle w-[68px]">{it.d}</span>
                  <span className="text-fg-muted">{it.n}</span>
                </div>
              ))}
            </div>
          </InfoPanel>
        </div>
      </div>

      <AnimatePresence>
        {installing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-card rounded-[14px] px-8 py-6 shadow-2xl flex items-center gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Download size={22} className="text-accent" />
              </motion.div>
              <div>
                <div className="font-semibold text-fg">Installing {app.name}...</div>
                <div className="font-mono text-[11px] text-fg-subtle mt-1">
                  Provisioning runtime identity
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ============================================================================
 * SOURCE DRAWER — 点击 </> 从右侧滑出，装代码/manifest/版本
 * ========================================================================= */

type SourceTab = 'code' | 'manifest' | 'history'

function SourceDrawer({ app, open, onClose }: { app: App; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<SourceTab>('code')

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 top-14 bg-black/30 z-30"
          />
          <motion.div
            initial={{ x: 520 }}
            animate={{ x: 0 }}
            exit={{ x: 520 }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            className="fixed right-0 top-14 bottom-0 w-[520px] z-40 bg-card border-l border-line shadow-[-8px_0_24px_rgba(0,0,0,0.08)] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 h-[52px] border-b border-line shrink-0">
              <div className="flex items-center gap-2">
                <Code2 size={14} className="text-accent" />
                <span className="font-mono text-[11px] font-bold text-fg uppercase tracking-[0.1em]">
                  Source · {app.id}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-[7px] flex items-center justify-center text-fg-muted hover:bg-line-soft transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-1 px-5 border-b border-line shrink-0">
              <DrawerTab active={tab === 'code'} onClick={() => setTab('code')} icon={<Code2 size={12} />}>
                Code
              </DrawerTab>
              <DrawerTab
                active={tab === 'manifest'}
                onClick={() => setTab('manifest')}
                icon={<FileText size={12} />}
              >
                Manifest
              </DrawerTab>
              <DrawerTab
                active={tab === 'history'}
                onClick={() => setTab('history')}
                icon={<History size={12} />}
              >
                Versions
              </DrawerTab>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin bg-[#0a0a0a] p-5 font-mono text-[12px] text-white">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                {tab === 'code' && <CodeView />}
                {tab === 'manifest' && <ManifestView app={app} />}
                {tab === 'history' && <HistoryView />}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ============================================================================
 * Shared pieces
 * ========================================================================= */

function StatCard({
  label,
  value,
  delta,
  accent,
}: {
  label: string
  value: string
  delta: string
  accent?: boolean
}) {
  const positive = delta.startsWith('-') // for MTTR and critical, "-" is good
  const isPlus = delta.startsWith('+')
  return (
    <div
      className={`rounded-[12px] border p-[14px] ${
        accent ? 'bg-accent-ultra border-accent/20' : 'bg-card border-line'
      }`}
    >
      <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider font-semibold">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-[5px]">
        <div className={`text-[26px] font-extrabold tracking-tight ${accent ? 'text-accent' : 'text-fg'}`}>
          {value}
        </div>
        <div
          className={`font-mono text-[11px] font-bold ${
            isPlus ? 'text-[#ef4444]' : positive ? 'text-[#10b981]' : 'text-fg-subtle'
          }`}
        >
          {delta}
        </div>
      </div>
    </div>
  )
}

function InfoPanel({
  title,
  icon,
  children,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="bg-card border border-line rounded-[11px] p-[14px]">
      <div className="flex items-center gap-[6px] font-mono text-[10px] font-bold text-fg-subtle uppercase tracking-[0.1em] mb-[9px]">
        {icon}
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

function DeliveryRow({ label, target }: { label: string; target: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="font-mono text-fg-subtle uppercase w-[44px]">{label}</span>
      <span className="font-mono text-fg">{target}</span>
    </div>
  )
}

function SeverityDot({ level }: { level: 'critical' | 'warning' | 'info' }) {
  const map = {
    critical: 'bg-[#ef4444]',
    warning: 'bg-[#f59e0b]',
    info: 'bg-accent',
  }
  return <span className={`w-[8px] h-[8px] rounded-full shrink-0 ${map[level]}`} />
}

function RunningPulse({ on }: { on: boolean }) {
  if (!on) {
    return (
      <span className="font-mono text-[10px] uppercase px-2 py-[3px] rounded font-bold tracking-wider bg-[#f3f4f6] text-fg-muted">
        paused
      </span>
    )
  }
  return (
    <span className="flex items-center gap-[6px] px-2 py-[3px] rounded bg-[#d1fae5]">
      <span className="relative w-[7px] h-[7px]">
        <span className="absolute inset-0 rounded-full bg-[#10b981]" />
        <motion.span
          animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-[#10b981]"
        />
      </span>
      <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#065f46]">
        running
      </span>
    </span>
  )
}

function Sparkline() {
  const points = [24, 31, 28, 42, 35, 47, 41]
  const max = Math.max(...points)
  const w = 80
  const h = 24
  const step = w / (points.length - 1)
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - (p / max) * h).toFixed(1)}`)
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={w} cy={h - (points[points.length - 1] / max) * h} r="2" fill="#2563eb" />
    </svg>
  )
}

function HowStep({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-accent-ultra text-accent font-mono text-[12px] font-extrabold flex items-center justify-center shrink-0 border border-accent/20">
        {n}
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-bold text-fg">{title}</div>
        <div className="text-[12px] text-fg-muted leading-[1.55] mt-[2px]">{children}</div>
      </div>
    </div>
  )
}

function CodePreviewStatic() {
  const lines = [
    '# handler.ts · read-only preview',
    'export async function run(ctx) {',
    "  const prs = await ctx.cli('github.pulls.list', {",
    "    repo: ctx.params.repo,",
    "    state: 'open',",
    '  })',
    '  for (const pr of prs) {',
    "    await ctx.cli('github.reviews.create', {",
    '      pr: pr.id,',
    '      body: await ctx.llm.review(pr.diff),',
    '    })',
    '  }',
    '}',
  ]
  return (
    <div className="space-y-[2px]">
      {lines.map((l, i) => (
        <div key={i} className="flex">
          <span className="text-white/25 select-none w-8 text-right pr-3">{i + 1}</span>
          <span
            className={`whitespace-pre ${l.startsWith('#') ? 'text-white/45' : 'text-white'}`}
          >
            {l || '\u00A0'}
          </span>
        </div>
      ))}
    </div>
  )
}

function DrawerTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-[10px] text-[12px] font-semibold flex items-center gap-[6px] border-b-2 transition-colors ${
        active ? 'border-accent text-accent' : 'border-transparent text-fg-muted hover:text-fg'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function CodeView() {
  const code = [
    'export async function run(ctx) {',
    "  const alerts = await ctx.cli('dce.alerts.list', {",
    "    team: 'platform',",
    "    since: '7d',",
    '    top: 10,',
    '  })',
    '',
    "  const pods = await ctx.cli('dce.pods.health', {",
    "    namespace: 'platform',",
    '  })',
    '',
    "  return ctx.render('team-alert.template', {",
    '    alerts,',
    '    pods,',
    '    generatedAt: new Date(),',
    '  })',
    '}',
  ]
  return (
    <div className="space-y-[2px]">
      {code.map((l, i) => (
        <div key={i} className="flex">
          <span className="text-white/25 select-none w-8 text-right pr-3">{i + 1}</span>
          <span className="whitespace-pre">{l || '\u00A0'}</span>
        </div>
      ))}
    </div>
  )
}

function ManifestView({ app }: { app: App }) {
  const manifest = `app: ${app.id}
version: ${app.version}
runtime_identity: invoker
capabilities:
${app.capabilities.map((c) => `  - ${c}`).join('\n')}
data_retention: none
share_policy:
  visibility: team
  allow_share: true
  require_capability_check: true`
  return <pre className="whitespace-pre text-white">{manifest}</pre>
}

function HistoryView() {
  const versions = [
    { v: 'v1.3', date: '2 days ago', note: 'Add pod health check + Feishu push' },
    { v: 'v1.2', date: '1 week ago', note: 'Fix timezone issue in weekly cron' },
    { v: 'v1.1', date: '2 weeks ago', note: 'Add Feishu integration' },
    { v: 'v1.0', date: '1 month ago', note: 'Initial release' },
  ]
  return (
    <div className="space-y-3">
      {versions.map((v) => (
        <div key={v.v} className="flex items-center gap-3 text-[12.5px]">
          <span className="text-accent font-bold w-10">{v.v}</span>
          <span className="text-white/50 w-24">{v.date}</span>
          <span className="text-white/85">— {v.note}</span>
        </div>
      ))}
    </div>
  )
}

/* ============================================================================
 * Mock data for Team Alert Dashboard
 * ========================================================================= */

const MOCK_ALERTS: {
  severity: 'critical' | 'warning' | 'info'
  namespace: string
  name: string
  age: string
  count: number
}[] = [
  { severity: 'critical', namespace: 'platform/ingress', name: 'nginx-ingress 5xx rate > 2%', age: '12m', count: 8 },
  { severity: 'critical', namespace: 'platform/db', name: 'postgres replica lag > 30s', age: '1h', count: 4 },
  { severity: 'critical', namespace: 'platform/auth', name: 'oauth token refresh failures', age: '3h', count: 3 },
  { severity: 'warning', namespace: 'platform/api', name: 'api-gateway p99 latency > 800ms', age: '2h', count: 12 },
  { severity: 'warning', namespace: 'platform/cache', name: 'redis memory > 85%', age: '4h', count: 6 },
  { severity: 'warning', namespace: 'platform/queue', name: 'kafka consumer lag growing', age: '5h', count: 5 },
  { severity: 'warning', namespace: 'platform/jobs', name: 'cron job overlap detected', age: '8h', count: 3 },
  { severity: 'info', namespace: 'platform/metrics', name: 'prometheus scrape duration up', age: '1d', count: 2 },
  { severity: 'info', namespace: 'platform/logs', name: 'elasticsearch shard rebalance', age: '2d', count: 2 },
  { severity: 'info', namespace: 'platform/cdn', name: 'cache hit ratio dropped', age: '2d', count: 2 },
]

const MOCK_NAMESPACES: { name: string; healthy: number }[] = [
  { name: 'platform/api', healthy: 98 },
  { name: 'platform/db', healthy: 82 },
  { name: 'platform/auth', healthy: 91 },
  { name: 'platform/cache', healthy: 87 },
  { name: 'platform/queue', healthy: 95 },
  { name: 'platform/ingress', healthy: 76 },
  { name: 'platform/metrics', healthy: 99 },
  { name: 'platform/logs', healthy: 96 },
]
