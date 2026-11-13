import { useId } from 'react'
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatINRTick, formatTick } from '@/utils/format'
import { BAR_SIZE } from '../shared/chartTheme'
import { useChartTheme } from '../shared/demo-theme'
import { tooltipRenderer } from '../shared/tooltip'
import { KPIS, type ChartType, type KpiKey } from './engine'

export interface TrendRow {
  label: string
  current: number
  previous?: number | null
  /** The bucket covers only part of its week or month (shown dashed / faded). */
  partial?: boolean
}

function tickFor(kpi: KpiKey): (v: number) => string {
  if (kpi === 'revenue' || kpi === 'grossProfit' || kpi === 'aov') return formatINRTick
  if (kpi === 'margin') return (v) => `${Math.round(v)}%`
  return formatTick
}

const partialLabel = (label: string) => (label.endsWith('*') ? `${label.slice(0, -1)} · partial period` : label)

/**
 * Main KPI trend with switchable mark type; the previous period is drawn as a de-emphasized
 * dashed comparison. Partial weeks/months at the edges of a range are drawn dashed (lines/areas)
 * or faded (bars) so a short period is not mistaken for a real drop.
 */
export function TrendChart({ rows, kpi, chartType, compare }: { rows: TrendRow[]; kpi: KpiKey; chartType: ChartType; compare: boolean }) {
  const { activeDot, axisProps, barCursor, DEEMPH, gridProps, lineCursor, SERIES, yAxisProps, animate } = useChartTheme()
  const gradient = useId().replace(/:/g, '')
  const format = KPIS[kpi].format
  const label = KPIS[kpi].label
  const domain: [number | 'auto', number | 'auto'] = kpi === 'margin' ? ['auto', 'auto'] : [0, 'auto']
  // Complete buckets form the solid series; partial buckets plus their neighbours form the dashed one.
  const data = rows.map((r, i) => ({
    ...r,
    solid: r.partial ? null : r.current,
    dashed: r.partial || rows[i - 1]?.partial || rows[i + 1]?.partial ? r.current : null,
  }))
  const hasPartial = rows.some((r) => r.partial)
  const common = [
    <CartesianGrid key="grid" {...gridProps} />,
    <XAxis key="x" dataKey="label" {...axisProps} minTickGap={20} />,
    <YAxis key="y" {...yAxisProps} domain={domain} tickFormatter={tickFor(kpi)} allowDecimals={kpi === 'margin'} />,
    <Tooltip key="tip" content={tooltipRenderer((v) => format(v), partialLabel, ['solid', 'dashed'])} cursor={chartType === 'bar' ? barCursor : lineCursor} />,
  ]
  const previousLine = compare && (
    <Line isAnimationActive={animate} type="monotone" dataKey="previous" name="Previous period" stroke={DEEMPH} strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={activeDot} />
  )
  const partialLine = hasPartial && (
    <Line isAnimationActive={animate} type="monotone" dataKey="dashed" stroke={SERIES[0]} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="2 4" dot={false} activeDot={false} tooltipType="none" legendType="none" />
  )
  // Invisible series carrying the tooltip and hover dot for every bucket.
  const hoverLine = <Line isAnimationActive={animate} type="monotone" dataKey="current" name={label} stroke="transparent" fill={SERIES[0]} dot={false} activeDot={activeDot} />

  return (
    <ResponsiveContainer width="100%" height="100%">
      {chartType === 'bar' ? (
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          {common}
          {compare && <Bar isAnimationActive={animate} dataKey="previous" name="Previous period" fill={DEEMPH} radius={[4, 4, 0, 0]} maxBarSize={BAR_SIZE / 2} />}
          <Bar isAnimationActive={animate} dataKey="current" name={label} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={compare ? BAR_SIZE / 2 : BAR_SIZE}>
            {data.map((r) => (
              <Cell key={r.label} fillOpacity={r.partial ? 0.4 : 1} />
            ))}
          </Bar>
        </BarChart>
      ) : chartType === 'line' ? (
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          {common}
          {previousLine}
          {partialLine}
          <Line isAnimationActive={animate}
            type="monotone"
            dataKey="solid"
            stroke={SERIES[0]}
            strokeWidth={2}
            dot={rows.length <= 14 ? { r: 3, strokeWidth: 0, fill: SERIES[0] } : false}
            activeDot={false}
            tooltipType="none"
            legendType="none"
          />
          {hoverLine}
        </LineChart>
      ) : (
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.24} />
              <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          {common}
          {previousLine}
          {partialLine}
          <Area isAnimationActive={animate} type="monotone" dataKey="solid" stroke={SERIES[0]} strokeWidth={2} fill={`url(#${gradient})`} activeDot={false} tooltipType="none" legendType="none" />
          {hoverLine}
        </ComposedChart>
      )}
    </ResponsiveContainer>
  )
}
