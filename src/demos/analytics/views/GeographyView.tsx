import { useMemo } from 'react'
import { MapPinned } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Panel } from '@/components/ui/Panel'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { REGIONS, type Region } from '@/data/mock/analytics'
import { cn } from '@/utils/cn'
import { formatINR, formatINRCompact, formatINRTick, formatSignedPercent } from '@/utils/format'
import { ChartFrame } from '../../shared/Chart'
import { axisProps, BAR_SIZE, barCursor, DEEMPH, gridProps, SERIES } from '../../shared/chartTheme'
import { tooltipRenderer } from '../../shared/tooltip'
import type { AnalyticsCtx } from '../context'
import { byRegion, change } from '../engine'

// Single-hue sequential ramp. On the dark surface low values sit near the surface and high values are brightest.
const RAMP = ['#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#86b6ef']
const LAYOUT: Record<Region, string> = {
  North: 'col-start-2 row-start-1',
  West: 'col-start-1 row-start-2',
  Central: 'col-start-2 row-start-2',
  East: 'col-start-3 row-start-2',
  South: 'col-start-2 row-start-3',
}

export function GeographyView({ ds, filters, setFilters, range }: AnalyticsCtx) {
  const regions = useMemo(() => byRegion(ds, filters.category, range), [ds, filters.category, range])
  const values = regions.map((r) => r.current.revenue)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const total = values.reduce((s, v) => s + v, 0) || 1
  const step = (v: number) => (max === min ? 3 : Math.round(((v - min) / (max - min)) * (RAMP.length - 1)))
  const ranked = [...regions].sort((a, b) => b.current.revenue - a.current.revenue).map((r) => ({ region: r.key, revenue: Math.round(r.current.revenue) }))

  const focus = (r: Region) => {
    const only = filters.regions.length === 1 && filters.regions[0] === r
    setFilters({ regions: only ? [...REGIONS] : [r] })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <Panel title="Revenue by zone" description="Schematic map — select a zone to filter every view">
          <div className="grid grid-cols-3 grid-rows-3 gap-2" role="group" aria-label="Regional revenue map">
            {regions.map((r) => {
              const s = step(r.current.revenue)
              const light = s >= 5
              const selected = filters.regions.includes(r.key)
              const growth = r.previous ? change(r.current.revenue, r.previous.revenue) : null
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => focus(r.key)}
                  aria-pressed={filters.regions.length === 1 && selected}
                  aria-label={`${r.key}: ${formatINRCompact(r.current.revenue)}. Filter to this region`}
                  className={cn(
                    'flex min-h-[92px] flex-col justify-between rounded-xl p-3 text-left transition-[transform,opacity] hover:scale-[1.02]',
                    LAYOUT[r.key],
                    !selected && 'opacity-35',
                  )}
                  style={{ backgroundColor: RAMP[s], color: light ? '#0b0b0b' : '#ffffff' }}
                >
                  <span className="text-xs font-semibold">{r.key}</span>
                  <span>
                    <span className="block text-base font-semibold">{formatINRCompact(r.current.revenue)}</span>
                    <span className="block text-[11px] opacity-85">
                      {((r.current.revenue / total) * 100).toFixed(1)}% share{growth !== null && filters.compare ? ` · ${formatSignedPercent(growth)}` : ''}
                    </span>
                  </span>
                </button>
              )
            })}
            <div className="col-start-1 row-start-3 flex items-end">
              <MapPinned className="size-5 text-fg-4" aria-hidden />
            </div>
            <div className="col-start-3 row-start-3 flex flex-col justify-end gap-1">
              <div className="flex h-2 overflow-hidden rounded-full" aria-hidden>
                {RAMP.map((c) => (
                  <span key={c} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-fg-3">
                <span>{formatINRCompact(min)}</span>
                <span>{formatINRCompact(max)}</span>
              </div>
            </div>
          </div>
        </Panel>

        <ChartFrame
          title="Regional ranking"
          description="Selected regions highlighted"
          height={260}
          table={{ columns: [{ key: 'region', label: 'Region' }, { key: 'revenue', label: 'Revenue', align: 'right', format: (v) => formatINRCompact(Number(v)) }], rows: ranked }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ranked} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid {...gridProps} horizontal={false} vertical />
              <XAxis type="number" {...axisProps} tickFormatter={formatINRTick} />
              <YAxis type="category" dataKey="region" {...axisProps} axisLine={false} width={64} />
              <Tooltip content={tooltipRenderer((v) => formatINRCompact(v))} cursor={barCursor} />
              <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} maxBarSize={BAR_SIZE}>
                {ranked.map((r) => (
                  <Cell key={r.region} fill={filters.regions.includes(r.region) ? SERIES[0] : DEEMPH} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>

      <Panel title="Regional performance" flush>
        <Table minWidth={680}>
          <THead>
            <tr>
              <TH>Region</TH>
              <TH align="right">Revenue</TH>
              <TH align="right">Share</TH>
              <TH align="right">Orders</TH>
              <TH align="right">AOV</TH>
              <TH align="right">Gross margin</TH>
              <TH align="right">Growth</TH>
            </tr>
          </THead>
          <TBody>
            {regions.map((r) => {
              const growth = r.previous ? change(r.current.revenue, r.previous.revenue) : null
              return (
                <TR key={r.key} className={cn('cursor-pointer', !filters.regions.includes(r.key) && 'opacity-50')} onClick={() => focus(r.key)}>
                  <TD className="font-medium text-fg">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: SERIES[REGIONS.indexOf(r.key)] }} aria-hidden />
                      {r.key}
                    </span>
                  </TD>
                  <TD align="right" className="text-fg">
                    {formatINRCompact(r.current.revenue)}
                  </TD>
                  <TD align="right">{((r.current.revenue / total) * 100).toFixed(1)}%</TD>
                  <TD align="right">{Math.round(r.current.orders).toLocaleString('en-IN')}</TD>
                  <TD align="right">{formatINR(r.current.aov)}</TD>
                  <TD align="right">{r.current.margin.toFixed(1)}%</TD>
                  <TD align="right" className={growth === null ? undefined : growth >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                    {growth === null ? '—' : formatSignedPercent(growth)}
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      </Panel>
    </div>
  )
}
