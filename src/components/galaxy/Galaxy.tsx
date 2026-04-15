import { SATELLITES } from '@/data/satellites'
import { Satellite } from './Satellite'
import { Orbit } from './Orbit'
import { Core } from './Core'

interface Props {
  onSatelliteClick?: (hintPrompt: string) => void
}

export function Galaxy({ onSatelliteClick }: Props) {
  return (
    <div className="relative w-[500px] h-[420px] mx-auto">
      <Orbit radius={100} />
      <Orbit radius={145} />
      <Orbit radius={190} dim />

      {SATELLITES.map((sat) => (
        <Satellite
          key={sat.id}
          icon={sat.icon}
          label={sat.label}
          initialAngle={sat.angle}
          radius={sat.radius}
          duration={sat.duration}
          reverse={sat.reverse}
          onClick={() => onSatelliteClick?.(sat.hintPrompt)}
        />
      ))}

      <Core />
    </div>
  )
}
