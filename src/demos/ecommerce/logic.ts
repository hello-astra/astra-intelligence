import { buildTimeline, COUPONS, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '@/data/mock/ecommerce'
import type { CartLine, CommerceState, Order, OrderStatus, PaymentMethod, PaymentStatus, Product, StockMovement } from '@/types/ecommerce'
import { DAY } from '@/utils/dates'
import { nextSequentialId, uid } from '@/utils/id'

export type StockLevel = 'ok' | 'low' | 'out'

export function stockLevel(p: Pick<Product, 'stock' | 'reorderLevel'>): StockLevel {
  if (p.stock <= 0) return 'out'
  if (p.stock <= p.reorderLevel) return 'low'
  return 'ok'
}

/** Booked revenue excludes cancelled orders, refunds and failed payments. */
export function countsAsRevenue(o: Order): boolean {
  return o.status !== 'cancelled' && o.payment !== 'refunded' && o.payment !== 'failed'
}

export function ordersBetween(orders: Order[], fromDaysAgo: number, toDaysAgo: number): Order[] {
  const now = Date.now()
  const from = now - fromDaysAgo * DAY
  const to = now - toDaysAgo * DAY
  return orders.filter((o) => {
    const t = new Date(o.createdAt).getTime()
    return t > from && t <= to
  })
}

export function revenueOf(orders: Order[]): number {
  return orders.filter(countsAsRevenue).reduce((s, o) => s + o.total, 0)
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

export const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; action: string }>> = {
  pending: { status: 'processing', action: 'Start processing' },
  processing: { status: 'shipped', action: 'Mark as shipped' },
  shipped: { status: 'delivered', action: 'Mark as delivered' },
}

function movement(productId: string, change: number, reason: StockMovement['reason'], balance: number, ref?: string): StockMovement {
  return { id: uid('mov'), at: new Date().toISOString(), productId, change, reason, ref, balance }
}

export function restock(state: CommerceState, productId: string, qty: number, reason: StockMovement['reason'] = 'Restock', ref?: string): CommerceState {
  if (qty === 0) return state
  let balance = 0
  const products = state.products.map((p) => {
    if (p.id !== productId) return p
    balance = Math.max(0, p.stock + qty)
    return { ...p, stock: balance }
  })
  return { ...state, products, movements: [movement(productId, qty, reason, balance, ref), ...state.movements].slice(0, 60) }
}

export function updateOrder(state: CommerceState, orderId: string, fn: (o: Order) => Order): CommerceState {
  return { ...state, orders: state.orders.map((o) => (o.id === orderId ? fn(o) : o)) }
}

/** Advances an order one step; COD orders are marked paid on delivery. */
export function advanceOrder(state: CommerceState, orderId: string): CommerceState {
  return updateOrder(state, orderId, (o) => {
    const next = NEXT_STATUS[o.status]
    if (!next) return o
    const now = new Date().toISOString()
    const timeline = [...o.timeline, { label: next.status === 'processing' ? 'Processing' : next.status === 'shipped' ? 'Shipped' : 'Delivered', at: now }]
    let payment = o.payment
    if (next.status === 'delivered' && o.method === 'Cash on delivery' && o.payment === 'pending') {
      payment = 'paid'
      timeline.push({ label: 'Cash collected on delivery', at: now })
    }
    return {
      ...o,
      status: next.status,
      payment,
      trackingNo: next.status === 'shipped' ? `DLV${Date.now().toString().slice(-9)}` : o.trackingNo,
      timeline,
    }
  })
}

/** Cancels an order, returns its items to stock and refunds prepaid payments. */
export function cancelOrder(state: CommerceState, orderId: string): CommerceState {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status === 'shipped' || order.status === 'delivered' || order.status === 'cancelled') return state
  let next = updateOrder(state, orderId, (o) => {
    const now = new Date().toISOString()
    const refunded = o.payment === 'paid'
    return {
      ...o,
      status: 'cancelled',
      payment: refunded ? 'refunded' : o.payment,
      timeline: [...o.timeline, { label: 'Order cancelled', at: now, note: 'Cancelled from admin' }, ...(refunded ? [{ label: 'Refund issued', at: now }] : [])],
    }
  })
  for (const item of order.items) next = restock(next, item.productId, item.qty, 'Cancellation', order.id)
  return next
}

/** Refund after delivery: items come back as a return. */
export function refundOrder(state: CommerceState, orderId: string): CommerceState {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'delivered' || order.payment !== 'paid') return state
  let next = updateOrder(state, orderId, (o) => ({
    ...o,
    payment: 'refunded',
    timeline: [...o.timeline, { label: 'Return received', at: new Date().toISOString() }, { label: 'Refund issued', at: new Date().toISOString() }],
  }))
  for (const item of order.items) next = restock(next, item.productId, item.qty, 'Return', order.id)
  return next
}

