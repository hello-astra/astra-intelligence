/**
 * Forecasting toolkit used by the predictive analytics demo.
 *
 * Everything here is real (if compact) statistics computed in the browser:
 * - Holt-Winters additive smoothing, parameters chosen by grid search on
 *   one-step-ahead squared error.
 * - Regression with a linear trend and Fourier seasonality (ordinary least squares).
 * - Seasonal naïve — the standard benchmark every model should beat.
 * - Hold-out backtesting (MAPE / RMSE / MAE), widening prediction intervals
 *   from residual spread, and robust (median/MAD) anomaly detection.
 */
import { futureDate, futureLabel, type ForecastDataset } from '@/data/mock/predictive'

export type ModelId = 'holt-winters' | 'regression' | 'seasonal-naive'

export const MODEL_LABELS: Record<ModelId, string> = {
  'holt-winters': 'Holt-Winters (exponential smoothing)',
  regression: 'Linear trend + seasonality (regression)',
  'seasonal-naive': 'Seasonal naïve (baseline)',
}

export const MODEL_SHORT: Record<ModelId, string> = {
  'holt-winters': 'Holt-Winters',
  regression: 'Regression',
  'seasonal-naive': 'Seasonal naïve',
}

interface Fit {
  fitted: (number | null)[]
  forecast: (h: number) => number[]
  sigma: number
  params: string
  /** Multiplier on sigma for the h-th step ahead. */
  widen: (h: number) => number
}

const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0)
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function residualSigma(y: number[], fitted: (number | null)[]): number {
  const r = y.map((v, i) => (fitted[i] === null ? null : v - (fitted[i] as number))).filter((v): v is number => v !== null)
  if (r.length < 2) return 0
  const mu = mean(r)
  return Math.sqrt(r.reduce((s, v) => s + (v - mu) ** 2, 0) / (r.length - 1))
}

/* ------------------------------------------------------------ Holt-Winters */

function hwRun(y: number[], m: number, a: number, b: number, g: number) {
  const n = y.length
  const seasons = Math.max(1, Math.floor(n / m))
  const firstMean = mean(y.slice(0, m))
  let level = firstMean
  let trend = seasons >= 2 ? (mean(y.slice(m, 2 * m)) - firstMean) / m : (y[Math.min(n - 1, m - 1)] - y[0]) / Math.max(1, Math.min(n - 1, m - 1))
  const season = Array.from({ length: m }, (_, i) => {
    const vals: number[] = []
    for (let j = 0; j < seasons; j++) {
      const block = y.slice(j * m, (j + 1) * m)
      if (block.length === m && j * m + i < n) vals.push(y[j * m + i] - mean(block))
    }
    return vals.length ? mean(vals) : 0
  })
  const fitted: number[] = []
  for (let t = 0; t < n; t++) {
    const s = season[t % m]
    fitted.push(level + trend + s)
    const prev = level
    level = a * (y[t] - s) + (1 - a) * (level + trend)
    trend = b * (level - prev) + (1 - b) * trend
    season[t % m] = g * (y[t] - level) + (1 - g) * s
  }
  return { fitted, level, trend, season, n }
}

function holtWinters(y: number[], m: number): Fit {
  let best: { sse: number; a: number; b: number; g: number } | null = null
  for (const a of [0.1, 0.25, 0.4, 0.6, 0.8])
    for (const b of [0.01, 0.05, 0.1, 0.2])
      for (const g of [0.05, 0.15, 0.3, 0.5]) {
        const run = hwRun(y, m, a, b, g)
        let sse = 0
        for (let t = m; t < y.length; t++) sse += (y[t] - run.fitted[t]) ** 2
        if (!best || sse < best.sse) best = { sse, a, b, g }
      }
  const { a, b, g } = best ?? { a: 0.4, b: 0.05, g: 0.15 }
  const run = hwRun(y, m, a, b, g)
  const fitted = run.fitted.map((v, t) => (t < m ? null : v))
  return {
    fitted,
    sigma: residualSigma(y, fitted),
    params: `α=${a}, β=${b}, γ=${g}`,
    widen: (h) => Math.sqrt(h),
    forecast: (h) => Array.from({ length: h }, (_, k) => run.level + (k + 1) * run.trend + run.season[(run.n + k) % m]),
  }
}

/* -------------------------------------------------------------- Regression */

