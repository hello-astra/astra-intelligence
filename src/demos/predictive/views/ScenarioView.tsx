import { useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { Switch } from '@/components/ui/Switch'
import { Slider } from '@/components/ui/Slider'
import { futureLabel } from '@/data/mock/predictive'
import { cn } from '@/utils/cn'
import { ChartFrame } from '../../shared/Chart'
import { useChartTheme } from '../../shared/demo-theme'
import { StatTile } from '../../shared/StatTile'
import { tooltipRenderer } from '../../shared/tooltip'
import { ASSUMPTIONS, NEUTRAL_SCENARIO, type Scenario } from '../models'
import { signedPct, tickFormatter, type PredictiveCtx } from '../shared'

export function ScenarioView(ctx: PredictiveCtx) {
  const { activeDot, axisProps, gridProps, lineCursor, SERIES, yAxisProps, animate } = useChartTheme()
  // Forecasts take the third series colour: distinct from the actuals and never the red used for anomalies.
  const FORECAST = SERIES[2]
  const { config, setConfig, result, format } = ctx
  const ds = result.dataset
  const s = config.scenario
  const set = (patch: Partial<Scenario>) => setConfig({ scenario: { ...s, ...patch } })

  const rows = useMemo(
    () =>
      result.forecast.map((v, i) => ({
        label: futureLabel(ds, i + 1),
        baseline: Math.round(v),
        scenario: Math.round(result.scenarioForecast[i]),
        delta: Math.round(result.scenarioForecast[i] - v),
      })),
    [result, ds],
  )
  const diff = result.totalScenario - result.totalForecast
  const diffPct = (diff / result.totalForecast) * 100
  const elasticity = ASSUMPTIONS.priceElasticity[ds.id]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Scenario planning</h2>
        <p className="text-xs text-fg-3">
          Adjust business levers to see how they could change the {result.horizon}-period outlook for <span className="text-fg-2">{ds.name}</span>. Effects apply stated
          assumptions on top of the statistical baseline.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Panel
          title="Business parameters"
          actions={
            <Button size="xs" variant="ghost" leftIcon={<RotateCcw className="size-3" />} onClick={() => setConfig({ scenario: { ...NEUTRAL_SCENARIO } })}>
              Baseline
            </Button>
          }
        >
          <div className="space-y-5">
            <Slider id="sc-marketing" label="Marketing spend" value={s.marketing} min={-50} max={100} step={5} onChange={(v) => set({ marketing: v })} format={signedPct} hint={`Assumed elasticity ${ASSUMPTIONS.marketingElasticity}: +10% spend → +${(ASSUMPTIONS.marketingElasticity * 10).toFixed(1)}% volume`} />
            <Slider id="sc-price" label="Price change" value={s.price} min={-20} max={20} step={1} onChange={(v) => set({ price: v })} format={signedPct} hint={`Assumed price elasticity of demand: ${elasticity}`} />
            <Slider id="sc-growth" label="Extra market growth (annual)" value={s.growth} min={-10} max={20} step={1} onChange={(v) => set({ growth: v })} format={signedPct} hint="Compounded across the horizon" />
            <Switch
              label={`Peak-season campaign (+${ASSUMPTIONS.promotionUplift * 100}% in peak periods)`}
              checked={s.promotion}
              onChange={(promotion) => set({ promotion })}
              className="text-[13px]"
            />
          </div>
        </Panel>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile label="Baseline forecast" value={format(result.totalForecast)} hint="Statistical model only" />
            <StatTile label="Scenario forecast" value={format(result.totalScenario)} hint="Baseline × assumptions" />
            <StatTile
              label="Scenario impact"
              value={`${diff >= 0 ? '+' : '−'}${format(Math.abs(diff))}`}
              hint={`${diffPct >= 0 ? '+' : '−'}${Math.abs(diffPct).toFixed(1)}% vs baseline`}
            />
          </div>
          <ChartFrame
            title="Baseline vs scenario"
            description="Forecast periods only"
            height={260}
            legend={[
              { label: 'Baseline forecast', color: FORECAST, kind: 'line' },
              { label: 'Scenario', color: SERIES[1], kind: 'line' },
            ]}
            table={{
              columns: [
                { key: 'label', label: 'Period' },
                { key: 'baseline', label: 'Baseline', align: 'right', format: (v) => format(Number(v)) },
                { key: 'scenario', label: 'Scenario', align: 'right', format: (v) => format(Number(v)) },
              ],
              rows,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} minTickGap={16} />
                <YAxis {...yAxisProps} tickFormatter={tickFormatter(ds)} domain={['auto', 'auto']} />
                <Tooltip content={tooltipRenderer((v) => format(v))} cursor={lineCursor} />
                <Line isAnimationActive={animate} dataKey="baseline" name="Baseline" stroke={FORECAST} strokeWidth={2} dot={{ r: 3, fill: FORECAST, strokeWidth: 0 }} activeDot={activeDot} />
                <Line isAnimationActive={animate} dataKey="scenario" name="Scenario" stroke={SERIES[1]} strokeWidth={2} dot={{ r: 3, fill: SERIES[1], strokeWidth: 0 }} activeDot={activeDot} />
              </LineChart>
            </ResponsiveContainer>
          </ChartFrame>
          <Panel title="Impact by period" flush>
            <div className="max-h-[260px] overflow-auto">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 border-b border-line bg-panel text-[11px] tracking-wide text-fg-3 uppercase">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-medium">
                      Period
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Baseline
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Scenario
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {rows.map((r) => (
                    <tr key={r.label}>
                      <th scope="row" className="px-3 py-2 text-left font-normal text-fg-2">
                        {r.label}
                      </th>
                      <td className="px-3 py-2 text-right text-fg-2 tabular-nums">{format(r.baseline)}</td>
                      <td className="px-3 py-2 text-right text-fg tabular-nums">{format(r.scenario)}</td>
                      <td className={cn('px-3 py-2 text-right tabular-nums', r.delta > 0 ? 'text-emerald-300' : r.delta < 0 ? 'text-red-300' : 'text-fg-3')}>
                        {r.delta === 0 ? '—' : `${r.delta > 0 ? '+' : '−'}${format(Math.abs(r.delta))}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
