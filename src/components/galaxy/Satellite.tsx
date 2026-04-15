import { motion, useTime, useTransform } from 'framer-motion'

interface Props {
  icon: string
  label: string
  initialAngle: number
  radius: number
  duration: number
  reverse?: boolean
  onClick?: () => void
}

/**
 * A satellite orbiting the Forge core. Position is computed every frame from
 * framer-motion's useTime, so each satellite moves independently (different
 * radius, speed, direction) without any CSS keyframe choreography.
 *
 * The wrapper moves along the circle; the inner button does not rotate, so the
 * icon always stays upright.
 */
export function Satellite({
  icon,
  label,
  initialAngle,
  radius,
  duration,
  reverse = false,
  onClick,
}: Props) {
  const time = useTime()

  const x = useTransform(time, (t) => {
    const direction = reverse ? -1 : 1
    const angle = initialAngle + direction * (t / (duration * 1000)) * 360
    return Math.sin((angle * Math.PI) / 180) * radius
  })

  const y = useTransform(time, (t) => {
    const direction = reverse ? -1 : 1
    const angle = initialAngle + direction * (t / (duration * 1000)) * 360
    return -Math.cos((angle * Math.PI) / 180) * radius
  })

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 group z-[2]"
      style={{ x, y, marginLeft: -26, marginTop: -26 }}
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.96 }}
        className="w-[52px] h-[52px] bg-card border-[1.5px] border-line rounded-[11px]
                   shadow-[0_6px_22px_-10px_rgba(0,0,0,0.12)]
                   flex items-center justify-center cursor-pointer
                   font-mono text-[13px] font-extrabold text-fg
                   hover:border-accent hover:text-accent hover:shadow-[0_10px_30px_-8px_rgba(37,99,235,0.3)]
                   transition-[border-color,color,box-shadow] duration-200"
      >
        {icon}
      </motion.button>
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 mt-[6px]
                   px-2 py-[3px] bg-card border border-line rounded
                   font-sans text-[10px] font-semibold text-fg-muted whitespace-nowrap
                   opacity-0 group-hover:opacity-100 transition-opacity
                   pointer-events-none"
        style={{ boxShadow: '0 4px 12px -4px rgba(0,0,0,0.08)' }}
      >
        {label}
      </div>
    </motion.div>
  )
}
