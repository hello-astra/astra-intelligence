import type { LucideIcon } from 'lucide-react'
import {
  Backpack,
  Box,
  CheckCircle2,
  Clock,
  Coffee,
  Headphones,
  Keyboard,
  Lamp,
  Laptop,
  Lightbulb,
  Mouse,
  Package,
  PackageCheck,
  Plug,
  RotateCcw,
  Speaker,
  Truck,
  Watch,
  Wind,
  XCircle,
  TriangleAlert,
  Activity,
  Music,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { OrderStatus, PaymentStatus, Product, ProductIconKey } from '@/types/ecommerce'
import { cn } from '@/utils/cn'
import { stockLevel } from './logic'

const ICONS: Record<ProductIconKey, LucideIcon> = {
  headphones: Headphones,
  earbuds: Music,
  speaker: Speaker,
  watch: Watch,
  band: Activity,
  keyboard: Keyboard,
  mouse: Mouse,
  charger: Plug,
  sleeve: Laptop,
  mug: Coffee,
  lamp: Lamp,
  purifier: Wind,
  backpack: Backpack,
  light: Lightbulb,
  box: Box,
}

export function ProductIcon({ product, size = 40, className }: { product: Pick<Product, 'icon' | 'color'>; size?: number; className?: string }) {
  const Icon = ICONS[product.icon] ?? Box
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10', className)}
      style={{ width: size, height: size, background: `linear-gradient(140deg, ${product.color}3d, ${product.color}10)` }}
      aria-hidden
    >
      <Icon style={{ color: product.color, width: size * 0.48, height: size * 0.48 }} strokeWidth={1.6} />
    </span>
  )
}

const ORDER_STATUS: Record<OrderStatus, { label: string; tone: 'amber' | 'blue' | 'violet' | 'green' | 'red'; icon: LucideIcon }> = {
  pending: { label: 'Pending', tone: 'amber', icon: Clock },
  processing: { label: 'Processing', tone: 'blue', icon: Package },
  shipped: { label: 'Shipped', tone: 'violet', icon: Truck },
  delivered: { label: 'Delivered', tone: 'green', icon: PackageCheck },
  cancelled: { label: 'Cancelled', tone: 'red', icon: XCircle },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status]
  return (
    <Badge tone={s.tone} icon={<s.icon className="size-3" aria-hidden />}>
      {s.label}
    </Badge>
  )
}

const PAYMENT: Record<PaymentStatus, { label: string; tone: 'green' | 'amber' | 'red' | 'neutral'; icon: LucideIcon }> = {
  paid: { label: 'Paid', tone: 'green', icon: CheckCircle2 },
  pending: { label: 'Pending', tone: 'amber', icon: Clock },
  failed: { label: 'Failed', tone: 'red', icon: XCircle },
  refunded: { label: 'Refunded', tone: 'neutral', icon: RotateCcw },
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT[status]
  return (
    <Badge tone={s.tone} icon={<s.icon className="size-3" aria-hidden />}>
      {s.label}
    </Badge>
  )
}

export function StockBadge({ product }: { product: Pick<Product, 'stock' | 'reorderLevel'> }) {
  const level = stockLevel(product)
  if (level === 'out')
    return (
      <Badge tone="red" icon={<XCircle className="size-3" aria-hidden />}>
        Out of stock
      </Badge>
    )
  if (level === 'low')
    return (
      <Badge tone="amber" icon={<TriangleAlert className="size-3" aria-hidden />}>
        Low · {product.stock}
      </Badge>
    )
  return <Badge tone="green">In stock · {product.stock}</Badge>
}

