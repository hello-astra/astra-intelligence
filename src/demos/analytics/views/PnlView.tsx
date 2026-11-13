import { useMemo } from 'react'
import { Download, Landmark, PiggyBank, Receipt, Scale } from 'lucide-react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { useToast } from '@/components/ui/toast-context'
import { cn } from '@/utils/cn'
import { dateStamp, downloadCSV } from '@/utils/export'
import { formatINRCompact, formatINRTick } from '@/utils/format'
import { ChartFrame } from '../../shared/Chart'
import { activeDot, axisProps, BAR_SIZE, barCursor, gridProps, SERIES, yAxisProps } from '../../shared/chartTheme'
import { StatTile } from '../../shared/StatTile'
import { tooltipRenderer } from '../../shared/tooltip'
import type { AnalyticsCtx } from '../context'
import { monthlyPnl } from '../engine'

export function PnlView({ ds, list, range }: AnalyticsCtx) {
  const toast = useToast()
  const rows = useMemo(() => monthlyPnl(ds, list, range), [ds, list, range])
  const sum = (k: 'revenue' | 'cogs' | 'grossProfit' | 'marketing' | 'fulfilment' | 'overheads' | 'opex' | 'netProfit') => rows.reduce((s, r) => s + r[k], 0)
  const revenue = sum('revenue')
  const gross = sum('grossProfit')
  const opex = sum('opex')
  const net = sum('netProfit')

  const exportCsv = () => {
    downloadCSV(`profit-and-loss-${dateStamp()}`, rows, [
      { key: 'month', label: 'Month', value: (r) => r.label },
      { key: 'revenue', label: 'Revenue (INR)', value: (r) => Math.round(r.revenue) },
      { key: 'cogs', label: 'COGS (INR)', value: (r) => Math.round(r.cogs) },
      { key: 'gross', label: 'Gross profit (INR)', value: (r) => Math.round(r.grossProfit) },
      { key: 'marketing', label: 'Marketing (INR)', value: (r) => Math.round(r.marketing) },
      { key: 'fulfilment', label: 'Fulfilment (INR)', value: (r) => Math.round(r.fulfilment) },
      { key: 'overheads', label: 'Allocated overheads (INR)', value: (r) => Math.round(r.overheads) },
      { key: 'net', label: 'Net profit (INR)', value: (r) => Math.round(r.netProfit) },
      { key: 'margin', label: 'Net margin (%)', value: (r) => r.netMargin.toFixed(1) },
    ])
    toast({ title: 'P&L exported', description: `${rows.length} month rows downloaded as CSV.` })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Revenue" icon={Receipt} value={formatINRCompact(revenue)} hint="Selected slice" />
        <StatTile label="Gross profit" icon={Scale} value={formatINRCompact(gross)} hint={`${revenue ? ((gross / revenue) * 100).toFixed(1) : 0}% gross margin`} />
        <StatTile label="Operating expenses" icon={Landmark} value={formatINRCompact(opex)} hint="Marketing, fulfilment & overheads" />
        <StatTile label="Net profit" icon={PiggyBank} value={formatINRCompact(net)} hint={`${revenue ? ((net / revenue) * 100).toFixed(1) : 0}% net margin`} />
      </div>

      <ChartFrame
        title="Revenue and net profit by month"
        description="Both in INR on one axis"
        height={270}
        legend={[
          { label: 'Revenue', color: SERIES[0], kind: 'rect' },
          { label: 'Gross profit', color: SERIES[2], kind: 'rect' },
          { label: 'Net profit', color: SERIES[1], kind: 'line' },
        ]}
        table={{
          columns: [
            { key: 'label', label: 'Month' },
            { key: 'revenue', label: 'Revenue', align: 'right', format: (v) => formatINRCompact(Number(v)) },
            { key: 'grossProfit', label: 'Gross profit', align: 'right', format: (v) => formatINRCompact(Number(v)) },
            { key: 'netProfit', label: 'Net profit', align: 'right', format: (v) => formatINRCompact(Number(v)) },
          ],
          rows: rows as unknown as Record<string, unknown>[],
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} tickFormatter={(v: string) => v.replace(' (partial)', '*')} minTickGap={12} />
            <YAxis {...yAxisProps} tickFormatter={formatINRTick} />
            <Tooltip content={tooltipRenderer((v) => formatINRCompact(v))} cursor={barCursor} />
            <Bar dataKey="revenue" name="Revenue" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={BAR_SIZE} />
            <Bar dataKey="grossProfit" name="Gross profit" fill={SERIES[2]} radius={[4, 4, 0, 0]} maxBarSize={BAR_SIZE} />
            <Line type="monotone" dataKey="netProfit" name="Net profit" stroke={SERIES[1]} strokeWidth={2} dot={{ r: 3, fill: SERIES[1], strokeWidth: 0 }} activeDot={activeDot} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFrame>

      <Panel
        title="Profit & loss statement"
        description="Overheads are allocated to the filtered slice by its share of company revenue"
        flush
        actions={
          <Button size="xs" variant="secondary" leftIcon={<Download className="size-3" />} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead className="border-b border-line text-[11px] tracking-wide text-fg-3 uppercase">
              <tr>
                {['Month', 'Revenue', 'COGS', 'Gross profit', 'Marketing', 'Fulfilment', 'Overheads', 'Net profit', 'Net margin'].map((h, i) => (
                  <th key={h} scope="col" className={cn('px-3 py-2.5 font-medium whitespace-nowrap', i > 0 && 'text-right')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {rows.map((r) => (
                <tr key={r.label} className="hover:bg-white/[0.02]">
                  <th scope="row" className="px-3 py-2 text-left font-normal whitespace-nowrap text-fg-2">
                    {r.label}
                  </th>
                  {[r.revenue, -r.cogs, r.grossProfit, -r.marketing, -r.fulfilment, -r.overheads].map((v, i) => (
                    <td key={i} className={cn('px-3 py-2 text-right tabular-nums', v < 0 ? 'text-fg-3' : 'text-fg-2')}>
                      {v < 0 ? `(${formatINRCompact(-v)})` : formatINRCompact(v)}
                    </td>
                  ))}
                  <td className={cn('px-3 py-2 text-right font-medium tabular-nums', r.netProfit >= 0 ? 'text-fg' : 'text-red-300')}>{formatINRCompact(r.netProfit)}</td>
                  <td className={cn('px-3 py-2 text-right tabular-nums', r.netMargin >= 0 ? 'text-fg-2' : 'text-red-300')}>{r.netMargin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-line-strong text-fg">
              <tr>
                <th scope="row" className="px-3 py-2.5 text-left font-semibold">
                  Total
                </th>
                {[revenue, -sum('cogs'), gross, -sum('marketing'), -sum('fulfilment'), -sum('overheads')].map((v, i) => (
                  <td key={i} className="px-3 py-2.5 text-right font-semibold tabular-nums">
                    {v < 0 ? `(${formatINRCompact(-v)})` : formatINRCompact(v)}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatINRCompact(net)}</td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{revenue ? ((net / revenue) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="border-t border-line px-4 py-2.5 text-xs text-fg-4">Figures are computed from the synthetic sample dataset. Costs in brackets.</p>
      </Panel>
    </div>
  )
}
