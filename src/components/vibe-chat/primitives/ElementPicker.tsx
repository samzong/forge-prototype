import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Crosshair, X } from 'lucide-react'

export type PickerHit = {
  target: string
  label: string
  path?: string
}

type Rect = { top: number; left: number; width: number; height: number }

type HitWithRect = PickerHit & { rect: Rect }

interface Props {
  active: boolean
  onPick: (hit: PickerHit) => void
  onCancel: () => void
  rootSelector?: string
}

function rectFromEl(el: Element): Rect {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

function findHit(
  x: number,
  y: number,
  rootSelector: string | undefined,
): HitWithRect | null {
  const el = document.elementFromPoint(x, y)
  if (!el) return null
  if (el.closest('[data-vibe-ignore]')) return null

  const root = rootSelector ? document.querySelector(rootSelector) : null
  if (rootSelector && (!root || !root.contains(el))) return null

  const match = el.closest<HTMLElement>('[data-vibe-target]')
  if (!match) return null
  if (root && !root.contains(match)) return null

  const target = match.dataset.vibeTarget ?? ''
  const label = match.dataset.vibeLabel ?? target
  const path = match.dataset.vibePath
  return { target, label, path, rect: rectFromEl(match) }
}

export function ElementPicker({ active, onPick, onCancel, rootSelector }: Props) {
  const [hit, setHit] = useState<HitWithRect | null>(null)
  const armedRef = useRef(false)

  useEffect(() => {
    if (!active) {
      setHit(null)
      armedRef.current = false
      return
    }

    const armTimer = window.setTimeout(() => {
      armedRef.current = true
    }, 0)

    const onMove = (e: MouseEvent) => {
      setHit(findHit(e.clientX, e.clientY, rootSelector))
    }

    const onClick = (e: MouseEvent) => {
      if (!armedRef.current) return
      e.preventDefault()
      e.stopPropagation()
      const h = findHit(e.clientX, e.clientY, rootSelector)
      if (!h) {
        onCancel()
        return
      }
      onPick({ target: h.target, label: h.label, path: h.path })
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCancel()
      }
    }

    const onScrollOrResize = () => {
      setHit((prev) => {
        if (!prev) return prev
        const el = document.querySelector<HTMLElement>(
          `[data-vibe-target="${CSS.escape(prev.target)}"]`,
        )
        if (!el) return null
        return { ...prev, rect: rectFromEl(el) }
      })
    }

    window.addEventListener('mousemove', onMove, true)
    window.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize, true)

    return () => {
      window.clearTimeout(armTimer)
      window.removeEventListener('mousemove', onMove, true)
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize, true)
    }
  }, [active, onPick, onCancel, rootSelector])

  if (!active) return null

  return createPortal(
    <div
      data-vibe-ignore
      aria-live="polite"
      className="fixed inset-0 z-[1000] pointer-events-none"
      style={{ cursor: 'crosshair' }}
    >
      <div className="absolute inset-0 bg-black/5" />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 h-9 bg-[#0a0a0a] text-white rounded-[10px] shadow-lg text-[12px] font-semibold">
          <Crosshair size={13} className="text-[#60a5fa]" />
          <span>Pick a module to focus the chat</span>
          <span className="text-white/40 font-mono text-[10px]">ESC to cancel</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCancel()
            }}
            className="ml-1 w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center"
            aria-label="Cancel picker"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {hit && (
        <>
          <div
            className="absolute border-2 border-accent rounded-[8px] transition-all duration-75"
            style={{
              top: hit.rect.top - 2,
              left: hit.rect.left - 2,
              width: hit.rect.width + 4,
              height: hit.rect.height + 4,
              boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.18)',
            }}
          />
          <div
            className="absolute px-2 h-6 bg-accent text-white rounded-[6px] text-[11px] font-semibold flex items-center gap-[5px] shadow-md"
            style={{
              top: Math.max(4, hit.rect.top - 28),
              left: hit.rect.left,
              maxWidth: Math.max(160, hit.rect.width),
            }}
          >
            <Crosshair size={10} />
            <span className="truncate">{hit.label}</span>
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}
