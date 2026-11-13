import { useMemo, useState } from 'react'
import { useToday } from '@/hooks/useToday'
import { CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Form'
import { Panel } from '@/components/ui/Panel'
import { useToast } from '@/components/ui/toast-context'
import type { AttendanceStatus } from '@/types/erp'
import { cn } from '@/utils/cn'
import { toISODate } from '@/utils/dates'
import { formatDateShort, formatWeekday } from '@/utils/format'
import type { ErpCtx } from '../context'
import { ATTENDANCE_META, ATTENDANCE_ORDER, attendanceRate } from '../logic'

export function AttendanceView({ state, setState }: ErpCtx) {
  const toast = useToast()
  const [dept, setDept] = useState(state.departments[0].id)
  const today = toISODate(useToday())
  const days = useMemo(() => Object.keys(state.attendance).sort().slice(-10), [state.attendance])
  const people = state.employees.filter((e) => dept === 'all' || e.departmentId === dept)
  const todayRec = state.attendance[today] ?? {}
  const summary = ATTENDANCE_ORDER.map((s) => ({ s, n: people.filter((p) => todayRec[p.id] === s).length }))
  const unmarked = people.filter((p) => !todayRec[p.id]).length

  const cycle = (empId: string, day: string) => {
    if (day !== today) return
    const current = state.attendance[day]?.[empId]
    const next = current ? ATTENDANCE_ORDER[(ATTENDANCE_ORDER.indexOf(current) + 1) % ATTENDANCE_ORDER.length] : 'present'
    setState((s) => ({ ...s, attendance: { ...s.attendance, [day]: { ...(s.attendance[day] ?? {}), [empId]: next } } }))
  }

  const markRest = () => {
    const rec = { ...(state.attendance[today] ?? {}) }
    let n = 0
    for (const p of people)
      if (!rec[p.id]) {
        rec[p.id] = p.status === 'on_leave' ? 'leave' : 'present'
        n += 1
      }
    setState((s) => ({ ...s, attendance: { ...s.attendance, [today]: rec } }))
    toast({ title: `${n} employees marked`, description: 'Unmarked employees set to Present (or Leave if on approved leave).' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Attendance</h2>
          <p className="text-xs text-fg-3">Last 10 working days. Click a cell in today’s column to cycle its status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select controlSize="sm" aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)} wrapperClassName="w-44">
            <option value="all">All departments</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          {state.attendance[today] && (
            <Button size="sm" variant="secondary" leftIcon={<CheckCheck className="size-3.5" />} onClick={markRest} disabled={unmarked === 0}>
              Mark remaining present
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {summary.map(({ s, n }) => (
          <span key={s} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-fg-2" style={{ backgroundColor: ATTENDANCE_META[s].color }}>
            <span className="font-semibold" style={{ color: ATTENDANCE_META[s].text }}>
              {ATTENDANCE_META[s].short}
            </span>
            {ATTENDANCE_META[s].label} · {n}
          </span>
        ))}
        <span className="inline-flex items-center rounded-lg bg-ink/[0.04] px-2.5 py-1.5 text-xs text-fg-3">Not marked · {unmarked}</span>
        <span className="ml-auto self-center text-xs text-fg-3">Today’s figures for the selected department</span>
      </div>

      <Panel flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-line text-[10px] tracking-wide text-fg-3 uppercase">
                <th scope="col" className="sticky left-0 z-10 bg-panel px-3 py-2 text-left font-medium">
                  Employee
                </th>
                {days.map((d) => (
                  <th key={d} scope="col" className={cn('px-1 py-2 text-center font-medium', d === today && 'text-brand-soft')}>
                    <span className="block">{formatWeekday(d)}</span>
                    <span className="block normal-case">{d === today ? 'Today' : formatDateShort(d)}</span>
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {people.map((p) => (
                <tr key={p.id} className="hover:bg-ink/[0.015]">
                  <th scope="row" className="sticky left-0 z-10 bg-panel px-3 py-1.5 text-left font-normal">
                    <span className="block text-[13px] text-fg">{p.name}</span>
                    <span className="block text-[10px] text-fg-4">{p.designation}</span>
                  </th>
                  {days.map((d) => {
                    const s = state.attendance[d]?.[p.id] as AttendanceStatus | undefined
                    const editable = d === today
                    return (
                      <td key={d} className="px-1 py-1 text-center">
                        <button
                          type="button"
                          disabled={!editable}
                          onClick={() => cycle(p.id, d)}
                          aria-label={`${p.name}, ${d}: ${s ? ATTENDANCE_META[s].label : 'not marked'}${editable ? '. Click to change' : ''}`}
                          title={s ? ATTENDANCE_META[s].label : 'Not marked'}
                          className={cn(
                            'mx-auto flex size-7 items-center justify-center rounded-md text-[11px] font-semibold',
                            editable && 'ring-1 ring-brand/40 hover:ring-brand',
                            !s && 'border border-dashed border-line-strong text-fg-4',
                          )}
                          style={s ? { backgroundColor: ATTENDANCE_META[s].color, color: ATTENDANCE_META[s].text } : undefined}
                        >
                          {s ? ATTENDANCE_META[s].short : '·'}
                        </button>
                      </td>
                    )
                  })}
                  <td className="px-3 py-1 text-right text-fg-2 tabular-nums">{attendanceRate(state, [p.id], days).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
