/**
 * Historical datasets for the forecasting demo. All series are synthetic
 * sample data (deterministic seed) with realistic trend, seasonality and noise,
 * plus a few injected one-off events for anomaly detection to find.
 */
import { addDays, addMonths, startOfMonth, startOfWeek } from '@/utils/dates'
import { formatDateShort, formatMonth } from '@/utils/format'
import { createRng, gaussian } from '@/utils/random'

export type Frequency = 'month' | 'week' | 'day'

export interface DataPoint {
  date: string
  label: string
  value: number
}

export interface ForecastDataset {
  id: 'retail' | 'demand' | 'mrr' | 'orders'
  name: string
  description: string
  unit: 'INR' | 'units' | 'orders'
  frequency: Frequency
  /** Seasonal period in observations. */
  period: number
  /** Number of Fourier harmonics used by the regression model. */
  harmonics: number
  horizons: number[]
  defaultHorizon: number
  points: DataPoint[]
  /** Labels of the injected events (ground truth, shown after detection). */
  events: { index: number; note: string }[]
}

function monthly(count: number): Date[] {
  const last = addMonths(startOfMonth(), -1)
  return Array.from({ length: count }, (_, i) => addMonths(last, i - count + 1))
}

function weekly(count: number): Date[] {
  const last = addDays(startOfWeek(new Date()), -7)
  return Array.from({ length: count }, (_, i) => addDays(last, (i - count + 1) * 7))
}

function daily(count: number): Date[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => addDays(today, i - count))
}

let cache: ForecastDataset[] | null = null

export function getForecastDatasets(): ForecastDataset[] {
  if (cache) return cache

  // 1) Monthly retail revenue — festive seasonality, steady growth.
  const rRng = createRng(901)
  const rDates = monthly(36)
  const SEASON = [0.95, 0.88, 0.94, 0.96, 0.98, 0.95, 0.97, 1.0, 1.06, 1.32, 1.28, 1.1]
  const retailEvents = [
    { index: 14, factor: 0.76, note: 'Supply disruption — key SKUs out of stock' },
    { index: 29, factor: 1.22, note: 'Viral social campaign' },
  ]
  const retail = rDates.map((d, i) => {
    const trend = 3.2e7 * Math.pow(1.18, i / 12)
    const ev = retailEvents.find((e) => e.index === i)
    const v = trend * SEASON[d.getMonth()] * (1 + gaussian(rRng) * 0.028) * (ev?.factor ?? 1)
    return { date: d.toISOString(), label: formatMonth(d), value: Math.round(v) }
  })

  // 2) Weekly unit demand for wireless earbuds — smooth annual cycle with a festive peak.
  const dRng = createRng(902)
  const dDates = weekly(104)
  const demandEvents = [
    { index: 37, factor: 0.45, note: 'Stock-out week (supplier delay)' },
    { index: 81, factor: 1.42, note: 'Viral product review' },
  ]
  const demand = dDates.map((d, i) => {
    const start = new Date(d.getFullYear(), 0, 1)
    const woy = Math.floor((d.getTime() - start.getTime()) / (7 * 864e5))
    const festive = 0.42 * Math.exp(-((woy - 43) ** 2) / (2 * 3.2 ** 2))
    const midyear = 0.1 * Math.exp(-((woy - 28) ** 2) / (2 * 2.5 ** 2))
    const annual = 0.05 * Math.cos((2 * Math.PI * (woy - 2)) / 52)
    const trend = 1450 * (1 + 0.22 * (i / 52))
    const ev = demandEvents.find((e) => e.index === i)
    const v = trend * (1 + festive + midyear + annual) * (1 + gaussian(dRng) * 0.045) * (ev?.factor ?? 1)
    return { date: d.toISOString(), label: formatDateShort(d), value: Math.round(v) }
  })

  // 3) Subscription MRR — S-curve growth with fiscal-year-end bump.
  const mRng = createRng(903)
  const mDates = monthly(30)
  const mrrEvents = [{ index: 19, factor: 0.88, note: 'Payment-gateway migration failed renewals' }]
  const mrr = mDates.map((d, i) => {
    const logistic = 2.8e6 + 9.6e6 / (1 + Math.exp(-(i - 16) / 5.5))
    const season = d.getMonth() === 2 ? 1.04 : d.getMonth() === 11 ? 0.97 : 1
    const ev = mrrEvents.find((e) => e.index === i)
    const v = logistic * season * (1 + gaussian(mRng) * 0.012) * (ev?.factor ?? 1)
    return { date: d.toISOString(), label: formatMonth(d), value: Math.round(v) }
  })

  // 4) Daily web orders — weekly rhythm and gentle growth.
  const oRng = createRng(904)
  const oDates = daily(182)
  const WEEKDAY = [1.16, 0.95, 0.97, 0.98, 1.0, 1.04, 1.2] // Sun..Sat
  const orderEvents = [
    { index: 61, factor: 0.4, note: 'Checkout outage (4 hours)' },
    { index: 133, factor: 1.55, note: 'Flash sale' },
  ]
  const orders = oDates.map((d, i) => {
    const trend = 640 * (1 + 0.12 * (i / 182))
    const ev = orderEvents.find((e) => e.index === i)
    const v = trend * WEEKDAY[d.getDay()] * (1 + gaussian(oRng) * 0.04) * (ev?.factor ?? 1)
    return { date: d.toISOString(), label: formatDateShort(d), value: Math.round(v) }
  })

  cache = [
    {
      id: 'retail',
      name: 'Monthly revenue — multi-store retail',
      description: '36 months of revenue for a retail chain with a strong festive season (October–November).',
      unit: 'INR',
      frequency: 'month',
      period: 12,
      harmonics: 5,
      horizons: [3, 6, 12],
      defaultHorizon: 6,
      points: retail,
      events: retailEvents,
    },
    {
      id: 'demand',
      name: 'Weekly unit demand — wireless earbuds',
      description: '104 weeks of unit sales for one SKU, used for replenishment planning.',
      unit: 'units',
      frequency: 'week',
      period: 52,
      harmonics: 12,
      horizons: [4, 12, 26],
      defaultHorizon: 12,
      points: demand,
      events: demandEvents,
    },
    {
      id: 'mrr',
      name: 'Subscription MRR — B2B SaaS',
      description: '30 months of monthly recurring revenue for a growing subscription business.',
      unit: 'INR',
      frequency: 'month',
      period: 12,
      harmonics: 2,
      horizons: [3, 6, 12],
      defaultHorizon: 6,
      points: mrr,
      events: mrrEvents,
    },
    {
      id: 'orders',
      name: 'Daily orders — e-commerce website',
      description: '26 weeks of daily orders with a clear weekly rhythm.',
      unit: 'orders',
      frequency: 'day',
      period: 7,
      harmonics: 3,
      horizons: [7, 14, 30],
      defaultHorizon: 14,
      points: orders,
      events: orderEvents,
    },
  ]
  return cache
}

/** Calendar date of the i-th future step after the last observation. */
export function futureDate(ds: ForecastDataset, step: number): Date {
  const last = new Date(ds.points[ds.points.length - 1].date)
  if (ds.frequency === 'month') return addMonths(last, step)
  if (ds.frequency === 'week') return addDays(last, step * 7)
  return addDays(last, step)
}

export function futureLabel(ds: ForecastDataset, step: number): string {
  const d = futureDate(ds, step)
  return ds.frequency === 'month' ? formatMonth(d) : formatDateShort(d)
}
