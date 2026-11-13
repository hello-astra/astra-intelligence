import { useState } from 'react'
import { ArrowRight, Ban, CircleDollarSign, MapPin, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/toast-context'
import type { CommerceState } from '@/types/ecommerce'
import { formatDateTime, formatINR } from '@/utils/format'
import { advanceOrder, cancelOrder, markPaid, NEXT_STATUS, refundOrder } from './logic'
import { OrderStatusBadge, PaymentBadge } from './parts'

interface Props {
  orderId: string | null
  state: CommerceState
  onClose: () => void
  onChange: (next: CommerceState) => void
}

export function OrderDetailModal({ orderId, state, onClose, onChange }: Props) {
  const toast = useToast()
  const [confirm, setConfirm] = useState<'cancel' | 'refund' | null>(null)
  const order = state.orders.find((o) => o.id === orderId)
  const customer = order ? state.customers.find((c) => c.id === order.customerId) : undefined
  const next = order ? NEXT_STATUS[order.status] : undefined

  const act = (kind: 'advance' | 'cancel' | 'refund' | 'paid') => {
    if (!order) return
    if (kind === 'advance') {
      onChange(advanceOrder(state, order.id))
      toast({ title: `${order.id} updated`, description: `Status changed to ${next?.status}.` })
    } else if (kind === 'cancel') {
      onChange(cancelOrder(state, order.id))
      toast({ title: `${order.id} cancelled`, description: `${order.items.reduce((s, i) => s + i.qty, 0)} unit(s) returned to stock${order.payment === 'paid' ? '; refund issued (simulated)' : ''}.`, tone: 'warning' })
    } else if (kind === 'refund') {
      onChange(refundOrder(state, order.id))
      toast({ title: `Refund issued for ${order.id}`, description: 'Simulated — no money moved. Items returned to stock.', tone: 'info' })
    } else {
      onChange(markPaid(state, order.id))
      toast({ title: `Payment recorded for ${order.id}` })
    }
    setConfirm(null)
  }

  return (
    <Modal
      open={Boolean(order)}
      onClose={() => {
        setConfirm(null)
        onClose()
      }}
      size="lg"
      title={order ? `Order ${order.id}` : 'Order'}
      description={order ? `${formatDateTime(order.createdAt)} · ${order.channel} · ${order.method}` : undefined}
      footer={
        order && (
          <>
            {confirm ? (
              <>
                <span className="mr-auto text-xs text-fg-2">
                  {confirm === 'cancel' ? 'Cancel this order and return items to stock?' : 'Refund this order and restock the returned items?'}
                </span>
                <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
                  Keep order
                </Button>
                <Button size="sm" variant="danger" onClick={() => act(confirm)}>
                  {confirm === 'cancel' ? 'Cancel order' : 'Issue refund'}
                </Button>
              </>
            ) : (
              <>
                {(order.status === 'pending' || order.status === 'processing') && (
                  <Button size="sm" variant="ghost" leftIcon={<Ban className="size-3.5" />} onClick={() => setConfirm('cancel')} className="mr-auto text-red-300 hover:text-red-200">
                    Cancel order
                  </Button>
                )}
                {order.status === 'delivered' && order.payment === 'paid' && (
                  <Button size="sm" variant="ghost" leftIcon={<RotateCcw className="size-3.5" />} onClick={() => setConfirm('refund')} className="mr-auto">
                    Return & refund
                  </Button>
                )}
                {(order.payment === 'failed' || (order.payment === 'pending' && order.method !== 'Cash on delivery')) && order.status !== 'cancelled' && (
                  <Button size="sm" variant="secondary" leftIcon={<CircleDollarSign className="size-3.5" />} onClick={() => act('paid')}>
                    Mark payment received
                  </Button>
                )}
                {next && (
                  <Button size="sm" rightIcon={<ArrowRight className="size-3.5" />} onClick={() => act('advance')}>
                    {next.action}
                  </Button>
                )}
                {!next && order.status !== 'delivered' && <span className="text-xs text-fg-3">No further actions</span>}
              </>
            )}
          </>
        )
      }
    >
      {order && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentBadge status={order.payment} />
            {order.trackingNo && <span className="font-mono text-xs text-fg-3">Tracking {order.trackingNo}</span>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line p-3.5">
              <p className="text-xs text-fg-3">Customer</p>
              <p className="mt-1 text-sm font-medium text-fg">{customer?.name ?? 'Guest checkout'}</p>
              <p className="text-xs text-fg-3">{customer?.email ?? 'guest@example.in'}</p>
              {customer && <p className="text-xs text-fg-3">{customer.phone}</p>}
            </div>
            <div className="rounded-xl border border-line p-3.5">
              <p className="flex items-center gap-1 text-xs text-fg-3">
                <MapPin className="size-3" aria-hidden /> Ship to
              </p>
              <p className="mt-1 text-sm text-fg-2">{customer ? `${customer.city}, ${customer.state}` : 'Bengaluru, Karnataka'}</p>
              <p className="text-xs text-fg-3">India · Standard delivery</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-white/[0.02] text-[11px] tracking-wide text-fg-3 uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 text-right font-medium">Price</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.items.map((i) => (
                  <tr key={i.productId}>
                    <td className="px-3 py-2">
                      <p className="text-fg">{i.name}</p>
                      <p className="font-mono text-[11px] text-fg-3">{i.sku}</p>
                    </td>
                    <td className="px-3 py-2 text-right text-fg-2 tabular-nums">{i.qty}</td>
                    <td className="px-3 py-2 text-right text-fg-2 tabular-nums">{formatINR(i.price)}</td>
                    <td className="px-3 py-2 text-right text-fg tabular-nums">{formatINR(i.price * i.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="space-y-1 border-t border-line bg-white/[0.015] px-3 py-2.5 text-[13px]">
              {[
                ['Subtotal', formatINR(order.subtotal)],
                ...(order.discount > 0 ? [['Discount', `−${formatINR(order.discount)}`]] : []),
                ['Shipping', order.shipping === 0 ? 'Free' : formatINR(order.shipping)],
                ['GST (18%, included)', formatINR(Math.round(((order.subtotal - order.discount) * 18) / 118))],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-fg-2">
                  <dt>{k}</dt>
                  <dd className="tabular-nums">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between pt-1 text-sm font-semibold text-fg">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatINR(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Timeline</h3>
            <ol className="mt-3 space-y-3 border-l border-line-strong pl-4">
              {order.timeline.map((e, i) => (
                <li key={`${e.label}-${i}`} className="relative">
                  <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-brand ring-4 ring-[#0b1122]" aria-hidden />
                  <p className="text-[13px] text-fg">{e.label}</p>
                  <p className="text-xs text-fg-3">
                    {formatDateTime(e.at)}
                    {e.note ? ` · ${e.note}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <p className="text-xs text-fg-4">Payments and notifications in this demo are simulated — no money moves and no messages are sent.</p>
        </div>
      )}
    </Modal>
  )
}
