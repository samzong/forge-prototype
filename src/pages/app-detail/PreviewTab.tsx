import { LayoutDashboard, Bell, FileText, ClipboardList, Bot, Construction } from 'lucide-react'
import type { App, AppViewKind } from '@/types'

interface Props {
  app: App
}

const VIEW_KIND_META: Record<
  AppViewKind,
  { label: string; description: string; Icon: typeof LayoutDashboard }
> = {
  dashboard: {
    label: 'Dashboard',
    description:
      'Renders recurring KPI widgets and charts. Implementation lands in Sprint 3.5 (cockpit rewrite).',
    Icon: LayoutDashboard,
  },
  notifier: {
    label: 'Notifier',
    description:
      'Pushes alerts and summaries to delivery channels. Skeleton here; rich notification layout later.',
    Icon: Bell,
  },
  report: {
    label: 'Report',
    description: 'Scheduled report renderer. Skeleton here; table + export UI later.',
    Icon: FileText,
  },
  form: {
    label: 'Form',
    description: 'Submit-and-route form layout. Skeleton here; field renderers later.',
    Icon: ClipboardList,
  },
  bot: {
    label: 'Bot',
    description:
      'Conversational bot preview. Skeleton here; chat transcript + action replay later.',
    Icon: Bot,
  },
}

export function PreviewTab({ app }: Props) {
  const meta = VIEW_KIND_META[app.viewKind]
  const Icon = meta.Icon

  return (
    <div className="px-8 py-6 max-w-[1000px] mx-auto">
      <div className="bg-card border border-line rounded-[12px] p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-[11px] bg-accent-ultra text-accent flex items-center justify-center shrink-0">
            <Icon size={22} strokeWidth={1.8} />
          </div>
          <div>
            <div className="font-mono text-[11px] font-bold text-fg-subtle uppercase tracking-[0.1em] mb-[3px]">
              {meta.label} renderer
            </div>
            <div className="text-[18px] font-extrabold text-fg leading-tight">
              {app.name} preview
            </div>
            <div className="text-[13px] text-fg-muted mt-[6px] max-w-[560px] leading-[1.55]">
              {meta.description}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f172a] rounded-[10px] aspect-[16/9] flex items-center justify-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 40%, rgba(37,99,235,0.35), transparent 50%), radial-gradient(circle at 70% 60%, rgba(139,92,246,0.3), transparent 50%)',
            }}
          />
          <div className="relative text-center">
            <Construction size={28} className="mx-auto mb-3 text-white/60" strokeWidth={1.5} />
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50 mb-2">
              Renderer skeleton
            </div>
            <div className="text-white/85 text-[14px] font-semibold">
              viewKind = {app.viewKind}
            </div>
            <div className="text-white/45 text-[11px] font-mono mt-1">
              [ {app.icon.toLowerCase()}.preview · mock snapshot ]
            </div>
          </div>
        </div>

        <div className="mt-4 text-[12px] text-fg-muted font-mono">
          Future work will bind to <span className="text-fg">Execution.outputSummary</span> and
          render a live layout driven by the manifest.
        </div>
      </div>
    </div>
  )
}
