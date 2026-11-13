export const EXPENSE_CATEGORIES = ['Food', 'Transportation', 'Software', 'Marketing', 'Utilities', 'Salaries', 'Travel', 'Office'] as const
export const INCOME_CATEGORIES = ['Client payments', 'Subscriptions', 'Other income'] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]
export type Category = ExpenseCategory | IncomeCategory | 'Uncategorized'
export type TxnType = 'income' | 'expense'
export type TxnMethod = 'UPI' | 'Corporate card' | 'Bank transfer' | 'Auto-debit'

export interface Transaction {
  id: string
  /** YYYY-MM-DD */
  date: string
  /** Raw description as it appears on the bank statement. */
  description: string
  merchant: string
  amount: number
  type: TxnType
  category: Category
  method: TxnMethod
  status: 'cleared' | 'pending'
  notes?: string
  categorizedBy: 'manual' | 'ai' | 'rule'
  confidence?: number
  reason?: string
}

export interface Budget {
  category: ExpenseCategory
  limit: number
}

export interface SavingsGoal {
  id: string
  name: string
  target: number
  saved: number
  deadline: string
}

export interface MerchantRule {
  id: string
  pattern: string
  category: ExpenseCategory
  createdAt: string
}

export interface LedgerState {
  company: string
  transactions: Transaction[]
  budgets: Budget[]
  goals: SavingsGoal[]
  rules: MerchantRule[]
  /** Imported bank-feed lines waiting for review. */
  inbox: Transaction[]
}
