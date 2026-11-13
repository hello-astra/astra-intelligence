import { useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { ChartFrame } from '../../shared/Chart'
import { useChartTheme } from '../../shared/demo-theme'
import { tooltipRenderer } from '../../shared/tooltip'
import { MODEL_LABELS, MODEL_SHORT, type ModelId } from '../models'
import { tickFormatter, type PredictiveCtx } from '../shared'

/** Model colours follow the product palette (slot 0 is reserved for the actuals). */
const modelColors = (series: readonly string[]): Record<ModelId, string> => ({ 'holt-winters': series[1], regression: series[2], 'seasonal-naive': series[3] })

export function ModelsView({ result, format, generate, config, running }: PredictiveCtx) {
  const { activeDot, axisProps, gridProps, lineCursor, SERIES, yAxisProps, animate } = useChartTheme()
  const COLORS = modelColors(SERIES)
  const ds = result.dataset
  const h = result.metrics[0].holdout
  const rows = useMemo(() => {
    const start = ds.points.length - h
    return ds.points.slice(start).map((p, i) => {
      const row: Record<string, string | number> = { label: p.label, actual: p.value }
      for (const m of result.metrics) row[m.model] = Math.round(m.predicted[i])
      return row
    })
  }, [ds, h, result.metrics])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Model comparison</h2>
        <p className="text-xs text-fg-3">
          Each model is trained without the last {h} {ds.frequency}s, then asked to forecast them. The model with the lowest error is used when Model = Auto.
        </p>
      </div>
      <Panel flush>
        <Table minWidth={680}>
          <THead>
            <tr>
              <TH>Rank</TH>
              <TH>Model</TH>
              <TH align="right">MAPE</TH>
              <TH align="right">MAE</TH>
              <TH align="right">RMSE</TH>
              <TH align="right">
                <span className="sr-only">Action</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {result.metrics.map((m, i) => (
              <TR key={m.model}>
                <TD>
                  {i === 0 ? (
                    <Badge tone="amber" icon={<Trophy className="size-3" aria-hidden />}>
                      Best
                    </Badge>
                  ) : (
                    <span className="text-fg-3">#{i + 1}</span>
                  )}
                </TD>
                <TD>
                  <span className="flex items-center gap-2 font-medium text-fg">
                    <span className="h-0.5 w-3.5 rounded-full" style={{ backgroundColor: COLORS[m.model] }} aria-hidden />
                    {MODEL_LABELS[m.model]}
                  </span>
                </TD>
                <TD align="right" className="font-medium text-fg">
                  {m.mape.toFixed(1)}%
                </TD>
                <TD align="right">{format(m.mae)}</TD>
                <TD align="right">{format(m.rmse)}</TD>
                <TD align="right">
                  {result.model === m.model ? (
                    <Badge tone="blue">In use</Badge>
                  ) : (
                    <Button size="xs" variant="secondary" disabled={running} onClick={() => generate({ model: m.model })}>
                      Use {MODEL_SHORT[m.model]}
                    </Button>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <p className="border-t border-line px-4 py-2.5 text-[11px] text-fg-4">
          MAPE = mean absolute percentage error · MAE = mean absolute error · RMSE = root mean squared error. Current selection: {config.model === 'auto' ? 'Auto' : MODEL_SHORT[config.model]}.
        </p>
      </Panel>
      <ChartFrame
        title="Hold-out period: actual vs model predictions"
        description={`Last ${h} ${ds.frequency}s`}
        height={280}
        legend={[{ label: 'Actual', color: SERIES[0], kind: 'line' }, ...result.metrics.map((m) => ({ label: MODEL_SHORT[m.model], color: COLORS[m.model], kind: 'line' as const }))]}
        table={{
          columns: [
            { key: 'label', label: 'Period' },
            { key: 'actual', label: 'Actual', align: 'right', format: (v) => format(Number(v)) },
            ...result.metrics.map((m) => ({ key: m.model, label: MODEL_SHORT[m.model], align: 'right' as const, format: (v: unknown) => format(Number(v)) })),
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
            <Line isAnimationActive={animate} dataKey="actual" name="Actual" stroke={SERIES[0]} strokeWidth={2.5} dot={{ r: 3, fill: SERIES[0], strokeWidth: 0 }} activeDot={activeDot} />
            {result.metrics.map((m) => (
              <Line isAnimationActive={animate} key={m.model} dataKey={m.model} name={MODEL_SHORT[m.model]} stroke={COLORS[m.model]} strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={activeDot} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  )
}
