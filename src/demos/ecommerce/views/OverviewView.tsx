import { useState } from 'react'
import { IndianRupee, PackagePlus, ReceiptText, ShoppingBag, TriangleAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { SegmentedBar } from '@/components/ui/Meter'
import { Panel } from '@/components/ui/Panel'
import { Segmented } from '@/components/ui/Segmented'
import { useToast } from '@/components/ui/toast-context'
import type { PaymentStatus } from '@/types/ecommerce'
import { addDays, startOfDay, toISODate } from '@/utils/dates'
import { formatDateShort, formatINR, formatINRCompact, formatINRTick, formatRelative, formatTick } from '@/utils/format'
import { ChartFrame } from '../../shared/Chart'
import { axisProps, BAR_SIZE, barCursor, gridProps, SERIES, yAxisProps } from '../../shared/chartTheme'
import { StatTile } from '../../shared/StatTile'
import { tooltipRenderer } from '../../shared/tooltip'
import type { CommerceViewProps } from '../context'
import { countsAsRevenue, ordersBetween, pctChange, restock, revenueOf, stockLevel, PAYMENT_COLORS } from '../logic'
import { OrderStatusBadge, ProductIcon } from '../parts'

export function OverviewView({ state, setState, openOrder, goTo }: CommerceViewProps) {
  const toast = useToast()
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue')

  const current = ordersBetween(state.orders, 30, 0)
  const previous = ordersBetween(state.orders, 60, 30)
  const revenue = revenueOf(current)
  const prevRevenue = revenueOf(previous)
  const booked = current.filter(countsAsRevenue)
  const prevBooked = previous.filter(countsAsRevenue)
  const aov = booked.length ? revenue / booked.length : 0
  const prevAov = prevBooked.length ? prevRevenue / prevBooked.length : 0
  const lowStock = state.products.filter((p) => p.status === 'active' && stockLevel(p) !== 'ok')

  // Small data sets — computed directly each render.
  const buckets = new Map<string, { revenue: number; orders: number }>()
  const today = startOfDay()
  for (let i = 29; i >= 0; i--) buckets.set(toISODate(addDays(today, -i)), { revenue: 0, orders: 0 })
  for (const o of current) {
    const b = buckets.get(toISODate(new Date(o.createdAt)))
    if (!b) continue
    b.orders += 1
    if (countsAsRevenue(o)) b.revenue += o.total
  }
  const daily = [...buckets.entries()].map(([date, v]) => ({ date: formatDateShort(date), ...v }))

  const productValue = new Map<string, number>()
  for (const o of booked) for (const i of o.items) productValue.set(i.productId, (productValue.get(i.productId) ?? 0) + i.qty * i.price)
  const topProducts = [...productValue.entries()]
    .map(([id, value]) => ({ product: state.products.find((p) => p.id === id), value }))
    .filter((x) => x.product)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const payments = (['paid', 'pending', 'failed', 'refunded'] as PaymentStatus[]).map((s) => ({
    status: s,
    count: current.filter((o) => o.payment === s).length,
  }))

  const restockAll = () => {
    let next = state
    for (const p of lowStock) next = restock(next, p.id, Math.max(p.reorderLevel * 3 - p.stock, 1), 'Restock', 'Bulk restock')
    setState(next)
    toast({ title: `${lowStock.length} products restocked`, description: 'Purchase orders simulated; stock levels updated.' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Sales overview</h2>
          <p className="text-xs text-fg-3">Last 30 days compared with the previous 30 days · updates with every order</p>
        </div>
        <Button size="sm" leftIcon={<ShoppingBag className="size-3.5" />} onClick={() => goTo('storefront')}>
          Simulate an order
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Revenue" icon={IndianRupee} value={formatINRCompact(revenue)} delta={pctChange(revenue, prevRevenue)} deltaLabel="vs prior 30 days" />
        <StatTile label="Orders" icon={ReceiptText} value={current.length} delta={pctChange(current.length, previous.length)} deltaLabel="vs prior 30 days" />
        <StatTile label="Average order value" value={formatINR(aov)} delta={pctChange(aov, prevAov)} deltaLabel="vs prior 30 days" />
        <StatTile
          label="Low-stock products"
          icon={TriangleAlert}
          value={lowStock.length}
          hint={lowStock.length ? `${lowStock.filter((p) => p.stock === 0).length} out of stock` : 'All products healthy'}
          onClick={() => goTo('inventory')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <ChartFrame
          title={metric === 'revenue' ? 'Daily revenue' : 'Daily orders'}
          description={metric === 'revenue' ? 'Booked revenue (excludes cancellations, refunds and failed payments)' : 'Orders placed per day, all statuses'}
          height={250}
          actions={
            <Segmented
              size="xs"
              ariaLabel="Chart metric"
              value={metric}
              onChange={setMetric}
              options={[
                { value: 'revenue', label: 'Revenue' },
                { value: 'orders', label: 'Orders' },
              ]}
            />
          }
          table={{
            columns: [
              { key: 'date', label: 'Date' },
              { key: 'orders', label: 'Orders', align: 'right' },
              { key: 'revenue', label: 'Revenue', align: 'right', format: (v) => formatINR(Number(v)) },
            ],
            rows: daily,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" {...axisProps} minTickGap={24} />
              <YAxis {...yAxisProps} allowDecimals={false} tickFormatter={metric === 'revenue' ? formatINRTick : formatTick} />
              <Tooltip content={tooltipRenderer(metric === 'revenue' ? (v) => formatINR(v) : (v) => `${v}`)} cursor={barCursor} />
              <Bar dataKey={metric} name={metric === 'revenue' ? 'Revenue' : 'Orders'} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={BAR_SIZE} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <Panel title="Top products" description="By booked revenue, last 30 days">
          <ul className="space-y-3">
            {topProducts.map(({ product, value }) =>
              product ? (
                <li key={product.id}>
                  <div className="flex items-center gap-2.5">
                    <ProductIcon product={product} size={28} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-fg-2">{product.name}</span>
                    <span className="text-[13px] font-medium text-fg tabular-nums">{formatINRCompact(value)}</span>
                  </div>
                  <div className="mt-1.5 ml-[38px] h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full rounded-full" style={{ width: `${(value / (topProducts[0]?.value || 1)) * 100}%`, backgroundColor: SERIES[0] }} />
                  </div>
                </li>
              ) : null,
            )}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Payment status" description="Orders in the last 30 days">
          <SegmentedBar parts={payments.map((p) => ({ label: p.status, value: p.count, color: PAYMENT_COLORS[p.status] }))} />
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {payments.map((p) => (
              <li key={p.status} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2 text-xs">
                <span className="size-2 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[p.status] }} aria-hidden />
                <span className="flex-1 text-fg-2 capitalize">{p.status}</span>
                <span className="font-medium text-fg tabular-nums">{p.count}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Recent orders"
          actions={
            <Button size="xs" variant="ghost" onClick={() => goTo('orders')}>
              View all
            </Button>
          }
        >
          <ul className="divide-y divide-line/70">
            {state.orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => openOrder(o.id)} className="flex w-full items-center gap-2 py-2 text-left first:pt-0 hover:opacity-90">
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs text-fg">{o.id}</span>
                    <span className="block truncate text-[11px] text-fg-3">
                      {state.customers.find((c) => c.id === o.customerId)?.name ?? 'Guest'} · {formatRelative(o.createdAt)}
                    </span>
                  </span>
                  <span className="text-[13px] font-medium text-fg tabular-nums">{formatINR(o.total)}</span>
                  <OrderStatusBadge status={o.status} />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Low-stock notifications"
          description={lowStock.length ? 'At or below reorder level' : undefined}
          actions={
            lowStock.length > 0 && (
              <Button size="xs" variant="secondary" leftIcon={<PackagePlus className="size-3" />} onClick={restockAll}>
                Restock all
              </Button>
            )
          }
        >
          {lowStock.length === 0 ? (
            <p className="text-sm text-fg-3">All active products are above their reorder levels.</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-2.5 rounded-lg border border-amber-400/15 bg-amber-400/[0.05] px-2.5 py-2">
                  <TriangleAlert className="size-3.5 shrink-0 text-amber-300" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-xs text-fg-2">{p.name}</span>
                  <span className={p.stock === 0 ? 'text-xs font-medium text-red-300' : 'text-xs font-medium text-amber-200'}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
