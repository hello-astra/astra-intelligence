import { useMemo, useDeferredValue, useState } from 'react'
import { Bot, Headset, MessagesSquare, Package, ShieldCheck, Smile, UserRoundCheck } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Form'
import { SegmentedBar } from '@/components/ui/Meter'
import { Panel } from '@/components/ui/Panel'
import { SearchInput } from '@/components/ui/SearchInput'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { buildOrders, POLICIES, PRODUCTS } from '@/data/mock/chatbot'
import { INTENT_LABELS } from '@/services/ai/ruleBasedEngine'
import type { ConversationCategory, IntentId } from '@/services/ai/types'
import type { ChatbotState, ConversationStatus } from '@/types/chatbot'
import { formatINR, formatRelative } from '@/utils/format'
import { ChartFrame } from '../shared/Chart'
import { BAR_SIZE } from '../shared/chartTheme'
import { useChartTheme } from '../shared/demo-theme'
import { StatTile } from '../shared/StatTile'
import { tooltipRenderer } from '../shared/tooltip'
import { RichText } from './parts'
import { STATUS_META } from './status'

export function ConversationsView({ state, open }: { state: ChatbotState; open: (id: string) => void }) {
  const [query, setQuery] = useState('')
  // Typing stays instant; the filtered list re-renders at low priority (interruptible) behind it.
  const deferredQuery = useDeferredValue(query)
  const [category, setCategory] = useState<ConversationCategory | 'all'>('all')
  const [status, setStatus] = useState<ConversationStatus | 'all'>('all')
  const rows = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return [...state.conversations]
      .filter((c) => (category === 'all' || c.category === category) && (status === 'all' || c.status === status))
      .filter((c) => !q || c.customer.toLowerCase().includes(q) || c.messages.some((m) => m.text.toLowerCase().includes(q)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [state.conversations, deferredQuery, category, status])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Conversation history</h2>
        <p className="text-xs text-fg-3">Every conversation is categorized automatically from the detected intents.</p>
      </div>
      <Panel flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search customer or message" className="w-full sm:w-64" />
          <Select controlSize="sm" value={category} onChange={(e) => setCategory(e.target.value as ConversationCategory | 'all')} aria-label="Filter by category" wrapperClassName="w-44">
            <option value="all">All categories</option>
            {(['Orders', 'Returns & refunds', 'Products', 'Billing', 'Sales lead', 'General'] as ConversationCategory[]).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select controlSize="sm" value={status} onChange={(e) => setStatus(e.target.value as ConversationStatus | 'all')} aria-label="Filter by status" wrapperClassName="w-44">
            <option value="all">All statuses</option>
            <option value="bot">Bot handling</option>
            <option value="escalated">With human agent</option>
            <option value="resolved">Resolved</option>
          </Select>
        </div>
        <Table minWidth={760}>
          <THead>
            <tr>
              <TH>Customer</TH>
              <TH>Category</TH>
              <TH>Status</TH>
              <TH>Sentiment</TH>
              <TH align="right">Messages</TH>
              <TH>Last activity</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((c) => (
              <TR key={c.id} className="cursor-pointer" onClick={() => open(c.id)}>
                <TD>
                  <button type="button" className="flex items-center gap-2.5 text-left" aria-label={`Open conversation with ${c.customer}`}>
                    <Avatar name={c.customer} size={26} title="" />
                    <span className="font-medium text-fg">{c.customer}</span>
                  </button>
                </TD>
                <TD>{c.category}</TD>
                <TD>
                  <Badge tone={STATUS_META[c.status].tone}>{STATUS_META[c.status].label}</Badge>
                </TD>
                <TD className="capitalize">{c.insights.sentiment.label}</TD>
                <TD align="right">{c.messages.length}</TD>
                <TD className="text-xs">{formatRelative(c.updatedAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Panel>
    </div>
  )
}

export function ChatAnalyticsView({ state }: { state: ChatbotState }) {
  const { axisProps, barCursor, gridProps, SERIES, STATUS, animate } = useChartTheme()
  const convs = state.conversations.filter((c) => c.messages.some((m) => m.role === 'customer'))
  const customerMsgs = convs.flatMap((c) => c.messages.filter((m) => m.role === 'customer'))
  const escalated = convs.filter((c) => c.status === 'escalated' || c.insights.escalationReason).length
  const botResolved = convs.filter((c) => c.status === 'resolved' && !c.insights.escalationReason).length
  const leads = convs.filter((c) => c.context.lead.stage === 'qualified').length

  const intentCounts = useMemo(() => {
    const map = new Map<IntentId, number>()
    for (const m of customerMsgs) if (m.intent && m.intent !== 'unknown') map.set(m.intent, (map.get(m.intent) ?? 0) + 1)
    return [...map.entries()].map(([intent, count]) => ({ intent: INTENT_LABELS[intent], count })).sort((a, b) => b.count - a.count).slice(0, 8)
  }, [customerMsgs])

  const sentiment = { positive: 0, neutral: 0, negative: 0 }
  for (const m of customerMsgs) {
    const s = m.sentiment ?? 0
    sentiment[s <= -0.3 ? 'negative' : s >= 0.3 ? 'positive' : 'neutral'] += 1
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Assistant analytics</h2>
        <p className="text-xs text-fg-3">Computed live from the conversations in this demo, including the ones you start.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Conversations" icon={MessagesSquare} value={convs.length} hint={`${customerMsgs.length} customer messages`} />
        <StatTile label="Resolved by assistant" icon={Bot} value={convs.length ? `${Math.round((botResolved / convs.length) * 100)}%` : '—'} hint={`${botResolved} without a human`} />
        <StatTile label="Escalated to humans" icon={Headset} value={escalated} hint={convs.length ? `${Math.round((escalated / convs.length) * 100)}% of conversations` : undefined} />
        <StatTile label="Qualified leads" icon={UserRoundCheck} value={leads} hint="From corporate inquiries" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ChartFrame
          title="Detected intents"
          description="Top intent of each customer message"
          height={Math.max(180, intentCounts.length * 36 + 30)}
          table={{ columns: [{ key: 'intent', label: 'Intent' }, { key: 'count', label: 'Messages', align: 'right' }], rows: intentCounts }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={intentCounts} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid {...gridProps} horizontal={false} vertical />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="intent" {...axisProps} axisLine={false} width={150} />
              <Tooltip content={tooltipRenderer((v) => `${v} message${v === 1 ? '' : 's'}`)} cursor={barCursor} />
              <Bar isAnimationActive={animate} dataKey="count" name="Messages" fill={SERIES[0]} radius={[0, 4, 4, 0]} maxBarSize={BAR_SIZE} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <Panel title="Customer sentiment" description="Across all customer messages">
          <SegmentedBar
            height={10}
            parts={[
              { label: 'Positive', value: sentiment.positive, color: STATUS.good },
              { label: 'Neutral', value: sentiment.neutral, color: '#5b6886' },
              { label: 'Negative', value: sentiment.negative, color: STATUS.critical },
            ]}
          />
          <ul className="mt-4 space-y-2 text-[13px]">
            {(
              [
                ['Positive', sentiment.positive, STATUS.good],
                ['Neutral', sentiment.neutral, '#5b6886'],
                ['Negative', sentiment.negative, STATUS.critical],
              ] as const
            ).map(([label, value, color]) => (
              <li key={label} className="flex items-center gap-2">
                <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden />
                <Smile className="size-3.5 text-fg-4" aria-hidden />
                <span className="flex-1 text-fg-2">{label}</span>
                <span className="font-medium text-fg tabular-nums">{value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-fg-3">Two consecutive negative messages — or one strongly negative complaint — trigger escalation to a person.</p>
        </Panel>
      </div>
    </div>
  )
}

export function KnowledgeView() {
  const orders = useMemo(() => Object.values(buildOrders()), [])
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Knowledge base</h2>
        <p className="flex items-center gap-1.5 text-xs text-fg-3">
          <ShieldCheck className="size-3.5" aria-hidden /> The assistant answers only from these sources and cites them — the same grounding a production LLM (RAG) setup uses.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {Object.values(POLICIES).map((p) => (
          <Panel key={p.title} title={p.title}>
            <p className="text-[13px] leading-relaxed text-fg-2">
              <RichText text={p.text} />
            </p>
          </Panel>
        ))}
      </div>
      <Panel title="Order system (sample records)" description="Used for order look-ups by ID" flush>
        <Table minWidth={620}>
          <THead>
            <tr>
              <TH>Order</TH>
              <TH>Customer</TH>
              <TH>Items</TH>
              <TH align="right">Total</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {orders.map((o) => (
              <TR key={o.id}>
                <TD className="font-mono text-xs text-fg">
                  <span className="flex items-center gap-1.5">
                    <Package className="size-3.5 text-fg-3" aria-hidden /> {o.id}
                  </span>
                </TD>
                <TD>{o.customer}</TD>
                <TD className="text-xs">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</TD>
                <TD align="right">{formatINR(o.total)}</TD>
                <TD>
                  <Badge tone={o.status === 'cancelled' ? 'red' : o.status === 'delivered' ? 'green' : 'blue'}>{o.status.replace(/_/g, ' ')}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Panel>
      <Panel title="Product catalog" flush>
        <Table minWidth={620}>
          <THead>
            <tr>
              <TH>Product</TH>
              <TH>Category</TH>
              <TH align="right">Price</TH>
              <TH>Highlights</TH>
            </tr>
          </THead>
          <TBody>
            {PRODUCTS.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium text-fg">{p.name}</TD>
                <TD>{p.category}</TD>
                <TD align="right">{formatINR(p.price)}</TD>
                <TD className="text-xs">{p.highlights.join(' · ')}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Panel>
    </div>
  )
}
