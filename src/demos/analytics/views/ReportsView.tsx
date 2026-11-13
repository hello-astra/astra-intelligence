import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Select } from '@/components/ui/Form'
import { Panel } from '@/components/ui/Panel'
import { useToast } from '@/components/ui/toast-context'
import { CATEGORIES, REGIONS, seriesKey } from '@/data/mock/analytics'
import { dateStamp, downloadCSV } from '@/utils/export'
import { toISODate } from '@/utils/dates'
import { formatINR } from '@/utils/format'
import type { AnalyticsCtx } from '../context'
import { buildReport, dateOf, METRIC_LABELS, PRESET_LABELS, type ReportDimension, type ReportMetric, type Totals } from '../engine'

const DIMENSIONS: { value: ReportDimension; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
  { value: 'region', label: 'Region' },
  { value: 'category', label: 'Category' },
  { value: 'weekday', label: 'Day of week' },
]

function metricValue(t: Totals, m: ReportMetric): number {
  if (m === 'margin') return Number(t.margin.toFixed(2))
  if (m === 'aov') return Math.round(t.aov)
  return Math.round(t[m])
}

function display(m: ReportMetric, v: number): string {
  if (m === 'revenue' || m === 'grossProfit' || m === 'aov') return formatINR(v)
  if (m === 'margin') return `${v.toFixed(1)}%`
  return v.toLocaleString('en-IN')
}

export function ReportsView({ ds, filters, range }: AnalyticsCtx) {
  const toast = useToast()
  const [dimension, setDimension] = useState<ReportDimension>('month')
  const [metrics, setMetrics] = useState<ReportMetric[]>(['revenue', 'orders', 'aov', 'margin'])

  const rows = useMemo(() => buildReport(ds, filters, range, dimension), [ds, filters, range, dimension])
  const toggle = (m: ReportMetric) => setMetrics((list) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]))
  const scope = `${PRESET_LABELS[filters.preset]} · ${filters.regions.length === REGIONS.length ? 'all regions' : filters.regions.join(', ')} · ${filters.category === 'all' ? 'all categories' : filters.category}`

  const exportReport = () => {
    if (metrics.length === 0) {
      toast({ title: 'Choose at least one metric', tone: 'warning' })
      return
    }
    downloadCSV(`astra-insights-${dimension}-report-${dateStamp()}`, rows, [
      { key: 'dim', label: DIMENSIONS.find((d) => d.value === dimension)?.label ?? 'Group', value: (r) => r.label },
      ...metrics.map((m) => ({ key: m, label: METRIC_LABELS[m], value: (r: (typeof rows)[number]) => metricValue(r.totals, m) })),
    ])
    toast({ title: 'Report exported', description: `${rows.length} rows · ${metrics.length} metrics · CSV downloaded.` })
  }

  const exportDaily = () => {
    const out: { date: string; region: string; category: string; orders: number; revenue: number; cogs: number; newCustomers: number }[] = []
    const cats = filters.category === 'all' ? CATEGORIES : [filters.category]
    for (let i = range.start; i <= range.end; i++) {
      const date = toISODate(dateOf(ds, i))
      for (const r of filters.regions)
        for (const c of cats) {
          const s = ds.series[seriesKey(r, c)]
          out.push({ date, region: r, category: c, orders: s.orders[i], revenue: s.revenue[i], cogs: s.cogs[i], newCustomers: s.newCustomers[i] })
        }
    }
    downloadCSV(`astra-insights-daily-${dateStamp()}`, out, [
      { key: 'date', label: 'Date', value: (r) => r.date },
      { key: 'region', label: 'Region', value: (r) => r.region },
      { key: 'category', label: 'Category', value: (r) => r.category },
      { key: 'orders', label: 'Orders', value: (r) => r.orders },
      { key: 'revenue', label: 'Revenue (INR)', value: (r) => r.revenue },
      { key: 'cogs', label: 'COGS (INR)', value: (r) => r.cogs },
      { key: 'new', label: 'New customers', value: (r) => r.newCustomers },
    ])
    toast({ title: 'Dataset exported', description: `${out.length.toLocaleString('en-IN')} daily rows downloaded as CSV.` })
  }

  return (
    <div className="space-y-4">
      <Panel title="Report builder" description={`Scope: ${scope}`}>
        <div className="grid gap-5 lg:grid-cols-[220px_1fr_auto] lg:items-end">
          <Field label="Group by" htmlFor="report-dimension">
            <Select id="report-dimension" controlSize="sm" value={dimension} onChange={(e) => setDimension(e.target.value as ReportDimension)}>
              {DIMENSIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-fg-2">Metrics</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(Object.keys(METRIC_LABELS) as ReportMetric[]).map((m) => (
                <Checkbox key={m} id={`metric-${m}`} label={METRIC_LABELS[m].replace(' (INR)', '').replace(' (%)', '')} checked={metrics.includes(m)} onChange={() => toggle(m)} className="text-[13px]" />
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" leftIcon={<Download className="size-3.5" />} onClick={exportReport}>
              Export CSV
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<FileSpreadsheet className="size-3.5" />} onClick={exportDaily}>
              Daily data
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Preview" description={`${rows.length} rows`} flush>
        {metrics.length === 0 ? (
          <p className="flex items-center gap-2 p-4 text-sm text-fg-3">
            <ListChecks className="size-4" aria-hidden /> Select one or more metrics to preview the report.
          </p>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead className="sticky top-0 border-b border-line bg-panel text-[11px] tracking-wide text-fg-3 uppercase">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-left font-medium">
                    {DIMENSIONS.find((d) => d.value === dimension)?.label}
                  </th>
                  {metrics.map((m) => (
                    <th key={m} scope="col" className="px-3 py-2.5 text-right font-medium whitespace-nowrap">
                      {METRIC_LABELS[m]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {rows.map((r) => (
                  <tr key={r.label} className="hover:bg-ink/[0.02]">
                    <th scope="row" className="px-3 py-2 text-left font-normal text-fg-2">
                      {r.label}
                    </th>
                    {metrics.map((m) => (
                      <td key={m} className="px-3 py-2 text-right text-fg tabular-nums">
                        {display(m, metricValue(r.totals, m))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
