import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowUp, CheckCircle2, Cpu, Headset, MessageSquarePlus, Send, Sparkles, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Meter } from '@/components/ui/Meter'
import { Sparkline } from '@/components/ui/Sparkline'
import { CONVERSATION_STARTERS } from '@/data/mock/chatbot'
import { chatProvider } from '@/services/ai'
import { lookupOrder } from '@/services/ai/ruleBasedEngine'
import type { ConversationCategory } from '@/services/ai/types'
import type { ChatbotState, Conversation } from '@/types/chatbot'
import { cn } from '@/utils/cn'
import { formatINR, formatRelative } from '@/utils/format'
import { MessageBubble, TypingIndicator } from './parts'
import { STATUS_META } from './status'


const CATEGORIES: (ConversationCategory | 'All')[] = ['All', 'Orders', 'Returns & refunds', 'Products', 'Billing', 'Sales lead', 'General']

interface ChatViewProps {
  state: ChatbotState
  select: (id: string) => void
  send: (conversationId: string, text: string) => void
  typingId: string | null
  newConversation: () => void
  escalate: (conversationId: string) => void
  resolve: (conversationId: string) => void
  sendAsAgent: (conversationId: string, text: string) => void
  createLead: (conversationId: string) => void
}

export function ChatView({ state, select, send, typingId, newConversation, escalate, resolve, sendAsAgent, createLead }: ChatViewProps) {
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<ConversationCategory | 'All'>('All')
  const threadRef = useRef<HTMLDivElement>(null)
  const active = state.conversations.find((c) => c.id === state.activeId) ?? state.conversations[0]
  const typing = typingId === active.id
  const last = active.messages[active.messages.length - 1]

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [active.id, active.messages.length, typing])

  const list = useMemo(
    () => [...state.conversations].filter((c) => filter === 'All' || c.category === filter).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [state.conversations, filter],
  )

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || typing) return
    send(active.id, input)
    setInput('')
  }

  const showStarters = active.messages.length <= 1 && active.status === 'bot'

  return (
    <div className="grid h-full min-h-0 lg:grid-cols-[250px_minmax(0,1fr)_290px] 2xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      {/* Conversation list */}
      <aside className="hidden min-h-0 flex-col border-r border-line lg:flex" aria-label="Conversations">
        <div className="flex items-center justify-between gap-2 border-b border-line p-3">
          <span className="text-[13px] font-semibold text-fg">Conversations</span>
          <Button size="xs" variant="secondary" leftIcon={<MessageSquarePlus className="size-3" />} onClick={newConversation}>
            New
          </Button>
        </div>
        <div className="border-b border-line p-2">
          <select
            aria-label="Filter conversations by category"
            value={filter}
            onChange={(e) => setFilter(e.target.value as ConversationCategory | 'All')}
            className="h-7 w-full rounded-md border border-line bg-raised px-2 text-xs text-fg outline-none focus:border-brand/70"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All categories' : c}
              </option>
            ))}
          </select>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {list.map((c) => {
            const lastMsg = [...c.messages].reverse().find((m) => m.role !== 'system')
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => select(c.id)}
                  aria-current={c.id === active.id ? 'true' : undefined}
                  className={cn('mb-1 flex w-full gap-2.5 rounded-lg p-2.5 text-left transition-colors', c.id === active.id ? 'bg-ink/[0.07]' : 'hover:bg-ink/[0.03]')}
                >
                  <Avatar name={c.customer} size={30} title="" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-fg">{c.customer}</span>
                      <span className="shrink-0 text-[10px] text-fg-4">{formatRelative(c.updatedAt)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-fg-3">{lastMsg?.text.replace(/\*\*/g, '')}</span>
                    <span className="mt-1.5 flex items-center gap-1.5">
                      <Badge tone={STATUS_META[c.status].tone} size="xs">
                        {STATUS_META[c.status].label}
                      </Badge>
                      <SentimentDot score={c.insights.sentiment.score} />
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
          {list.length === 0 && <li className="p-3 text-xs text-fg-3">No conversations in this category.</li>}
        </ul>
      </aside>

      {/* Thread */}
      <section className="flex h-[640px] min-h-0 flex-col lg:h-auto" aria-label="Chat">
        <header className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5 sm:px-4">
          <select
            aria-label="Switch conversation"
            value={active.id}
            onChange={(e) => select(e.target.value)}
            className="h-8 max-w-[55%] rounded-md border border-line bg-raised px-2 text-xs text-fg lg:hidden"
          >
            {state.conversations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customer}
              </option>
            ))}
          </select>
          <div className="hidden min-w-0 items-center gap-2.5 lg:flex">
            <Avatar name={active.customer} size={30} title="" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{active.customer}</p>
              <p className="text-[11px] text-fg-3">
                {active.category} · started {formatRelative(active.createdAt)}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Badge tone={STATUS_META[active.status].tone} dot>
              {STATUS_META[active.status].label}
            </Badge>
            <Button size="xs" variant="ghost" className="lg:hidden" leftIcon={<MessageSquarePlus className="size-3" />} onClick={newConversation}>
              New
            </Button>
          </div>
        </header>

        <div ref={threadRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite" aria-relevant="additions">
          {active.messages.map((m) => (
            <MessageBubble key={m.id} message={m} lead={active.context.lead}>
              {m.id === last.id && m.role === 'bot' && active.status === 'bot' && !typing && m.quickReplies && m.quickReplies.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {m.quickReplies.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(active.id, q)}
                      className="rounded-full bg-ink/[0.04] px-3 py-1.5 text-xs text-fg-2 ring-1 ring-brand/30 transition-colors hover:bg-brand/15 hover:text-fg"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </MessageBubble>
          ))}
          {typing && <TypingIndicator who={active.status === 'escalated' ? 'Support agent' : 'Astra Assist'} />}
          {showStarters && !typing && (
            <div className="pt-2">
              <p className="mb-2 text-[11px] font-medium tracking-wide text-fg-3 uppercase">Try a conversation starter</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {CONVERSATION_STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(active.id, s)}
                    className="flex items-start gap-2 rounded-xl border border-line bg-ink/[0.02] p-2.5 text-left text-xs text-fg-2 transition-colors hover:border-brand/40 hover:bg-ink/[0.04] hover:text-fg"
                  >
                    <Sparkles className="mt-px size-3.5 shrink-0 text-astra-cyan" aria-hidden />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="border-t border-line p-3">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-raised p-1.5 pl-3 focus-within:border-brand/60 focus-within:ring-2 focus-within:ring-brand/15">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={active.status === 'escalated' ? 'Message the support agent…' : active.status === 'resolved' ? 'Send a message to reopen…' : 'Ask about an order, refund, product…'}
              aria-label="Message"
              maxLength={500}
              className="min-w-0 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-3 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="Send message"
              className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-strong text-on-brand transition-opacity disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-fg-4">
            <Cpu className="size-3" aria-hidden /> {chatProvider.label}
            {chatProvider.kind === 'rule-based' ? ' · simulated AI, answers only from the sample knowledge base' : ' · connected LLM backend'}
          </p>
        </form>
      </section>

      {/* Insights */}
      <InsightsPanel conversation={active} escalate={escalate} resolve={resolve} sendAsAgent={sendAsAgent} createLead={createLead} />
    </div>
  )
}

function SentimentDot({ score }: { score: number }) {
  const label = score <= -0.3 ? 'Negative' : score >= 0.3 ? 'Positive' : 'Neutral'
  const color = score <= -0.3 ? 'bg-red-400' : score >= 0.3 ? 'bg-emerald-400' : 'bg-fg-4'
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-fg-3" title={`Sentiment ${score.toFixed(2)}`}>
      <span className={cn('size-1.5 rounded-full', color)} aria-hidden />
      {label}
    </span>
  )
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="border-b border-line p-3.5 last:border-0">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-wide text-fg-3 uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function InsightsPanel({
  conversation: c,
  escalate,
  resolve,
  sendAsAgent,
  createLead,
}: {
  conversation: Conversation
  escalate: (id: string) => void
  resolve: (id: string) => void
  sendAsAgent: (id: string, text: string) => void
  createLead: (id: string) => void
}) {
  const { insights, context } = c
  const sentiment = insights.sentiment
  const order = context.orderId ? lookupOrder(context.orderId) : undefined
  const lead = context.lead
  const entities = Object.entries(insights.entities).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))

  return (
    <aside className="min-h-0 overflow-y-auto border-t border-line bg-chrome/60 lg:border-t-0 lg:border-l" aria-label="Conversation insights">
      <Section title="Conversation">
        <div className="flex flex-wrap gap-2">
          {c.status === 'bot' && (
            <Button size="xs" variant="secondary" leftIcon={<Headset className="size-3" />} onClick={() => escalate(c.id)}>
              Escalate to human
            </Button>
          )}
          {c.status !== 'resolved' && (
            <Button size="xs" variant="ghost" leftIcon={<CheckCircle2 className="size-3" />} onClick={() => resolve(c.id)}>
              Mark resolved
            </Button>
          )}
          {c.status === 'resolved' && <span className="text-xs text-emerald-300">Resolved — new messages reopen it</span>}
        </div>
        {c.status === 'escalated' && (
          <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-2.5 text-xs text-fg-2">
            <p className="font-medium text-amber-200">Handoff summary</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 marker:text-amber-300/60">
              <li>Reason: {insights.escalationReason ?? 'Agent took over'}</li>
              <li>Topic: {c.category}</li>
              {context.orderId && <li>Order: {context.orderId}</li>}
              <li>Sentiment: {sentiment.label} ({sentiment.score.toFixed(2)})</li>
              <li>{c.messages.filter((m) => m.role === 'customer').length} customer messages</li>
            </ul>
          </div>
        )}
      </Section>

      <Section title="Intent detection">
        {insights.intents.length === 0 ? (
          <p className="text-xs text-fg-3">Send a message to see how the assistant classifies it.</p>
        ) : (
          <ul className="space-y-2">
            {insights.intents.slice(0, 3).map((i, idx) => (
              <li key={i.intent}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className={idx === 0 ? 'font-medium text-fg' : 'text-fg-3'}>{i.label}</span>
                  <span className="text-fg-3 tabular-nums">{Math.round(i.confidence * 100)}%</span>
                </div>
                <Meter value={i.confidence * 100} tone={idx === 0 ? 'brand' : 'violet'} size="xs" label={`${i.label} confidence`} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Customer sentiment">
        <div className="flex items-center justify-between">
          <Badge tone={sentiment.label === 'negative' ? 'red' : sentiment.label === 'positive' ? 'green' : 'neutral'} dot>
            {sentiment.label[0].toUpperCase() + sentiment.label.slice(1)}
          </Badge>
          <span className="text-xs text-fg-3 tabular-nums">score {sentiment.score.toFixed(2)}</span>
        </div>
        <div className="relative mt-3 h-1.5 rounded-full bg-gradient-to-r from-critical via-deemph to-good" aria-hidden>
          <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-chrome bg-white" style={{ left: `${((sentiment.score + 1) / 2) * 100}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-fg-4">
          <span>Negative</span>
          <span>Positive</span>
        </div>
        {insights.sentimentHistory.length > 1 && (
          <div className="mt-2">
            <p className="text-[10px] text-fg-4">Trend across customer messages</p>
            <Sparkline data={insights.sentimentHistory} width={240} height={30} color="var(--color-series-1)" className="mt-1 w-full" ariaLabel="Sentiment trend" />
          </div>
        )}
      </Section>

      <Section title="Extracted entities">
        {entities.length === 0 ? (
          <p className="text-xs text-fg-3">Order IDs, products, quantities, amounts and emails appear here.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {entities.map(([k, v]) => (
              <span key={k} className="rounded-md bg-ink/[0.05] px-2 py-1 font-mono text-[10.5px] text-fg-2 ring-1 ring-ink/[0.07]">
                {k}: {Array.isArray(v) ? v.join(', ') : k === 'amount' ? formatINR(Number(v)) : String(v)}
              </span>
            ))}
          </div>
        )}
      </Section>

      {order && (
        <Section title="Order context">
          <p className="font-mono text-xs text-fg">{order.id}</p>
          <p className="mt-0.5 text-xs text-fg-3">
            {order.customer} · {formatINR(order.total)} · {order.status.replace(/_/g, ' ')}
          </p>
        </Section>
      )}

      {lead.stage !== 'none' && (
        <Section title="Lead qualification">
          <div className="flex items-center justify-between">
            <Badge tone={lead.tier === 'Hot' ? 'red' : lead.tier === 'Warm' ? 'amber' : 'blue'}>
              {lead.tier} lead · {lead.score}/100
            </Badge>
            <span className="text-[11px] text-fg-3">{lead.stage === 'qualified' ? 'Qualified' : 'In progress'}</span>
          </div>
          <Meter className="mt-2.5" value={lead.score} max={100} tone={lead.tier === 'Hot' ? 'good' : lead.tier === 'Warm' ? 'warning' : 'brand'} size="sm" label="Lead score" />
          <dl className="mt-3 space-y-1 text-xs">
            {[
              ['Needs', lead.answers.needs],
              ['Quantity', lead.answers.quantity?.toLocaleString('en-IN')],
              ['Company', lead.answers.company && `${lead.answers.company}${lead.answers.companySize ? ` (${lead.answers.companySize} employees)` : ''}`],
              ['Budget', lead.answers.budget !== undefined ? (lead.answers.budget ? `~${formatINR(lead.answers.budget)}` : 'Not shared') : undefined],
              ['Timeline', lead.answers.timeline],
              ['Email', lead.answers.email],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-fg-4">{k}</dt>
                <dd className="truncate text-right text-fg-2">{v ?? '—'}</dd>
              </div>
            ))}
          </dl>
          {lead.stage === 'qualified' && (
            <Button size="xs" variant="secondary" className="mt-3 w-full" leftIcon={<UserPlus className="size-3" />} onClick={() => createLead(c.id)}>
              Push to CRM (simulated)
            </Button>
          )}
        </Section>
      )}

      <Section title="Agent assist · suggested replies">
        {insights.suggestions.length === 0 ? (
          <p className="text-xs text-fg-3">Suggestions appear once the customer writes.</p>
        ) : (
          <ul className="space-y-2">
            {insights.suggestions.map((s) => (
              <li key={s} className="rounded-lg border border-line bg-ink/[0.02] p-2.5">
                <p className="text-xs leading-relaxed text-fg-2">{s}</p>
                <button
                  type="button"
                  onClick={() => sendAsAgent(c.id, s)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-brand-soft hover:text-fg"
                >
                  <Send className="size-3" aria-hidden /> Send as agent
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </aside>
  )
}
