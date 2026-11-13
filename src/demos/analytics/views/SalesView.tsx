import { useMemo } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Panel } from '@/components/ui/Panel'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { CATEGORIES } from '@/data/mock/analytics'
import { cn } from '@/utils/cn'
import { formatINR, formatINRCompact, formatINRTick, formatSignedPercent } from '@/utils/format'
import { ChartFrame } from '../../shared/Chart'
import { BAR_SIZE } from '../../shared/chartTheme'
import { useChartTheme } from '../../shared/demo-theme'
import { tooltipRenderer } from '../../shared/tooltip'
import type { AnalyticsCtx } from '../context'
import { bucketize, byCategory, byWeekday, change, selectSeries } from '../engine'

export function SalesView({ ds, filters, range, list, gran, openDrilldown }: AnalyticsCtx) {
  const { axisProps, barCursor, CHART, DEEMPH, gridProps, SERIES, yAxisProps, animate } = useChartTheme()
  const categories = useMemo(() => byCategory(ds, filters.regions, range).sort((a, b) => b.current.revenue - a.current.revenue), [ds, filters.regions, range])
  const total = categories.reduce((s, c) => s + c.current.revenue, 0) || 1
  const weekday = useMemo(() => byWeekday(ds, list, range), [ds, list, range])
  const best = weekday.reduce((m, d) => (d.revenue > m.revenue ? d : m), weekday[0])

  // Stacked category mix over time (respects region filter; category filter emphasises one category).
  const mix = useMemo(() => {
    const per = CATEGORIES.map((c) => bucketize(ds, selectSeries(ds, filters.regions, c), range.start, range.end, gran === 'day' ? 'week' : gran))
    return per[0].map((b, i) => {
      const row: Record<string, string | number> = { label: b.label }
      CATEGORIES.forEach((c, ci) => (row[c] = Math.round(per[ci][i].totals.revenue)))
      return row
    })
  }, [ds, filters.regions, range, gran])

  return (
    <div className="space-y-4">
      <Panel title="Category performance" description="Click a row for detailed analytics" flush>
        <Table minWidth={720}>
          <THead>
            <tr>
              <TH>Category</TH>
              <TH align="right">Revenue</TH>
              <TH align="right">Share</TH>
              <TH align="right">Orders</TH>
              <TH align="right">AOV</TH>
              <TH align="right">Gross margin</TH>
              <TH align="right">Growth</TH>
            </tr>
          </THead>
          <TBody>
            {categories.map((c) => {
              const growth = c.previous ? change(c.current.revenue, c.previous.revenue) : null
              const dim = filters.category !== 'all' && filters.category !== c.key
              return (
                <TR key={c.key} className={cn('cursor-pointer', dim && 'opacity-50')} onClick={() => openDrilldown(c.key)}>
                  <TD>
                    <button type="button" className="flex items-center gap-2 font-medium text-fg" aria-label={`Details for ${c.key}`}>
                      <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: SERIES[CATEGORIES.indexOf(c.key)] }} aria-hidden />
                      {c.key}
                    </button>
                  </TD>
                  <TD align="right" className="font-medium text-fg">
                    {formatINRCompact(c.current.revenue)}
                  </TD>
                  <TD align="right">{((c.current.revenue / total) * 100).toFixed(1)}%</TD>
                  <TD align="right">{Math.round(c.current.orders).toLocaleString('en-IN')}</TD>
                  <TD align="right">{formatINR(c.current.aov)}</TD>
                  <TD align="right">{c.current.margin.toFixed(1)}%</TD>
                  <TD align="right">
                    {growth === null ? (
                      '—'
                    ) : (
                      <span className={cn('inline-flex items-center gap-1', growth >= 0 ? 'text-emerald-300' : 'text-red-300')}>
                        {growth >= 0 ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
                        {formatSignedPercent(growth)}
                      </span>
                    )}
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <ChartFrame
          title="Weekly pattern"
          description={`Average daily revenue by weekday · strongest: ${best?.day}`}
          height={250}
          table={{ columns: [{ key: 'day', label: 'Weekday' }, { key: 'revenue', label: 'Avg revenue', align: 'right', format: (v) => formatINR(Number(v)) }, { key: 'orders', label: 'Avg orders', align: 'right' }], rows: weekday }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekday} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="day" {...axisProps} />
              <YAxis {...yAxisProps} tickFormatter={formatINRTick} />
              <Tooltip content={tooltipRenderer((v) => formatINR(v))} cursor={barCursor} />
              <Bar isAnimationActive={animate} dataKey="revenue" name="Avg daily revenue" radius={[4, 4, 0, 0]} maxBarSize={BAR_SIZE} fill={SERIES[0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="Category mix over time"
          description="Revenue by category, stacked"
          height={250}
          legend={CATEGORIES.map((c, i) => ({ label: c, color: filters.category === 'all' || filters.category === c ? SERIES[i] : DEEMPH, kind: 'rect' as const }))}
          table={{ columns: [{ key: 'label', label: 'Period' }, ...CATEGORIES.map((c) => ({ key: c, label: c, align: 'right' as const, format: (v: unknown) => formatINRCompact(Number(v)) }))], rows: mix }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mix} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} minTickGap={16} />
              <YAxis {...yAxisProps} tickFormatter={formatINRTick} />
              <Tooltip content={tooltipRenderer((v) => formatINRCompact(v))} cursor={barCursor} />
              {CATEGORIES.map((c, i) => (
                <Bar isAnimationActive={animate}
                  key={c}
                  dataKey={c}
                  stackId="mix"
                  name={c}
                  fill={filters.category === 'all' || filters.category === c ? SERIES[i] : DEEMPH}
                  stroke={CHART.surface}
                  strokeWidth={1}
                  maxBarSize={BAR_SIZE + 8}
                  radius={i === CATEGORIES.length - 1 ? [4, 4, 0, 0] : 0}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>
    </div>
  )
}
