import type { CommerceState, Customer, Order, OrderEvent, OrderItem, OrderStatus, PaymentMethod, PaymentStatus, Product, StockMovement } from '@/types/ecommerce'
import { addDays, DAY, HOUR, startOfDay } from '@/utils/dates'
import { createRng, pick, randInt } from '@/utils/random'

/** Store name used across the commerce demo. */
export const STORE_NAME = 'Nova Retail'
export const FREE_SHIPPING_THRESHOLD = 999
export const SHIPPING_FEE = 79
export const GST_RATE = 0.18
export const COUPONS: Record<string, number> = { ASTRA10: 0.1, WELCOME5: 0.05 }

const PRODUCTS: Omit<Product, 'id' | 'createdAt'>[] = [
  { sku: 'AUD-1001', name: 'Aurora ANC Headphones', category: 'Audio', price: 7999, cost: 4300, stock: 42, reorderLevel: 15, status: 'active', icon: 'headphones', color: '#4f86ff', rating: 4.6, description: 'Over-ear wireless headphones with adaptive noise cancellation and 40-hour battery life.' },
  { sku: 'AUD-1002', name: 'Echo Buds Pro', category: 'Audio', price: 4499, cost: 2150, stock: 64, reorderLevel: 20, status: 'active', icon: 'earbuds', color: '#8b74ff', rating: 4.4, description: 'True wireless earbuds with ENC microphones, IPX5 rating and wireless charging case.' },
  { sku: 'AUD-1003', name: 'Nimbus Bluetooth Speaker', category: 'Audio', price: 3299, cost: 1650, stock: 23, reorderLevel: 12, status: 'active', icon: 'speaker', color: '#22d3ee', rating: 4.5, description: 'Portable 20W speaker with deep bass, IP67 waterproofing and 16-hour playback.' },
  { sku: 'WEA-2001', name: 'Pulse Smartwatch S2', category: 'Wearables', price: 12999, cost: 7200, stock: 6, reorderLevel: 10, status: 'active', icon: 'watch', color: '#f472b6', rating: 4.3, description: 'AMOLED smartwatch with GPS, SpO₂, sleep tracking and 7-day battery.' },
  { sku: 'WEA-2002', name: 'Stride Fitness Band', category: 'Wearables', price: 2799, cost: 1240, stock: 88, reorderLevel: 25, status: 'active', icon: 'band', color: '#2dd4bf', rating: 4.1, description: 'Lightweight fitness band with heart-rate monitoring and 14-day battery.' },
  { sku: 'COM-3001', name: 'Flux Mechanical Keyboard', category: 'Computing', price: 6499, cost: 3600, stock: 18, reorderLevel: 10, status: 'active', icon: 'keyboard', color: '#a78bfa', rating: 4.7, description: 'Hot-swappable 75% mechanical keyboard with tri-mode connectivity.' },
  { sku: 'COM-3002', name: 'Orbit Wireless Mouse', category: 'Computing', price: 1899, cost: 820, stock: 0, reorderLevel: 15, status: 'active', icon: 'mouse', color: '#60a5fa', rating: 4.2, description: 'Ergonomic silent-click wireless mouse with multi-device pairing.' },
  { sku: 'ACC-4001', name: 'Volt 65W GaN Charger', category: 'Accessories', price: 2999, cost: 1350, stock: 37, reorderLevel: 15, status: 'active', icon: 'charger', color: '#fbbf24', rating: 4.6, description: 'Compact 3-port GaN charger for laptops, tablets and phones.' },
  { sku: 'ACC-4002', name: 'Glide Laptop Sleeve 14"', category: 'Accessories', price: 1499, cost: 520, stock: 9, reorderLevel: 12, status: 'active', icon: 'sleeve', color: '#94a3b8', rating: 4.4, description: 'Water-resistant padded sleeve with a front accessory pocket.' },
  { sku: 'ACC-4003', name: 'Trail Commuter Backpack 28L', category: 'Accessories', price: 3999, cost: 1900, stock: 31, reorderLevel: 12, status: 'active', icon: 'backpack', color: '#fb923c', rating: 4.5, description: 'Weatherproof daypack with a 16" laptop compartment and USB pass-through.' },
  { sku: 'HOM-5001', name: 'Terra Ceramic Mug Set', category: 'Home & Living', price: 1199, cost: 480, stock: 54, reorderLevel: 20, status: 'active', icon: 'mug', color: '#f59e0b', rating: 4.8, description: 'Set of four hand-glazed 350 ml stoneware mugs.' },
  { sku: 'HOM-5002', name: 'Lumen Smart Desk Lamp', category: 'Home & Living', price: 3499, cost: 1700, stock: 27, reorderLevel: 10, status: 'active', icon: 'lamp', color: '#facc15', rating: 4.5, description: 'App-controlled LED desk lamp with adjustable color temperature.' },
  { sku: 'HOM-5003', name: 'Breeze Mini Air Purifier', category: 'Home & Living', price: 8999, cost: 5100, stock: 4, reorderLevel: 8, status: 'active', icon: 'purifier', color: '#34d399', rating: 4.4, description: 'HEPA H13 purifier for rooms up to 250 sq ft with PM2.5 display.' },
  { sku: 'ACC-4004', name: 'Halo LED Ring Light', category: 'Accessories', price: 2299, cost: 980, stock: 20, reorderLevel: 8, status: 'draft', icon: 'light', color: '#e879f9', rating: 0, description: '10" ring light with tripod stand for video calls and content creation.' },
]

