import { useMemo } from 'react'
import { useToday } from '@/hooks/useToday'
import { CalendarCheck, CircleAlert, ClipboardList, IndianRupee, Truck, Users } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { formatDateShort, formatINRCompact } from '@/utils/format'
import { toISODate } from '@/utils/dates'
import { ChartFrame } from '../../shared/Chart'
import { useChartTheme } from '../../shared/demo-theme'
import { StatTile } from '../../shared/StatTile'
import { tooltipRenderer } from '../../shared/tooltip'
import type { ErpCtx } from '../context'
import { attendanceRate, poHealth, SHIPMENT_LABEL } from '../logic'

export function DashboardView({ state, goTo, openPo }: ErpCtx) {
  const { activeDot, axisProps, gridProps, lineCursor, SERIES, yAxisProps, animate } = useChartTheme()
  const today = toISODate(useToday())
  const active = state.employees.filter((e) => e.status !== 'on_leave')
  const todayRec = state.attendance[today] ?? {}
  const marked = Object.keys(todayRec).length
  const inToday = Object.values(todayRec).filter((s) => s === 'present' || s === 'wfh' || s === 'half_day').length
  const monthlyGross = state.employees.reduce((s, e) => s + e.ctc / 12, 0)
  const openPos = state.purchaseOrders.filter((p) => p.status === 'approved' || p.status === 'in_transit' || p.status === 'draft')
  const inTransit = state.purchaseOrders.filter((p) => p.status === 'in_transit')
  const delayed = state.purchaseOrders.filter((p) => poHealth(p) === 'late')
  const drafts = state.purchaseOrders.filter((p) => p.status === 'draft')

  const trend = useMemo(() => {
    const ids = state.employees.map((e) => e.id)
    return Object.keys(state.attendance)
      .sort()
      .slice(-14)
      .map((day) => ({ day: formatDateShort(day), rate: Number(attendanceRate(state, ids, [day]).toFixed(1)) }))
  }, [state])

  const alerts = [
    ...delayed.map((p) => ({ id: p.id, tone: 'red' as const, text: `${p.id} is ${p.shipment.status === 'delayed' ? 'delayed in transit' : 'past its expected date'} — ${state.vendors.find((v) => v.id === p.vendorId)?.name}`, action: () => openPo(p.id) })),
    ...drafts.map((p) => ({ id: p.id, tone: 'amber' as const, text: `${p.id} is waiting for approval (${formatINRCompact(p.total)})`, action: () => openPo(p.id) })),
    ...(marked < state.employees.length ? [{ id: 'att', tone: 'amber' as const, text: `${state.employees.length - marked} employees not yet marked for today`, action: () => goTo('attendance') }] : []),
    ...state.employees.filter((e) => e.status === 'probation').slice(0, 2).map((e) => ({ id: e.id, tone: 'blue' as const, text: `${e.name} is on probation — review due`, action: () => goTo('employees') })),
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Operations dashboard</h2>
        <p className="text-xs text-fg-3">{state.company}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        <StatTile label="Headcount" icon={Users} value={state.employees.length} hint={`${active.length} available · ${state.employees.length - active.length} on leave`} onClick={() => goTo('employees')} />
        <StatTile label="In today" icon={CalendarCheck} value={`${inToday}/${marked}`} hint={`${state.employees.length - marked} not marked yet`} onClick={() => goTo('attendance')} />
        <StatTile label="Monthly payroll (gross)" icon={IndianRupee} value={formatINRCompact(monthlyGross)} hint="Before deductions" onClick={() => goTo('payroll')} />
        <StatTile label="Open purchase orders" icon={ClipboardList} value={openPos.length} hint={`${drafts.length} awaiting approval`} onClick={() => goTo('orders')} />
        <StatTile label="Shipments in transit" icon={Truck} value={inTransit.length} hint="Tracked live" onClick={() => goTo('orders')} />
        <StatTile label="Delayed / late" icon={CircleAlert} value={delayed.length} hint={delayed.length ? 'Needs follow-up' : 'All on schedule'} onClick={() => goTo('orders')} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ChartFrame
          title="Attendance rate"
          description="Last 14 working days · present + WFH + ½ half-days"
          height={240}
          table={{ columns: [{ key: 'day', label: 'Day' }, { key: 'rate', label: 'Attendance %', align: 'right' }], rows: trend }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="day" {...axisProps} minTickGap={16} />
              <YAxis {...yAxisProps} domain={[70, 100]} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip content={tooltipRenderer((v) => `${v.toFixed(1)}%`)} cursor={lineCursor} />
              <Line isAnimationActive={animate} dataKey="rate" name="Attendance rate" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 3, fill: SERIES[0], strokeWidth: 0 }} activeDot={activeDot} />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
        <Panel title="Alerts & approvals" description={`${alerts.length} item${alerts.length === 1 ? '' : 's'} need attention`}>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={a.action} className="flex w-full items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-left hover:bg-ink/[0.03]">
                  <Badge tone={a.tone} dot size="xs">
                    {a.tone === 'red' ? 'Urgent' : a.tone === 'amber' ? 'Action' : 'Info'}
                  </Badge>
                  <span className="text-[13px] text-fg-2">{a.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel
        title="Inbound shipments"
        actions={
          <Button size="xs" variant="ghost" onClick={() => goTo('orders')}>
            All orders
          </Button>
        }
        flush
      >
        <ul className="divide-y divide-line">
          {state.purchaseOrders
            .filter((p) => p.status === 'in_transit' || p.status === 'approved')
            .map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => openPo(p.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-ink/[0.02]">
                  <Truck className="size-4 shrink-0 text-fg-3" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs text-fg">{p.id}</span>
                    <span className="block truncate text-[11px] text-fg-3">
                      {state.vendors.find((v) => v.id === p.vendorId)?.name} · {p.items[0]?.name}
                    </span>
                  </span>
                  <Badge tone={p.shipment.status === 'delayed' ? 'red' : 'blue'}>{SHIPMENT_LABEL[p.shipment.status]}</Badge>
                  <span className="hidden w-24 text-right text-xs text-fg-3 sm:block">ETA {formatDateShort(p.expectedDate)}</span>
                </button>
              </li>
            ))}
        </ul>
      </Panel>
    </div>
  )
}
