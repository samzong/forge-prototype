import { LayoutDashboard, Bell, FileBarChart2, ClipboardList, MessageCircle } from 'lucide-react'
import type { App, AppViewKind } from '@/types'
import { VibeChatTrigger, type VibeChatSubject } from '@/components/vibe-chat'
import { DashboardRenderer } from '@/components/renderers/DashboardRenderer'

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

export function AppRenderer({ app }: { app: App }) {
  if (app.viewKind === 'dashboard') {
    return <DashboardRenderer />
  }
  return <UnrenderedSurface app={app} />
}

const KIND_COPY: Record<Exclude<AppViewKind, 'dashboard'>, {
  icon: typeof Bell
  eyebrow: string
  headline: string
  body: string
}> = {
  notifier: {
    icon: Bell,
    eyebrow: 'Notifier',
    headline: 'This app delivers updates to your channels.',
    body: 'Describe the shape of the notification you want — subject, audience, trigger — and Forge will build the view that summarises each send.',
  },
  report: {
    icon: FileBarChart2,
    eyebrow: 'Report',
    headline: 'This app assembles a scheduled report.',
    body: 'Tell Forge what the report should show, who should receive it, and when — the rendered report will appear here.',
  },
  form: {
    icon: ClipboardList,
    eyebrow: 'Form',
    headline: 'This app collects structured input.',
    body: 'Describe the fields, validation, and downstream action — Forge will render the form here and wire the submission path.',
  },
  bot: {
    icon: MessageCircle,
    eyebrow: 'Bot',
    headline: 'This app responds in conversation.',
    body: 'Describe the job-to-be-done and the tone — Forge will render the chat surface here and connect the capabilities needed.',
  },
}

function UnrenderedSurface({ app }: { app: App }) {
  const kind = app.viewKind as Exclude<AppViewKind, 'dashboard'>
  const copy = KIND_COPY[kind] ?? {
    icon: LayoutDashboard,
    eyebrow: 'App',
    headline: 'This app is ready to be shaped.',
    body: 'Describe the view you want, and Forge will build it here.',
  }
  const Icon = copy.icon
  return (
    <div className="px-8 py-14 flex items-start justify-center">
      <div className="max-w-[640px] w-full bg-card border border-line rounded-[14px] p-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-[13px] bg-accent/10 text-accent mb-6">
          <Icon size={24} strokeWidth={1.8} />
        </div>
        <div className="font-mono text-[11px] font-bold text-fg-subtle uppercase tracking-[0.12em] mb-3">
          {copy.eyebrow}
        </div>
        <h2 className="text-[20px] font-extrabold text-fg tracking-tight mb-3">
          {copy.headline}
        </h2>
        <p className="text-[13.5px] text-fg-muted leading-[1.65] mb-7 max-w-[500px] mx-auto">
          {copy.body}
        </p>
        <VibeChatTrigger
          subject={subjectFromApp(app)}
          variant="primary"
          label="Chat to design this view"
        />
      </div>
    </div>
  )
}
