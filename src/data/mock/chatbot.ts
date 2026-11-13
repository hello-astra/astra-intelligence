/**
 * Knowledge base for the Astra Assist demo (fictional store "Nova Retail").
 * The rule-based engine answers only from this data, and cites the source of
 * every policy answer — the same pattern a retrieval-augmented LLM would follow.
 */
import { addDays, startOfDay } from '@/utils/dates'
import { formatDateShort } from '@/utils/format'

export const BRAND = 'Nova Retail'
export const AGENT_NAME = 'Priya S.'

export type KbOrderStatus = 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled'

export interface KbOrder {
  id: string
  customer: string
  items: { name: string; qty: number; price: number }[]
  total: number
  status: KbOrderStatus
  payment: string
  carrier?: string
  tracking?: string
  /** Human-readable date strings relative to today. */
  placedOn: string
  eta?: string
  deliveredOn?: string
  returnUntil?: string
  cancelledOn?: string
}

export function buildOrders(): Record<string, KbOrder> {
  const today = startOfDay()
  const d = (n: number) => formatDateShort(addDays(today, n))
  const list: KbOrder[] = [
    { id: 'ORD-10482', customer: 'Ananya Sharma', items: [{ name: 'Aurora ANC Headphones', qty: 1, price: 7999 }], total: 7999, status: 'out_for_delivery', payment: 'UPI', carrier: 'SwiftShip Logistics', tracking: 'SS778120394', placedOn: d(-3), eta: 'today by 8 PM' },
    { id: 'ORD-10477', customer: 'Rohit Verma', items: [{ name: 'Pulse Smartwatch S2', qty: 1, price: 12999 }, { name: 'Volt 65W GaN Charger', qty: 1, price: 2999 }], total: 15998, status: 'delivered', payment: 'Credit card', carrier: 'SwiftShip Logistics', tracking: 'SS778097112', placedOn: d(-7), deliveredOn: d(-3), returnUntil: d(4) },
    { id: 'ORD-10491', customer: 'Kabir Malhotra', items: [{ name: 'Flux Mechanical Keyboard', qty: 1, price: 6499 }], total: 6499, status: 'processing', payment: 'UPI', placedOn: d(0), eta: d(3) },
    { id: 'ORD-10468', customer: 'Sneha Kulkarni', items: [{ name: 'Echo Buds Pro', qty: 2, price: 4499 }], total: 8998, status: 'shipped', payment: 'Debit card', carrier: 'BlueRiver Express', tracking: 'BR55102877', placedOn: d(-2), eta: d(2) },
    { id: 'ORD-10455', customer: 'Ishita Banerjee', items: [{ name: 'Breeze Mini Air Purifier', qty: 1, price: 8999 }], total: 8999, status: 'cancelled', payment: 'UPI', placedOn: d(-11), cancelledOn: d(-10) },
  ]
  return Object.fromEntries(list.map((o) => [o.id, o]))
}

export interface KbProduct {
  id: string
  name: string
  keywords: string[]
  price: number
  category: string
  highlights: string[]
  warranty: string
}

export const PRODUCTS: KbProduct[] = [
  { id: 'aurora', name: 'Aurora ANC Headphones', keywords: ['aurora', 'headphone', 'headphones', 'anc', 'over-ear'], price: 7999, category: 'Audio', highlights: ['Adaptive noise cancellation', '40-hour battery', 'Multipoint Bluetooth 5.3'], warranty: '1-year manufacturer warranty' },
  { id: 'echo', name: 'Echo Buds Pro', keywords: ['echo', 'buds', 'earbuds', 'earbud', 'tws', 'earphones'], price: 4499, category: 'Audio', highlights: ['ENC calling mics', 'IPX5 sweat resistance', 'Wireless charging case'], warranty: '1-year manufacturer warranty' },
  { id: 'nimbus', name: 'Nimbus Bluetooth Speaker', keywords: ['nimbus', 'speaker', 'speakers'], price: 3299, category: 'Audio', highlights: ['20W output', 'IP67 waterproof', '16-hour playback'], warranty: '1-year manufacturer warranty' },
  { id: 'pulse', name: 'Pulse Smartwatch S2', keywords: ['pulse', 'smartwatch', 'watch'], price: 12999, category: 'Wearables', highlights: ['AMOLED display', 'Built-in GPS', '7-day battery'], warranty: '1-year manufacturer warranty' },
  { id: 'flux', name: 'Flux Mechanical Keyboard', keywords: ['flux', 'keyboard', 'mechanical'], price: 6499, category: 'Computing', highlights: ['Hot-swappable switches', 'Tri-mode connectivity', '75% layout'], warranty: '1-year manufacturer warranty' },
  { id: 'breeze', name: 'Breeze Mini Air Purifier', keywords: ['breeze', 'purifier', 'air purifier'], price: 8999, category: 'Home & Living', highlights: ['HEPA H13 filter', 'Covers 250 sq ft', 'PM2.5 display'], warranty: '1-year warranty · free installation in metro cities' },
  { id: 'volt', name: 'Volt 65W GaN Charger', keywords: ['volt', 'charger', 'gan', 'adapter'], price: 2999, category: 'Accessories', highlights: ['3 ports (2× USB-C, 1× USB-A)', 'Charges laptops', 'Foldable plug'], warranty: '1-year manufacturer warranty' },
]

export const POLICIES = {
  returns: {
    title: 'Returns & refunds policy',
    text: 'Unused items in original packaging can be returned within **7 days of delivery**. Products with a manufacturing defect can be replaced within **30 days**. Refunds are processed within 2 business days of the item passing inspection and reach the original payment method in 5–7 business days (UPI usually 2–3).',
  },
  shipping: {
    title: 'Shipping policy',
    text: 'Delivery is **free on orders above ₹999** (otherwise ₹79). Standard delivery takes 3–5 business days; **Express delivery** (1–2 days) is available in metro cities for ₹149. Cash on delivery is available for orders up to ₹20,000.',
  },
  payments: {
    title: 'Payments & EMI',
    text: 'We accept UPI, credit and debit cards, net banking and cash on delivery. **No-cost EMI** is available on orders above ₹6,000 with select cards. If money was debited but the order failed, the amount is auto-reversed to your account within 3–5 business days.',
  },
  warranty: {
    title: 'Warranty & services',
    text: 'All electronics carry a **1-year manufacturer warranty**. **Nova Care+** extends cover by one more year (₹499–₹1,499 depending on the product). We offer free installation for air purifiers and setup help for smart devices in metro cities.',
  },
  business: {
    title: 'Corporate & bulk orders',
    text: 'For orders of 10+ units we offer volume pricing (typically 5–15% off), GST invoices, custom branding for gifting and a dedicated account manager.',
  },
  support: {
    title: 'Support hours',
    text: 'Our human support team is available **9 AM – 9 PM IST, seven days a week**. Astra Assist is available 24/7.',
  },
} as const

export const CONVERSATION_STARTERS = [
  'Where is my order ORD-10482?',
  'I want a refund for ORD-10477',
  'What is your return policy?',
  'Tell me about the Aurora headphones',
  'We need 150 smartwatches for corporate gifting',
  'This is the third time my delivery is late!',
]
