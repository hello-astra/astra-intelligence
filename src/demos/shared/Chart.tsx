import { useState, type ReactNode } from 'react'
import { BarChart3, Table2 } from 'lucide-react'
import { Segmented } from '@/components/ui/Segmented'
import { cn } from '@/utils/cn'

/* ------------------------------------------------------------------ Tooltip */

interface TooltipEntry {
  name?: unknown
  value?: unknown
  color?: string
  stroke?: string
  fill?: string
  dataKey?: unknown
  payload?: unknown
}

export interface ChartTooltipProps {
  active?: boolean
  payload?: ReadonlyArray<TooltipEntry>
  label?: unknown
  valueFormatter?: (value: number, name: string) => string
  labelFormatter?: (label: string) => string
  /** Hide series whose value is null/undefined (e.g. forecast before "today"). */
  hideEmpty?: boolean
  /** dataKeys of helper series (e.g. styling-only segments) to leave out. */
  exclude?: readonly string[]
}

/** Values lead, labels follow; series keyed with a short line, not a box. */
export function ChartTooltip({ active, payload, label, valueFormatter, labelFormatter, hideEmpty = true, exclude }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const rows = payload.filter(
    (p) => !exclude?.includes(String(p.dataKey)) && (!hideEmpty || (p.value !== null && p.value !== undefined && !Number.isNaN(Number(p.value)))),
  )
  if (rows.length === 0) return null
  const labelText = label === undefined || label === null ? '' : String(label)
  return (
    <div className="min-w-[140px] rounded-lg border border-line-strong bg-[#0c1325]/95 px-3 py-2 shadow-xl shadow-black/40 backdrop-blur">
      {labelText && <p className="mb-1.5 text-[11px] text-fg-3">{labelFormatter ? labelFormatter(labelText) : labelText}</p>}
      <ul className="space-y-1">
        {rows.map((p, i) => {
          const name = String(p.name ?? p.dataKey ?? '')
          const raw = p.value
          const value = Array.isArray(raw) ? raw.map(Number) : Number(raw)
          const color = [p.color, p.stroke, p.fill].find((c) => c && c !== 'transparent' && c !== 'none') ?? '#4180f2'
          const text = Array.isArray(value)
            ? value.map((v) => (valueFormatter ? valueFormatter(v, name) : v.toLocaleString('en-IN'))).join(' – ')
            : valueFormatter
              ? valueFormatter(value, name)
              : value.toLocaleString('en-IN')
          return (
            <li key={`${name}-${i}`} className="flex items-center gap-2 text-xs">
              <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              <span className="font-semibold text-fg tabular-nums">{text}</span>
              <span className="truncate text-fg-3">{name}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------- Legend */

export interface LegendItem {
  label: string
  color: string
  /** Mirrors the mark: rect for bars/areas, line for lines, dashed for forecasts. */
  kind?: 'rect' | 'line' | 'dashed' | 'dot' | 'band'
}

export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-fg-2">
          <LegendSwatch color={item.color} kind={item.kind ?? 'rect'} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

function LegendSwatch({ color, kind }: { color: string; kind: NonNullable<LegendItem['kind']> }) {
  if (kind === 'line') return <span className="h-0.5 w-3.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
  if (kind === 'dashed') return <span className="w-3.5 border-t-2 border-dashed" style={{ borderColor: color }} aria-hidden />
  if (kind === 'dot') return <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
  if (kind === 'band') return <span className="h-2.5 w-3.5 rounded-sm" style={{ backgroundColor: color, opacity: 0.35 }} aria-hidden />
  return <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden />
}

/* -------------------------------------------------------------------- Frame */

export interface TableColumn {
  key: string
  label: string
  align?: 'left' | 'right'
  format?: (value: unknown, row: Record<string, unknown>) => ReactNode
}

interface ChartFrameProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  legend?: LegendItem[]
  /** Plot height in px (includes the x-axis band). */
  height?: number
  children: ReactNode
  /** Accessible table-view twin of the chart. */
  table?: { columns: TableColumn[]; rows: Record<string, unknown>[] }
  className?: string
  footer?: ReactNode
  /** Dims the chart while recomputing, keeping the previous render (no skeleton flash). */
  busy?: boolean
}

export function ChartFrame({ title, description, actions, legend, height = 260, children, table, className, footer, busy }: ChartFrameProps) {
  const [mode, setMode] = useState<'chart' | 'table'>('chart')
  return (
    <figure className={cn('min-w-0 rounded-xl border border-line bg-panel', className)}>
      <figcaption className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 pt-3.5">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-fg">{title}</div>
          {description && <div className="mt-0.5 text-xs text-fg-3">{description}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {actions}
          {table && (
            <Segmented
              size="xs"
              ariaLabel="Chart or table view"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'chart', label: <span className="sr-only">Chart</span>, icon: BarChart3, title: 'Chart view' },
                { value: 'table', label: <span className="sr-only">Table</span>, icon: Table2, title: 'Table view' },
              ]}
            />
          )}
        </div>
      </figcaption>
      {legend && legend.length > 0 && mode === 'chart' && <ChartLegend items={legend} className="px-4 pt-3" />}
      <div className="px-2 pt-3 pb-3 sm:px-3">
        {mode === 'chart' || !table ? (
          <div style={{ height }} className={cn('w-full transition-opacity', busy && 'opacity-50')}>
            {children}
          </div>
        ) : (
          <div className="overflow-auto px-1" style={{ maxHeight: Math.max(height, 220) }}>
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-panel text-[10px] tracking-wide text-fg-3 uppercase">
                <tr>
                  {table.columns.map((c) => (
                    <th key={c.key} scope="col" className={cn('px-2 py-2 font-medium', c.align === 'right' && 'text-right')}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {table.rows.map((row, i) => (
                  <tr key={i}>
                    {table.columns.map((c) => (
                      <td key={c.key} className={cn('px-2 py-1.5 text-fg-2', c.align === 'right' && 'text-right tabular-nums')}>
                        {c.format ? c.format(row[c.key], row) : String(row[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {footer && <div className="border-t border-line px-4 py-2.5 text-xs text-fg-3">{footer}</div>}
    </figure>
  )
}
