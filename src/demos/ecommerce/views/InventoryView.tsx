import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Boxes, IndianRupee, PackagePlus, PackageX, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Meter } from '@/components/ui/Meter'
import { Panel } from '@/components/ui/Panel'
import { Segmented } from '@/components/ui/Segmented'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { useToast } from '@/components/ui/toast-context'
import { cn } from '@/utils/cn'
import { formatINRCompact, formatRelative } from '@/utils/format'
import { StatTile } from '../../shared/StatTile'
import type { CommerceViewProps } from '../context'
import { ordersBetween, restock, stockLevel } from '../logic'
import { ProductIcon, StockBadge } from '../parts'

export function InventoryView({ state, setState, openProduct }: CommerceViewProps) {
  const toast = useToast()
  const [filter, setFilter] = useState<'all' | 'attention'>('all')
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  const tracked = state.products.filter((p) => p.status !== 'archived')
  const value = tracked.reduce((s, p) => s + p.stock * p.cost, 0)
  const units = tracked.reduce((s, p) => s + p.stock, 0)
  const low = tracked.filter((p) => stockLevel(p) === 'low')
  const out = tracked.filter((p) => stockLevel(p) === 'out')

  // Average daily units sold over 30 days → days of cover.
  const velocity = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of ordersBetween(state.orders, 30, 0)) {
      if (o.status === 'cancelled') continue
      for (const i of o.items) map.set(i.productId, (map.get(i.productId) ?? 0) + i.qty)
    }
    return map
  }, [state.orders])

  const rows = tracked.filter((p) => filter === 'all' || stockLevel(p) !== 'ok')

  const doRestock = (productId: string, qty: number, label: string) => {
    if (!Number.isFinite(qty) || qty <= 0) return
    setState((s) => restock(s, productId, Math.round(qty), 'Restock', 'Manual restock'))
    setAmounts((a) => ({ ...a, [productId]: '' }))
    toast({ title: `Restocked ${label}`, description: `+${Math.round(qty)} units received (simulated purchase order).` })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Inventory</h2>
        <p className="text-xs text-fg-3">Stock is reserved automatically when storefront orders are placed and returned on cancellation.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Inventory value (at cost)" icon={IndianRupee} value={formatINRCompact(value)} hint={`${tracked.length} SKUs tracked`} />
        <StatTile label="Units in stock" icon={Boxes} value={units.toLocaleString('en-IN')} hint="Across all locations" />
        <StatTile label="Low stock" icon={TriangleAlert} value={low.length} hint="At or below reorder level" />
        <StatTile label="Out of stock" icon={PackageX} value={out.length} hint={out.length ? out.map((p) => p.name).join(', ') : 'None'} />
      </div>

      <Panel
        flush
        title="Stock levels"
        description="Days of cover = units in stock ÷ average daily sales (last 30 days)"
        actions={
          <Segmented
            size="xs"
            ariaLabel="Filter stock levels"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All products' },
              { value: 'attention', label: `Needs attention (${low.length + out.length})` },
            ]}
          />
        }
      >
        <Table minWidth={820}>
          <THead>
            <tr>
              <TH>Product</TH>
              <TH>Stock vs reorder level</TH>
              <TH align="right">Sold / 30d</TH>
              <TH align="right">Days of cover</TH>
              <TH>Status</TH>
              <TH align="right">Restock</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((p) => {
              const sold = velocity.get(p.id) ?? 0
              const cover = sold > 0 ? p.stock / (sold / 30) : null
              const level = stockLevel(p)
              const suggested = Math.max(p.reorderLevel * 3 - p.stock, 5)
              return (
                <TR key={p.id}>
                  <TD>
                    <button type="button" onClick={() => openProduct(p.id)} className="flex items-center gap-2.5 text-left">
                      <ProductIcon product={p} size={28} />
                      <span>
                        <span className="block font-medium text-fg hover:text-brand-soft">{p.name}</span>
                        <span className="block font-mono text-[11px] text-fg-3">{p.sku}</span>
                      </span>
                    </button>
                  </TD>
                  <TD className="min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <Meter
                        value={p.stock}
                        max={Math.max(p.reorderLevel * 4, p.stock, 1)}
                        tone={level === 'out' ? 'critical' : level === 'low' ? 'warning' : 'brand'}
                        size="sm"
                        label={`${p.name} stock`}
                      />
                      <span className="w-16 shrink-0 text-right text-xs text-fg-2 tabular-nums">
                        {p.stock} / {p.reorderLevel}
                      </span>
                    </div>
                  </TD>
                  <TD align="right">{sold}</TD>
                  <TD align="right" className={cn(cover !== null && cover < 7 && 'text-amber-300')}>
                    {cover === null ? '—' : cover > 365 ? '365+' : Math.round(cover)}
                  </TD>
                  <TD>
                    <StockBadge product={p} />
                  </TD>
                  <TD align="right">
                    <div className="flex items-center justify-end gap-1.5">
                      <input
                        type="number"
                        min={1}
                        placeholder={String(suggested)}
                        value={amounts[p.id] ?? ''}
                        onChange={(e) => setAmounts((a) => ({ ...a, [p.id]: e.target.value }))}
                        aria-label={`Units to add for ${p.name}`}
                        className="h-7 w-16 rounded-md border border-line bg-raised px-2 text-right text-xs text-fg outline-none focus:border-brand/70"
                      />
                      <Button size="xs" variant={level === 'ok' ? 'ghost' : 'secondary'} leftIcon={<PackagePlus className="size-3" />} onClick={() => doRestock(p.id, Number(amounts[p.id] || suggested), p.name)}>
                        Add
                      </Button>
                    </div>
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      </Panel>

      <Panel title="Stock movements" description="Most recent inventory changes across all channels">
        <ul className="divide-y divide-line/70">
          {state.movements.slice(0, 12).map((m) => {
            const p = state.products.find((x) => x.id === m.productId)
            const inbound = m.change > 0
            return (
              <li key={m.id} className="flex items-center gap-3 py-2 text-[13px] first:pt-0 last:pb-0">
                <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', inbound ? 'bg-emerald-500/10' : 'bg-white/[0.04]')}>
                  {inbound ? <ArrowUpRight className="size-3.5 text-emerald-300" aria-hidden /> : <ArrowDownRight className="size-3.5 text-fg-3" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1 truncate text-fg-2">{p?.name ?? 'Removed product'}</span>
                <Badge tone={m.reason === 'Order' ? 'neutral' : m.reason === 'Restock' ? 'green' : m.reason === 'Adjustment' ? 'blue' : 'amber'}>{m.reason}</Badge>
                {m.ref && <span className="hidden font-mono text-[11px] text-fg-3 sm:inline">{m.ref}</span>}
                <span className={cn('w-12 text-right font-medium tabular-nums', inbound ? 'text-emerald-300' : 'text-fg')}>
                  {inbound ? '+' : ''}
                  {m.change}
                </span>
                <span className="hidden w-20 text-right text-xs text-fg-3 tabular-nums md:inline">→ {m.balance} left</span>
                <span className="hidden w-20 text-right text-xs text-fg-4 lg:inline">{formatRelative(m.at)}</span>
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
