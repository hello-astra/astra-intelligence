import { useRef, useState } from 'react'
import { CheckCheck, Download, FlaskConical, Sparkles, Trash2, Wand2, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Meter } from '@/components/ui/Meter'
import { Panel } from '@/components/ui/Panel'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { useToast } from '@/components/ui/toast-context'
import { SAMPLE_STATEMENT } from '@/data/mock/fintech'
import { ruleBasedClassifier, suggestPattern } from '@/services/ai/expenseClassifier'
import { EXPENSE_CATEGORIES, type Category, type ExpenseCategory, type LedgerState, type Transaction } from '@/types/fintech'
import { isoDateFromToday } from '@/utils/dates'
import { formatDate, formatINR } from '@/utils/format'
import { uid } from '@/utils/id'
import type { LedgerCtx } from '../context'
import { isExpenseCategory } from '../logic'

export function CategorizeView({ state, setState }: LedgerCtx) {
  const toast = useToast()
  const [running, setRunning] = useState(false)
  const [processed, setProcessed] = useState<Set<string>>(new Set())
  const [remember, setRemember] = useState<Record<string, boolean>>({})
  const timers = useRef<number[]>([])
  const pendingLedger = state.transactions.filter((t) => t.category === 'Uncategorized')

  const importStatement = () => {
    const lines: Transaction[] = SAMPLE_STATEMENT.map((l, i) => ({
      id: uid('imp'),
      date: isoDateFromToday(-Math.floor(i / 3)),
      description: l.description,
      merchant: l.merchant,
      amount: l.amount,
      type: 'expense',
      category: 'Uncategorized',
      method: l.method,
      status: 'pending',
      categorizedBy: 'manual',
    }))
    setState((s) => ({ ...s, inbox: [...lines, ...s.inbox] }))
    setProcessed(new Set())
    toast({ title: `${lines.length} lines imported`, description: 'Sample bank statement added to the review inbox (no bank is connected).' })
  }

  const classifyAll = () => {
    if (running || state.inbox.length === 0) return
    setRunning(true)
    const ids = state.inbox.map((t) => t.id)
    ids.forEach((id, i) =>
      timers.current.push(
        window.setTimeout(() => {
          setState((s) => ({
            ...s,
            inbox: s.inbox.map((t) => {
              if (t.id !== id) return t
              const c = ruleBasedClassifier.classify(t.description, t.amount, s.rules)
              return { ...t, category: c.category, categorizedBy: c.source === 'rule' ? 'rule' : 'ai', confidence: c.confidence, reason: c.reason }
            }),
          }))
          setProcessed((p) => new Set(p).add(id))
          if (i === ids.length - 1) {
            setRunning(false)
            toast({ title: 'AI categorization complete', description: 'Review low-confidence suggestions before posting.' })
          }
        }, 160 * (i + 1)),
      ),
    )
  }

  const setInboxCategory = (t: Transaction, category: Category) => {
    setState((s) => ({ ...s, inbox: s.inbox.map((x) => (x.id === t.id ? { ...x, category, categorizedBy: 'manual', reason: 'Set by reviewer' } : x)) }))
    setRemember((r) => ({ ...r, [t.id]: isExpenseCategory(category) }))
  }

  const post = (ids: string[]) => {
    setState((s) => {
      const posting = s.inbox.filter((t) => ids.includes(t.id))
      const rules = [...s.rules]
      for (const t of posting) {
        if (remember[t.id] && t.categorizedBy === 'manual' && isExpenseCategory(t.category)) {
          const pattern = suggestPattern(t.description)
          if (!rules.some((r) => r.pattern === pattern)) rules.push({ id: uid('rule'), pattern, category: t.category as ExpenseCategory, createdAt: new Date().toISOString() })
        }
      }
      const posted = posting.map((t) => ({ ...t, status: 'cleared' as const }))
      return { ...s, rules, inbox: s.inbox.filter((t) => !ids.includes(t.id)), transactions: [...posted, ...s.transactions].sort((a, b) => b.date.localeCompare(a.date)) }
    })
    toast({ title: `${ids.length} transaction${ids.length === 1 ? '' : 's'} posted to the ledger` })
  }

  const categorizeLedger = () => {
    const updates = new Map<string, Partial<Transaction>>()
    for (const t of state.transactions) {
      if (t.category !== 'Uncategorized') continue
      const c = ruleBasedClassifier.classify(t.description, t.amount, state.rules)
      if (c.category === 'Uncategorized' || c.confidence < 0.6) continue
      updates.set(t.id, { category: c.category, categorizedBy: c.source === 'rule' ? 'rule' : 'ai', confidence: c.confidence, reason: c.reason })
    }
    if (updates.size) setState((s: LedgerState) => ({ ...s, transactions: s.transactions.map((t) => (updates.has(t.id) ? { ...t, ...updates.get(t.id) } : t)) }))
    toast({
      title: updates.size ? `${updates.size} categorized automatically` : 'Nothing confident enough to auto-assign',
      description: 'Items below 60% confidence stay in the queue for you.',
      tone: updates.size ? 'success' : 'info',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">AI expense categorization</h2>
          <p className="text-xs text-fg-3">Import statement lines, let the model suggest categories with confidence, then review and post.</p>
        </div>
        <Badge tone="amber" icon={<FlaskConical className="size-3" />}>
          Simulated AI — rule-based classifier stands in for a trained model
        </Badge>
      </div>

      <Panel
        title="Review inbox"
        description={state.inbox.length ? `${state.inbox.length} imported line${state.inbox.length === 1 ? '' : 's'} awaiting review` : 'Import a sample statement to begin'}
        flush
        actions={
          <>
            <Button size="xs" variant="secondary" leftIcon={<Download className="size-3" />} onClick={importStatement}>
              Import sample statement
            </Button>
            <Button size="xs" leftIcon={running ? <Spinner className="size-3" /> : <Wand2 className="size-3" />} disabled={running || state.inbox.length === 0} onClick={classifyAll}>
              {running ? 'Categorizing…' : 'Auto-categorize with AI'}
            </Button>
            <Button size="xs" variant="secondary" leftIcon={<CheckCheck className="size-3" />} disabled={state.inbox.length === 0 || running} onClick={() => post(state.inbox.map((t) => t.id))}>
              Post all
            </Button>
          </>
        }
      >
        {state.inbox.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-fg-3">The inbox is empty. Import the sample bank statement (13 lines) to try AI categorization.</p>
        ) : (
          <Table minWidth={900}>
            <THead>
              <tr>
                <TH>Statement line</TH>
                <TH align="right">Amount</TH>
                <TH>Category</TH>
                <TH>Confidence</TH>
                <TH>Why</TH>
                <TH align="right">
                  <span className="sr-only">Actions</span>
                </TH>
              </tr>
            </THead>
            <TBody>
              {state.inbox.map((t) => {
                const done = processed.has(t.id) || t.categorizedBy !== 'manual' || t.category !== 'Uncategorized'
                const low = (t.confidence ?? 0) < 0.6
                return (
                  <TR key={t.id} className={running && !processed.has(t.id) ? 'opacity-60' : undefined}>
                    <TD>
                      <span className="block font-mono text-xs text-fg">{t.description}</span>
                      <span className="block text-[11px] text-fg-4">{formatDate(t.date)}</span>
                    </TD>
                    <TD align="right" className="text-fg">
                      {formatINR(t.amount)}
                    </TD>
                    <TD>
                      <select
                        aria-label={`Category for ${t.description}`}
                        value={t.category}
                        onChange={(e) => setInboxCategory(t, e.target.value as Category)}
                        className={`h-7 rounded-md border bg-raised px-1.5 text-xs outline-none focus:border-brand/70 ${t.category === 'Uncategorized' ? 'border-amber-400/40 text-amber-200' : 'border-line text-fg'}`}
                      >
                        {[...EXPENSE_CATEGORIES, 'Uncategorized'].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {t.categorizedBy === 'manual' && t.category !== 'Uncategorized' && (
                        <label className="mt-1 flex items-center gap-1 text-[10px] text-fg-3">
                          <input type="checkbox" className="accent-brand" checked={Boolean(remember[t.id])} onChange={(e) => setRemember((r) => ({ ...r, [t.id]: e.target.checked }))} />
                          Remember “{suggestPattern(t.description)}”
                        </label>
                      )}
                    </TD>
                    <TD className="w-36">
                      {done && t.confidence !== undefined ? (
                        <div>
                          <Meter value={t.confidence * 100} tone={low ? 'warning' : 'good'} size="xs" label="Confidence" />
                          <span className={`mt-1 block text-[10px] ${low ? 'text-amber-300' : 'text-fg-3'}`}>
                            {Math.round(t.confidence * 100)}% {t.categorizedBy === 'rule' ? '· your rule' : low ? '· needs review' : ''}
                          </span>
                        </div>
                      ) : running && !processed.has(t.id) ? (
                        <Spinner className="size-3.5 text-brand" />
                      ) : (
                        <span className="text-[11px] text-fg-4">—</span>
                      )}
                    </TD>
                    <TD className="max-w-[240px] text-[11px] text-fg-3">
                      {t.reason ? (
                        <span className="flex gap-1">
                          <Sparkles className="mt-px size-3 shrink-0 text-astra-cyan" aria-hidden />
                          {t.reason}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TD>
                    <TD align="right">
                      <div className="flex justify-end gap-1">
                        <Button size="xs" variant="secondary" onClick={() => post([t.id])} disabled={running}>
                          Post
                        </Button>
                        <Button size="xs" variant="ghost" aria-label={`Discard ${t.description}`} onClick={() => setState((s) => ({ ...s, inbox: s.inbox.filter((x) => x.id !== t.id) }))}>
                          <X className="size-3" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Ledger items without a category"
          description={pendingLedger.length ? `${pendingLedger.length} transaction${pendingLedger.length === 1 ? '' : 's'}` : 'All ledger items are categorized'}
          actions={
            pendingLedger.length > 0 && (
              <Button size="xs" leftIcon={<Wand2 className="size-3" />} onClick={categorizeLedger}>
                Categorize confidently
              </Button>
            )
          }
        >
          <ul className="space-y-2">
            {pendingLedger.map((t) => {
              const s = ruleBasedClassifier.classify(t.description, t.amount, state.rules)
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs">
                  <span className="min-w-0 flex-1 truncate font-mono text-fg">{t.description}</span>
                  <span className="text-fg-2 tabular-nums">{formatINR(t.amount)}</span>
                  <Badge tone={s.category === 'Uncategorized' || s.confidence < 0.6 ? 'amber' : 'cyan'} size="xs">
                    {s.category === 'Uncategorized' ? 'No confident match' : `${s.category} · ${Math.round(s.confidence * 100)}%`}
                  </Badge>
                </li>
              )
            })}
            {pendingLedger.length === 0 && <li className="text-sm text-fg-3">Nothing to review.</li>}
          </ul>
        </Panel>
        <Panel title="Learned merchant rules" description="Created when you correct a suggestion and tick “Remember”">
          {state.rules.length === 0 ? (
            <p className="text-sm text-fg-3">No rules yet. Rules always override the model.</p>
          ) : (
            <ul className="space-y-2">
              {state.rules.map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-lg bg-ink/[0.03] px-3 py-2 text-xs">
                  <code className="font-mono text-fg">“{r.pattern}”</code>
                  <span className="text-fg-3">→</span>
                  <Badge tone="blue" size="xs">
                    {r.category}
                  </Badge>
                  <button
                    type="button"
                    className="ml-auto text-fg-4 hover:text-red-300"
                    aria-label={`Delete rule ${r.pattern}`}
                    onClick={() => setState((s) => ({ ...s, rules: s.rules.filter((x) => x.id !== r.id) }))}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
