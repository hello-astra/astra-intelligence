import { useState, type FormEvent } from 'react'
import { Plus, Target } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Form'
import { Meter } from '@/components/ui/Meter'
import { Modal } from '@/components/ui/Modal'
import { Panel } from '@/components/ui/Panel'
import { useToast } from '@/components/ui/toast-context'
import { diffInDays, fromISODate, fromMonthKey, isoDateFromToday, startOfDay } from '@/utils/dates'
import { formatDate, formatINR, formatINRCompact, formatINRTick, formatMonthShort } from '@/utils/format'
import { uid } from '@/utils/id'
import { ChartFrame } from '../../shared/Chart'
import { BAR_SIZE } from '../../shared/chartTheme'
import { useChartTheme } from '../../shared/demo-theme'
import { StatTile } from '../../shared/StatTile'
import { tooltipRenderer } from '../../shared/tooltip'
import type { LedgerCtx } from '../context'
import { lastMonths, monthTotals } from '../logic'

// Diverging pair for polarity (surplus vs deficit).

export function SavingsView({ state, setState }: LedgerCtx) {
  const { axisProps, barCursor, CHART, gridProps, yAxisProps, SERIES, STATUS, animate } = useChartTheme()
  // Surplus in the product colour, deficit in the reserved 'critical' status colour.
  const POSITIVE = SERIES[0]
  const NEGATIVE = STATUS.critical
  const toast = useToast()
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [newGoal, setNewGoal] = useState(false)
  const months = lastMonths(6)
  const net = months.map((m) => {
    const t = monthTotals(state.transactions, m)
    return { month: formatMonthShort(fromMonthKey(m)), net: Math.round(t.net), rate: t.savingsRate }
  })
  const saved = state.goals.reduce((s, g) => s + g.saved, 0)
  const target = state.goals.reduce((s, g) => s + g.target, 0)
  const avgRate = net.slice(0, -1).reduce((s, m) => s + m.rate, 0) / Math.max(1, net.length - 1)

  const contribute = (id: string) => {
    const value = Number(amounts[id])
    if (!Number.isFinite(value) || value <= 0) {
      toast({ title: 'Enter an amount greater than zero', tone: 'warning' })
      return
    }
    const goal = state.goals.find((g) => g.id === id)
    setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, saved: g.saved + value } : g)) }))
    setAmounts((a) => ({ ...a, [id]: '' }))
    toast({ title: `${formatINR(value)} moved to “${goal?.name}”` })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Savings overview</h2>
          <p className="text-xs text-fg-3">Reserves and goals funded from operating surplus.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => setNewGoal(true)}>
            New goal
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <StatTile label="Saved across goals" value={formatINRCompact(saved)} hint={`${((saved / target) * 100).toFixed(0)}% of ${formatINRCompact(target)}`} />
        <StatTile label="Average savings rate" value={`${avgRate.toFixed(1)}%`} hint="Last 5 full months" />
        <StatTile label="Active goals" value={state.goals.length} icon={Target} hint="Funded from monthly surplus" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Panel title="Savings goals">
          <ul className="space-y-5">
            {state.goals.map((g) => {
              const pct = (g.saved / g.target) * 100
              const days = diffInDays(fromISODate(g.deadline), startOfDay())
              return (
                <li key={g.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13px] font-medium text-fg">{g.name}</p>
                    <p className="text-xs text-fg-3 tabular-nums">
                      {formatINRCompact(g.saved)} / {formatINRCompact(g.target)}
                    </p>
                  </div>
                  <Meter className="mt-2" value={g.saved} max={g.target} tone={pct >= 100 ? 'good' : 'brand'} size="md" label={`${g.name} progress`} />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-fg-4">
                      {pct >= 100 ? 'Goal reached 🎉' : `${pct.toFixed(0)}% · ${formatINRCompact(g.target - g.saved)} to go`} · due {formatDate(g.deadline)} ({days >= 0 ? `${days} d left` : 'past due'})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        placeholder="Amount ₹"
                        aria-label={`Contribution to ${g.name}`}
                        value={amounts[g.id] ?? ''}
                        onChange={(e) => setAmounts((a) => ({ ...a, [g.id]: e.target.value }))}
                        className="h-7 w-28 rounded-md border border-line bg-raised px-2 text-right text-xs text-fg outline-none focus:border-brand/70"
                      />
                      <Button size="xs" variant="secondary" onClick={() => contribute(g.id)}>
                        Add
                      </Button>
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>
        <ChartFrame
          title="Net cash flow by month"
          description="Surplus (blue) and deficit (red) months"
          height={250}
          table={{ columns: [{ key: 'month', label: 'Month' }, { key: 'net', label: 'Net cash flow', align: 'right', format: (v) => formatINR(Number(v)) }], rows: net }}
          legend={[
            { label: 'Surplus', color: POSITIVE, kind: 'rect' },
            { label: 'Deficit', color: NEGATIVE, kind: 'rect' },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={net} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...yAxisProps} tickFormatter={formatINRTick} />
              <Tooltip content={tooltipRenderer((v) => formatINR(v))} cursor={barCursor} />
              <ReferenceLine y={0} stroke={CHART.axis} />
              <Bar isAnimationActive={animate} dataKey="net" name="Net cash flow" maxBarSize={BAR_SIZE} radius={[4, 4, 0, 0]}>
                {net.map((m) => (
                  <Cell key={m.month} fill={m.net >= 0 ? POSITIVE : NEGATIVE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>
      <NewGoalModal
        open={newGoal}
        onClose={() => setNewGoal(false)}
        onCreate={(g) => {
          setState((s) => ({ ...s, goals: [...s.goals, g] }))
          setNewGoal(false)
          toast({ title: `Goal “${g.name}” created` })
        }}
      />
    </div>
  )
}

function NewGoalModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (g: { id: string; name: string; target: number; saved: number; deadline: string }) => void }) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState(isoDateFromToday(180))
  const [error, setError] = useState<string | null>(null)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 3) return setError('Enter a goal name.')
    if (!(Number(target) > 0)) return setError('Enter a target amount greater than zero.')
    onCreate({ id: uid('g'), name: name.trim(), target: Number(target), saved: 0, deadline })
    setName('')
    setTarget('')
    setError(null)
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="New savings goal"
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="goal-form">
            Create goal
          </Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Goal name" htmlFor="goal-name" error={error} required>
          <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Office expansion" aria-invalid={Boolean(error)} />
        </Field>
        <Field label="Target amount (₹)" htmlFor="goal-target" required>
          <Input id="goal-target" type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} />
        </Field>
        <Field label="Target date" htmlFor="goal-deadline">
          <Input id="goal-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}
