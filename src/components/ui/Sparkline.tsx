import { useId } from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  /** Draw a soft area wash under the line. */
  area?: boolean
  /** Index from which the line is drawn dashed (e.g. forecast). */
  dashedFrom?: number
  /** Show an end-dot on the last point. */
  endDot?: boolean
  className?: string
  strokeWidth?: number
  ariaLabel?: string
}

/** Lightweight SVG sparkline (no chart library) for previews and stat tiles. Colours may be CSS variables. */
export function Sparkline({
  data,
  width = 120,
  height = 32,
  color = 'var(--color-series-1)',
  area = true,
  dashedFrom,
  endDot = true,
  className,
  strokeWidth = 1.75,
  ariaLabel,
}: SparklineProps) {
  const id = useId()
  if (data.length < 2) return null
  const pad = 3
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const x = (i: number) => pad + (i / (data.length - 1)) * (width - pad * 2)
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2)
  const points = data.map((v, i) => [x(i), y(v)] as const)
  const toPath = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ')

  const split = dashedFrom !== undefined && dashedFrom > 0 && dashedFrom < data.length ? dashedFrom : data.length
  const solid = points.slice(0, split)
  const dashed = split < data.length ? points.slice(split - 1) : []
  const areaPath = `${toPath(solid)} L${solid[solid.length - 1][0].toFixed(1)},${height} L${solid[0][0].toFixed(1)},${height} Z`
  const last = points[points.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: color }} stopOpacity="0.28" />
          <stop offset="100%" style={{ stopColor: color }} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={areaPath} fill={`url(#${id}-fill)`} />}
      <path d={toPath(solid)} fill="none" style={{ stroke: color }} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {dashed.length > 1 && (
        <path
          d={toPath(dashed)}
          fill="none"
          style={{ stroke: color }}
          strokeWidth={strokeWidth}
          strokeDasharray="3 3"
          strokeLinecap="round"
          opacity={0.85}
        />
      )}
      {endDot && <circle cx={last[0]} cy={last[1]} r={2.6} style={{ fill: color, stroke: 'var(--color-panel)' }} strokeWidth={1.5} />}
    </svg>
  )
}