export function markPaid(state: CommerceState, orderId: string): CommerceState {
  return updateOrder(state, orderId, (o) => ({
    ...o,
    payment: 'paid',
    timeline: [...o.timeline, { label: 'Payment confirmed', at: new Date().toISOString(), note: 'Marked as received by admin' }],
  }))
}

export interface CartTotals {
  subtotal: number
  discount: number
  shipping: number
  total: number
  gstIncluded: number
}

export function cartTotals(lines: CartLine[], products: Product[], coupon: string): CartTotals {
  const subtotal = lines.reduce((s, l) => s + (products.find((p) => p.id === l.productId)?.price ?? 0) * l.qty, 0)
  const rate = COUPONS[coupon.trim().toUpperCase()] ?? 0
  const discount = Math.round(subtotal * rate)
  const shipping = subtotal === 0 ? 0 : subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const total = subtotal - discount + shipping
  return { subtotal, discount, shipping, total, gstIncluded: Math.round(((subtotal - discount) * 18) / 118) }
}

export interface PlacedOrder {
  state: CommerceState
  order: Order
  log: { productId: string; name: string; before: number; after: number; level: StockLevel }[]
}

/** Creates an order from the cart, reserving stock and logging every inventory change. */
export function placeOrder(state: CommerceState, customerId: string, method: PaymentMethod, coupon: string): PlacedOrder | { error: string } {
  if (state.cart.length === 0) return { error: 'The cart is empty.' }
  for (const line of state.cart) {
    const p = state.products.find((x) => x.id === line.productId)
    if (!p || p.status !== 'active') return { error: 'A product in the cart is no longer available.' }
    if (p.stock < line.qty) return { error: `Only ${p.stock} × ${p.name} left in stock.` }
  }
  const totals = cartTotals(state.cart, state.products, coupon)
  const id = nextSequentialId(
    state.orders.map((o) => o.id),
    'ORD-',
    10_001,
  )
  const created = new Date()
  const payment = method === 'Cash on delivery' ? 'pending' : 'paid'
  const order: Order = {
    id,
    customerId,
    items: state.cart.map((l) => {
      const p = state.products.find((x) => x.id === l.productId) as Product
      return { productId: p.id, name: p.name, sku: p.sku, qty: l.qty, price: p.price }
    }),
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    total: totals.total,
    status: 'pending',
    payment,
    method,
    channel: 'Storefront',
    createdAt: created.toISOString(),
    timeline: buildTimeline('pending', created, payment),
  }

  const log: PlacedOrder['log'] = []
  let next: CommerceState = { ...state, orders: [order, ...state.orders], cart: [] }
  for (const line of state.cart) {
    const before = next.products.find((p) => p.id === line.productId)?.stock ?? 0
    next = restock(next, line.productId, -line.qty, 'Order', id)
    const after = next.products.find((p) => p.id === line.productId) as Product
    log.push({ productId: line.productId, name: after.name, before, after: after.stock, level: stockLevel(after) })
  }
  return { state: next, order, log }
}

export type Segment = 'New' | 'Returning' | 'VIP'

export interface CustomerStats {
  orders: number
  spent: number
  lastOrderAt: string | null
  segment: Segment
}

export function customerStats(state: CommerceState): Map<string, CustomerStats> {
  const map = new Map<string, CustomerStats>()
  for (const c of state.customers) map.set(c.id, { orders: 0, spent: 0, lastOrderAt: null, segment: 'New' })
  for (const o of state.orders) {
    const s = map.get(o.customerId)
    if (!s) continue
    s.orders += 1
    if (countsAsRevenue(o)) s.spent += o.total
    if (!s.lastOrderAt || o.createdAt > s.lastOrderAt) s.lastOrderAt = o.createdAt
  }
  for (const s of map.values()) s.segment = s.spent >= 40_000 || s.orders >= 6 ? 'VIP' : s.orders >= 2 ? 'Returning' : 'New'
  return map
}

export const CATEGORY_PREFIX: Record<Product['category'], string> = {
  Audio: 'AUD-',
  Wearables: 'WEA-',
  Computing: 'COM-',
  Accessories: 'ACC-',
  'Home & Living': 'HOM-',
}

/** Payment-status colors (reserved status palette). */
export const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  paid: '#0ca30c',
  pending: '#fab219',
  failed: '#d03b3b',
  refunded: '#5b6886',
}
