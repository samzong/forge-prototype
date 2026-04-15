interface Props {
  radius: number
  dim?: boolean
}

export function Orbit({ radius, dim = false }: Props) {
  return (
    <div
      className={`absolute top-1/2 left-1/2 rounded-full border border-dashed pointer-events-none ${
        dim ? 'border-accent/15' : 'border-accent/25'
      }`}
      style={{
        width: radius * 2,
        height: radius * 2,
        marginLeft: -radius,
        marginTop: -radius,
      }}
    />
  )
}
