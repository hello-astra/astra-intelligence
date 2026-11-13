import type { Dispatch, SetStateAction } from 'react'
import type { LedgerState } from '@/types/fintech'

export type LedgerView = 'overview' | 'transactions' | 'categorize' | 'budgets' | 'reports' | 'savings'

export interface LedgerCtx {
  state: LedgerState
  setState: Dispatch<SetStateAction<LedgerState>>
  openTransaction: (id: string | 'new') => void
  goTo: (view: LedgerView) => void
}