function designRow(t: number, n: number, m: number, K: number, degree: number): number[] {
  const x = (t - n / 2) / n
  const row = [1]
  for (let d = 1; d <= degree; d++) row.push(x ** d)
  for (let k = 1; k <= K; k++) row.push(Math.sin((2 * Math.PI * k * t) / m), Math.cos((2 * Math.PI * k * t) / m))
  return row
}

/** Weighted least squares via normal equations with a tiny ridge term for stability. */
function ols(X: number[][], y: number[], w?: number[]): number[] {
  const p = X[0].length
  const A = Array.from({ length: p }, () => new Array<number>(p).fill(0))
  const c = new Array<number>(p).fill(0)
  X.forEach((row, i) => {
    const wi = w ? w[i] : 1
    if (wi === 0) return
    for (let r = 0; r < p; r++) {
      c[r] += wi * row[r] * y[i]
      for (let s = 0; s < p; s++) A[r][s] += wi * row[r] * row[s]
    }
  })
  for (let r = 0; r < p; r++) A[r][r] += 1e-9
  // Gaussian elimination with partial pivoting.
  for (let col = 0; col < p; col++) {
    let pivot = col
    for (let r = col + 1; r < p; r++) if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r
    ;[A[col], A[pivot]] = [A[pivot], A[col]]
    ;[c[col], c[pivot]] = [c[pivot], c[col]]
    const d = A[col][col] || 1e-12
    for (let r = col + 1; r < p; r++) {
      const f = A[r][col] / d
      for (let s = col; s < p; s++) A[r][s] -= f * A[col][s]
      c[r] -= f * c[col]
    }
  }
  const beta = new Array<number>(p).fill(0)
  for (let r = p - 1; r >= 0; r--) {
    let s = c[r]
    for (let k = r + 1; k < p; k++) s -= A[r][k] * beta[k]
    beta[r] = s / (A[r][r] || 1e-12)
  }
  return beta
}

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0)

function regression(y: number[], m: number, K: number, degree = 1, weights?: number[]) {
  const n = y.length
  const X = y.map((_, t) => designRow(t, n, m, K, degree))
  const beta = ols(X, y, weights)
  const fitted = X.map((row) => dot(row, beta))
  return { beta, fitted, n, predict: (t: number) => dot(designRow(t, n, m, K, degree), beta) }
}

function regressionFit(y: number[], m: number, K: number): Fit {
  const r = regression(y, m, K)
  return {
    fitted: r.fitted,
    sigma: residualSigma(y, r.fitted),
    params: `linear trend + ${K} seasonal harmonic${K === 1 ? '' : 's'}`,
    widen: (h) => Math.sqrt(1 + h / y.length),
    forecast: (h) => Array.from({ length: h }, (_, k) => r.predict(r.n + k)),
  }
}

/* ---------------------------------------------------------- Seasonal naïve */

function seasonalNaive(y: number[], m: number): Fit {
  const n = y.length
  const fitted = y.map((_, t) => (t >= m ? y[t - m] : null))
  return {
    fitted,
    sigma: residualSigma(y, fitted),
    params: `repeats the last ${m}-period season`,
    widen: (h) => Math.sqrt(Math.floor((h - 1) / m) + 1),
    forecast: (h) => Array.from({ length: h }, (_, k) => y[n - m + (k % m)]),
  }
}

function fit(model: ModelId, y: number[], ds: ForecastDataset): Fit {
  if (model === 'holt-winters' && y.length >= ds.period + 3) return holtWinters(y, ds.period)
  if (model === 'seasonal-naive' && y.length > ds.period) return seasonalNaive(y, ds.period)
  return regressionFit(y, ds.period, ds.harmonics)
}

/* ------------------------------------------------------------- Backtesting */

export interface Metrics {
  model: ModelId
  mape: number
  rmse: number
  mae: number
  holdout: number
  predicted: number[]
}

export function holdoutSize(ds: ForecastDataset): number {
  return ds.frequency === 'month' ? 6 : ds.frequency === 'week' ? 12 : 14
}

export function backtest(model: ModelId, ds: ForecastDataset): Metrics {
  const y = ds.points.map((p) => p.value)
  const h = holdoutSize(ds)
  const train = y.slice(0, y.length - h)
  const actual = y.slice(y.length - h)
  const predicted = fit(model, train, ds).forecast(h).map((v) => Math.max(0, v))
  const errors = actual.map((a, i) => a - predicted[i])
  return {
    model,
    holdout: h,
    predicted,
    mape: mean(errors.map((e, i) => Math.abs(e) / Math.max(1, Math.abs(actual[i])))) * 100,
    rmse: Math.sqrt(mean(errors.map((e) => e * e))),
    mae: mean(errors.map((e) => Math.abs(e))),
  }
}

