import { useState } from 'react'
import { Boxes, LayoutDashboard, Package, ReceiptText, Store, Users } from 'lucide-react'
import { useToast } from '@/components/ui/toast-context'
import { SOLUTION_BY_SLUG } from '@/data/constants/solutions'
import { createInitialCommerceState } from '@/data/mock/ecommerce'
import { usePersistentState } from '@/hooks/usePersistentState'
import { DemoShell } from '../shared/DemoShell'
import type { DemoView } from '../shared/demo-context'
import type { CommerceView, CommerceViewProps } from './context'
import { stockLevel } from './logic'
import { OrderDetailModal } from './OrderDetailModal'
import { ProductDrawer } from './ProductDrawer'
import { CustomersView } from './views/CustomersView'
import { InventoryView } from './views/InventoryView'
import { OrdersView } from './views/OrdersView'
import { OverviewView } from './views/OverviewView'
import { ProductsView } from './views/ProductsView'
import { StorefrontView } from './views/StorefrontView'

const solution = SOLUTION_BY_SLUG['ecommerce-inventory']

export default function EcommerceDemo() {
  const toast = useToast()
  const [state, setState, reset] = usePersistentState('ecommerce', createInitialCommerceState, 1)
  const [view, setView] = useState<CommerceView>('overview')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [productId, setProductId] = useState<string | 'new' | null>(null)

  const attention = state.products.filter((p) => p.status === 'active' && stockLevel(p) !== 'ok').length
  const pending = state.orders.filter((o) => o.status === 'pending').length
  const cartCount = state.cart.reduce((s, l) => s + l.qty, 0)

  const views: DemoView<CommerceView>[] = [
    { id: 'overview', label: 'Sales overview', icon: LayoutDashboard },
    { id: 'storefront', label: 'Storefront', icon: Store, badge: cartCount || undefined },
    { id: 'orders', label: 'Orders', icon: ReceiptText, badge: pending || undefined },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes, badge: attention || undefined },
    { id: 'customers', label: 'Customers', icon: Users },
  ]

  const props: CommerceViewProps = {
    state,
    setState,
    goTo: setView,
    openOrder: setOrderId,
    openProduct: setProductId,
  }

  return (
    <DemoShell
      solution={solution}
      views={views}
      activeView={view}
      onViewChange={setView}
      onReset={() => {
        reset()
        setView('overview')
        setOrderId(null)
        setProductId(null)
      }}
    >
      {view === 'overview' && <OverviewView {...props} />}
      {view === 'storefront' && <StorefrontView {...props} />}
      {view === 'orders' && <OrdersView {...props} />}
      {view === 'products' && <ProductsView {...props} />}
      {view === 'inventory' && <InventoryView {...props} />}
      {view === 'customers' && <CustomersView {...props} />}

      <OrderDetailModal orderId={orderId} state={state} onClose={() => setOrderId(null)} onChange={setState} />
      <ProductDrawer
        productId={productId}
        state={state}
        onClose={() => setProductId(null)}
        onSave={(next, message) => {
          setState(next)
          setProductId(null)
          toast({ title: 'Catalog updated', description: message })
        }}
      />
    </DemoShell>
  )
}
