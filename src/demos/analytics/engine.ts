import { CATEGORIES, FIXED_MONTHLY_OPEX, REGIONS, seriesKey, VARIABLE_OPEX, type Category, type Dataset, type Region, type Series } from '@/data/mock/analytics'
import { addDays, daysInMonth, diffInDays, fromISODate, startOfDay, toISODate } from '@/utils/dates'
import { formatDateShort, formatINR, formatINRCompact, formatMonth } from '@/utils/format'

export type RangePreset = '7d' | '30d' | '90d' | 'ytd' | '12m' | 'custom'
export type Granularity = 'auto' | 'day' | 'week' | 'month'
export type KpiKey = 'revenue' | 'orders' | 'aov' | 'grossProfit' | 'margin' | 'newCustomers'
export type ChartType = 'area' | 'line' | 'bar'

export interface Filters {
  preset: RangePreset
  from: string
  to: string
  regions: Region[]
  category: Category | 'all'
  granularity: Granularity
  compare: boolean
  kpi: KpiKey
  chartType: ChartType
}

export const DEFAULT_FILTERS: Filters = {
  preset: '90d',
  from: '',
  to: '',
  regions: [...REGIONS],
  category: 'all',
  granularity: 'auto',
  compare: true,
  kpi: 'revenue',
  chartType: 'area',
}

export const PRESET_LABELS: Record<RangePreset, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  ytd: 'Year to date',
  '12m': 'Last 12 months',
  custom: 'Custom range',
}

export const KPIS: Record<KpiKey, { label: string; format: (v: number) => string; goodWhen: 'up' | 'down' }> = {
  revenue: { label: 'Revenue', format: (v) => formatINRCompact(v), goodWhen: 'up' },
  orders: { label: 'Orders', format: (v) => Math.round(v).toLocaleString('en-IN'), goodWhen: 'up' },
  aov: { label: 'Avg order value', format: (v) => formatINR(v), goodWhen: 'up' },
  grossProfit: { label: 'Gross profit', format: (v) => formatINRCompact(v), goodWhen: 'up' },
  margin: { label: 'Gross margin', format: (v) => `${v.toFixed(1)}%`, goodWhen: 'up' },
  newCustomers: { label: 'New customers', format: (v) => Math.round(v).toLocaleString('en-IN'), goodWhen: 'up' },
}

export interface Range {
  start: number
  end: number
  prevStart: number
  prevEnd: number
  hasPrevious: boolean
  days: number
  label: string
}

export function dateOf(ds: Dataset, index: number): Date {
  return addDays(ds.start, index)
}

export function indexOf(ds: Dataset, date: Date): number {
  return diffInDays(date, ds.start)
}

export function resolveRange(f: Filters, ds: Dataset): Range {
  const last = ds.days - 1
  let start = last - 89
  let end = last
  if (f.preset === '7d') start = last - 6
  else if (f.preset === '30d') start = last - 29
  else if (f.preset === '12m') start = last - 364
  else if (f.preset === 'ytd') start = indexOf(ds, new Date(startOfDay().getFullYear(), 0, 1))
  else if (f.preset === 'custom' && f.from && f.to) {
    start = indexOf(ds, fromISODate(f.from))
    end = indexOf(ds, fromISODate(f.to))
    if (start > end) [start, end] = [end, start]
  }
  start = Math.max(0, Math.min(start, last))
  end = Math.max(start, Math.min(end, last))
  const days = end - start + 1
  const prevEnd = start - 1
  const prevStart = prevEnd - days + 1
  const fmt = (i: number) => formatDateShort(dateOf(ds, i))
  return {
    start,
    end,
    prevStart,
    prevEnd,
    hasPrevious: prevStart >= 0,
    days,
    label: `${fmt(start)} – ${fmt(end)} ${dateOf(ds, end).getFullYear()} · ${days} day${days === 1 ? '' : 's'}`,
  }
}

export interface Totals {
  revenue: number
  orders: number
  cogs: number
  newCustomers: number
  returning: number
  grossProfit: number
  aov: number
  margin: number
}

