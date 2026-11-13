import { Download, FileJson } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { useToast } from '@/components/ui/toast-context'
import { toISODate } from '@/utils/dates'
import { dateStamp, downloadCSV, downloadJSON } from '@/utils/export'
import { futureDate } from '@/data/mock/predictive'
import { MODEL_LABELS } from '../models'
import type { PredictiveCtx } from '../shared'

export function DataView({ result, format }: PredictiveCtx) {
  const toast = useToast()
  const ds = result.dataset
  const rows = [
    ...ds.points.map((p) => ({ date: toISODate(new Date(p.date)), label: p.label, type: 'Historical' as const, value: p.value, lower: null as number | null, upper: null as number | null })),
    ...result.forecast.map((v, i) => ({ date: toISODate(futureDate(ds, i + 1)), label: '', type: 'Forecast' as const, value: Math.round(v), lower: Math.round(result.lower[i]), upper: Math.round(result.upper[i]) })),
  ]

  const exportCsv = () => {
    downloadCSV(`${ds.id}-forecast-${dateStamp()}`, rows, [
      { key: 'date', label: 'Period start', value: (r) => r.date },
      { key: 'type', label: 'Type', value: (r) => r.type },
      { key: 'value', label: ds.unit === 'INR' ? 'Value (INR)' : `Value (${ds.unit})`, value: (r) => r.value },
      { key: 'lower', label: `Lower ${result.confidence}%`, value: (r) => r.lower },
      { key: 'upper', label: `Upper ${result.confidence}%`, value: (r) => r.upper },
    ])
    toast({ title: 'CSV exported', description: `${ds.points.length} historical + ${result.forecast.length} forecast rows.` })
  }

  const exportJson = () => {
    downloadJSON(`${ds.id}-forecast-${dateStamp()}`, {
      dataset: ds.name,
      model: MODEL_LABELS[result.model],
      parameters: result.params,
      confidence: result.confidence,
      generatedAt: result.generatedAt,
      note: 'Forecast values are statistical estimates.',
      backtest: result.metrics.map((m) => ({ model: m.model, mape: Number(m.mape.toFixed(2)), mae: Math.round(m.mae), rmse: Math.round(m.rmse) })),
      anomalies: result.anomalies.map((a) => ({ period: a.label, actual: a.actual, expected: Math.round(a.expected), deviationPct: Number(a.deviationPct.toFixed(1)) })),
      series: rows,
    })
    toast({ title: 'JSON exported' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Data & export</h2>
          <p className="text-xs text-fg-3">{ds.description}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" leftIcon={<Download className="size-3.5" />} onClick={exportCsv}>
            Export CSV
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<FileJson className="size-3.5" />} onClick={exportJson}>
            Export JSON
          </Button>
        </div>
      </div>
      <Panel flush title={`${rows.length} rows`} description="Historical observations and forecast values are labelled separately">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead className="sticky top-0 border-b border-line bg-panel text-[11px] tracking-wide text-fg-3 uppercase">
              <tr>
                {['Period start', 'Type', 'Value', `${result.confidence}% interval`].map((h, i) => (
                  <th key={h} scope="col" className={i >= 2 ? 'px-3 py-2 text-right font-medium' : 'px-3 py-2 text-left font-medium'}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {[...rows].reverse().map((r) => (
                <tr key={`${r.type}-${r.date}`} className={r.type === 'Forecast' ? 'bg-brand/[0.05]' : undefined}>
                  <th scope="row" className="px-3 py-2 text-left font-normal text-fg-2">
                    {r.date}
                  </th>
                  <td className="px-3 py-2">
                    <Badge tone={r.type === 'Forecast' ? 'violet' : 'neutral'}>{r.type}</Badge>
                  </td>
                  <td className="px-3 py-2 text-right text-fg tabular-nums">{format(r.value)}</td>
                  <td className="px-3 py-2 text-right text-fg-3 tabular-nums">{r.lower === null || r.upper === null ? '—' : `${format(r.lower)} – ${format(r.upper)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
