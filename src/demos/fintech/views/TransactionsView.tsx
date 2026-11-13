import { useMemo, useDeferredValue, useState } from 'react'
import { Download, Plus, Receipt, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Form'
import { Panel } from '@/components/ui/Panel'
import { SearchInput } from '@/components/ui/SearchInput'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type Category, type TxnMethod, type TxnType } from '@/types/fintech'
import { cn } from '@/utils/cn'
import { fromMonthKey } from '@/utils/dates'
import { dateStamp, downloadCSV } from '@/utils/export'
import { formatDate, formatINR, formatMonth } from '@/utils/format'
import type { LedgerCtx } from '../context'
import { lastMonths } from '../logic'

const PAGE = 60

export function TransactionsView({ state, setState, openTransaction }: LedgerCtx) {
  const [query, setQuery] = useState('')
  // Typing stays instant; the filtered list re-renders at low priority (interruptible) behind it.
  const deferredQuery = useDeferredValue(query)
  const [month, setMonth] = useState<string>('all')
  const [type, setType] = useState<TxnType | 'all'>('all')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [method, setMethod] = useState<TxnMethod | 'all'>('all')
  const [limit, setLimit] = useState(PAGE)
  const months = lastMonths(6).reverse()

  const rows = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return state.transactions.filter(
      (t) =>
        (month === 'all' || t.date.startsWith(month)) &&
        (type === 'all' || t.type === type) &&
        (category === 'all' || t.category === category) &&
        (method === 'all' || t.method === method) &&
        (!q || t.description.toLowerCase().includes(q) || t.merchant.toLowerCase().includes(q) || (t.notes ?? '').toLowerCase().includes(q)),
    )
  }, [state.transactions, deferredQuery, month, type, category, method])

  const totalIn = rows.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalOut = rows.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const setRowCategory = (id: string, c: Category) =>
    setState((s) => ({ ...s, transactions: s.transactions.map((t) => (t.id === id ? { ...t, category: c, categorizedBy: 'manual', confidence: undefined, reason: undefined } : t)) }))

  const exportCsv = () =>
    downloadCSV(`transactions-${dateStamp()}`, rows, [
      { key: 'date', label: 'Date', value: (t) => t.date },
      { key: 'description', label: 'Description', value: (t) => t.description },
      { key: 'merchant', label: 'Merchant', value: (t) => t.merchant },
      { key: 'type', label: 'Type', value: (t) => t.type },
      { key: 'category', label: 'Category', value: (t) => t.category },
      { key: 'method', label: 'Method', value: (t) => t.method },
      { key: 'status', label: 'Status', value: (t) => t.status },
      { key: 'amount', label: 'Amount (INR)', value: (t) => (t.type === 'expense' ? -t.amount : t.amount) },
    ])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Transactions</h2>
          <p className="text-xs text-fg-3">
            {rows.length} shown · in <span className="text-emerald-300">{formatINR(totalIn)}</span> · out <span className="text-fg-2">{formatINR(totalOut)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" leftIcon={<Download className="size-3.5" />} onClick={exportCsv}>
            Export CSV
          </Button>
          <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => openTransaction('new')}>
            Add transaction
          </Button>
        </div>
      </div>

      <Panel flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search description, merchant, notes" className="w-full sm:w-64" />
          <Select controlSize="sm" aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)} wrapperClassName="w-36">
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(fromMonthKey(m))}
              </option>
            ))}
          </Select>
          <Select controlSize="sm" aria-label="Type" value={type} onChange={(e) => setType(e.target.value as TxnType | 'all')} wrapperClassName="w-32">
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </Select>
          <Select controlSize="sm" aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as Category | 'all')} wrapperClassName="w-40">
            <option value="all">All categories</option>
            {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, 'Uncategorized'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select controlSize="sm" aria-label="Payment method" value={method} onChange={(e) => setMethod(e.target.value as TxnMethod | 'all')} wrapperClassName="w-40">
            <option value="all">All methods</option>
            {(['UPI', 'Corporate card', 'Bank transfer', 'Auto-debit'] as TxnMethod[]).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions match" description="Try clearing a filter." />
        ) : (
          <Table minWidth={900}>
            <THead>
              <tr>
                <TH>Date</TH>
                <TH>Description</TH>
                <TH>Category</TH>
                <TH>Method</TH>
                <TH>Status</TH>
                <TH align="right">Amount</TH>
              </tr>
            </THead>
            <TBody>
              {rows.slice(0, limit).map((t) => (
                <TR key={t.id}>
                  <TD className="text-xs whitespace-nowrap">{formatDate(t.date)}</TD>
                  <TD>
                    <button type="button" onClick={() => openTransaction(t.id)} className="text-left">
                      <span className="block font-medium text-fg hover:text-brand-soft">{t.merchant}</span>
                      <span className="block max-w-[320px] truncate font-mono text-[11px] text-fg-3">{t.description}</span>
                    </button>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1.5">
                      <select
                        aria-label={`Category for ${t.merchant}`}
                        value={t.category}
                        onChange={(e) => setRowCategory(t.id, e.target.value as Category)}
                        className={cn(
                          'h-7 rounded-md border bg-raised px-1.5 text-xs outline-none focus:border-brand/70',
                          t.category === 'Uncategorized' ? 'border-amber-400/40 text-amber-200' : 'border-line text-fg',
                        )}
                      >
                        {(t.type === 'income' ? [...INCOME_CATEGORIES] : [...EXPENSE_CATEGORIES, 'Uncategorized']).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {t.categorizedBy === 'ai' && (
                        <span title={t.reason} className="inline-flex items-center gap-0.5 text-[10px] text-astra-cyan-soft">
                          <Sparkles className="size-3" aria-hidden />
                          {t.confidence ? `${Math.round(t.confidence * 100)}%` : 'AI'}
                        </span>
                      )}
                      {t.categorizedBy === 'rule' && t.type === 'expense' && <Badge size="xs">Rule</Badge>}
                    </div>
                  </TD>
                  <TD className="text-xs">{t.method}</TD>
                  <TD>
                    <Badge tone={t.status === 'cleared' ? 'neutral' : 'amber'} size="xs">
                      {t.status === 'cleared' ? 'Cleared' : 'Pending'}
                    </Badge>
                  </TD>
                  <TD align="right" className={cn('font-medium', t.type === 'income' ? 'text-emerald-300' : 'text-fg')}>
                    {t.type === 'income' ? '+' : '−'}
                    {formatINR(t.amount, 2)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        {rows.length > limit && (
          <div className="border-t border-line p-3 text-center">
            <Button size="sm" variant="ghost" onClick={() => setLimit((l) => l + PAGE)}>
              Show more ({rows.length - limit} remaining)
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}
