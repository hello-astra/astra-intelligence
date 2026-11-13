import type { Dispatch, SetStateAction } from 'react'
import type { ErpState } from '@/types/erp'

export type ErpView = 'dashboard' | 'employees' | 'attendance' | 'payroll' | 'departments' | 'orders' | 'vendors'

export interface ErpCtx {
  state: ErpState
  setState: Dispatch<SetStateAction<ErpState>>
  goTo: (view: ErpView) => void
  openPo: (id: string) => void
  openEmployee: (id: string | 'new') => void
}
