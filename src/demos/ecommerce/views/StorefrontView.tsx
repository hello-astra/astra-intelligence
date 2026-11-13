import { useState } from 'react'
import { ArrowRight, CheckCircle2, FlaskConical, Minus, PackageCheck, Plus, RefreshCw, ShoppingCart, Star, Tag, Trash2, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Form'
import { Panel } from '@/components/ui/Panel'
import { useToast } from '@/components/ui/toast-context'
import { COUPONS, FREE_SHIPPING_THRESHOLD, STORE_NAME } from '@/data/mock/ecommerce'
import type { Order, PaymentMethod } from '@/types/ecommerce'
import { cn } from '@/utils/cn'
import { formatINR } from '@/utils/format'
import type { CommerceViewProps } from '../context'
import { cartTotals, placeOrder, type PlacedOrder } from '../logic'
import { ProductIcon } from '../parts'

const METHODS: PaymentMethod[] = ['UPI', 'Card', 'Net banking', 'Cash on delivery']

export function StorefrontView({ state, setState, openOrder, goTo }: CommerceViewProps) {
  const toast = useToast()
  const [customerId, setCustomerId] = useState(state.customers[0]?.id ?? 'guest')
  const [method, setMethod] = useState<PaymentMethod>('UPI')
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [result, setResult] = useState<{ order: Order; log: PlacedOrder['log'] } | null>(null)
  const [placing, setPlacing] = useState(false)

  const products = state.products.filter((p) => p.status === 'active')
  const inCart = (id: string) => state.cart.find((l) => l.productId === id)?.qty ?? 0
  const totals = cartTotals(state.cart, state.products, coupon)

  const setQty = (productId: string, qty: number) => {
    const p = state.products.find((x) => x.id === productId)
    if (!p) return
    const bounded = Math.max(0, Math.min(qty, p.stock))
    setState((s) => ({
      ...s,
      cart: bounded === 0 ? s.cart.filter((l) => l.productId !== productId) : s.cart.some((l) => l.productId === productId) ? s.cart.map((l) => (l.productId === productId ? { ...l, qty: bounded } : l)) : [...s.cart, { productId, qty: bounded }],
    }))
  }

  const add = (productId: string) => {
    const p = state.products.find((x) => x.id === productId)
    if (!p) return
    if (inCart(productId) >= p.stock) {
      toast({ title: 'Stock limit reached', description: `Only ${p.stock} × ${p.name} available.`, tone: 'warning' })
      return
    }
    setQty(productId, inCart(productId) + 1)
    setResult(null)
  }

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    if (COUPONS[code] === undefined) {
      setCouponError('Invalid code. Try ASTRA10.')
      setCoupon('')
      return
    }
    setCoupon(code)
    setCouponError(null)
  }

  const checkout = () => {
    setPlacing(true)
    window.setTimeout(() => {
      const placed = placeOrder(state, customerId, method, coupon)
      setPlacing(false)
      if ('error' in placed) {
        toast({ title: 'Order could not be placed', description: placed.error, tone: 'error' })
        return
      }
      setState(placed.state)
      setResult({ order: placed.order, log: placed.log })
      setCoupon('')
      setCouponInput('')
      const alerts = placed.log.filter((l) => l.level !== 'ok')
      toast({
        title: `${placed.order.id} placed`,
        description: `${formatINR(placed.order.total)} · inventory and analytics updated${alerts.length ? ` · ${alerts.length} low-stock alert${alerts.length === 1 ? '' : 's'}` : ''}.`,
      })
    }, 700)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">{STORE_NAME} storefront</h2>
          <p className="text-xs text-fg-3">What customers see. Orders placed here flow straight into Orders, Inventory and Sales.</p>
        </div>
        <Badge tone="amber" icon={<FlaskConical className="size-3" />}>
          Simulated checkout — no payment is processed
        </Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {products.map((p) => {
            const qty = inCart(p.id)
            const soldOut = p.stock === 0
            return (
              <article key={p.id} className={cn('flex flex-col rounded-xl border bg-panel p-3.5', qty > 0 ? 'border-brand/40' : 'border-line')}>
                <div className="flex items-start gap-3">
                  <ProductIcon product={p} size={48} />
                  <div className="min-w-0">
                    <h3 className="text-sm leading-snug font-medium text-fg">{p.name}</h3>
                    {p.rating > 0 && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-fg-3">
                        <Star className="size-3 fill-amber-300 text-amber-300" aria-hidden /> {p.rating.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-fg-3">{p.description}</p>
                <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                  <div>
                    <p className="text-base font-semibold text-fg">{formatINR(p.price)}</p>
                    <p className={cn('text-[11px]', soldOut ? 'text-red-300' : p.stock <= p.reorderLevel ? 'text-amber-300' : 'text-fg-4')}>
                      {soldOut ? 'Out of stock' : p.stock <= p.reorderLevel ? `Only ${p.stock} left` : 'In stock'}
                    </p>
                  </div>
                  {qty > 0 ? (
                    <div className="flex items-center gap-1 rounded-lg bg-ink/[0.05] p-0.5 ring-1 ring-ink/10">
                      <button type="button" aria-label={`Remove one ${p.name}`} onClick={() => setQty(p.id, qty - 1)} className="inline-flex size-7 items-center justify-center rounded-md text-fg-2 hover:bg-ink/[0.08]">
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm text-fg tabular-nums">{qty}</span>
                      <button
                        type="button"
                        aria-label={`Add one ${p.name}`}
                        onClick={() => add(p.id)}
                        disabled={qty >= p.stock}
                        className="inline-flex size-7 items-center justify-center rounded-md text-fg-2 hover:bg-ink/[0.08] disabled:opacity-30"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Button size="xs" variant={soldOut ? 'ghost' : 'secondary'} disabled={soldOut} onClick={() => add(p.id)} leftIcon={<ShoppingCart className="size-3" />}>
                      {soldOut ? 'Sold out' : 'Add to cart'}
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <div className="xl:sticky xl:top-0 xl:self-start">
          {result ? (
            <Panel>
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="size-5" aria-hidden />
                <p className="text-sm font-semibold">Order {result.order.id} placed</p>
              </div>
              <p className="mt-1 text-xs text-fg-3">
                {formatINR(result.order.total)} · {result.order.method} · payment {result.order.payment === 'paid' ? 'captured (simulated)' : 'due on delivery'}
              </p>
              <div className="mt-4 rounded-lg border border-line bg-sunken p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-fg-3 uppercase">
                  <RefreshCw className="size-3" aria-hidden /> Inventory sync
                </p>
                <ul className="mt-2 space-y-1.5 font-mono text-[11.5px]">
                  {result.log.map((l) => (
                    <li key={l.productId} className="flex flex-wrap items-center gap-1.5 text-fg-2">
                      <span className="text-fg">{l.name}</span>
                      <span>
                        {l.before} → {l.after}
                      </span>
                      {l.level !== 'ok' && (
                        <span className={cn('inline-flex items-center gap-1 font-sans text-[11px]', l.level === 'out' ? 'text-red-300' : 'text-amber-300')}>
                          <TriangleAlert className="size-3" aria-hidden /> {l.level === 'out' ? 'now out of stock' : 'low-stock alert raised'}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-fg-4">Sales analytics and the orders queue were updated in the same transaction.</p>
              </div>
              <div className="mt-4 grid gap-2">
                <Button size="sm" onClick={() => openOrder(result.order.id)} rightIcon={<ArrowRight className="size-3.5" />}>
                  View order
                </Button>
                <Button size="sm" variant="secondary" leftIcon={<PackageCheck className="size-3.5" />} onClick={() => goTo('inventory')}>
                  Check inventory
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
                  Continue shopping
                </Button>
              </div>
            </Panel>
          ) : (
            <Panel title={`Cart · ${state.cart.reduce((s, l) => s + l.qty, 0)} items`}>
              {state.cart.length === 0 ? (
                <p className="py-6 text-center text-sm text-fg-3">Your cart is empty. Add a product to simulate an order.</p>
              ) : (
                <div className="space-y-4">
                  <ul className="space-y-2.5">
                    {state.cart.map((l) => {
                      const p = state.products.find((x) => x.id === l.productId)
                      if (!p) return null
                      return (
                        <li key={l.productId} className="flex items-center gap-2.5">
                          <ProductIcon product={p} size={30} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] text-fg">{p.name}</span>
                            <span className="block text-[11px] text-fg-3">
                              {l.qty} × {formatINR(p.price)}
                            </span>
                          </span>
                          <span className="text-[13px] text-fg tabular-nums">{formatINR(p.price * l.qty)}</span>
                          <button type="button" aria-label={`Remove ${p.name} from cart`} onClick={() => setQty(p.id, 0)} className="text-fg-4 hover:text-red-300">
                            <Trash2 className="size-3.5" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="grid gap-3">
                    <Field label="Customer" htmlFor="sf-customer">
                      <Select id="sf-customer" controlSize="sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                        {state.customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {c.city}
                          </option>
                        ))}
                        <option value="guest">Guest checkout</option>
                      </Select>
                    </Field>
                    <Field label="Payment method" htmlFor="sf-method">
                      <Select id="sf-method" controlSize="sm" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                        {METHODS.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Coupon" htmlFor="sf-coupon" error={couponError} hint={coupon ? `${coupon} applied` : 'Try ASTRA10 for 10% off'}>
                      <div className="flex gap-2">
                        <Input id="sf-coupon" controlSize="sm" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Code" aria-invalid={Boolean(couponError)} />
                        <Button size="sm" variant="secondary" onClick={applyCoupon} leftIcon={<Tag className="size-3.5" />}>
                          Apply
                        </Button>
                      </div>
                    </Field>
                  </div>
                  <dl className="space-y-1 border-t border-line pt-3 text-[13px]">
                    <div className="flex justify-between text-fg-2">
                      <dt>Subtotal</dt>
                      <dd className="tabular-nums">{formatINR(totals.subtotal)}</dd>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-emerald-300">
                        <dt>Discount ({coupon})</dt>
                        <dd className="tabular-nums">−{formatINR(totals.discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between text-fg-2">
                      <dt>Shipping</dt>
                      <dd className="tabular-nums">{totals.shipping === 0 ? 'Free' : formatINR(totals.shipping)}</dd>
                    </div>
                    <div className="flex justify-between text-[11px] text-fg-4">
                      <dt>Includes GST (18%)</dt>
                      <dd className="tabular-nums">{formatINR(totals.gstIncluded)}</dd>
                    </div>
                    <div className="flex justify-between pt-1 text-sm font-semibold text-fg">
                      <dt>Total</dt>
                      <dd className="tabular-nums">{formatINR(totals.total)}</dd>
                    </div>
                    {totals.shipping > 0 && <p className="text-[11px] text-fg-4">Free shipping on orders above {formatINR(FREE_SHIPPING_THRESHOLD)}.</p>}
                  </dl>
                  <Button className="w-full" onClick={checkout} loading={placing} leftIcon={!placing ? <ShoppingCart className="size-4" /> : undefined}>
                    {placing ? 'Placing order…' : `Place order · ${formatINR(totals.total)}`}
                  </Button>
                  <p className="text-center text-[11px] text-fg-4">Simulated payment — no real transaction takes place.</p>
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
