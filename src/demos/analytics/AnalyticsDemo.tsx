import { useCallback, useMemo, useState } from 'react'
import { FileSpreadsheet, Globe2, LayoutDashboard, Scale, TrendingUp, Users } from 'lucide-react'
import { SOLUTION_BY_SLUG } from '@/data/constants/solutions'
import { getDataset, type Category } from '@/data/mock/analytics'
import { usePersistentState } from '@/hooks/usePersistentState'
import { DemoShell } from '../shared/DemoShell'
import type { DemoView } from '../shared/demo-context'
import type { AnalyticsCtx, AnalyticsView } from './context'
import { DrilldownModal } from './DrilldownModal'
import { bucketize, DEFAULT_FILTERS, effectiveGranularity, resolveRange, selectSeries, sumRange, type Filters } from './engine'
import { FilterBar } from './FilterBar'
import { CustomersView } from './views/CustomersView'
import { GeographyView } from './views/GeographyView'
import { OverviewView } from './views/OverviewView'
import { PnlView } from './views/PnlView'
import { ReportsView } from './views/ReportsView'
import { SalesView } from './views/SalesView'

const solution = SOLUTION_BY_SLUG['business-dashboards']
const initFilters = (): Filters => ({ ...DEFAULT_FILTERS })

const VIEWS: DemoView<AnalyticsView>[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales performance', icon: TrendingUp },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'pnl', label: 'Profit & loss', icon: Scale },
  { id: 'geography', label: 'Geography', icon: Globe2 },
  { id: 'reports', label: 'Reports & export', icon: FileSpreadsheet },
]

export default function AnalyticsDemo() {
  const [filters, setFiltersState, reset] = usePersistentState('analytics', initFilters, 1)
  const [view, setView] = useState<AnalyticsView>('overview')
  const [drill, setDrill] = useState<Category | null>(null)

  const ds = useMemo(() => getDataset(), [])
  const range = useMemo(() => resolveRange(filters, ds), [filters, ds])
  const list = useMemo(() => selectSeries(ds, filters.regions, filters.category), [ds, filters.regions, filters.category])
  const current = useMemo(() => sumRange(list, range.start, range.end), [list, range])
  const previous = useMemo(() => (range.hasPrevious ? sumRange(list, range.prevStart, range.prevEnd) : null), [list, range])
  const gran = effectiveGranularity(filters.granularity, range.days)
  const buckets = useMemo(() => bucketize(ds, list, range.start, range.end, gran), [ds, list, range, gran])
  const prevBuckets = useMemo(() => (range.hasPrevious ? bucketize(ds, list, range.prevStart, range.prevEnd, gran) : []), [ds, list, range, gran])

  const setFilters = useCallback((patch: Partial<Filters>) => setFiltersState((f) => ({ ...f, ...patch })), [setFiltersState])

  const ctx: AnalyticsCtx = { ds, filters, setFilters, range, list, current, previous, gran, buckets, prevBuckets, openDrilldown: setDrill }

  return (
    <DemoShell
      solution={solution}
      views={VIEWS}
      activeView={view}
      onViewChange={setView}
      onReset={() => {
        reset()
        setView('overview')
      }}
    >
      <FilterBar filters={filters} onChange={setFilters} range={range} ds={ds} />
      {view === 'overview' && <OverviewView {...ctx} />}
      {view === 'sales' && <SalesView {...ctx} />}
      {view === 'customers' && <CustomersView {...ctx} />}
      {view === 'pnl' && <PnlView {...ctx} />}
      {view === 'geography' && <GeographyView {...ctx} />}
      {view === 'reports' && <ReportsView {...ctx} />}
      <DrilldownModal category={drill} ctx={ctx} onClose={() => setDrill(null)} />
      <p className="mt-4 text-[11px] text-fg-4">Synthetic sample dataset generated for demonstration — not real business figures.</p>
    </DemoShell>
  )
}
