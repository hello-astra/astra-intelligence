import { useMemo } from 'react'
import { AreaChart as AreaIcon, BarChart3, ChevronRight, LineChart as LineIcon } from 'lucide-react'
import { SegmentedBar } from '@/components/ui/Meter'
import { Panel } from '@/components/ui/Panel'
import { Segmented } from '@/components/ui/Segmented'
import { REGIONS } from '@/data/mock/analytics'
import { cn } from '@/utils/cn'
import { formatINRCompact, formatSignedPercent } from '@/utils/format'
import { ChartFrame } from '../../shared/Chart'
import { useChartTheme } from '../../shared/demo-theme'
import { StatTile } from '../../shared/StatTile'
import type { AnalyticsCtx } from '../context'
import { byCategory, byRegion, change, KPIS, type ChartType, type Granularity, type KpiKey } from '../engine'
import { TrendChart } from '../TrendChart'

const TILE_KPIS: KpiKey[] = ['revenue', 'orders', 'aov', 'margin', 'newCustomers']

export function OverviewView(ctx: AnalyticsCtx) {
  const { DEEMPH, SERIES } = useChartTheme()
  const { ds, filters, setFilters, range, current, previous, buckets, prevBuckets, gran, openDrilldown } = ctx
  const kpi = filters.kpi
  const compare = filters.compare && range.hasPrevious

  const rows = useMemo(
    () => buckets.map((b, i) => ({ label: `${b.label}${b.partial ? '*' : ''}`, partial: b.partial, current: b.totals[kpi], previous: compare ? (prevBuckets[i]?.totals[kpi] ?? null) : null })),
    [buckets, prevBuckets, kpi, compare],
  )
  const categories = useMemo(() => byCategory(ds, filters.regions, range).sort((a, b) => b.current.revenue - a.current.revenue), [ds, filters.regions, range])
  const regions = useMemo(() => byRegion(ds, filters.category, range), [ds, filters.category, range])
  const topRevenue = categories[0]?.current.revenue || 1
  const selectedRegionRevenue = regions.filter((r) => filters.regions.includes(r.key))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {TILE_KPIS.map((k) => (
          <StatTile
            key={k}
            label={KPIS[k].label}
            value={KPIS[k].format(current[k])}
            delta={previous && filters.compare ? (k === 'margin' ? current.margin - previous.margin : change(current[k], previous[k])) : null}
            deltaUnit={k === 'margin' ? 'points' : 'percent'}
            deltaLabel='vs previous period'
            hint={!filters.compare ? 'Comparison off' : !previous ? 'No earlier data' : undefined}
            // Sparklines have no room to mark partial periods, so they show complete ones only.
            trend={buckets.filter((b) => !b.partial).map((b) => b.totals[k])}
            active={kpi === k}
            onClick={() => setFilters({ kpi: k })}
          />
        ))}
      </div>

      <ChartFrame
        title={`${KPIS[kpi].label} over time`}
        description={`${range.label} · grouped by ${gran}${buckets.some((b) => b.partial) ? ' · * partial period' : ''}`}
        height={290}
        legend={[
          { label: KPIS[kpi].label, color: SERIES[0], kind: filters.chartType === 'bar' ? 'rect' : filters.chartType === 'area' ? 'rect' : 'line' },
          ...(buckets.some((b) => b.partial) && filters.chartType !== 'bar' ? [{ label: 'Partial period', color: SERIES[0], kind: 'dashed' as const }] : []),
          ...(compare ? [{ label: 'Previous period', color: DEEMPH, kind: filters.chartType === 'bar' ? ('rect' as const) : ('dashed' as const) }] : []),
        ]}
        actions={
          <>
            <Select
              value={kpi}
              onChange={(k) => setFilters({ kpi: k })}
            />
            <Segmented
              size="xs"
              ariaLabel="Chart type"
              value={filters.chartType}
              onChange={(chartType: ChartType) => setFilters({ chartType })}
              options={[
                { value: 'area', label: <span className="sr-only">Area</span>, icon: AreaIcon, title: 'Area chart' },
                { value: 'line', label: <span className="sr-only">Line</span>, icon: LineIcon, title: 'Line chart' },
                { value: 'bar', label: <span className="sr-only">Bar</span>, icon: BarChart3, title: 'Bar chart' },
              ]}
            />
            <Segmented
              size="xs"
              ariaLabel="Granularity"
              value={filters.granularity}
              onChange={(granularity: Granularity) => setFilters({ granularity })}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'day', label: 'D', title: 'Daily' },
                { value: 'week', label: 'W', title: 'Weekly' },
                { value: 'month', label: 'M', title: 'Monthly' },
              ]}
            />
          </>
        }
        table={{
          columns: [
            { key: 'label', label: gran === 'month' ? 'Month' : gran === 'week' ? 'Week from' : 'Date' },
            { key: 'current', label: KPIS[kpi].label, align: 'right', format: (v) => KPIS[kpi].format(Number(v)) },
            ...(compare ? [{ key: 'previous', label: 'Previous period', align: 'right' as const, format: (v: unknown) => (v === null || v === undefined ? '—' : KPIS[kpi].format(Number(v))) }] : []),
          ],
          rows,
        }}
      >
        <TrendChart rows={rows} kpi={kpi} chartType={filters.chartType} compare={compare} />
      </ChartFrame>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Revenue by category" description={filters.category === 'all' ? 'Select a category for detailed analytics' : `${filters.category} highlighted · select any category for details`}>
          <ul className="space-y-1">
            {categories.map((c) => {
              const highlighted = filters.category === 'all' || filters.category === c.key
              const growth = c.previous ? change(c.current.revenue, c.previous.revenue) : null
              return (
                <li key={c.key}>
                  <button type="button" onClick={() => openDrilldown(c.key)} className="group w-full rounded-lg px-2 py-2 text-left hover:bg-ink/[0.03]">
                    <div className="flex items-center gap-2 text-[13px]">
                      <span className={cn('flex-1', highlighted ? 'text-fg' : 'text-fg-3')}>{c.key}</span>
                      {growth !== null && filters.compare && (
                        <span className={cn('text-[11px] tabular-nums', growth >= 0 ? 'text-emerald-300' : 'text-red-300')}>{formatSignedPercent(growth)}</span>
                      )}
                      <span className="w-20 text-right font-medium text-fg tabular-nums">{formatINRCompact(c.current.revenue)}</span>
                      <ChevronRight className="size-3.5 text-fg-4 group-hover:text-fg-2" aria-hidden />
                      <span className="sr-only">: view details</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.04]">
                      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(c.current.revenue / topRevenue) * 100}%`, backgroundColor: highlighted ? SERIES[0] : DEEMPH }} />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel title="Revenue mix by region" description="Share of selected-period revenue">
          <SegmentedBar
            height={10}
            parts={selectedRegionRevenue.map((r) => ({ label: r.key, value: r.current.revenue, color: SERIES[REGIONS.indexOf(r.key)] }))}
          />
          <ul className="mt-4 space-y-2">
            {selectedRegionRevenue.map((r) => {
              const total = selectedRegionRevenue.reduce((s, x) => s + x.current.revenue, 0) || 1
              return (
                <li key={r.key} className="flex items-center gap-2 text-[13px]">
                  <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: SERIES[REGIONS.indexOf(r.key)] }} aria-hidden />
                  <span className="flex-1 text-fg-2">{r.key}</span>
                  <span className="text-fg-3 tabular-nums">{((r.current.revenue / total) * 100).toFixed(1)}%</span>
                  <span className="w-20 text-right font-medium text-fg tabular-nums">{formatINRCompact(r.current.revenue)}</span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

function Select({ value, onChange }: { value: KpiKey; onChange: (k: KpiKey) => void }) {
  return (
    <select
      aria-label="KPI"
      value={value}
      onChange={(e) => onChange(e.target.value as KpiKey)}
      className="h-6 rounded-md border border-line bg-raised px-1.5 text-[11px] text-fg outline-none focus:border-brand/70"
    >
      {(Object.keys(KPIS) as KpiKey[]).map((k) => (
        <option key={k} value={k}>
          {KPIS[k].label}
        </option>
      ))}
    </select>
  )
}
