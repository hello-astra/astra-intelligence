import { useId, useMemo } from 'react'
import { Activity, CreditCard, Database, Gauge, HeartPulse, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Meter } from '@/components/ui/Meter'
import { Panel } from '@/components/ui/Panel'
import { addDays, startOfDay } from '@/utils/dates'
import { formatCompact, formatDateShort, formatNumber, formatRelative, formatTick, formatUSD } from '@/utils/format'
import { ChartFrame } from '../../shared/Chart'
import { activeDot, axisProps, gridProps, lineCursor, niceMax, SERIES, STATUS, yAxisProps } from '../../shared/chartTheme'
import { StatTile } from '../../shared/StatTile'
import { tooltipRenderer } from '../../shared/tooltip'
import type { SaasViewProps } from '../context'
import { IntegrationStatusBadge } from '../IntegrationStatus'
import { activeUsers, mrrOf, PERIOD_DAYS, periodCalls, planOf, seatsUsed } from '../logic'

const KIND_ICON = { user: Users, billing: CreditCard, integration: HeartPulse, security: ShieldCheck, workspace: Activity }

export function OverviewView({ tenant, goTo }: SaasViewProps) {
  const gradientId = useId().replace(/:/g, '')
  const plan = planOf(tenant)
  const calls = periodCalls(tenant)
  const seats = seatsUsed(tenant)

  const series = useMemo(() => {
    const today = startOfDay()
    return tenant.dailyCalls.map((v, i) => ({ date: formatDateShort(addDays(today, i - 29)), calls: v }))
  }, [tenant.dailyCalls])

  const last7 = tenant.dailyCalls.slice(-7).reduce((a, b) => a + b, 0)
  const prev7 = tenant.dailyCalls.slice(-14, -7).reduce((a, b) => a + b, 0)
  const weekDelta = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : null
  const allowance = plan.apiCalls / PERIOD_DAYS
  const quotaPct = (calls / plan.apiCalls) * 100

  const connected = tenant.integrations.filter((i) => i.status !== 'disconnected')
  const issues = connected.filter((i) => i.status !== 'operational').length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">{tenant.name}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-fg-3">
            <Badge tone="blue">{plan.name} plan</Badge>
            {tenant.status === 'trial' && <Badge tone="amber">Trial</Badge>}
            <span>{tenant.region}</span>
            <span aria-hidden>·</span>
            <span className="font-mono">{tenant.id}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" leftIcon={<UserPlus className="size-3.5" />} onClick={() => goTo('users', 'invite')}>
            Invite user
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<CreditCard className="size-3.5" />} onClick={() => goTo('subscription')}>
            Change plan
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<HeartPulse className="size-3.5" />} onClick={() => goTo('integrations', 'health')}>
            Health check
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Active users" icon={Users} value={`${activeUsers(tenant)}`} hint={`${seats} of ${plan.seats} seats in use`} />
        <StatTile
          label="API calls · last 30 days"
          icon={Gauge}
          value={formatCompact(calls)}
          delta={weekDelta}
          deltaLabel="last 7 days vs prior 7"
        />
        <StatTile label="Storage" icon={Database} value={`${tenant.storageGb.toFixed(1)} GB`} hint={`of ${formatNumber(plan.storageGb)} GB included`} />
        <StatTile
          label="Monthly recurring revenue"
          icon={CreditCard}
          value={formatUSD(mrrOf(tenant), 2)}
          hint={tenant.billingCycle === 'annual' ? 'Billed annually (2 months free)' : 'Billed monthly'}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <ChartFrame
          title="API calls per day"
          description={`Last 30 days · ${quotaPct.toFixed(0)}% of the ${plan.name} quota used`}
          height={250}
          legend={[
            { label: 'API calls', color: SERIES[0], kind: 'rect' },
            { label: 'Plan daily average', color: STATUS.warning, kind: 'dashed' },
          ]}
          table={{
            columns: [
              { key: 'date', label: 'Date' },
              { key: 'calls', label: 'API calls', align: 'right', format: (v) => Number(v).toLocaleString('en-US') },
            ],
            rows: series,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" {...axisProps} minTickGap={28} />
              <YAxis {...yAxisProps} domain={[0, niceMax(Math.max(allowance, ...tenant.dailyCalls))]} tickFormatter={formatTick} />
              <Tooltip content={tooltipRenderer((v) => v.toLocaleString('en-US'))} cursor={lineCursor} />
              <ReferenceLine y={allowance} stroke={STATUS.warning} strokeDasharray="4 4" strokeOpacity={0.8} />
              <Area type="monotone" dataKey="calls" name="API calls" stroke={SERIES[0]} strokeWidth={2} fill={`url(#${gradientId})`} activeDot={activeDot} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>

        <div className="grid gap-4">
          <Panel
            title="Quota usage"
            description="Current billing period"
            actions={
              <Button size="xs" variant="ghost" onClick={() => goTo('usage')}>
                Details
              </Button>
            }
          >
            <div className="space-y-3.5">
              {[
                { label: 'API calls', value: calls, max: plan.apiCalls, text: `${formatCompact(calls)} / ${formatCompact(plan.apiCalls)}` },
                { label: 'Seats', value: seats, max: plan.seats, text: `${seats} / ${plan.seats}` },
                { label: 'Storage', value: tenant.storageGb, max: plan.storageGb, text: `${tenant.storageGb.toFixed(1)} / ${formatNumber(plan.storageGb)} GB` },
              ].map((q) => (
                <div key={q.label}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-fg-2">{q.label}</span>
                    <span className="text-fg-3 tabular-nums">{q.text}</span>
                  </div>
                  <Meter value={q.value} max={q.max} tone="auto" label={`${q.label} usage`} />
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            title="Integration health"
            description={issues === 0 ? 'All connected services operational' : `${issues} service${issues === 1 ? '' : 's'} need attention`}
            actions={
              <Button size="xs" variant="ghost" onClick={() => goTo('integrations')}>
                Manage
              </Button>
            }
          >
            <ul className="space-y-2">
              {tenant.integrations.slice(0, 4).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="truncate text-fg-2">{i.name}</span>
                  <IntegrationStatusBadge status={i.status} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="Recent activity" description="Audit trail for this organization">
        <ul className="divide-y divide-line/70">
          {tenant.activity.slice(0, 6).map((a) => {
            const Icon = KIND_ICON[a.kind]
            return (
              <li key={a.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06]">
                  <Icon className="size-3.5 text-fg-3" aria-hidden />
                </span>
                <p className="min-w-0 flex-1 text-[13px] text-fg-2">
                  <span className="font-medium text-fg">{a.actor}</span> {a.text}
                </p>
                <span className="shrink-0 text-xs text-fg-4">{formatRelative(a.at)}</span>
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
