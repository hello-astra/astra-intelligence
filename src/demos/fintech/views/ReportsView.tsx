import { useMemo, useState } from 'react'
import { useToday } from '@/hooks/useToday'
import { Download, FileBarChart, TrendingDown, TrendingUp } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Form'
import { Panel } from '@/components/ui/Panel'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast-context'
import { cn } from '@/utils/cn'
import { addMonths, daysInMonth, fromMonthKey, monthKey } from '@/utils/dates'
import { downloadCSV } from '@/utils/export'
import { formatINR, formatINRCompact, formatINRTick, formatMonth, formatSignedPercent } from '@/utils/format'
import { ChartFrame } from '../../shared/Chart'
import { useChartTheme } from '../../shared/demo-theme'
import { StatTile } from '../../shared/StatTile'
import { tooltipRenderer } from '../../shared/tooltip'
import type { LedgerCtx } from '../context'
import { currentMonthKey, lastMonths, monthTotals } from '../logic'

export function ReportsView({ state }: LedgerCtx) {
  const { activeDot, axisProps, DEEMPH, gridProps, lineCursor, SERIES, yAxisProps, animate } = useChartTheme()
  const toast = useToast()
  const months = lastMonths(6).reverse()
  const [month, setMonth] = useState(months[1] ?? months[0])
  const [report, setReport] = useState<string | null>(months[1] ?? months[0])
  const [busy, setBusy] = useState(false)
  const today = useToday()

  const data = useMemo(() => {
    if (!report) return null
    const cur = monthTotals(state.transactions, report)
    const prev = monthTotals(state.transactions, monthKey(addMonths(fromMonthKey(report), -1)))
    const budget = state.budgets.reduce((s, b) => s + b.limit, 0)
    const len = daysInMonth(fromMonthKey(report))
    const isCurrent = report === currentMonthKey()
    const lastDay = isCurrent ? today.getDate() : len
    let running = 0
    const daily = Array.from({ length: len }, (_, i) => {
      const day = String(i + 1).padStart(2, '0')
      running += state.transactions.filter((t) => t.type === 'expense' && t.date === `${report}-${day}`).reduce((s, t) => s + t.amount, 0)
      return { day: i + 1, spend: i + 1 <= lastDay ? Math.round(running) : null, pace: Math.round((budget / len) * (i + 1)) }
    })
    const categories = Object.entries(cur.byCategory)
      .map(([c, v]) => ({ category: c, amount: v, share: cur.expense ? (v / cur.expense) * 100 : 0, change: prev.byCategory[c] ? ((v - prev.byCategory[c]) / prev.byCategory[c]) * 100 : null }))
      .sort((a, b) => b.amount - a.amount)
    return { cur, prev, daily, categories, budget, isCurrent }
  }, [report, state.transactions, state.budgets, today])

  const generate = () => {
    setBusy(true)
    window.setTimeout(() => {
      setReport(month)
      setBusy(false)
      toast({ title: `Report generated · ${formatMonth(fromMonthKey(month))}` })
    }, 500)
  }

  const exportSummary = () => {
    if (!data || !report) return
    downloadCSV(`ledger-report-${report}`, data.categories, [
      { key: 'category', label: 'Category', value: (r) => r.category },
      { key: 'amount', label: 'Amount (INR)', value: (r) => Math.round(r.amount) },
      { key: 'share', label: 'Share of expenses (%)', value: (r) => r.share.toFixed(1) },
      { key: 'change', label: 'Change vs previous month (%)', value: (r) => (r.change === null ? '' : r.change.toFixed(1)) },
    ])
  }

  const exportTransactions = () => {
    if (!report) return
    const rows = state.transactions.filter((t) => t.date.startsWith(report))
    downloadCSV(`ledger-transactions-${report}`, rows, [
      { key: 'date', label: 'Date', value: (t) => t.date },
      { key: 'description', label: 'Description', value: (t) => t.description },
      { key: 'category', label: 'Category', value: (t) => t.category },
      { key: 'type', label: 'Type', value: (t) => t.type },
      { key: 'amount', label: 'Amount (INR)', value: (t) => (t.type === 'expense' ? -t.amount : t.amount) },
    ])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Financial reports</h2>
          <p className="text-xs text-fg-3">Monthly income, expenses and category analysis — ready to share with your accountant.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select controlSize="sm" aria-label="Report month" value={month} onChange={(e) => setMonth(e.target.value)} wrapperClassName="w-40">
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(fromMonthKey(m))}
                {m === currentMonthKey() ? ' (to date)' : ''}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={generate} loading={busy} leftIcon={!busy ? <FileBarChart className="size-3.5" /> : undefined}>
            Generate report
          </Button>
        </div>
      </div>

      {data && report && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-panel px-4 py-3">
            <p className="text-sm text-fg">
              Report · <span className="font-semibold">{formatMonth(fromMonthKey(report))}</span>
              {data.isCurrent && <span className="text-fg-3"> (month to date)</span>} · {state.company}
            </p>
            <div className="flex gap-2">
              <Button size="xs" variant="secondary" leftIcon={<Download className="size-3" />} onClick={exportSummary}>
                Summary CSV
              </Button>
              <Button size="xs" variant="secondary" leftIcon={<Download className="size-3" />} onClick={exportTransactions}>
                Transactions CSV
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatTile label="Income" value={formatINRCompact(data.cur.income)} delta={data.prev.income ? ((data.cur.income - data.prev.income) / data.prev.income) * 100 : null} deltaLabel="vs previous month" />
            <StatTile label="Expenses" value={formatINRCompact(data.cur.expense)} delta={data.prev.expense ? ((data.cur.expense - data.prev.expense) / data.prev.expense) * 100 : null} deltaLabel="vs previous month" goodWhen="down" />
            <StatTile label="Net cash flow" value={formatINRCompact(data.cur.net)} hint={data.cur.net >= 0 ? 'Surplus' : 'Deficit'} />
            <StatTile label="Savings rate" value={`${data.cur.savingsRate.toFixed(1)}%`} hint={`Previous month ${data.prev.savingsRate.toFixed(1)}%`} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <ChartFrame
              title="Cumulative spending vs budget pace"
              description="Total expenses through the month against a straight-line budget"
              height={260}
              busy={busy}
              legend={[
                { label: 'Cumulative spend', color: SERIES[1], kind: 'line' },
                { label: 'Budget pace', color: DEEMPH, kind: 'dashed' },
              ]}
              table={{
                columns: [
                  { key: 'day', label: 'Day' },
                  { key: 'spend', label: 'Cumulative spend', align: 'right', format: (v) => (v === null ? '—' : formatINR(Number(v))) },
                  { key: 'pace', label: 'Budget pace', align: 'right', format: (v) => formatINR(Number(v)) },
                ],
                rows: data.daily,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="day" {...axisProps} interval={4} />
                  <YAxis {...yAxisProps} tickFormatter={formatINRTick} />
                  <Tooltip content={tooltipRenderer((v) => formatINR(v), (l) => `Day ${l}`)} cursor={lineCursor} />
                  <Line isAnimationActive={animate} dataKey="pace" name="Budget pace" stroke={DEEMPH} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line isAnimationActive={animate} dataKey="spend" name="Cumulative spend" stroke={SERIES[1]} strokeWidth={2} dot={false} activeDot={activeDot} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
            <Panel title="Expenses by category" flush>
              <table className="w-full text-[13px]">
                <thead className="border-b border-line text-[11px] tracking-wide text-fg-3 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left font-medium">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">
                      Amount
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">
                      Share
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">
                      vs prev.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {data.categories.map((c) => (
                    <tr key={c.category}>
                      <th scope="row" className="px-4 py-2 text-left font-normal text-fg-2">
                        {c.category}
                      </th>
                      <td className="px-4 py-2 text-right text-fg tabular-nums">{formatINRCompact(c.amount)}</td>
                      <td className="px-4 py-2 text-right text-fg-3 tabular-nums">{c.share.toFixed(1)}%</td>
                      <td className={cn('px-4 py-2 text-right tabular-nums', c.change === null ? 'text-fg-4' : c.change > 0 ? 'text-red-300' : 'text-emerald-300')}>
                        {c.change === null ? '—' : (
                          <span className="inline-flex items-center gap-1">
                            {c.change > 0 ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
                            {formatSignedPercent(c.change)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        </>
      )}
      {busy && !data && <Spinner />}
    </div>
  )
}
