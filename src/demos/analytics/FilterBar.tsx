import { CalendarRange, Check } from 'lucide-react'
import { Select } from '@/components/ui/Form'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/toast-context'
import { CATEGORIES, REGIONS, type Category, type Dataset, type Region } from '@/data/mock/analytics'
import { addDays, toISODate } from '@/utils/dates'
import { cn } from '@/utils/cn'
import { useChartTheme } from '../shared/demo-theme'
import { PRESET_LABELS, type Filters, type Range, type RangePreset } from './engine'

interface Props {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  range: Range
  ds: Dataset
}

/** One filter row above the content; every chart, tile and table below re-renders against the same slice. */
export function FilterBar({ filters, onChange, range, ds }: Props) {
  const { SERIES } = useChartTheme()
  const toast = useToast()
  const minDate = toISODate(ds.start)
  const maxDate = toISODate(addDays(ds.start, ds.days - 1))

  const toggleRegion = (r: Region) => {
    const has = filters.regions.includes(r)
    if (has && filters.regions.length === 1) {
      toast({ title: 'At least one region is required', tone: 'warning', duration: 2500 })
      return
    }
    onChange({ regions: has ? filters.regions.filter((x) => x !== r) : REGIONS.filter((x) => x === r || filters.regions.includes(x)) })
  }

  const allRegions = filters.regions.length === REGIONS.length

  return (
    <div className="mb-4 rounded-xl border border-line bg-panel p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <CalendarRange className="size-4 text-fg-3" aria-hidden />
          <Select
            controlSize="sm"
            aria-label="Date range"
            value={filters.preset}
            wrapperClassName="w-40"
            onChange={(e) => {
              const preset = e.target.value as RangePreset
              onChange(preset === 'custom' && !filters.from ? { preset, from: toISODate(addDays(ds.start, ds.days - 60)), to: maxDate } : { preset })
            }}
          >
            {(Object.keys(PRESET_LABELS) as RangePreset[]).map((p) => (
              <option key={p} value={p}>
                {PRESET_LABELS[p]}
              </option>
            ))}
          </Select>
        </div>
        {filters.preset === 'custom' && (
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              aria-label="From date"
              min={minDate}
              max={maxDate}
              value={filters.from}
              onChange={(e) => e.target.value && onChange({ from: e.target.value })}
              className="h-8 rounded-lg border border-line bg-raised px-2 text-[13px] text-fg outline-none focus:border-brand/70"
            />
            <span className="text-xs text-fg-3">to</span>
            <input
              type="date"
              aria-label="To date"
              min={minDate}
              max={maxDate}
              value={filters.to}
              onChange={(e) => e.target.value && onChange({ to: e.target.value })}
              className="h-8 rounded-lg border border-line bg-raised px-2 text-[13px] text-fg outline-none focus:border-brand/70"
            />
          </div>
        )}

        <span className="mx-1 hidden h-5 w-px bg-line md:block" aria-hidden />

        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Regions">
          <button
            type="button"
            aria-pressed={allRegions}
            onClick={() => onChange({ regions: [...REGIONS] })}
            className={cn('h-7 rounded-full px-2.5 text-xs font-medium ring-1 transition-colors', allRegions ? 'bg-ink/[0.1] text-fg ring-ink/15' : 'text-fg-3 ring-line hover:text-fg-2')}
          >
            All regions
          </button>
          {REGIONS.map((r, i) => {
            const on = filters.regions.includes(r)
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                onClick={() => toggleRegion(r)}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 transition-colors',
                  on ? 'bg-ink/[0.06] text-fg ring-ink/15' : 'text-fg-4 ring-line hover:text-fg-3',
                )}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: on ? SERIES[i] : 'transparent', boxShadow: on ? undefined : `inset 0 0 0 1px ${SERIES[i]}` }} aria-hidden />
                {r}
                {on && !allRegions && <Check className="size-3" aria-hidden />}
              </button>
            )
          })}
        </div>

        <Select
          controlSize="sm"
          aria-label="Product category"
          value={filters.category}
          wrapperClassName="w-44"
          onChange={(e) => onChange({ category: e.target.value as Category | 'all' })}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Switch size="sm" label="Compare to previous period" checked={filters.compare} onChange={(compare) => onChange({ compare })} className="text-xs" />

        <span className="ml-auto text-xs text-fg-3 tabular-nums">{range.label}</span>
      </div>
    </div>
  )
}