export function selectSeries(ds: Dataset, regions: readonly Region[], category: Category | 'all'): Series[] {
  const cats = category === 'all' ? CATEGORIES : [category]
  const list: Series[] = []
  for (const r of regions) for (const c of cats) list.push(ds.series[seriesKey(r, c)])
  return list
}

export function sumRange(list: Series[], start: number, end: number): Totals {
  let revenue = 0
  let orders = 0
  let cogs = 0
  let newCustomers = 0
  for (const s of list) {
    for (let i = Math.max(0, start); i <= end; i++) {
      revenue += s.revenue[i]
      orders += s.orders[i]
      cogs += s.cogs[i]
      newCustomers += s.newCustomers[i]
    }
  }
  return finalize(revenue, orders, cogs, newCustomers)
}

function finalize(revenue: number, orders: number, cogs: number, newCustomers: number): Totals {
  const grossProfit = revenue - cogs
  return {
    revenue,
    orders,
    cogs,
    newCustomers,
    returning: Math.max(0, orders - newCustomers),
    grossProfit,
    aov: orders > 0 ? revenue / orders : 0,
    margin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
  }
}

export function kpiValue(t: Totals, k: KpiKey): number {
  return t[k]
}

export function change(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null
  return ((current - previous) / previous) * 100
}

/* ---------------------------------------------------------------- Buckets */

export function effectiveGranularity(g: Granularity, days: number): Exclude<Granularity, 'auto'> {
  if (g !== 'auto') return g
  if (days <= 45) return 'day'
  if (days <= 200) return 'week'
  return 'month'
}

export interface Bucket {
  label: string
  start: number
  end: number
  totals: Totals
  /** True when the bucket covers only part of its week or month. */
  partial: boolean
}

export function bucketize(ds: Dataset, list: Series[], start: number, end: number, gran: Exclude<Granularity, 'auto'>): Bucket[] {
  const out: Bucket[] = []
  if (start < 0 || end < start) return out
  let i = start
  while (i <= end) {
    const d = dateOf(ds, i)
    let j = i
    if (gran === 'week') {
      // Weeks start on Monday; first/last buckets may be partial.
      const offset = (d.getDay() + 6) % 7
      j = Math.min(end, i + (6 - offset))
    } else if (gran === 'month') {
      j = Math.min(end, i + (daysInMonth(d) - d.getDate()))
    }
    const label = gran === 'month' ? formatMonth(d) : formatDateShort(d)
    const length = j - i + 1
    const partial = (gran === 'week' && length < 7) || (gran === 'month' && length < daysInMonth(d))
    out.push({ label, start: i, end: j, totals: sumRange(list, i, j), partial })
    i = j + 1
  }
  return out
}

/* -------------------------------------------------------------- Breakdowns */

export interface BreakdownRow<K extends string> {
  key: K
  current: Totals
  previous: Totals | null
}

export function byCategory(ds: Dataset, regions: readonly Region[], range: Range): BreakdownRow<Category>[] {
  return CATEGORIES.map((c) => {
    const list = selectSeries(ds, regions, c)
    return { key: c, current: sumRange(list, range.start, range.end), previous: range.hasPrevious ? sumRange(list, range.prevStart, range.prevEnd) : null }
  })
}

