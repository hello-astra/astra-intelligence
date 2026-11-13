import { useMemo, useDeferredValue, useState } from 'react'
import { LayoutGrid, List, PackageSearch, Plus, Star } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Form'
import { Panel } from '@/components/ui/Panel'
import { SearchInput } from '@/components/ui/SearchInput'
import { Segmented } from '@/components/ui/Segmented'
import { SortableTH, Table, TBody, TD, TH, THead, TR, type SortDirection } from '@/components/ui/Table'
import type { Product, ProductCategory } from '@/types/ecommerce'
import { formatINR } from '@/utils/format'
import type { CommerceViewProps } from '../context'
import { stockLevel, type StockLevel } from '../logic'
import { ProductIcon, StockBadge } from '../parts'

const CATEGORIES: (ProductCategory | 'all')[] = ['all', 'Audio', 'Wearables', 'Computing', 'Accessories', 'Home & Living']
type SortKey = 'name' | 'price' | 'stock' | 'margin'

export function ProductsView({ state, openProduct }: CommerceViewProps) {
  const [query, setQuery] = useState('')
  // Typing stays instant; the filtered list re-renders at low priority (interruptible) behind it.
  const deferredQuery = useDeferredValue(query)
  const [category, setCategory] = useState<ProductCategory | 'all'>('all')
  const [stock, setStock] = useState<StockLevel | 'all'>('all')
  const [status, setStatus] = useState<Product['status'] | 'all'>('all')
  const [layout, setLayout] = useState<'grid' | 'table'>('grid')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDirection }>({ key: 'name', dir: 'asc' })

  const products = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    const list = state.products.filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (stock === 'all' || stockLevel(p) === stock) &&
        (status === 'all' || p.status === status) &&
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)),
    )
    const value = (p: Product) => (sort.key === 'margin' ? (p.price - p.cost) / p.price : sort.key === 'name' ? p.name : p[sort.key])
    return [...list].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      const cmp = typeof va === 'string' ? va.localeCompare(String(vb)) : Number(va) - Number(vb)
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [state.products, deferredQuery, category, stock, status, sort])

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Product catalog</h2>
          <p className="text-xs text-fg-3">
            {state.products.length} products · {state.products.filter((p) => p.status === 'active').length} live on the storefront
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => openProduct('new')}>
          Add product
        </Button>
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name or SKU" className="w-full sm:w-60" />
          <Select controlSize="sm" value={category} onChange={(e) => setCategory(e.target.value as ProductCategory | 'all')} aria-label="Filter by category" wrapperClassName="w-40">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All categories' : c}
              </option>
            ))}
          </Select>
          <Select controlSize="sm" value={stock} onChange={(e) => setStock(e.target.value as StockLevel | 'all')} aria-label="Filter by stock" wrapperClassName="w-36">
            <option value="all">Any stock</option>
            <option value="ok">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </Select>
          <Select controlSize="sm" value={status} onChange={(e) => setStatus(e.target.value as Product['status'] | 'all')} aria-label="Filter by status" wrapperClassName="w-32">
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
          <Segmented
            className="ml-auto"
            size="sm"
            ariaLabel="Layout"
            value={layout}
            onChange={setLayout}
            options={[
              { value: 'grid', label: <span className="sr-only">Grid</span>, icon: LayoutGrid, title: 'Grid view' },
              { value: 'table', label: <span className="sr-only">Table</span>, icon: List, title: 'Table view' },
            ]}
          />
        </div>
      </Panel>

      {products.length === 0 ? (
        <Panel>
          <EmptyState icon={PackageSearch} title="No products match these filters" description="Clear the search or choose a different category." />
        </Panel>
      ) : layout === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => openProduct(p.id)}
              className="group flex flex-col rounded-xl border border-line bg-panel p-3.5 text-left transition-colors hover:border-line-strong"
            >
              <div className="flex items-start justify-between gap-2">
                <ProductIcon product={p} size={44} />
                <div className="flex flex-col items-end gap-1">
                  {p.status !== 'active' && <Badge tone={p.status === 'draft' ? 'neutral' : 'red'}>{p.status === 'draft' ? 'Draft' : 'Archived'}</Badge>}
                  <StockBadge product={p} />
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-fg group-hover:text-brand-soft">{p.name}</p>
              <p className="font-mono text-[11px] text-fg-3">
                {p.sku} · {p.category}
              </p>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-base font-semibold text-fg">{formatINR(p.price)}</span>
                {p.rating > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-fg-3">
                    <Star className="size-3 fill-amber-300 text-amber-300" aria-hidden /> {p.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Panel flush>
          <Table minWidth={760}>
            <THead>
              <tr>
                <SortableTH label="Product" active={sort.key === 'name'} direction={sort.dir} onSort={() => toggleSort('name')} />
                <TH>Category</TH>
                <SortableTH label="Price" align="right" active={sort.key === 'price'} direction={sort.dir} onSort={() => toggleSort('price')} />
                <SortableTH label="Margin" align="right" active={sort.key === 'margin'} direction={sort.dir} onSort={() => toggleSort('margin')} />
                <SortableTH label="Stock" align="right" active={sort.key === 'stock'} direction={sort.dir} onSort={() => toggleSort('stock')} />
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {products.map((p) => (
                <TR key={p.id} className="cursor-pointer" onClick={() => openProduct(p.id)}>
                  <TD>
                    <span className="flex items-center gap-2.5">
                      <ProductIcon product={p} size={30} />
                      <span>
                        <span className="block font-medium text-fg">{p.name}</span>
                        <span className="block font-mono text-[11px] text-fg-3">{p.sku}</span>
                      </span>
                    </span>
                  </TD>
                  <TD>{p.category}</TD>
                  <TD align="right" className="text-fg">
                    {formatINR(p.price)}
                  </TD>
                  <TD align="right">{(((p.price - p.cost) / p.price) * 100).toFixed(0)}%</TD>
                  <TD align="right">{p.stock}</TD>
                  <TD>
                    {p.status === 'active' ? <StockBadge product={p} /> : <Badge tone={p.status === 'draft' ? 'neutral' : 'red'}>{p.status === 'draft' ? 'Draft' : 'Archived'}</Badge>}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Panel>
      )}
    </div>
  )
}
