import type { Dispatch, SetStateAction } from 'react'
import type { CommerceState } from '@/types/ecommerce'

export type CommerceView = 'overview' | 'products' | 'inventory' | 'orders' | 'customers' | 'storefront'

export interface CommerceViewProps {
  state: CommerceState
  setState: Dispatch<SetStateAction<CommerceState>>
  goTo: (view: CommerceView) => void
  openOrder: (orderId: string) => void
  openProduct: (productId: string | 'new') => void
}