export function byRegion(ds: Dataset, category: Category | 'all', range: Range): BreakdownRow<Region>[] {
  return REGIONS.map((r) => {
    const list = selectSeries(ds, [r], category)
    return { key: r, current: sumRange(list, range.start, range.end), previous: range.hasPrevious ? sumRange(list, range.prevStart, range.prevEnd) : null }
  })
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function byWeekday(ds: Dataset, list: Series[], range: Range): { day: string; revenue: number; orders: number }[] {
  const sums = WEEKDAYS.map(() => ({ revenue: 0, orders: 0, n: 0 }))
  for (let i = range.start; i <= range.end; i++) {
    const w = (dateOf(ds, i).getDay() + 6) % 7
    sums[w].n += 1
    for (const s of list) {
      sums[w].revenue += s.revenue[i]
      sums[w].orders += s.orders[i]
    }
  }
  return WEEKDAYS.map((day, w) => ({
    day,
    revenue: sums[w].n ? Math.round(sums[w].revenue / sums[w].n) : 0,
    orders: sums[w].n ? Math.round(sums[w].orders / sums[w].n) : 0,
  }))
}

/* --------------------------------------------------------------------- P&L */

export interface PnlRow {
  label: string
  revenue: number
  cogs: number
  grossProfit: number
  marketing: number
  fulfilment: number
  overheads: number
  opex: number
  netProfit: number
  netMargin: number
}

/** Monthly P&L. Overheads are allocated to the filtered slice by its share of company revenue. */
export function monthlyPnl(ds: Dataset, list: Series[], range: Range): PnlRow[] {
  const all = selectSeries(ds, REGIONS, 'all')
  return bucketize(ds, list, range.start, range.end, 'month').map((b) => {
    const company = sumRange(all, b.start, b.end).revenue
    const t = b.totals
    const share = company > 0 ? t.revenue / company : 0
    const fraction = (b.end - b.start + 1) / daysInMonth(dateOf(ds, b.start))
    const marketing = t.revenue * VARIABLE_OPEX.marketing
    const fulfilment = t.revenue * VARIABLE_OPEX.fulfilment
    const overheads = FIXED_MONTHLY_OPEX * fraction * share
    const opex = marketing + fulfilment + overheads
    const netProfit = t.grossProfit - opex
    return {
      label: fraction < 0.99 ? `${b.label} (partial)` : b.label,
      revenue: t.revenue,
      cogs: t.cogs,
      grossProfit: t.grossProfit,
      marketing,
      fulfilment,
      overheads,
      opex,
      netProfit,
      netMargin: t.revenue > 0 ? (netProfit / t.revenue) * 100 : 0,
    }
  })
}

/* ------------------------------------------------------------------ Report */

export type ReportDimension = 'month' | 'week' | 'day' | 'region' | 'category' | 'weekday'
export type ReportMetric = 'revenue' | 'orders' | 'aov' | 'grossProfit' | 'margin' | 'newCustomers' | 'returning'

export const METRIC_LABELS: Record<ReportMetric, string> = {
  revenue: 'Revenue (INR)',
  orders: 'Orders',
  aov: 'Avg order value (INR)',
  grossProfit: 'Gross profit (INR)',
  margin: 'Gross margin (%)',
  newCustomers: 'New customers',
  returning: 'Returning orders',
}

export function buildReport(ds: Dataset, f: Filters, range: Range, dimension: ReportDimension): { label: string; totals: Totals }[] {
  const list = selectSeries(ds, f.regions, f.category)
  if (dimension === 'region') return byRegion(ds, f.category, range).filter((r) => f.regions.includes(r.key)).map((r) => ({ label: r.key, totals: r.current }))
  if (dimension === 'category')
    return byCategory(ds, f.regions, range)
      .filter((r) => f.category === 'all' || r.key === f.category)
      .map((r) => ({ label: r.key, totals: r.current }))
  if (dimension === 'weekday') {
    return WEEKDAYS.map((day, w) => {
      let revenue = 0
      let orders = 0
      let cogs = 0
      let nc = 0
      for (let i = range.start; i <= range.end; i++) {
        if ((dateOf(ds, i).getDay() + 6) % 7 !== w) continue
        for (const s of list) {
          revenue += s.revenue[i]
          orders += s.orders[i]
          cogs += s.cogs[i]
          nc += s.newCustomers[i]
        }
      }
      return { label: day, totals: finalize(revenue, orders, cogs, nc) }
    })
  }
  return bucketize(ds, list, range.start, range.end, dimension).map((b) => ({
    label: dimension === 'day' ? toISODate(dateOf(ds, b.start)) : b.label,
    totals: b.totals,
  }))
}
