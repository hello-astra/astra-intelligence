import { useMemo, useDeferredValue, useState } from 'react'
import { Download, ReceiptText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Panel } from '@/components/ui/Panel'
import { SearchInput } from '@/components/ui/SearchInput'
import { Segmented } from '@/components/ui/Segmented'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import type { OrderStatus } from '@/types/ecommerce'
import { dateStamp, downloadCSV } from '@/utils/export'
import { formatDateTime, formatINR } from '@/utils/format'
import type { CommerceViewProps } from '../context'
import { OrderStatusBadge, PaymentBadge } from '../parts'

const TABS: (OrderStatus | 'all')[] = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

export function OrdersView({ state, openOrder }: CommerceViewProps) {
  const [tab, setTab] = useState<OrderStatus | 'all'>('all')
  const [query, setQuery] = useState('')
  // Typing stays instant; the filtered list re-renders at low priority (interruptible) behind it.
  const deferredQuery = useDeferredValue(query)
  const customers = useMemo(() => new Map(state.customers.map((c) => [c.id, c])), [state.customers])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: state.orders.length }
    for (const o of state.orders) c[o.status] = (c[o.status] ?? 0) + 1
    return c
  }, [state.orders])

  const orders = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return state.orders.filter((o) => {
      if (tab !== 'all' && o.status !== tab) return false
      if (!q) return true
      const name = customers.get(o.customerId)?.name.toLowerCase() ?? 'guest'
      return o.id.toLowerCase().includes(q) || name.includes(q)
    })
  }, [state.orders, tab, deferredQuery, customers])

  const exportCsv = () =>
    downloadCSV(`orders-${dateStamp()}`, orders, [
      { key: 'id', label: 'Order', value: (o) => o.id },
      { key: 'date', label: 'Placed at', value: (o) => o.createdAt },
      { key: 'customer', label: 'Customer', value: (o) => customers.get(o.customerId)?.name ?? 'Guest' },
      { key: 'items', label: 'Items', value: (o) => o.items.map((i) => `${i.qty}× ${i.name}`).join('; ') },
      { key: 'total', label: 'Total (INR)', value: (o) => o.total },
      { key: 'status', label: 'Status', value: (o) => o.status },
      { key: 'payment', label: 'Payment', value: (o) => o.payment },
      { key: 'method', label: 'Method', value: (o) => o.method },
    ])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Orders</h2>
          <p className="text-xs text-fg-3">Select an order to view details and move it through fulfilment.</p>
        </div>
        <Button size="sm" variant="secondary" leftIcon={<Download className="size-3.5" />} onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <Panel flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <Segmented
            size="sm"
            ariaLabel="Filter by status"
            value={tab}
            onChange={setTab}
            options={TABS.map((t) => ({ value: t, label: `${t === 'all' ? 'All' : t[0].toUpperCase() + t.slice(1)} · ${counts[t] ?? 0}` }))}
          />
          <SearchInput value={query} onChange={setQuery} placeholder="Order ID or customer" className="w-full sm:ml-auto sm:w-56" />
        </div>
        {orders.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No orders found" description="Try another status or search term." />
        ) : (
          <Table minWidth={820}>
            <THead>
              <tr>
                <TH>Order</TH>
                <TH>Customer</TH>
                <TH align="right">Items</TH>
                <TH align="right">Total</TH>
                <TH>Payment</TH>
                <TH>Status</TH>
                <TH>Channel</TH>
              </tr>
            </THead>
            <TBody>
              {orders.slice(0, 80).map((o) => (
                <TR key={o.id} className="cursor-pointer" onClick={() => openOrder(o.id)}>
                  <TD>
                    <button type="button" className="text-left" aria-label={`Open order ${o.id}`}>
                      <span className="block font-mono text-xs text-fg">{o.id}</span>
                      <span className="block text-[11px] text-fg-3">{formatDateTime(o.createdAt)}</span>
                    </button>
                  </TD>
                  <TD>{customers.get(o.customerId)?.name ?? 'Guest checkout'}</TD>
                  <TD align="right">{o.items.reduce((s, i) => s + i.qty, 0)}</TD>
                  <TD align="right" className="font-medium text-fg">
                    {formatINR(o.total)}
                  </TD>
                  <TD>
                    <PaymentBadge status={o.payment} />
                    <span className="mt-0.5 block text-[11px] text-fg-4">{o.method}</span>
                  </TD>
                  <TD>
                    <OrderStatusBadge status={o.status} />
                  </TD>
                  <TD className="text-xs">{o.channel}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        {orders.length > 80 && <p className="border-t border-line px-4 py-2.5 text-xs text-fg-3">Showing 80 of {orders.length} orders — refine with search or status filters.</p>}
      </Panel>
    </div>
  )
}