/* -------------------------------------------------------- Anomaly detection */

export interface Anomaly {
  index: number
  label: string
  actual: number
  expected: number
  deviationPct: number
  z: number
}

/**
 * Robust detection against a smooth baseline (cubic trend + Fourier seasonality).
 * Pass 1 flags points by median/MAD z-score; pass 2 refits without them so the
 * baseline is not pulled towards the outliers.
 */
export function detectAnomalies(ds: ForecastDataset, threshold: number): { anomalies: Anomaly[]; expected: number[] } {
  const y = ds.points.map((p) => p.value)
  const K = ds.harmonics
  const score = (fitted: number[], mask?: boolean[]) => {
    const r = y.map((v, i) => v - fitted[i])
    const base = mask ? r.filter((_, i) => !mask[i]) : r
    const med = median(base)
    const mad = median(base.map((v) => Math.abs(v - med))) * 1.4826 || 1
    return r.map((v) => (v - med) / mad)
  }
  const first = regression(y, ds.period, K, 3)
  const z1 = score(first.fitted)
  const flagged = z1.map((z) => Math.abs(z) >= threshold)
  const second = regression(y, ds.period, K, 3, flagged.map((f) => (f ? 0 : 1)))
  const z2 = score(second.fitted, flagged)
  const anomalies: Anomaly[] = []
  z2.forEach((z, i) => {
    if (Math.abs(z) >= threshold) {
      const expected = second.fitted[i]
      anomalies.push({ index: i, label: ds.points[i].label, actual: y[i], expected, deviationPct: ((y[i] - expected) / expected) * 100, z })
    }
  })
  return { anomalies, expected: second.fitted }
}

/* ---------------------------------------------------------------- Scenario */

export interface Scenario {
  /** % change in marketing spend (−50 … +100). */
  marketing: number
  /** % change in price (−20 … +20). */
  price: number
  /** Additional annual market growth assumption in % (−10 … +20). */
  growth: number
  /** Extra campaign during peak periods. */
  promotion: boolean
}

export const NEUTRAL_SCENARIO: Scenario = { marketing: 0, price: 0, growth: 0, promotion: false }

export const ASSUMPTIONS = {
  marketingElasticity: 0.12,
  priceElasticity: { retail: -1.4, demand: -1.6, mrr: -0.5, orders: -1.2 },
  promotionUplift: 0.08,
}

function stepsPerYear(ds: ForecastDataset): number {
  return ds.frequency === 'month' ? 12 : ds.frequency === 'week' ? 52 : 365
}

function isPeak(ds: ForecastDataset, date: Date): boolean {
  if (ds.id === 'retail') return date.getMonth() === 9 || date.getMonth() === 10
  if (ds.id === 'mrr') return date.getMonth() === 2
  if (ds.id === 'orders') return date.getDay() === 0 || date.getDay() === 6
  const start = new Date(date.getFullYear(), 0, 1)
  const woy = Math.floor((date.getTime() - start.getTime()) / (7 * 864e5))
  return woy >= 39 && woy <= 46
}

export function scenarioMultiplier(ds: ForecastDataset, s: Scenario, step: number): number {
  const marketing = ASSUMPTIONS.marketingElasticity * (s.marketing / 100)
  const p = s.price / 100
  const volume = 1 + ASSUMPTIONS.priceElasticity[ds.id] * p
  const priceEffect = ds.unit === 'INR' ? (1 + p) * volume - 1 : volume - 1
  const growth = Math.pow(1 + s.growth / 100, step / stepsPerYear(ds)) - 1
  const promo = s.promotion && isPeak(ds, futureDate(ds, step)) ? ASSUMPTIONS.promotionUplift : 0
  return Math.max(0, (1 + marketing) * (1 + priceEffect) * (1 + growth) * (1 + promo))
}

export function isNeutral(s: Scenario): boolean {
  return s.marketing === 0 && s.price === 0 && s.growth === 0 && !s.promotion
}

/* -------------------------------------------------------------- Run forecast */

export interface ForecastConfig {
  datasetId: ForecastDataset['id']
  horizon: number
  model: ModelId | 'auto'
  confidence: 80 | 95
  scenario: Scenario
  sensitivity: number
}

export interface ForecastRow {
  label: string
  actual: number | null
  fitted: number | null
  forecast: number | null
  scenario: number | null
  band: [number, number] | null
  anomaly: number | null
}

