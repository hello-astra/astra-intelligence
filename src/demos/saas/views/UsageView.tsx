import { useMemo } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { Meter } from '@/components/ui/Meter'
import { Panel } from '@/components/ui/Panel'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { addDays, startOfDay } from '@/utils/dates'
import { formatCompact, formatDateShort, formatNumber, formatTick } from '@/utils/format'
import { ChartFrame } from '../../shared/Chart'
import { activeDot, axisProps, BAR_SIZE, barCursor, gridProps, SERIES, yAxisProps } from '../../shared/chartTheme'
import { tooltipRenderer } from '../../shared/tooltip'
import type { SaasViewProps } from '../context'
import { PERIOD_DAYS, periodCalls, planOf, seatsUsed } from '../logic'

export function UsageView({ tenant }: SaasViewProps) {
  const plan = planOf(tenant)
  const calls = periodCalls(tenant)
  const seats = seatsUsed(tenant)
  const connected = tenant.integrations.filter((i) => i.status !== 'disconnected').length

  const data = useMemo(() => {
    const today = startOfDay()
    return tenant.dailyCalls.map((v, i, arr) => {
      const window = arr.slice(Math.max(0, i - 6), i + 1)
      return {
        date: formatDateShort(addDays(today, i - 29)),
        calls: v,
        avg: Math.round(window.reduce((s, x) => s + x, 0) / window.length),
      }
    })
  }, [tenant.dailyCalls])

  const recentAvg = tenant.dailyCalls.slice(-7).reduce((s, v) => s + v, 0) / 7
  const projected = Math.round(recentAvg * PERIOD_DAYS)
  const projectedPct = (projected / plan.apiCalls) * 100

  const quotas = [
    { label: 'API calls', value: calls, max: plan.apiCalls, display: `${formatCompact(calls)} of ${formatCompact(plan.apiCalls)}` },
    { label: 'Seats', value: seats, max: plan.seats, display: `${seats} of ${plan.seats}` },
    { label: 'Storage', value: tenant.storageGb, max: plan.storageGb, display: `${tenant.storageGb.toFixed(1)} of ${formatNumber(plan.storageGb)} GB` },
    {
      label: 'Integrations',
      value: connected,
      max: typeof plan.integrations === 'number' ? plan.integrations : Math.max(connected, 1) * 4,
      display: `${connected} of ${String(plan.integrations)}`,
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Usage</h2>
        <p className="text-xs text-fg-3">
          Rolling 30-day billing period · day {tenant.periodDay + 1} of {PERIOD_DAYS} · metered per tenant
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quotas.map((q) => {
          const pct = (q.value / q.max) * 100
          return (
            <Panel key={q.label}>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-fg-3">{q.label}</span>
                <span className="text-xs text-fg-3 tabular-nums">{Math.min(999, Math.round(pct))}%</span>
              </div>
              <p className="mt-1.5 text-[15px] font-semibold text-fg">{q.display}</p>
              <Meter className="mt-3" value={q.value} max={q.max} tone="auto" label={`${q.label} quota`} />
            </Panel>
          )
        })}
      </div>

      <div
        className={
          projectedPct >= 100
            ? 'flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4'
            : projectedPct >= 85
              ? 'flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-4'
              : 'flex items-start gap-3 rounded-xl border border-line bg-panel p-4'
        }
      >
        {projectedPct >= 85 && <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />}
        <p className="text-sm text-fg-2">
          At the last 7-day average of <span className="font-medium text-fg">{Math.round(recentAvg).toLocaleString('en-US')} calls/day</span>, this tenant is
          projected to use <span className="font-medium text-fg">{formatCompact(projected)}</span> calls this period —{' '}
          <span className="font-medium text-fg">{projectedPct.toFixed(0)}%</span> of the {plan.name} quota.
          {projectedPct >= 100 ? ' Overage charges would apply; consider upgrading.' : projectedPct >= 85 ? ' Usage is approaching the limit.' : ' Comfortably within plan limits.'}
        </p>
      </div>

      <ChartFrame
        title="Daily API calls"
        description="Calls per day with a 7-day moving average"
        height={260}
        legend={[
          { label: 'Daily calls', color: SERIES[0], kind: 'rect' },
          { label: '7-day average', color: SERIES[1], kind: 'line' },
        ]}
        table={{
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'calls', label: 'Calls', align: 'right', format: (v) => Number(v).toLocaleString('en-US') },
            { key: 'avg', label: '7-day avg', align: 'right', format: (v) => Number(v).toLocaleString('en-US') },
          ],
          rows: data,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="date" {...axisProps} minTickGap={28} />
            <YAxis {...yAxisProps} tickFormatter={formatTick} />
            <Tooltip content={tooltipRenderer((v) => v.toLocaleString('en-US'))} cursor={barCursor} />
            <Bar dataKey="calls" name="Daily calls" fill={SERIES[0]} fillOpacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={BAR_SIZE} />
            <Line type="monotone" dataKey="avg" name="7-day average" stroke={SERIES[1]} strokeWidth={2} dot={false} activeDot={activeDot} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFrame>

      <Panel title="Usage by endpoint" description="Share of calls, p95 latency and error rate (this period)" flush>
        <Table minWidth={560}>
          <THead>
            <tr>
              <TH>Endpoint</TH>
              <TH align="right">Calls</TH>
              <TH align="right">Share</TH>
              <TH align="right">p95 latency</TH>
              <TH align="right">Error rate</TH>
            </tr>
          </THead>
          <TBody>
            {tenant.endpoints.map((e) => (
              <TR key={`${e.method}-${e.path}`}>
                <TD>
                  <span className="inline-flex items-center gap-2">
                    <Badge tone={e.method === 'GET' ? 'blue' : 'violet'} size="xs">
                      {e.method}
                    </Badge>
                    <code className="font-mono text-xs text-fg">{e.path}</code>
                  </span>
                </TD>
                <TD align="right">{Math.round(calls * e.share).toLocaleString('en-US')}</TD>
                <TD align="right">{(e.share * 100).toFixed(0)}%</TD>
                <TD align="right" className={e.p95Ms > 400 ? 'text-amber-300' : undefined}>
                  {e.p95Ms} ms
                </TD>
                <TD align="right" className={e.errorRate >= 1 ? 'text-red-300' : undefined}>
                  {e.errorRate >= 1 && <TriangleAlert className="mr-1 inline size-3" aria-label="High error rate" />}
                  {e.errorRate.toFixed(2)}%
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Panel>
    </div>
  )
}
