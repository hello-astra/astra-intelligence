import { useState } from 'react'
import { FileBarChart, LayoutDashboard, PiggyBank, Receipt, Sparkles, Target } from 'lucide-react'
import { SOLUTION_BY_SLUG } from '@/data/constants/solutions'
import { createInitialLedgerState } from '@/data/mock/fintech'
import { usePersistentState } from '@/hooks/usePersistentState'
import { DemoShell } from '../shared/DemoShell'
import type { DemoView } from '../shared/demo-context'
import type { LedgerCtx, LedgerView } from './context'
import { budgetRows } from './logic'
import { TransactionModal } from './TransactionModal'
import { BudgetsView } from './views/BudgetsView'
import { CategorizeView } from './views/CategorizeView'
import { OverviewView } from './views/OverviewView'
import { ReportsView } from './views/ReportsView'
import { SavingsView } from './views/SavingsView'
import { TransactionsView } from './views/TransactionsView'

const solution = SOLUTION_BY_SLUG['fintech-automation']

export default function FintechDemo() {
  const [state, setState, reset] = usePersistentState('fintech', createInitialLedgerState, 1)
  const [view, setView] = useState<LedgerView>('overview')
  const [txn, setTxn] = useState<string | 'new' | null>(null)

  const toReview = state.transactions.filter((t) => t.category === 'Uncategorized').length + state.inbox.length
  const flagged = budgetRows(state).filter((b) => b.health !== 'ok').length
  const views: DemoView<LedgerView>[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'categorize', label: 'AI categorization', icon: Sparkles, badge: toReview || undefined },
    { id: 'budgets', label: 'Budgets', icon: Target, badge: flagged || undefined },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'savings', label: 'Savings', icon: PiggyBank },
  ]

  const ctx: LedgerCtx = { state, setState, openTransaction: setTxn, goTo: setView }

  return (
    <DemoShell
      solution={solution}
      views={views}
      activeView={view}
      onViewChange={setView}
      onReset={() => {
        reset()
        setTxn(null)
        setView('overview')
      }}
    >
      {view === 'overview' && <OverviewView {...ctx} />}
      {view === 'transactions' && <TransactionsView {...ctx} />}
      {view === 'categorize' && <CategorizeView {...ctx} />}
      {view === 'budgets' && <BudgetsView {...ctx} />}
      {view === 'reports' && <ReportsView {...ctx} />}
      {view === 'savings' && <SavingsView {...ctx} />}
      <TransactionModal target={txn} state={state} onClose={() => setTxn(null)} onChange={setState} />
      <p className="mt-4 text-[11px] text-fg-4">All amounts in INR (₹). Sample company and transactions — no bank or payment account is connected.</p>
    </DemoShell>
  )
}
