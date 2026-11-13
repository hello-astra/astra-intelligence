import type { Dispatch, SetStateAction } from 'react'
import type { LedgerState } from '@/types/fintech'

export type LedgerView = 'overview' | 'transactions' | 'categorize' | 'budgets' | 'reports' | 'savings'

export interface LedgerCtx {
  state: LedgerState
  setState: Dispatch<SetStateAction<LedgerState>>
  openTransaction: (id: string | 'new') => void
  goTo: (view: LedgerView) => void
}

/** Expense category colors follow the validated categorical palette in fixed order. */
export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#4180f2',
  Transportation: '#d95926',
  Software: '#199e70',
  Marketing: '#c98500',
  Utilities: '#d55181',
  Salaries: '#008300',
  Travel: '#9085e9',
  Office: '#e66767',
}
