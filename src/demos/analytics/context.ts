import type { Category, Dataset, Series } from '@/data/mock/analytics'
import type { Bucket, Filters, Granularity, Range, Totals } from './engine'

export type AnalyticsView = 'overview' | 'sales' | 'customers' | 'pnl' | 'geography' | 'reports'

export interface AnalyticsCtx {
  ds: Dataset
  filters: Filters
  setFilters: (patch: Partial<Filters>) => void
  range: Range
  list: Series[]
  current: Totals
  previous: Totals | null
  gran: Exclude<Granularity, 'auto'>
  buckets: Bucket[]
  prevBuckets: Bucket[]
  openDrilldown: (category: Category) => void
}
