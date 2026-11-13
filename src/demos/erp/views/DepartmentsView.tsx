import { useMemo } from 'react'
import { CheckCircle2, CircleAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Meter } from '@/components/ui/Meter'
import { formatINRCompact } from '@/utils/format'
import { ChartFrame } from '../../shared/Chart'
import { BAR_SIZE } from '../../shared/chartTheme'
import { useChartTheme } from '../../shared/demo-theme'
import { tooltipRenderer } from '../../shared/tooltip'
import type { ErpCtx } from '../context'
import { attendanceRate, onTimeDeliveryRate } from '../logic'

export function DepartmentsView({ state }: ErpCtx) {
  const { axisProps, barCursor, CHART, gridProps, SERIES, yAxisProps, animate } = useChartTheme()
  const days = useMemo(() => Object.keys(state.attendance).sort().slice(-20), [state.attendance])
  const rows = state.departments.map((d) => {
    const people = state.employees.filter((e) => e.departmentId === d.id)
    const monthly = people.reduce((s, e) => s + e.ctc / 12, 0)
    const kpiValue = d.id === 'd_scm' ? onTimeDeliveryRate(state) : d.kpiValue
    return {
      ...d,
      kpiValue,
      headcount: people.length,
      attendance: attendanceRate(state, people.map((p) => p.id), days),
      annualCost: monthly * 12,
      utilization: ((monthly * 12) / d.budget) * 100,
      head: state.employees.find((e) => e.id === d.headId),
    }
  })
  const chart = rows.map((r) => ({ name: r.name, attendance: Number(r.attendance.toFixed(1)) }))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Departments</h2>
        <p className="text-xs text-fg-3">Headcount, attendance (last 20 working days), people cost against budget and each team’s headline KPI.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {rows.map((r) => {
          const met = r.kpiValue >= r.kpiTarget
          return (
            <article key={r.id} className="rounded-xl border border-line bg-panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-fg">{r.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-3">
                    {r.head && <Avatar name={r.head.name} size={18} />} {r.head?.name}
                  </p>
                </div>
                <Badge>{r.headcount} people</Badge>
              </div>
              <dl className="mt-4 space-y-3 text-xs">
                <div>
                  <div className="mb-1 flex justify-between">
                    <dt className="text-fg-3">Attendance</dt>
                    <dd className="text-fg-2 tabular-nums">{r.attendance.toFixed(1)}%</dd>
                  </div>
                  <Meter value={r.attendance} tone={r.attendance < 85 ? 'warning' : 'brand'} size="xs" label={`${r.name} attendance`} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between">
                    <dt className="text-fg-3">People cost vs budget</dt>
                    <dd className="text-fg-2 tabular-nums">
                      {formatINRCompact(r.annualCost)} / {formatINRCompact(r.budget)}
                    </dd>
                  </div>
                  <Meter value={r.utilization} tone="auto" thresholds={[0.9, 1.0001]} size="xs" label={`${r.name} budget utilization`} />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-ink/[0.03] px-2.5 py-2">
                  <dt className="text-fg-3">{r.kpiLabel}</dt>
                  <dd className="flex items-center gap-1.5">
                    <span className="font-semibold text-fg tabular-nums">{r.kpiValue.toFixed(1)}%</span>
                    <Badge tone={met ? 'green' : 'amber'} size="xs" icon={met ? <CheckCircle2 className="size-3" aria-hidden /> : <CircleAlert className="size-3" aria-hidden />}>
                      Target {r.kpiTarget}%
                    </Badge>
                  </dd>
                </div>
              </dl>
            </article>
          )
        })}
      </div>
      <ChartFrame
        title="Attendance by department"
        description="Last 20 working days · reference line at 90%"
        height={260}
        table={{ columns: [{ key: 'name', label: 'Department' }, { key: 'attendance', label: 'Attendance %', align: 'right' }], rows: chart }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" {...axisProps} interval={0} tick={{ fill: CHART.tick, fontSize: 10 }} />
            <YAxis {...yAxisProps} domain={[70, 100]} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip content={tooltipRenderer((v) => `${v.toFixed(1)}%`)} cursor={barCursor} />
            <ReferenceLine y={90} stroke={CHART.axis} strokeDasharray="4 4" />
            <Bar isAnimationActive={animate} dataKey="attendance" name="Attendance" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={BAR_SIZE} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <p className="text-[11px] text-fg-4">KPIs other than on-time PO delivery are sample values; on-time delivery is computed from purchase orders in this demo.</p>
    </div>
  )
}
