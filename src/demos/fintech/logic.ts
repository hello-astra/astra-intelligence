import { EXPENSE_CATEGORIES, type ExpenseCategory, type LedgerState, type Transaction } from '@/types/fintech'
import { addMonths, daysInMonth, fromMonthKey, monthKey, startOfDay, startOfMonth } from '@/utils/dates'

export const RECURRING: ReadonlySet<ExpenseCategory> = new Set(['Salaries', 'Software', 'Utilities', 'Office'])

export function lastMonths(count = 6): string[] {
  const start = startOfMonth(startOfDay())
  return Array.from({ length: count }, (_, i) => monthKey(addMonths(start, i - count + 1)))
}

export const currentMonthKey = () => monthKey(startOfDay())

export function inMonth(t: Transaction, key: string): boolean {
  return t.date.startsWith(key)
}

export interface MonthTotals {
  income: number
  expense: number
  net: number
  savingsRate: number
  byCategory: Record<string, number>
}

/** Totals for a month; pass `throughDay` for a like-for-like month-to-date comparison. */
export function monthTotals(txns: Transaction[], key: string, throughDay?: number): MonthTotals {
  let income = 0
  let expense = 0
  const byCategory: Record<string, number> = {}
  for (const t of txns) {
    if (!inMonth(t, key)) continue
    if (throughDay !== undefined && Number(t.date.slice(8, 10)) > throughDay) continue
    if (t.type === 'income') income += t.amount
    else {
      expense += t.amount
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
    }
  }
  const net = income - expense
  return { income, expense, net, savingsRate: income > 0 ? (net / income) * 100 : 0, byCategory }
}

export type BudgetHealth = 'ok' | 'risk' | 'over'

export interface BudgetRow {
  category: ExpenseCategory
  limit: number
  spent: number
  projected: number
  health: BudgetHealth
}

/** Projects month-end spend: recurring charges count once, variable spend runs at its daily pace. */
export function budgetRows(state: LedgerState): BudgetRow[] {
  const key = currentMonthKey()
  const prevKey = monthKey(addMonths(fromMonthKey(key), -1))
  const today = startOfDay()
  const day = today.getDate()
  const length = daysInMonth(today)
  const current = monthTotals(state.transactions, key).byCategory
  const previous = monthTotals(state.transactions, prevKey).byCategory
  return state.budgets.map((b) => {
    const spent = current[b.category] ?? 0
    const projected = RECURRING.has(b.category) ? Math.max(spent, previous[b.category] ?? 0) : (spent / Math.max(1, day)) * length
    const health: BudgetHealth = spent > b.limit ? 'over' : projected > b.limit * 1.02 ? 'risk' : 'ok'
    return { category: b.category, limit: b.limit, spent, projected, health }
  })
}

export const HEALTH_META: Record<BudgetHealth, { label: string; tone: 'green' | 'amber' | 'red' }> = {
  ok: { label: 'On track', tone: 'green' },
  risk: { label: 'At risk', tone: 'amber' },
  over: { label: 'Over budget', tone: 'red' },
}

export function isExpenseCategory(c: string): c is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(c)
}
