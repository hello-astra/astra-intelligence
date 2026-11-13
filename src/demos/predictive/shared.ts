import type { ForecastDataset } from '@/data/mock/predictive'
import { formatCompact, formatINRCompact, formatINRTick, formatTick } from '@/utils/format'
import type { ForecastConfig, ForecastResult } from './models'

export type PredictiveView = 'forecast' | 'scenarios' | 'anomalies' | 'models' | 'data'

export interface PredictiveCtx {
  config: ForecastConfig
  setConfig: (patch: Partial<ForecastConfig>) => void
  result: ForecastResult
  datasets: ForecastDataset[]
  generate: (override?: Partial<ForecastConfig>) => void
  running: boolean
  stage: string | null
  stale: boolean
  format: (v: number) => string
}

export function valueFormatter(ds: ForecastDataset): (v: number) => string {
  if (ds.unit === 'INR') return (v) => formatINRCompact(v)
  if (ds.unit === 'units') return (v) => `${formatCompact(Math.round(v))} units`
  return (v) => `${formatCompact(Math.round(v))} orders`
}

export function tickFormatter(ds: ForecastDataset): (v: number) => string {
  return ds.unit === 'INR' ? formatINRTick : formatTick
}

export const signedPct = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}%`
