import { CheckCircle2, CircleAlert, OctagonAlert } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Meter } from '@/components/ui/Meter'
import { Panel } from '@/components/ui/Panel'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { daysInMonth, startOfDay } from '@/utils/dates'
import { formatINR, formatINRCompact, formatMonthLong } from '@/utils/format'
import { StatTile } from '../../shared/StatTile'
import type { LedgerCtx } from '../context'
import { budgetRows, HEALTH_META, RECURRING } from '../logic'

const HEALTH_ICON = { ok: CheckCircle2, risk: CircleAlert, over: OctagonAlert }

export function BudgetsView({ state, setState }: LedgerCtx) {
  const rows = budgetRows(state)
  const today = startOfDay()
  const totalLimit = rows.reduce((s, r) => s + r.limit, 0)
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0)
  const totalProjected = rows.reduce((s, r) => s + r.projected, 0)
  const flagged = rows.filter((r) => r.health !== 'ok').length

  const setLimit = (category: string, value: number) =>
    setState((s) => ({ ...s, budgets: s.budgets.map((b) => (b.category === category ? { ...b, limit: Math.max(0, Math.round(value)) } : b)) }))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Monthly budgets</h2>
        <p className="text-xs text-fg-3">
          {formatMonthLong(today)} · day {today.getDate()} of {daysInMonth(today)}. Recurring costs are projected once; variable spend at its current daily pace.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Total budget" value={formatINRCompact(totalLimit)} hint={`${rows.length} categories`} />
        <StatTile label="Spent so far" value={formatINRCompact(totalSpent)} hint={`${((totalSpent / totalLimit) * 100).toFixed(0)}% of budget`} />
        <StatTile label="Projected month-end" value={formatINRCompact(totalProjected)} hint={totalProjected > totalLimit ? 'Above total budget' : 'Within total budget'} />
        <StatTile label="Categories needing attention" value={flagged} hint="At risk or over budget" />
      </div>
      <Panel flush title="Budget by category" description="Edit a limit — changes apply immediately">
        <Table minWidth={860}>
          <THead>
            <tr>
              <TH>Category</TH>
              <TH>Monthly limit (₹)</TH>
              <TH>Spent</TH>
              <TH align="right">Projected</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => {
              const Icon = HEALTH_ICON[r.health]
              return (
                <TR key={r.category}>
                  <TD>
                    <span className="font-medium text-fg">{r.category}</span>
                    <span className="block text-[11px] text-fg-4">{RECURRING.has(r.category) ? 'Recurring' : 'Variable'}</span>
                  </TD>
                  <TD>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      aria-label={`Monthly limit for ${r.category}`}
                      defaultValue={r.limit}
                      onBlur={(e) => setLimit(r.category, Number(e.target.value) || 0)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      className="h-8 w-32 rounded-md border border-line bg-raised px-2 text-right text-xs text-fg outline-none focus:border-brand/70"
                    />
                  </TD>
                  <TD className="min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <Meter value={r.spent} max={r.limit || 1} tone="auto" thresholds={[0.85, 1.0001]} label={`${r.category} spent`} />
                      <span className="w-28 shrink-0 text-right text-xs text-fg-2 tabular-nums">
                        {formatINRCompact(r.spent)} · {r.limit ? Math.round((r.spent / r.limit) * 100) : 0}%
                      </span>
                    </div>
                  </TD>
                  <TD align="right">{formatINR(r.projected)}</TD>
                  <TD>
                    <Badge tone={HEALTH_META[r.health].tone} icon={<Icon className="size-3" aria-hidden />}>
                      {HEALTH_META[r.health].label}
                    </Badge>
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