const CUSTOMERS: [string, string, string][] = [
  ['Ananya Sharma', 'Bengaluru', 'Karnataka'],
  ['Rohit Verma', 'Mumbai', 'Maharashtra'],
  ['Ishita Banerjee', 'Kolkata', 'West Bengal'],
  ['Kabir Malhotra', 'New Delhi', 'Delhi'],
  ['Sneha Kulkarni', 'Pune', 'Maharashtra'],
  ['Arjun Reddy', 'Hyderabad', 'Telangana'],
  ['Meenakshi Iyer', 'Chennai', 'Tamil Nadu'],
  ['Vivek Patel', 'Ahmedabad', 'Gujarat'],
  ['Tanya Arora', 'Gurugram', 'Haryana'],
  ['Nikhil Menon', 'Kochi', 'Kerala'],
  ['Pooja Agarwal', 'Jaipur', 'Rajasthan'],
  ['Aditya Singh', 'Lucknow', 'Uttar Pradesh'],
  ['Divya Nair', 'Bengaluru', 'Karnataka'],
  ['Harsh Vardhan', 'Indore', 'Madhya Pradesh'],
  ['Sanya Kapoor', 'Chandigarh', 'Chandigarh'],
  ['Rahul Deshmukh', 'Nagpur', 'Maharashtra'],
  ['Fatima Sheikh', 'Hyderabad', 'Telangana'],
  ['Karan Mehta', 'Mumbai', 'Maharashtra'],
  ['Lavanya Krishnan', 'Coimbatore', 'Tamil Nadu'],
  ['Siddharth Rao', 'Noida', 'Uttar Pradesh'],
  ['Neha Joshi', 'Bhopal', 'Madhya Pradesh'],
  ['Aman Gill', 'Ludhiana', 'Punjab'],
]

// Relative popularity used when generating historical orders.
const POPULARITY = [9, 8, 6, 4, 7, 4, 5, 6, 4, 4, 5, 4, 2, 0]

