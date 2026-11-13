/**
 * Synthetic retail dataset for the BI dashboard demo.
 *
 * 730 days × 5 regions × 5 categories, generated deterministically from a
 * seed with a growth trend, weekly patterns, festive-season peaks and
 * regional price differences. Values are sample data, not real figures.
 */
import { addDays, startOfDay } from '@/utils/dates'
import { createRng, gaussian } from '@/utils/random'

export const REGIONS = ['North', 'South', 'East', 'West', 'Central'] as const
export const CATEGORIES = ['Electronics', 'Apparel', 'Home & Kitchen', 'Beauty', 'Sports & Fitness'] as const
export type Region = (typeof REGIONS)[number]
export type Category = (typeof CATEGORIES)[number]

export const DATASET_DAYS = 730

export interface Series {
  orders: Float64Array
  revenue: Float64Array
  cogs: Float64Array
  newCustomers: Float64Array
}

export interface Dataset {
  /** Local midnight of day index 0. */
  start: Date
  days: number
  series: Record<string, Series>
}

const REGION_WEIGHT: Record<Region, number> = { North: 1.18, South: 1.26, East: 0.72, West: 1.12, Central: 0.62 }
const REGION_PRICE: Record<Region, number> = { North: 1.0, South: 1.05, East: 0.93, West: 1.07, Central: 0.95 }
const CATEGORY_WEIGHT: Record<Category, number> = { Electronics: 0.85, Apparel: 1.35, 'Home & Kitchen': 0.95, Beauty: 1.1, 'Sports & Fitness': 0.6 }
const CATEGORY_AOV: Record<Category, number> = { Electronics: 6400, Apparel: 1750, 'Home & Kitchen': 2350, Beauty: 920, 'Sports & Fitness': 2150 }
const CATEGORY_MARGIN: Record<Category, number> = { Electronics: 0.21, Apparel: 0.52, 'Home & Kitchen': 0.39, Beauty: 0.58, 'Sports & Fitness': 0.43 }

// Month-of-year demand multipliers (Jan … Dec) per category.
const SEASON: Record<Category, number[]> = {
  Electronics: [1.0, 0.92, 0.95, 0.96, 1.0, 0.98, 1.02, 1.05, 1.12, 1.58, 1.46, 1.18],
  Apparel: [1.15, 0.95, 1.0, 1.02, 0.98, 0.94, 1.12, 0.98, 1.06, 1.52, 1.4, 1.2],
  'Home & Kitchen': [0.98, 0.95, 1.0, 0.99, 1.01, 0.97, 0.98, 1.02, 1.1, 1.5, 1.38, 1.08],
  Beauty: [1.02, 1.08, 1.0, 0.98, 1.0, 0.97, 0.99, 1.0, 1.04, 1.36, 1.32, 1.15],
  'Sports & Fitness': [1.32, 1.12, 1.05, 1.0, 0.96, 0.9, 0.92, 0.95, 1.0, 1.12, 1.05, 1.0],
}

const BASE_DAILY_ORDERS = 26

let cached: { key: string; data: Dataset } | null = null

export function seriesKey(region: Region, category: Category): string {
  return `${region}|${category}`
}

export function getDataset(): Dataset {
  const start = addDays(startOfDay(), -(DATASET_DAYS - 1))
  const key = start.toDateString()
  if (cached && cached.key === key) return cached.data

  const series: Record<string, Series> = {}
  let seed = 7001
  for (const region of REGIONS) {
    for (const category of CATEGORIES) {
      const rng = createRng(seed++)
      const s: Series = {
        orders: new Float64Array(DATASET_DAYS),
        revenue: new Float64Array(DATASET_DAYS),
        cogs: new Float64Array(DATASET_DAYS),
        newCustomers: new Float64Array(DATASET_DAYS),
      }
      for (let d = 0; d < DATASET_DAYS; d++) {
        const date = addDays(start, d)
        const dow = date.getDay()
        const weekend = dow === 0 || dow === 6
        const weekly =
          category === 'Electronics' ? (weekend ? 0.94 : 1.03) : category === 'Sports & Fitness' ? (dow === 0 ? 1.2 : 1) : weekend ? 1.16 : 0.96
        const trend = 1 + 0.27 * (d / DATASET_DAYS)
        const season = SEASON[category][date.getMonth()]
        const noise = 1 + gaussian(rng) * 0.09
        const orders = Math.max(0, Math.round(BASE_DAILY_ORDERS * REGION_WEIGHT[region] * CATEGORY_WEIGHT[category] * weekly * trend * season * noise))
        const aov = CATEGORY_AOV[category] * REGION_PRICE[region] * (1 + gaussian(rng) * 0.05) * (season > 1.3 ? 0.94 : 1)
        const revenue = orders * aov
        const margin = CATEGORY_MARGIN[category] * (season > 1.3 ? 0.9 : 1) * (1 + gaussian(rng) * 0.03)
        const newShare = 0.34 - 0.08 * (d / DATASET_DAYS) + (season > 1.3 ? 0.06 : 0) + gaussian(rng) * 0.02
        s.orders[d] = orders
        s.revenue[d] = Math.round(revenue)
        s.cogs[d] = Math.round(revenue * (1 - margin))
        s.newCustomers[d] = Math.max(0, Math.round(orders * newShare))
      }
      series[seriesKey(region, category)] = s
    }
  }
  const data: Dataset = { start, days: DATASET_DAYS, series }
  cached = { key, data }
  return data
}

/** Fixed monthly overheads (salaries, rent, technology) at company level, INR. */
export const FIXED_MONTHLY_OPEX = 65_00_000
/** Variable operating costs as a share of revenue. */
export const VARIABLE_OPEX = { marketing: 0.075, fulfilment: 0.085 }
