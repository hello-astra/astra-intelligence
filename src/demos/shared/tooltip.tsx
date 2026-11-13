import type { TooltipContentProps } from 'recharts'
import { ChartTooltip } from './Chart'

/** Builds a Recharts `content` renderer using the shared tooltip styling. */
export function tooltipRenderer(
  valueFormatter?: (value: number, name: string) => string,
  labelFormatter?: (label: string) => string,
  exclude?: readonly string[],
) {
  return function TooltipContent(props: TooltipContentProps) {
    return <ChartTooltip {...props} valueFormatter={valueFormatter} labelFormatter={labelFormatter} exclude={exclude} />
  }
}
