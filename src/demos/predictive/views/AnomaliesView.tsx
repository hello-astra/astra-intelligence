import { useMemo } from 'react'
import { BadgeCheck, CircleHelp } from 'lucide-react'
import { CartesianGrid, ComposedChart, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { Panel } from '@/components/ui/Panel'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { Slider } from '@/components/ui/Slider'
import { cn } from '@/utils/cn'
import { ChartFrame } from '../../shared/Chart'
import { activeDot, axisProps, CHART, DEEMPH, gridProps, lineCursor, SERIES, STATUS, yAxisProps } from '../../shared/chartTheme'
import { tooltipRenderer } from '../../shared/tooltip'
import { tickFormatter, type PredictiveCtx } from '../shared'

export function AnomaliesView(ctx: PredictiveCtx) {
  const { result, config, setConfig, format } = ctx
  const ds = result.dataset
  const data = useMemo(() => ds.points.map((p, i) => ({ i, label: p.label, actual: p.value, expected: Math.round(result.expected[i]) })), [ds, result.expected])
  const labelOf = (i: number) => data[Math.round(i)]?.label ?? ''

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Anomaly detection</h2>
        <p className="text-xs text-fg-3">
          Each observation is compared with a robust baseline (trend + seasonality). Points whose robust z-score exceeds the threshold are flagged.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <Panel title="Sensitivity">
          <Slider
            id="anomaly-threshold"
            label="Threshold |z|"
            value={config.sensitivity}
            min={2}
            max={4.5}
            step={0.25}
            onChange={(v) => setConfig({ sensitivity: v })}
            format={(v) => v.toFixed(2)}
            hint="Lower = more sensitive (more alerts). Default 3.5."
          />
          <p className="mt-4 text-[13px] text-fg-2">
            <span className="text-2xl font-semibold text-fg">{result.anomalies.length}</span> anomal{result.anomalies.length === 1 ? 'y' : 'ies'} in {ds.points.length} observations
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-fg-4">
            Method: two-pass regression baseline with Fourier seasonality; residuals scored with median and MAD (robust to the outliers themselves).
          </p>
        </Panel>

        <ChartFrame
          title="Actual vs expected"
          description={ds.name}
          height={280}
          legend={[
            { label: 'Actual', color: SERIES[0], kind: 'line' },
            { label: 'Expected baseline', color: DEEMPH, kind: 'dashed' },
            { label: 'Anomaly', color: STATUS.critical, kind: 'dot' },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="i" type="number" domain={[0, data.length - 1]} {...axisProps} tickFormatter={labelOf} allowDecimals={false} tickCount={8} />
              <YAxis {...yAxisProps} tickFormatter={tickFormatter(ds)} />
              <Tooltip content={tooltipRenderer((v) => format(v), (l) => labelOf(Number(l)))} cursor={lineCursor} />
              <Line dataKey="expected" name="Expected" stroke={DEEMPH} strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
              <Line dataKey="actual" name="Actual" stroke={SERIES[0]} strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
              {result.anomalies.map((a) => (
                <ReferenceDot key={a.index} x={a.index} y={a.actual} r={5} fill={STATUS.critical} stroke={CHART.surface} strokeWidth={2} ifOverflow="extendDomain" />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>

      <Panel title="Flagged observations" flush>
        {result.anomalies.length === 0 ? (
          <p className="p-4 text-sm text-fg-3">No anomalies at this sensitivity. Lower the threshold to surface smaller deviations.</p>
        ) : (
          <Table minWidth={720}>
            <THead>
              <tr>
                <TH>Period</TH>
                <TH align="right">Actual</TH>
                <TH align="right">Expected</TH>
                <TH align="right">Deviation</TH>
                <TH align="right">z-score</TH>
                <TH>Known event</TH>
              </tr>
            </THead>
            <TBody>
              {result.anomalies.map((a) => {
                const event = ds.events.find((e) => e.index === a.index)
                return (
                  <TR key={a.index}>
                    <TD className="font-medium text-fg">{a.label}</TD>
                    <TD align="right">{format(a.actual)}</TD>
                    <TD align="right">{format(a.expected)}</TD>
                    <TD align="right" className={cn(a.deviationPct < 0 ? 'text-red-300' : 'text-emerald-300')}>
                      {a.deviationPct >= 0 ? '+' : '−'}
                      {Math.abs(a.deviationPct).toFixed(1)}%
                    </TD>
                    <TD align="right">{a.z.toFixed(1)}</TD>
                    <TD>
                      {event ? (
                        <Badge tone="green" icon={<BadgeCheck className="size-3" aria-hidden />}>
                          {event.note}
                        </Badge>
                      ) : (
                        <Badge icon={<CircleHelp className="size-3" aria-hidden />}>Needs investigation</Badge>
                      )}
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
        <p className="border-t border-line px-4 py-2.5 text-[11px] text-fg-4">
          “Known event” labels come from the sample dataset’s annotations and are shown only to validate what the detector found.
        </p>
      </Panel>
    </div>
  )
}