export function createInitialCommerceState(): CommerceState {
  const rng = createRng(4242)
  const today = startOfDay()

  const products: Product[] = PRODUCTS.map((p, i) => ({ ...p, id: `prd_${i + 1}`, createdAt: addDays(today, -200 + i * 7).toISOString() }))

  const customers: Customer[] = CUSTOMERS.map(([name, city, state], i) => {
    const [first, last] = name.toLowerCase().split(' ')
    return {
      id: `cus_${i + 1}`,
      name,
      email: `${first}.${last}@example.in`,
      phone: `+91 9${String(8_100_000_00 + i * 7_331_19).padStart(9, '0').slice(0, 4)} ${String(10_000 + i * 3_917).slice(-5)}`,
      city,
      state,
      joinedAt: addDays(today, -randInt(rng, 40, 420)).toISOString(),
    }
  })

  const weighted = products.flatMap((p, i) => Array(POPULARITY[i]).fill(p) as Product[])
  const methods: PaymentMethod[] = ['UPI', 'UPI', 'UPI', 'UPI', 'Card', 'Card', 'Card', 'Cash on delivery', 'Cash on delivery', 'Net banking']
  // A handful of loyal customers order more often.
  const customerPool = [...customers, ...customers.slice(0, 6), ...customers.slice(0, 3)]

  const orders: Order[] = []
  let seq = 10380
  for (let d = 59; d >= 0; d--) {
    const date = addDays(today, -d)
    const weekend = date.getDay() === 0 || date.getDay() === 6
    const expected = (1.25 + (d < 30 ? 0.35 : 0)) * (weekend ? 1.35 : 1)
    const count = Math.max(0, Math.round(expected + (rng() - 0.5) * 2))
    for (let k = 0; k < count; k++) {
      seq += 1
      const customer = pick(rng, customerPool)
      const lineCount = rng() < 0.62 ? 1 : rng() < 0.8 ? 2 : 3
      const items: OrderItem[] = []
      for (let l = 0; l < lineCount; l++) {
        const p = pick(rng, weighted)
        if (items.some((i) => i.productId === p.id)) continue
        items.push({ productId: p.id, name: p.name, sku: p.sku, qty: rng() < 0.85 ? 1 : 2, price: p.price })
      }
      const createdAt = new Date(date.getTime() + (9 + rng() * 13) * HOUR)
      if (createdAt.getTime() > Date.now()) createdAt.setTime(Date.now() - randInt(rng, 5, 90) * 60_000)
      const method = pick(rng, methods)
      const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
      const discount = rng() < 0.12 ? Math.round(subtotal * 0.1) : 0
      const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE

      let status: OrderStatus
      if (d >= 6) status = rng() < 0.05 ? 'cancelled' : 'delivered'
      else if (d >= 3) status = rng() < 0.4 ? 'delivered' : 'shipped'
      else if (d >= 1) status = rng() < 0.5 ? 'shipped' : 'processing'
      else status = rng() < 0.55 ? 'pending' : 'processing'

      let payment: PaymentStatus = 'paid'
      if (method === 'Cash on delivery') payment = status === 'delivered' ? 'paid' : 'pending'
      if (status === 'cancelled') payment = method === 'Cash on delivery' ? 'pending' : 'refunded'
      if (status === 'pending' && method !== 'Cash on delivery' && rng() < 0.25) payment = 'failed'

      orders.push({
        id: `ORD-${seq}`,
        customerId: customer.id,
        items,
        subtotal,
        discount,
        shipping,
        total: subtotal - discount + shipping,
        status,
        payment,
        method,
        channel: rng() < 0.78 ? 'Storefront' : rng() < 0.7 ? 'Marketplace' : 'Phone',
        createdAt: createdAt.toISOString(),
        trackingNo: status === 'shipped' || status === 'delivered' ? `DLV${String(78_402_100 + seq * 37).slice(-9)}` : undefined,
        timeline: buildTimeline(status, createdAt, payment),
      })
    }
  }
  orders.reverse() // newest first

  // Recent stock movements, newest first, with running balances derived from current stock.
  const recent: Omit<StockMovement, 'balance'>[] = []
  for (const o of orders.slice(0, 14)) {
    if (o.status === 'cancelled') continue
    for (const item of o.items) recent.push({ id: `mov_${o.id}_${item.productId}`, at: o.createdAt, productId: item.productId, change: -item.qty, reason: 'Order', ref: o.id })
  }
  recent.splice(4, 0, { id: 'mov_restock_1', at: new Date(Date.now() - 26 * HOUR).toISOString(), productId: 'prd_2', change: 40, reason: 'Restock', ref: 'PO-7781' })
  recent.splice(9, 0, { id: 'mov_restock_2', at: new Date(Date.now() - 2 * DAY).toISOString(), productId: 'prd_11', change: 30, reason: 'Restock', ref: 'PO-7764' })
  recent.sort((a, b) => b.at.localeCompare(a.at))
  const running = new Map(products.map((p) => [p.id, p.stock]))
  const movements: StockMovement[] = recent.map((m) => {
    const balance = running.get(m.productId) ?? 0
    running.set(m.productId, balance - m.change)
    return { ...m, balance }
  })

  return { products, orders, customers, movements, cart: [] }
}

export function buildTimeline(status: OrderStatus, created: Date, payment: PaymentStatus): OrderEvent[] {
  const t = created.getTime()
  const at = (h: number) => new Date(Math.min(Date.now(), t + h * HOUR)).toISOString()
  const events: OrderEvent[] = [{ label: 'Order placed', at: at(0) }]
  if (payment === 'paid' || payment === 'refunded') events.push({ label: 'Payment confirmed', at: at(0.05) })
  if (payment === 'failed') events.push({ label: 'Payment failed', at: at(0.05), note: 'Customer notified to retry' })
  if (status === 'cancelled') {
    events.push({ label: 'Order cancelled', at: at(3), note: 'Cancelled at customer request' })
    if (payment === 'refunded') events.push({ label: 'Refund issued', at: at(5) })
    return events
  }
  if (status === 'pending') return events
  events.push({ label: 'Processing', at: at(2) })
  if (status === 'processing') return events
  events.push({ label: 'Shipped', at: at(20) })
  if (status === 'shipped') return events
  events.push({ label: 'Delivered', at: at(70) })
  return events
}