export interface Insight {
  title: string
  text: string
  tone: 'info' | 'positive' | 'warning'
}

export interface ForecastResult {
  dataset: ForecastDataset
  model: ModelId
  params: string
  horizon: number
  confidence: number
  rows: ForecastRow[]
  forecast: number[]
  lower: number[]
  upper: number[]
  scenarioForecast: number[]
  metrics: Metrics[]
  anomalies: Anomaly[]
  expected: number[]
  trendPctPerYear: number
  peak: { label: string; liftPct: number }
  trough: { label: string; dropPct: number }
  totalForecast: number
  totalScenario: number
  sameLastYear: number | null
  insights: Insight[]
  recommendations: string[]
  generatedAt: string
}

const Z = { 80: 1.2816, 95: 1.96 }

function seasonLabel(ds: ForecastDataset, index: number): string {
  const d = new Date(ds.points[index].date)
  if (ds.frequency === 'month') return d.toLocaleString('en-IN', { month: 'long' })
  if (ds.frequency === 'day') return d.toLocaleString('en-IN', { weekday: 'long' })
  return `week of ${ds.points[index].label}`
}

export function runForecast(ds: ForecastDataset, config: ForecastConfig, format: (v: number) => string): ForecastResult {
  const y = ds.points.map((p) => p.value)
  const n = y.length
  const metrics = (['holt-winters', 'regression', 'seasonal-naive'] as ModelId[]).map((m) => backtest(m, ds)).sort((a, b) => a.mape - b.mape)
  const model: ModelId = config.model === 'auto' ? metrics[0].model : config.model
  const f = fit(model, y, ds)
  const h = config.horizon
  const z = Z[config.confidence]
  const forecast = f.forecast(h).map((v) => Math.max(0, v))
  const lower = forecast.map((v, i) => Math.max(0, v - z * f.sigma * f.widen(i + 1)))
  const upper = forecast.map((v, i) => v + z * f.sigma * f.widen(i + 1))
  const scenarioForecast = forecast.map((v, i) => v * scenarioMultiplier(ds, config.scenario, i + 1))
  const { anomalies, expected } = detectAnomalies(ds, config.sensitivity)
  const anomalyIdx = new Set(anomalies.map((a) => a.index))
  const showScenario = !isNeutral(config.scenario)

  const rows: ForecastRow[] = [
    ...ds.points.map((p, i) => ({
      label: p.label,
      actual: p.value,
      fitted: f.fitted[i] === null ? null : Math.round(f.fitted[i] as number),
      forecast: i === n - 1 ? p.value : null,
      scenario: i === n - 1 && showScenario ? p.value : null,
      band: null,
      anomaly: anomalyIdx.has(i) ? p.value : null,
    })),
    ...forecast.map((v, i) => ({
      label: futureLabel(ds, i + 1),
      actual: null,
      fitted: null,
      forecast: Math.round(v),
      scenario: showScenario ? Math.round(scenarioForecast[i]) : null,
      band: [Math.round(lower[i]), Math.round(upper[i])] as [number, number],
      anomaly: null,
    })),
  ]

  // Trend and seasonality from the regression decomposition.
  const reg = regression(y, ds.period, ds.harmonics)
  const slope = (reg.predict(n) - reg.predict(0)) / n
  const level = mean(y)
  const trendPctPerYear = ((slope * stepsPerYear(ds)) / level) * 100
  const lastSeason = Array.from({ length: Math.min(ds.period, n) }, (_, k) => n - Math.min(ds.period, n) + k)
  const seasonal = lastSeason.map((t) => ({ t, s: reg.fitted[t] - (reg.predict(0) + slope * t) }))
  const peakS = seasonal.reduce((a, b) => (b.s > a.s ? b : a))
  const troughS = seasonal.reduce((a, b) => (b.s < a.s ? b : a))
  const recentLevel = mean(y.slice(-ds.period))
  const peak = { label: seasonLabel(ds, peakS.t), liftPct: (peakS.s / recentLevel) * 100 }
  const trough = { label: seasonLabel(ds, troughS.t), dropPct: (troughS.s / recentLevel) * 100 }

  const totalForecast = forecast.reduce((s, v) => s + v, 0)
  const totalScenario = scenarioForecast.reduce((s, v) => s + v, 0)
  const lastYearIdx = forecast.map((_, i) => n + i - ds.period).filter((i) => i >= 0 && i < n)
  const sameLastYear = lastYearIdx.length === h ? lastYearIdx.reduce((s, i) => s + y[i], 0) : null

  const best = metrics[0]
  const chosen = metrics.find((m) => m.model === model) ?? best
  const insights: Insight[] = [
    {
      title: 'Trend',
      tone: trendPctPerYear >= 0 ? 'positive' : 'warning',
      text: `The underlying trend is ${trendPctPerYear >= 0 ? 'growing' : 'declining'} at about ${Math.abs(trendPctPerYear).toFixed(1)}% per year (linear trend fit).`,
    },
    {
      title: 'Seasonality',
      tone: 'info',
      text: `Strongest period: ${peak.label} (≈${peak.liftPct.toFixed(0)}% above the recent average). Weakest: ${trough.label} (≈${Math.abs(trough.dropPct).toFixed(0)}% below).`,
    },
    {
      title: 'Forecast',
      tone: 'info',
      text: `Next ${h} ${ds.frequency}${h === 1 ? '' : 's'}: ${format(totalForecast)} in total${sameLastYear ? `, ${totalForecast >= sameLastYear ? '+' : ''}${(((totalForecast - sameLastYear) / sameLastYear) * 100).toFixed(1)}% vs the same period last year` : ''}. ${config.confidence}% interval for the final step: ${format(lower[h - 1])} – ${format(upper[h - 1])}.`,
    },
    {
      title: 'Model',
      tone: 'info',
      text: `${MODEL_SHORT[model]} (${f.params}) — backtest MAPE ${chosen.mape.toFixed(1)}% on the last ${chosen.holdout} ${ds.frequency}s.${model !== best.model ? ` ${MODEL_SHORT[best.model]} scored better (${best.mape.toFixed(1)}%).` : ' Best of the three models tested.'}`,
    },
    {
      title: 'Anomalies',
      tone: anomalies.length ? 'warning' : 'positive',
      text: anomalies.length
        ? `${anomalies.length} unusual point${anomalies.length === 1 ? '' : 's'}: ${anomalies.map((a) => `${a.label} (${a.deviationPct >= 0 ? '+' : ''}${a.deviationPct.toFixed(0)}% vs expected)`).join(', ')}.`
        : 'No observations deviate strongly from the expected pattern at this sensitivity.',
    },
  ]

  const recommendations: string[] = []
  const peakStep = forecast.indexOf(Math.max(...forecast))
  const avgForecast = totalForecast / h
  if (forecast[peakStep] > avgForecast * 1.15 && peakStep >= 0)
    recommendations.push(`Prepare inventory and staffing ahead of ${futureLabel(ds, peakStep + 1)} — forecast is ${(((forecast[peakStep] - avgForecast) / avgForecast) * 100).toFixed(0)}% above the horizon average.`)
  if (trendPctPerYear < 0) recommendations.push('Investigate the declining trend: review pricing, channel mix and churn drivers before committing spend.')
  else if (trendPctPerYear > 10) recommendations.push(`Plan capacity for ~${trendPctPerYear.toFixed(0)}% annual growth; revisit supplier and hiring plans quarterly.`)
  const neg = anomalies.filter((a) => a.deviationPct < 0)
  if (neg.length) recommendations.push(`Set alerts for drops of more than ${Math.min(...neg.map((a) => Math.abs(a.deviationPct))).toFixed(0)}% versus expected — recent example: ${neg[neg.length - 1].label}.`)
  const width = (upper[h - 1] - lower[h - 1]) / Math.max(1, forecast[h - 1])
  if (width > 0.25) recommendations.push(`Uncertainty widens with the horizon (±${((width / 2) * 100).toFixed(0)}% at the end) — commit spend against the lower bound and re-forecast monthly.`)
  if (showScenario)
    recommendations.push(`Your scenario changes the outlook by ${totalScenario >= totalForecast ? '+' : ''}${(((totalScenario - totalForecast) / totalForecast) * 100).toFixed(1)}% (${format(totalScenario - totalForecast)}) — based on stated assumptions, not on the model.`)
  if (recommendations.length < 2) recommendations.push('Keep the model monitored: compare actuals with the forecast each period and retrain when error drifts above the backtest MAPE.')

  return {
    dataset: ds,
    model,
    params: f.params,
    horizon: h,
    confidence: config.confidence,
    rows,
    forecast,
    lower,
    upper,
    scenarioForecast,
    metrics,
    anomalies,
    expected,
    trendPctPerYear,
    peak,
    trough,
    totalForecast,
    totalScenario,
    sameLastYear,
    insights,
    recommendations,
    generatedAt: new Date().toISOString(),
  }
}
