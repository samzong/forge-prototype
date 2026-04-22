import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApps } from '@/hooks/useApps'

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { data } = useApps({ group: 'marketplace' })
  const items = data?.items ?? []

  return (
    <div className="p-8">
      <div className="max-w-[1100px] mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-fg-muted hover:text-fg text-sm mb-4 font-medium flex items-center gap-[6px] transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="mb-8">
          <div className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.12em] mb-3">
            Enterprise Marketplace
          </div>
          <h1 className="text-[40px] font-black tracking-[-0.02em] leading-none">
            Official &amp; Community Apps
          </h1>
          <p className="text-fg-muted mt-4 max-w-[640px] text-[15px]">
            Fork any app to customize for your team, subscribe to upstream updates, or publish
            your own to the company marketplace.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {items.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/apps/${app.id}`}
                className="block bg-card border border-line rounded-xl p-5 hover:border-accent hover:shadow-[0_12px_40px_-16px_rgba(37,99,235,0.2)] transition-all group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 bg-bg border border-line rounded-[10px] flex items-center justify-center font-mono text-sm font-extrabold text-fg-muted group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-colors shrink-0">
                    {app.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-fg truncate">{app.name}</div>
                    <div className="font-mono text-[10px] text-fg-subtle mt-[2px]">
                      {app.currentVersion} · {app.source}
                    </div>
                  </div>
                </div>
                <p className="text-[13px] text-fg-muted mb-4 line-clamp-2 leading-relaxed">
                  {app.description}
                </p>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-line">
                  <span className="flex items-center gap-1 text-fg-muted font-semibold">
                    <Star size={13} className="fill-current" />{' '}
                    {(app.stars ?? 0) >= 1000 ? `${((app.stars ?? 0) / 1000).toFixed(1)}k` : app.stars}
                  </span>
                  <span className="text-accent font-semibold group-hover:underline">View →</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
