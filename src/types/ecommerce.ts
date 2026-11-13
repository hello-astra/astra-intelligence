export type ProductCategory = 'Audio' | 'Wearables' | 'Computing' | 'Accessories' | 'Home & Living'
export type ProductStatus = 'active' | 'draft' | 'archived'
export type ProductIconKey =
  | 'headphones'
  | 'earbuds'
  | 'speaker'
  | 'watch'
  | 'band'
  | 'keyboard'
  | 'mouse'
  | 'charger'
  | 'sleeve'
  | 'mug'
  | 'lamp'
  | 'purifier'
  | 'backpack'
  | 'light'
  | 'box'

export interface Product {
  id: string
  sku: string
  name: string
  category: ProductCategory
  /** Selling price in INR, GST inclusive. */
  price: number
  cost: number
  stock: number
  reorderLevel: number
  status: ProductStatus
  description: string
  icon: ProductIconKey
  color: string
  rating: number
  createdAt: string
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded'
export type PaymentMethod = 'UPI' | 'Card' | 'Net banking' | 'Cash on delivery'

export interface OrderItem {
  productId: string
  name: string
  sku: string
  qty: number
  price: number
}

export interface OrderEvent {
  label: string
  at: string
  note?: string
}

export interface Order {
  id: string
  customerId: string
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  status: OrderStatus
  payment: PaymentStatus
  method: PaymentMethod
  channel: 'Storefront' | 'Marketplace' | 'Phone'
  createdAt: string
  trackingNo?: string
  timeline: OrderEvent[]
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  city: string
  state: string
  joinedAt: string
}

export interface StockMovement {
  id: string
  at: string
  productId: string
  change: number
  reason: 'Order' | 'Restock' | 'Adjustment' | 'Cancellation' | 'Return'
  ref?: string
  balance: number
}

export interface CartLine {
  productId: string
  qty: number
}

export interface CommerceState {
  products: Product[]
  orders: Order[]
  customers: Customer[]
  movements: StockMovement[]
  cart: CartLine[]
}
