import { useMemo } from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { REGIONS, type Category } from '@/data/mock/analytics'
import { formatINRCompact, formatSignedPercent } from '@/utils/format'
import { ChartFrame } from '../shared/Chart'
import { SERIES } from '../shared/chartTheme'
import type { AnalyticsCtx } from './context'
import { bucketize, change, KPIS, selectSeries, sumRange } from './engine'
import { TrendChart } from './TrendChart'

export function DrilldownModal({ category, ctx, onClose }: { category: Category | null; ctx: AnalyticsCtx; onClose: () => void }) {
  const { ds, filters, range, gran, setFilters } = ctx
  const data = useMemo(() => {
    if (!category) return null
    const list = selectSeries(ds, filters.regions, category)
    const cur = sumRange(list, range.start, range.end)
    const prev = range.hasPrevious ? sumRange(list, range.prevStart, range.prevEnd) : null
    const buckets = bucketize(ds, list, range.start, range.end, gran)
    const prevBuckets = range.hasPrevious ? bucketize(ds, list, range.prevStart, range.prevEnd, gran) : []
    const rows = buckets.map((b, i) => ({ label: `${b.label}${b.partial ? '*' : ''}`, partial: b.partial, current: b.totals.revenue, previous: prevBuckets[i]?.totals.revenue ?? null }))
    const regions = REGIONS.filter((r) => filters.regions.includes(r)).map((r) => ({ region: r, revenue: sumRange(selectSeries(ds, [r], category), range.start, range.end).revenue }))
    return { cur, prev, rows, regions }
  }, [category, ds, filters.regions, range, gran])

  return (
    <Modal open={Boolean(category)} onClose={onClose} size="xl" title={category ? `${category} — detailed analytics` : ''} description={range.label}>
      {data && category && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['revenue', 'orders', 'aov', 'margin'] as const).map((k) => {
              const delta = data.prev ? (k === 'margin' ? data.cur.margin - data.prev.margin : change(data.cur[k], data.prev[k])) : null
              return (
                <div key={k} className="rounded-xl border border-line p-3">
                  <p className="text-[11px] text-fg-3">{KPIS[k].label}</p>
                  <p className="mt-1 text-lg font-semibold text-fg">{KPIS[k].format(data.cur[k])}</p>
                  {delta !== null && (
                    <p className={delta >= 0 ? 'text-[11px] text-emerald-300' : 'text-[11px] text-red-300'}>
                      {k === 'margin' ? `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)} pts` : formatSignedPercent(delta)} vs previous
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <ChartFrame title="Revenue trend" description={`By ${gran}, with the previous period for comparison`} height={240}>
            <TrendChart rows={data.rows} kpi="revenue" chartType="area" compare={range.hasPrevious} />
          </ChartFrame>
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Revenue by region</h3>
            <ul className="mt-3 space-y-2.5">
              {data.regions
                .sort((a, b) => b.revenue - a.revenue)
                .map((r) => (
                  <li key={r.region} className="grid grid-cols-[90px_1fr_80px] items-center gap-3 text-[13px]">
                    <span className="text-fg-2">{r.region}</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                      <span className="block h-full rounded-full" style={{ width: `${(r.revenue / (data.regions[0]?.revenue || 1)) * 100}%`, backgroundColor: SERIES[0] }} />
                    </span>
                    <span className="text-right text-fg tabular-nums">{formatINRCompact(r.revenue)}</span>
                  </li>
                ))}
            </ul>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Filter className="size-3.5" />}
              onClick={() => {
                setFilters({ category })
                onClose()
              }}
            >
              Filter dashboard to {category}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
