import { useMemo } from 'react'
import { Repeat, UserPlus, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatTick } from '@/utils/format'
import { ChartFrame } from '../../shared/Chart'
import { BAR_SIZE } from '../../shared/chartTheme'
import { useChartTheme } from '../../shared/demo-theme'
import { StatTile } from '../../shared/StatTile'
import { tooltipRenderer } from '../../shared/tooltip'
import type { AnalyticsCtx } from '../context'
import { change } from '../engine'

export function CustomersView({ current, previous, buckets, filters, gran }: AnalyticsCtx) {
  const { activeDot, axisProps, barCursor, CHART, gridProps, lineCursor, SERIES, yAxisProps, animate } = useChartTheme()
  const rows = useMemo(
    () =>
      buckets.map((b) => ({
        label: b.label,
        newCustomers: Math.round(b.totals.newCustomers),
        returning: Math.round(b.totals.returning),
        newShare: b.totals.orders ? Number(((b.totals.newCustomers / b.totals.orders) * 100).toFixed(1)) : 0,
      })),
    [buckets],
  )
  const repeat = current.orders ? (current.returning / current.orders) * 100 : 0
  const prevRepeat = previous && previous.orders ? (previous.returning / previous.orders) * 100 : null
  const cmp = filters.compare && previous

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="New customers" icon={UserPlus} value={Math.round(current.newCustomers).toLocaleString('en-IN')} delta={cmp ? change(current.newCustomers, previous.newCustomers) : null} />
        <StatTile label="Orders from returning customers" icon={Repeat} value={Math.round(current.returning).toLocaleString('en-IN')} delta={cmp ? change(current.returning, previous.returning) : null} />
        <StatTile
          label="Repeat purchase rate"
          icon={Users}
          value={`${repeat.toFixed(1)}%`}
          delta={cmp && prevRepeat !== null ? repeat - prevRepeat : null}
          deltaUnit="points"
          deltaLabel="vs previous period"
        />
      </div>

      <ChartFrame
        title="Customer acquisition"
        description={`New vs returning orders, by ${gran}`}
        height={270}
        legend={[
          { label: 'New customers', color: SERIES[0], kind: 'rect' },
          { label: 'Returning customers', color: SERIES[1], kind: 'rect' },
        ]}
        table={{ columns: [{ key: 'label', label: 'Period' }, { key: 'newCustomers', label: 'New', align: 'right' }, { key: 'returning', label: 'Returning', align: 'right' }], rows }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={16} />
            <YAxis {...yAxisProps} tickFormatter={formatTick} />
            <Tooltip content={tooltipRenderer((v) => v.toLocaleString('en-IN'))} cursor={barCursor} />
            <Bar isAnimationActive={animate} dataKey="newCustomers" name="New customers" stackId="c" fill={SERIES[0]} stroke={CHART.surface} strokeWidth={1} maxBarSize={BAR_SIZE + 8} />
            <Bar isAnimationActive={animate} dataKey="returning" name="Returning customers" stackId="c" fill={SERIES[1]} stroke={CHART.surface} strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={BAR_SIZE + 8} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame
        title="New-customer share of orders"
        description="Higher during festive campaigns, when acquisition spend peaks"
        height={220}
        table={{ columns: [{ key: 'label', label: 'Period' }, { key: 'newShare', label: 'New share (%)', align: 'right' }], rows }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={16} />
            <YAxis {...yAxisProps} domain={['auto', 'auto']} tickFormatter={(v: number) => `${Math.round(v)}%`} />
            <Tooltip content={tooltipRenderer((v) => `${v.toFixed(1)}%`)} cursor={lineCursor} />
            <Line isAnimationActive={animate} type="monotone" dataKey="newShare" name="New-customer share" stroke={SERIES[0]} strokeWidth={2} dot={false} activeDot={activeDot} />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  )
}
