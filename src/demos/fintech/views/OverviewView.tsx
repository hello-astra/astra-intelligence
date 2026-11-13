import { ArrowDownLeft, ArrowUpRight, PiggyBank, Plus, Scale, Sparkles, TriangleAlert, Wallet } from 'lucide-react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { useToday } from '@/hooks/useToday'
import { cn } from '@/utils/cn'
import { fromMonthKey } from '@/utils/dates'
import { formatDateShort, formatINR, formatINRCompact, formatINRTick, formatMonthShort } from '@/utils/format'
import { ChartFrame } from '../../shared/Chart'
import { activeDot, axisProps, BAR_SIZE, barCursor, gridProps, SERIES, yAxisProps } from '../../shared/chartTheme'
import { StatTile } from '../../shared/StatTile'
import { tooltipRenderer } from '../../shared/tooltip'
import type { LedgerCtx } from '../context'
import { budgetRows, currentMonthKey, HEALTH_META, lastMonths, monthTotals } from '../logic'

export function OverviewView({ state, openTransaction, goTo }: LedgerCtx) {
  const months = lastMonths(6)
  const key = currentMonthKey()
  const prevKey = months[months.length - 2]
  const cur = monthTotals(state.transactions, key)
  const today = useToday().getDate()
  // Like-for-like: the same days of last month.
  const prev = monthTotals(state.transactions, prevKey, today)
  const prevFull = monthTotals(state.transactions, prevKey)
  const trend = months.map((m) => {
    const t = monthTotals(state.transactions, m)
    return { month: formatMonthShort(fromMonthKey(m)) + (m === key ? '*' : ''), income: Math.round(t.income), expenses: Math.round(t.expense), net: Math.round(t.net) }
  })
  const categories = Object.entries(cur.byCategory)
    .filter(([c]) => c !== 'Uncategorized')
    .sort((a, b) => b[1] - a[1])
  const alerts = budgetRows(state).filter((b) => b.health !== 'ok')
  const uncategorized = state.transactions.filter((t) => t.category === 'Uncategorized').length
  const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Financial overview</h2>
          <p className="text-xs text-fg-3">{state.company} · month to date (day {today}), compared with the same days last month</p>
        </div>
        <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => openTransaction('new')}>
          Add transaction
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Income · month to date" icon={ArrowDownLeft} value={formatINRCompact(cur.income)} delta={pct(cur.income, prev.income)} deltaLabel="vs same days last month" />
        <StatTile label="Expenses · month to date" icon={ArrowUpRight} value={formatINRCompact(cur.expense)} delta={pct(cur.expense, prev.expense)} deltaLabel="vs same days last month" goodWhen="down" />
        <StatTile
          label="Net cash flow · month to date"
          icon={Scale}
          value={formatINRCompact(cur.net)}
          hint={cur.net >= 0 ? 'Positive so far this month' : `Payroll is paid on the 1st · same point last month: ${formatINRCompact(prev.net)}`}
        />
        <StatTile label="Savings rate" icon={PiggyBank} value={`${cur.savingsRate.toFixed(1)}%`} hint={`Last full month ${prevFull.savingsRate.toFixed(1)}%`} />
      </div>

      {uncategorized > 0 && (
        <button
          type="button"
          onClick={() => goTo('categorize')}
          className="flex w-full items-center gap-3 rounded-xl border border-astra-cyan/25 bg-astra-cyan/[0.05] px-4 py-3 text-left transition-colors hover:bg-astra-cyan/[0.08]"
        >
          <Sparkles className="size-4 text-astra-cyan" aria-hidden />
          <span className="flex-1 text-[13px] text-fg-2">
            <span className="font-medium text-fg">{uncategorized} transactions need a category.</span> Let AI suggest categories and review them in one place.
          </span>
          <span className="text-xs font-medium text-astra-cyan-soft">Review →</span>
        </button>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <ChartFrame
          title="Income vs expenses"
          description="Last 6 months · * month to date"
          height={270}
          legend={[
            { label: 'Income', color: SERIES[0], kind: 'rect' },
            { label: 'Expenses', color: SERIES[1], kind: 'rect' },
            { label: 'Net cash flow', color: SERIES[2], kind: 'line' },
          ]}
          table={{
            columns: [
              { key: 'month', label: 'Month' },
              { key: 'income', label: 'Income', align: 'right', format: (v) => formatINR(Number(v)) },
              { key: 'expenses', label: 'Expenses', align: 'right', format: (v) => formatINR(Number(v)) },
              { key: 'net', label: 'Net', align: 'right', format: (v) => formatINR(Number(v)) },
            ],
            rows: trend,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...yAxisProps} tickFormatter={formatINRTick} />
              <Tooltip content={tooltipRenderer((v) => formatINR(v))} cursor={barCursor} />
              <Bar dataKey="income" name="Income" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={BAR_SIZE} />
              <Bar dataKey="expenses" name="Expenses" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={BAR_SIZE} />
              <Line dataKey="net" name="Net cash flow" stroke={SERIES[2]} strokeWidth={2} dot={{ r: 3, fill: SERIES[2], strokeWidth: 0 }} activeDot={activeDot} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>

        <Panel title="Spending by category" description="This month">
          <ul className="space-y-2.5">
            {categories.map(([c, v]) => (
              <li key={c}>
                <div className="flex justify-between text-[13px]">
                  <span className="text-fg-2">{c}</span>
                  <span className="font-medium text-fg tabular-nums">{formatINRCompact(v)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                  <div className="h-full rounded-full" style={{ width: `${(v / (categories[0]?.[1] || 1)) * 100}%`, backgroundColor: SERIES[1] }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Panel
          title="Budget alerts"
          actions={
            <Button size="xs" variant="ghost" onClick={() => goTo('budgets')}>
              Budgets
            </Button>
          }
        >
          {alerts.length === 0 ? (
            <p className="text-sm text-fg-3">All categories are on track for this month.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.category} className={cn('flex items-center gap-2.5 rounded-lg border px-3 py-2', a.health === 'over' ? 'border-red-500/25 bg-red-500/[0.06]' : 'border-amber-400/20 bg-amber-400/[0.05]')}>
                  <TriangleAlert className={cn('size-4 shrink-0', a.health === 'over' ? 'text-red-300' : 'text-amber-300')} aria-hidden />
                  <span className="flex-1 text-[13px] text-fg-2">
                    <span className="font-medium text-fg">{a.category}</span> · {formatINRCompact(a.spent)} of {formatINRCompact(a.limit)}
                    {a.health === 'risk' && ` · projected ${formatINRCompact(a.projected)}`}
                  </span>
                  <Badge tone={HEALTH_META[a.health].tone}>{HEALTH_META[a.health].label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel
          title="Recent transactions"
          actions={
            <Button size="xs" variant="ghost" onClick={() => goTo('transactions')}>
              View all
            </Button>
          }
        >
          <ul className="divide-y divide-line/70">
            {state.transactions.slice(0, 6).map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => openTransaction(t.id)} className="flex w-full items-center gap-3 py-2 text-left first:pt-0">
                  <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', t.type === 'income' ? 'bg-emerald-500/10' : 'bg-white/[0.04]')}>
                    <Wallet className={cn('size-3.5', t.type === 'income' ? 'text-emerald-300' : 'text-fg-3')} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-fg">{t.merchant}</span>
                    <span className="block text-[11px] text-fg-3">
                      {formatDateShort(t.date)} · {t.category}
                    </span>
                  </span>
                  <span className={cn('text-[13px] font-medium tabular-nums', t.type === 'income' ? 'text-emerald-300' : 'text-fg')}>
                    {t.type === 'income' ? '+' : '−'}
                    {formatINR(t.amount)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
