import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, Lightbulb, Play, RefreshCw, Sparkles } from 'lucide-react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Form'
import { Panel } from '@/components/ui/Panel'
import { Segmented } from '@/components/ui/Segmented'
import { Spinner } from '@/components/ui/Spinner'
import { Switch } from '@/components/ui/Switch'
import { cn } from '@/utils/cn'
import { ChartFrame, type LegendItem } from '../../shared/Chart'
import { activeDot, axisProps, CHART, DEEMPH, gridProps, lineCursor, SERIES, STATUS, yAxisProps } from '../../shared/chartTheme'
import { StatTile } from '../../shared/StatTile'
import { tooltipRenderer } from '../../shared/tooltip'
import { isNeutral, MODEL_LABELS, MODEL_SHORT, type ForecastConfig, type ModelId } from '../models'
import { tickFormatter, type PredictiveCtx } from '../shared'

export function ConfigBar({ config, setConfig, datasets, generate, running, stage, stale }: PredictiveCtx) {
  const ds = datasets.find((d) => d.id === config.datasetId) ?? datasets[0]
  return (
    <div className="mb-4 rounded-xl border border-line bg-panel p-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-[11px] font-medium text-fg-3">
          Dataset
          <Select controlSize="sm" value={config.datasetId} onChange={(e) => setConfig({ datasetId: e.target.value as ForecastConfig['datasetId'] })}>
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-fg-3">Horizon</span>
          <Segmented
            size="sm"
            ariaLabel="Forecast horizon"
            value={String(config.horizon)}
            onChange={(v) => setConfig({ horizon: Number(v) })}
            options={ds.horizons.map((h) => ({ value: String(h), label: `${h} ${ds.frequency === 'month' ? 'mo' : ds.frequency === 'week' ? 'wk' : 'd'}` }))}
          />
        </div>
        <label className="flex min-w-[190px] flex-col gap-1 text-[11px] font-medium text-fg-3">
          Model
          <Select controlSize="sm" value={config.model} onChange={(e) => setConfig({ model: e.target.value as ModelId | 'auto' })}>
            <option value="auto">Auto — best backtest</option>
            {(Object.keys(MODEL_LABELS) as ModelId[]).map((m) => (
              <option key={m} value={m}>
                {MODEL_LABELS[m]}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-fg-3">Interval</span>
          <Segmented
            size="sm"
            ariaLabel="Prediction interval"
            value={String(config.confidence)}
            onChange={(v) => setConfig({ confidence: Number(v) as 80 | 95 })}
            options={[
              { value: '80', label: '80%' },
              { value: '95', label: '95%' },
            ]}
          />
        </div>
        <Button size="sm" onClick={() => generate()} disabled={running} leftIcon={running ? <Spinner /> : stale ? <RefreshCw className="size-3.5" /> : <Play className="size-3.5" />}>
          {running ? 'Generating…' : 'Generate forecast'}
        </Button>
      </div>
      {(running || stale) && (
        <p className={cn('mt-3 flex items-center gap-2 text-xs', running ? 'text-brand-soft' : 'text-amber-200')} role="status">
          {running ? <Spinner className="size-3.5" /> : <Info className="size-3.5" aria-hidden />}
          {running ? stage : 'Settings changed — generate the forecast to apply them. The chart below still shows the previous run.'}
        </p>
      )}
    </div>
  )
}

export function ForecastChart({ ctx, height = 320, showFit }: { ctx: PredictiveCtx; height?: number; showFit: boolean }) {
  const { result, format, running, stale } = ctx
  const ds = result.dataset
  const n = ds.points.length
  const data = useMemo(() => result.rows.map((r, i) => ({ ...r, i })), [result.rows])
  const scenario = data.some((r) => r.scenario !== null && r.actual === null)
  const legend: LegendItem[] = [
    { label: 'Historical (actual)', color: SERIES[0], kind: 'line' },
    { label: 'Forecast', color: SERIES[6], kind: 'dashed' },
    { label: `${result.confidence}% prediction interval`, color: SERIES[6], kind: 'band' },
    ...(scenario ? [{ label: 'Scenario (assumptions)', color: SERIES[1], kind: 'dashed' as const }] : []),
    ...(showFit ? [{ label: 'Model fit', color: DEEMPH, kind: 'dashed' as const }] : []),
    ...(result.anomalies.length ? [{ label: 'Anomaly', color: STATUS.critical, kind: 'dot' as const }] : []),
  ]
  const labelOf = (i: number) => data[Math.round(i)]?.label ?? ''

  return (
    <ChartFrame
      title={ds.name}
      description={`${MODEL_LABELS[result.model]} · ${result.params}`}
      height={height}
      legend={legend}
      busy={running || stale}
      table={{
        columns: [
          { key: 'label', label: 'Period' },
          { key: 'type', label: 'Type' },
          { key: 'actual', label: 'Actual', align: 'right', format: (v) => (v === null ? '—' : format(Number(v))) },
          { key: 'forecast', label: 'Forecast', align: 'right', format: (v, row) => (row.type === 'Historical' || v === null ? '—' : format(Number(v))) },
          { key: 'band', label: 'Interval', align: 'right', format: (v) => (Array.isArray(v) ? `${format(v[0])} – ${format(v[1])}` : '—') },
        ],
        rows: data.map((r) => ({ ...r, type: r.actual === null ? 'Forecast' : 'Historical' })),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 14, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="i" type="number" domain={[0, data.length - 1]} {...axisProps} tickFormatter={labelOf} allowDecimals={false} tickCount={8} />
          <YAxis {...yAxisProps} tickFormatter={tickFormatter(ds)} />
          <Tooltip content={tooltipRenderer((v) => format(v), (l) => labelOf(Number(l)))} cursor={lineCursor} />
          <ReferenceArea x1={n - 1} x2={data.length - 1} fill="#9085e9" fillOpacity={0.05} ifOverflow="hidden" />
          <ReferenceLine x={n - 1} stroke={CHART.axis} label={{ value: 'Forecast →', position: 'insideTopLeft', fill: CHART.tick, fontSize: 11 }} />
          <Area dataKey="band" name={`${result.confidence}% interval`} stroke="none" fill={SERIES[6]} fillOpacity={0.2} isAnimationActive={false} />
          {showFit && <Line dataKey="fitted" name="Model fit" stroke={DEEMPH} strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={false} />}
          <Line dataKey="actual" name="Actual" stroke={SERIES[0]} strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
          <Line dataKey="forecast" name="Forecast" stroke={SERIES[6]} strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={activeDot} isAnimationActive={false} />
          {scenario && <Line dataKey="scenario" name="Scenario" stroke={SERIES[1]} strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={activeDot} isAnimationActive={false} />}
          {result.anomalies.map((a) => (
            <ReferenceDot key={a.index} x={a.index} y={a.actual} r={5} fill={STATUS.critical} stroke={CHART.surface} strokeWidth={2} ifOverflow="extendDomain" />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

const TONE = {
  positive: { icon: CheckCircle2, cls: 'text-emerald-300' },
  warning: { icon: AlertTriangle, cls: 'text-amber-300' },
  info: { icon: Info, cls: 'text-brand-soft' },
}

export function ForecastView(ctx: PredictiveCtx) {
  const { result, format, config } = ctx
  const [showFit, setShowFit] = useState(false)
  const ds = result.dataset
  const chosen = result.metrics.find((m) => m.model === result.model) ?? result.metrics[0]
  const yoy = result.sameLastYear ? ((result.totalForecast - result.sameLastYear) / result.sameLastYear) * 100 : null
  const unitLabel = ds.frequency === 'month' ? 'months' : ds.frequency === 'week' ? 'weeks' : 'days'

  return (
    <div className="space-y-4">
      <ConfigBar {...ctx} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label={`Forecast · next ${result.horizon} ${unitLabel}`} value={format(result.totalForecast)} hint={`${MODEL_SHORT[result.model]} model`} />
        <StatTile label="vs same period last year" value={yoy === null ? '—' : `${yoy >= 0 ? '+' : '−'}${Math.abs(yoy).toFixed(1)}%`} hint={result.sameLastYear ? `Last year: ${format(result.sameLastYear)}` : 'Not enough history'} />
        <StatTile label="Backtest error (MAPE)" value={`${chosen.mape.toFixed(1)}%`} hint={`Hold-out of ${chosen.holdout} ${unitLabel} · lower is better`} />
        <StatTile label="Anomalies detected" value={result.anomalies.length} hint={`Sensitivity |z| ≥ ${config.sensitivity}`} />
      </div>

      <div className="flex justify-end">
        <Switch size="sm" label="Show model fit on history" checked={showFit} onChange={setShowFit} className="text-xs" />
      </div>
      <ForecastChart ctx={ctx} showFit={showFit} />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Insights" description="Generated from model outputs with rule-based templates — no external AI service">
          <ul className="space-y-3">
            {result.insights.map((i) => {
              const t = TONE[i.tone]
              return (
                <li key={i.title} className="flex gap-3">
                  <t.icon className={cn('mt-0.5 size-4 shrink-0', t.cls)} aria-hidden />
                  <p className="text-[13px] leading-relaxed text-fg-2">
                    <span className="font-medium text-fg">{i.title}. </span>
                    {i.text}
                  </p>
                </li>
              )
            })}
          </ul>
        </Panel>
        <Panel title="Recommendations" description={isNeutral(config.scenario) ? 'Based on the baseline forecast' : 'Includes your scenario assumptions'}>
          <ul className="space-y-3">
            {result.recommendations.map((r) => (
              <li key={r} className="flex gap-3 text-[13px] leading-relaxed text-fg-2">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-fg-4">
            <Sparkles className="size-3" aria-hidden /> Forecasts are estimates with uncertainty, not guarantees.
          </p>
        </Panel>
      </div>
    </div>
  )
}
