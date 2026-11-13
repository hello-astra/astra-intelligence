import { useState, type FormEvent } from 'react'
import { Minus, Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import type { CommerceState, Product, ProductCategory, ProductIconKey, ProductStatus } from '@/types/ecommerce'
import { formatINR } from '@/utils/format'
import { nextSequentialId, uid } from '@/utils/id'
import { CATEGORY_PREFIX, restock } from './logic'
import { ProductIcon, StockBadge } from './parts'

const CATEGORIES: ProductCategory[] = ['Audio', 'Wearables', 'Computing', 'Accessories', 'Home & Living']
const DEFAULT_ICON: Record<ProductCategory, ProductIconKey> = { Audio: 'speaker', Wearables: 'watch', Computing: 'keyboard', Accessories: 'box', 'Home & Living': 'lamp' }
const COLORS = ['#4f86ff', '#8b74ff', '#22d3ee', '#f472b6', '#2dd4bf', '#fbbf24', '#fb923c', '#34d399']

interface Props {
  productId: string | 'new' | null
  state: CommerceState
  onClose: () => void
  onSave: (next: CommerceState, message: string) => void
}

export function ProductDrawer({ productId, state, onClose, onSave }: Props) {
  const product = productId && productId !== 'new' ? state.products.find((p) => p.id === productId) : undefined
  return (
    <Modal
      open={productId !== null}
      onClose={onClose}
      variant="drawer"
      title={product ? 'Edit product' : 'Add product'}
      description={product ? `${product.sku} · ${product.category}` : 'New products are saved to the catalog immediately.'}
      leading={product ? <ProductIcon product={product} size={36} /> : undefined}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="product-form" leftIcon={<Save className="size-3.5" />}>
            {product ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      {productId !== null && <ProductForm key={productId} product={product} state={state} onSave={onSave} />}
    </Modal>
  )
}

interface FormState {
  name: string
  category: ProductCategory
  price: string
  cost: string
  stock: string
  reorderLevel: string
  status: ProductStatus
  description: string
}

function ProductForm({ product, state, onSave }: { product?: Product; state: CommerceState; onSave: Props['onSave'] }) {
  const [form, setForm] = useState<FormState>(() => ({
    name: product?.name ?? '',
    category: product?.category ?? 'Audio',
    price: product ? String(product.price) : '',
    cost: product ? String(product.cost) : '',
    stock: product ? String(product.stock) : '0',
    reorderLevel: product ? String(product.reorderLevel) : '10',
    status: product?.status ?? 'active',
    description: product?.description ?? '',
  }))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))
  const price = Number(form.price)
  const cost = Number(form.cost)
  const margin = price > 0 && cost >= 0 ? ((price - cost) / price) * 100 : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (form.name.trim().length < 3) errs.name = 'Enter a product name (3+ characters).'
    else if (state.products.some((p) => p.id !== product?.id && p.name.toLowerCase() === form.name.trim().toLowerCase())) errs.name = 'A product with this name already exists.'
    if (!Number.isFinite(price) || price <= 0) errs.price = 'Price must be greater than zero.'
    if (!Number.isFinite(cost) || cost < 0) errs.cost = 'Cost cannot be negative.'
    else if (Number.isFinite(price) && cost > price) errs.cost = 'Cost is higher than the selling price.'
    const stock = Number(form.stock)
    if (!Number.isInteger(stock) || stock < 0) errs.stock = 'Stock must be a whole number ≥ 0.'
    const reorder = Number(form.reorderLevel)
    if (!Number.isInteger(reorder) || reorder < 0) errs.reorderLevel = 'Reorder level must be a whole number ≥ 0.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    if (product) {
      const diff = stock - product.stock
      let next: CommerceState = {
        ...state,
        products: state.products.map((p) =>
          p.id === product.id
            ? { ...p, name: form.name.trim(), category: form.category, price, cost, reorderLevel: reorder, status: form.status, description: form.description.trim() }
            : p,
        ),
      }
      if (diff !== 0) next = restock(next, product.id, diff, 'Adjustment', 'Manual edit')
      onSave(next, `${form.name.trim()} updated${diff !== 0 ? ` · stock ${diff > 0 ? '+' : ''}${diff}` : ''}`)
    } else {
      const prefix = CATEGORY_PREFIX[form.category]
      const sku = nextSequentialId(
        state.products.map((p) => p.sku),
        prefix,
        Number(`${CATEGORIES.indexOf(form.category) + 1}001`),
      )
      const created: Product = {
        id: uid('prd'),
        sku,
        name: form.name.trim(),
        category: form.category,
        price,
        cost,
        stock: 0,
        reorderLevel: reorder,
        status: form.status,
        description: form.description.trim() || 'New product added from the admin dashboard.',
        icon: DEFAULT_ICON[form.category],
        color: COLORS[state.products.length % COLORS.length],
        rating: 0,
        createdAt: new Date().toISOString(),
      }
      let next: CommerceState = { ...state, products: [created, ...state.products] }
      if (stock > 0) next = restock(next, created.id, stock, 'Restock', 'Initial stock')
      onSave(next, `${created.name} added as ${sku}`)
    }
  }

  const stockNum = Number(form.stock) || 0
  return (
    <form id="product-form" onSubmit={submit} noValidate className="grid gap-4">
      <Field label="Product name" htmlFor="pf-name" error={errors.name} required>
        <Input id="pf-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Nimbus Mini Speaker" aria-invalid={Boolean(errors.name)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="pf-category">
          <Select id="pf-category" value={form.category} onChange={(e) => set('category', e.target.value as ProductCategory)} disabled={Boolean(product)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor="pf-status">
          <Select id="pf-status" value={form.status} onChange={(e) => set('status', e.target.value as ProductStatus)}>
            <option value="active">Active — visible in store</option>
            <option value="draft">Draft — hidden</option>
            <option value="archived">Archived</option>
          </Select>
        </Field>
        <Field label="Selling price (₹, incl. GST)" htmlFor="pf-price" error={errors.price} required>
          <Input id="pf-price" type="number" min={1} inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} aria-invalid={Boolean(errors.price)} />
        </Field>
        <Field label="Unit cost (₹)" htmlFor="pf-cost" error={errors.cost} hint={margin !== null ? `Gross margin ${margin.toFixed(1)}% · ${formatINR(price - cost)} per unit` : undefined} required>
          <Input id="pf-cost" type="number" min={0} inputMode="decimal" value={form.cost} onChange={(e) => set('cost', e.target.value)} aria-invalid={Boolean(errors.cost)} />
        </Field>
        <Field label="Units in stock" htmlFor="pf-stock" error={errors.stock}>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="secondary" aria-label="Decrease stock" onClick={() => set('stock', String(Math.max(0, stockNum - 1)))} className="px-2.5">
              <Minus className="size-3.5" />
            </Button>
            <Input id="pf-stock" type="number" min={0} value={form.stock} onChange={(e) => set('stock', e.target.value)} className="text-center" aria-invalid={Boolean(errors.stock)} />
            <Button type="button" size="sm" variant="secondary" aria-label="Increase stock" onClick={() => set('stock', String(stockNum + 1))} className="px-2.5">
              <Plus className="size-3.5" />
            </Button>
          </div>
        </Field>
        <Field label="Reorder level" htmlFor="pf-reorder" error={errors.reorderLevel} hint="Low-stock alert threshold">
          <Input id="pf-reorder" type="number" min={0} value={form.reorderLevel} onChange={(e) => set('reorderLevel', e.target.value)} aria-invalid={Boolean(errors.reorderLevel)} />
        </Field>
      </div>
      <div className="flex items-center gap-2 text-xs text-fg-3">
        Stock status after saving: <StockBadge product={{ stock: stockNum, reorderLevel: Number(form.reorderLevel) || 0 }} />
      </div>
      <Field label="Description" htmlFor="pf-desc">
        <Textarea id="pf-desc" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Short product description shown on the storefront" />
      </Field>
      {product && <p className="text-xs text-fg-4">Stock changes are recorded as inventory adjustments.</p>}
    </form>
  )
}
