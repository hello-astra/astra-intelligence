import { useState, type FormEvent } from 'react'
import { Save, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { Segmented } from '@/components/ui/Segmented'
import { useToast } from '@/components/ui/toast-context'
import { ruleBasedClassifier } from '@/services/ai/expenseClassifier'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type Category, type LedgerState, type Transaction, type TxnMethod, type TxnType } from '@/types/fintech'
import { toISODate } from '@/utils/dates'
import { uid } from '@/utils/id'

const METHODS: TxnMethod[] = ['UPI', 'Corporate card', 'Bank transfer', 'Auto-debit']

interface Props {
  target: string | 'new' | null
  state: LedgerState
  onClose: () => void
  onChange: (next: LedgerState) => void
}

export function TransactionModal({ target, state, onClose, onChange }: Props) {
  const txn = target && target !== 'new' ? state.transactions.find((t) => t.id === target) : undefined
  const toast = useToast()
  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title={txn ? 'Edit transaction' : 'Add transaction'}
      description={txn ? txn.description : 'Manual entries are marked as categorized by you.'}
      footer={
        <>
          {txn && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto text-red-300 hover:text-red-200"
              leftIcon={<Trash2 className="size-3.5" />}
              onClick={() => {
                onChange({ ...state, transactions: state.transactions.filter((t) => t.id !== txn.id) })
                toast({ title: 'Transaction deleted', tone: 'info' })
                onClose()
              }}
            >
              Delete
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="txn-form" leftIcon={<Save className="size-3.5" />}>
            {txn ? 'Save changes' : 'Add transaction'}
          </Button>
        </>
      }
    >
      {target !== null && (
        <TxnForm
          key={target}
          txn={txn}
          state={state}
          onSubmit={(next, message) => {
            onChange(next)
            toast({ title: message })
            onClose()
          }}
        />
      )}
    </Modal>
  )
}

function TxnForm({ txn, state, onSubmit }: { txn?: Transaction; state: LedgerState; onSubmit: (next: LedgerState, message: string) => void }) {
  const [type, setType] = useState<TxnType>(txn?.type ?? 'expense')
  const [date, setDate] = useState(() => txn?.date ?? toISODate(new Date()))
  const [description, setDescription] = useState(txn?.description ?? '')
  const [merchant, setMerchant] = useState(txn?.merchant ?? '')
  const [amount, setAmount] = useState(txn ? String(txn.amount) : '')
  const [category, setCategory] = useState<Category>(txn?.category ?? 'Uncategorized')
  const [method, setMethod] = useState<TxnMethod>(txn?.method ?? 'UPI')
  const [status, setStatus] = useState<Transaction['status']>(txn?.status ?? 'cleared')
  const [notes, setNotes] = useState(txn?.notes ?? '')
  const [suggestion, setSuggestion] = useState<{ confidence: number; reason: string } | null>(null)
  const [aiApplied, setAiApplied] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories: Category[] = type === 'income' ? [...INCOME_CATEGORIES] : [...EXPENSE_CATEGORIES, 'Uncategorized']

  const suggest = () => {
    const c = ruleBasedClassifier.classify(`${description} ${merchant}`, Number(amount) || 0, state.rules)
    setCategory(c.category)
    setSuggestion({ confidence: c.confidence, reason: c.reason })
    setAiApplied(true)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const value = Number(amount)
    if (description.trim().length < 3) errs.description = 'Enter a description (3+ characters).'
    if (!Number.isFinite(value) || value <= 0) errs.amount = 'Amount must be greater than zero.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errs.date = 'Choose a valid date.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    const finalCategory: Category = type === 'income' && !(INCOME_CATEGORIES as readonly string[]).includes(category) ? 'Client payments' : category
    const record: Transaction = {
      id: txn?.id ?? uid('txn'),
      date,
      description: description.trim(),
      merchant: merchant.trim() || description.trim().slice(0, 24),
      amount: Math.round(value * 100) / 100,
      type,
      category: finalCategory,
      method,
      status,
      notes: notes.trim() || undefined,
      categorizedBy: aiApplied && suggestion ? 'ai' : txn && txn.category === finalCategory ? txn.categorizedBy : 'manual',
      confidence: aiApplied ? suggestion?.confidence : txn?.confidence,
      reason: aiApplied ? suggestion?.reason : txn?.reason,
    }
    const transactions = txn ? state.transactions.map((t) => (t.id === txn.id ? record : t)) : [record, ...state.transactions]
    onSubmit({ ...state, transactions: transactions.sort((a, b) => b.date.localeCompare(a.date)) }, txn ? 'Transaction updated' : 'Transaction added')
  }

  return (
    <form id="txn-form" onSubmit={submit} noValidate className="grid gap-4">
      <Segmented
        ariaLabel="Transaction type"
        value={type}
        onChange={(t) => {
          setType(t)
          setCategory(t === 'income' ? 'Client payments' : 'Uncategorized')
        }}
        options={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
        className="w-fit"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="txn-date" error={errors.date} required>
          <Input id="txn-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={Boolean(errors.date)} />
        </Field>
        <Field label="Amount (₹)" htmlFor="txn-amount" error={errors.amount} required>
          <Input id="txn-amount" type="number" min={0} step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" aria-invalid={Boolean(errors.amount)} />
        </Field>
      </div>
      <Field label="Description (as on statement)" htmlFor="txn-desc" error={errors.description} required>
        <Input id="txn-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. CARD 9911 FIGMA INC" aria-invalid={Boolean(errors.description)} />
      </Field>
      <Field label="Merchant / payee" htmlFor="txn-merchant">
        <Input id="txn-merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Figma" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Category" htmlFor="txn-category">
          <Select
            id="txn-category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as Category)
              setAiApplied(false)
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        {type === 'expense' && (
          <Button type="button" variant="secondary" onClick={suggest} disabled={description.trim().length < 3} leftIcon={<Sparkles className="size-3.5 text-astra-cyan" />}>
            Suggest category
          </Button>
        )}
      </div>
      {suggestion && aiApplied && (
        <p className="rounded-lg bg-astra-cyan/[0.06] px-3 py-2 text-xs text-fg-2 ring-1 ring-astra-cyan/20">
          <span className="font-medium text-astra-cyan-soft">AI suggestion · {Math.round(suggestion.confidence * 100)}% confidence.</span> {suggestion.reason}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Payment method" htmlFor="txn-method">
          <Select id="txn-method" value={method} onChange={(e) => setMethod(e.target.value as TxnMethod)}>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor="txn-status">
          <Select id="txn-status" value={status} onChange={(e) => setStatus(e.target.value as Transaction['status'])}>
            <option value="cleared">Cleared</option>
            <option value="pending">Pending</option>
          </Select>
        </Field>
      </div>
      <Field label="Notes" htmlFor="txn-notes">
        <Textarea id="txn-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional internal note" />
      </Field>
    </form>
  )
}
