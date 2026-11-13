import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Headphones,
  Package,
  ScanLine,
  Sparkles,
  Speaker,
  Truck,
  Watch,
} from 'lucide-react'
import { Meter, SegmentedBar } from '@/components/ui/Meter'
import { SOLUTION_INDEX } from '@/data/constants/solution-index'
import { canAnimateDecor, useInView, usePageVisible } from '@/hooks/useInView'
import { accentVars } from '@/theme/accents'
import type { DemoId, SolutionSummary } from '@/types/content'
import { cn } from '@/utils/cn'

/**
 * Illustrative mini-previews of the nine products (no chart or animation library).
 * Each preview wears its product's colours through CSS variables:
 *   --p primary · --p2 secondary · --p-strong primary for filled chips
 *   text-sol / text-sol-accent pick the right shade for light or dark mode.
 */

/** Whether this preview may run its ticker: on screen, tab visible, capable device. */
const PreviewActiveContext = createContext(false)

/** Cycles 0..steps-1 every `ms` while the preview is active; otherwise holds still. */
function useTicker(steps: number, ms: number): number {
  const active = useContext(PreviewActiveContext)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setTick((t) => (t + 1) % steps), ms)
    return () => window.clearInterval(id)
  }, [active, steps, ms])
  return tick
}

const tint = (color: string, pct: number) => `color-mix(in oklab, ${color} ${pct}%, transparent)`
const P = 'var(--p)'
const P2 = 'var(--p2)'

function previewVars(solution: SolutionSummary): CSSProperties {
  // Deep shade of the primary for filled chips that carry white text.
  return { ...accentVars(solution), '--p-strong': solution.accentInk } as CSSProperties
}

function Frame({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <div role="img" aria-label={label} className={cn('relative h-full min-h-[220px] w-full overflow-hidden rounded-xl border border-ink/[0.07] bg-base', className)}>
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <div
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-70"
        style={{ background: `radial-gradient(closest-side, ${tint(P, 16)}, transparent)` }}
        aria-hidden
      />
      <div className="relative flex h-full flex-col p-4" aria-hidden>
        {children}
      </div>
    </div>
  )
}

function AppBar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: P }} />
        <span className="text-[11px] font-semibold text-fg-2">{title}</span>
      </div>
      {right}
    </div>
  )
}

/* ------------------------------------------------------------------ 01 SaaS */
const TENANTS = [
  { name: 'Acme Technologies', plan: 'Growth', color: P, seats: [18, 25], api: 68, mrr: '$199' },
  { name: 'Nova Retail', plan: 'Enterprise', color: P2, seats: [64, 100], api: 41, mrr: '$799' },
  { name: 'Vertex Solutions', plan: 'Starter', color: 'var(--color-astra-cyan)', seats: [4, 5], api: 92, mrr: '$49' },
]

function SaasPreview() {
  const i = useTicker(3, 2600)
  const t = TENANTS[i]
  return (
    <Frame label="Preview: multi-tenant SaaS admin console switching between organizations">
      <AppBar
        title="Astra Console"
        right={
          <span className="flex items-center gap-1 rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[10px] text-fg-2">
            <span key={t.name} className="animate-enter">
              {t.name}
            </span>
            <ChevronDown className="size-3" />
          </span>
        }
      />
      <div className="grid flex-1 grid-cols-[1fr_1.15fr] gap-3">
        <ul className="space-y-1">
            {TENANTS.map((tenant, idx) => (
              <li key={tenant.name} className="relative flex items-center gap-2 rounded-lg px-2 py-1.5">
                <span className={cn('absolute inset-0 rounded-lg bg-ink/[0.06] ring-1 ring-ink/10 transition-opacity duration-300', idx === i ? 'opacity-100' : 'opacity-0')} />
                <span className="relative size-5 rounded-md" style={{ backgroundColor: tint(tenant.color, 25), boxShadow: `inset 0 0 0 1px ${tint(tenant.color, 50)}` }} />
                <span className="relative min-w-0">
                  <span className="block truncate text-[10.5px] font-medium text-fg">{tenant.name}</span>
                  <span className="block text-[9.5px] text-fg-3">{tenant.plan} plan</span>
                </span>
              </li>
            ))}
        </ul>
        <div className="space-y-2.5 rounded-lg border border-ink/[0.06] bg-ink/[0.02] p-2.5">
          <div>
            <div className="mb-1 flex justify-between text-[9.5px] text-fg-3">
              <span>Seats</span>
              <span className="text-fg-2 tabular-nums">
                {t.seats[0]}/{t.seats[1]}
              </span>
            </div>
            <Meter value={t.seats[0]} max={t.seats[1]} tone="auto" size="xs" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[9.5px] text-fg-3">
              <span>API quota</span>
              <span className="text-fg-2 tabular-nums">{t.api}%</span>
            </div>
            <Meter value={t.api} tone="auto" size="xs" />
          </div>
          <div className="flex items-end justify-between pt-1">
            <span className="text-[9.5px] text-fg-3">MRR</span>
            <span className="text-sm font-semibold text-fg">{t.mrr}</span>
          </div>
        </div>
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------ 02 Commerce */
function EcommercePreview() {
  const tick = useTicker(4, 2200)
  const products = [
    { name: 'Aurora ANC Headphones', icon: Headphones, stock: 42 - tick, reorder: 15 },
    { name: 'Pulse Smartwatch S2', icon: Watch, stock: 6, reorder: 10 },
    { name: 'Nimbus Bluetooth Speaker', icon: Speaker, stock: 23, reorder: 12 },
  ]
  return (
    <Frame label="Preview: storefront orders updating inventory in real time">
      <AppBar title="Astra Commerce · Inventory" />
      <ul className="space-y-2">
        {products.map((p) => {
          const low = p.stock <= p.reorder
          return (
            <li key={p.name} className="flex items-center gap-2.5 rounded-lg border border-ink/[0.05] bg-ink/[0.02] px-2.5 py-2">
              <span className="flex size-7 items-center justify-center rounded-md" style={{ backgroundColor: tint(P, 12) }}>
                <p.icon className="text-sol-accent size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[10.5px] font-medium text-fg">{p.name}</span>
                  <span className={cn('flex items-center gap-1 text-[10px] tabular-nums', low ? 'text-amber-300' : 'text-fg-3')}>
                    {low && <AlertTriangle className="size-3" />}
                    {p.stock} in stock
                  </span>
                </div>
                <Meter value={p.stock} max={60} tone={low ? 'warning' : 'good'} size="xs" className="mt-1.5" />
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-auto pt-3">
        <div key={tick} className="animate-enter flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 ring-1 ring-emerald-500/20">
          <CheckCircle2 className="size-3.5 text-emerald-300" />
          <span className="text-[10.5px] text-emerald-200">Order ORD-{10494 + tick} placed · stock reserved</span>
        </div>
      </div>
    </Frame>
  )
}

/* ----------------------------------------------------------- 03 Dashboards */
const BAR_SETS = [
  [38, 52, 44, 61, 57, 70, 66, 74, 69, 82, 78, 90],
  [42, 48, 51, 58, 63, 60, 71, 68, 77, 74, 85, 88],
  [35, 45, 49, 55, 52, 64, 69, 72, 70, 79, 83, 94],
]

function AnalyticsPreview() {
  const tick = useTicker(3, 2400)
  const bars = BAR_SETS[tick]
  return (
    <Frame label="Preview: business dashboard with KPI tiles and a monthly revenue chart">
      <AppBar
        title="Astra Insights"
        right={
          <div className="flex gap-1">
            {['Last 12 months', 'All regions'].map((c) => (
              <span key={c} className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[9.5px] text-fg-2">
                {c}
              </span>
            ))}
          </div>
        }
      />
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Revenue', value: '₹1.84Cr', delta: '+12.4%' },
          { label: 'Orders', value: '9,412', delta: '+6.1%' },
          { label: 'Margin', value: '38.2%', delta: '+1.3 pts' },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-ink/[0.06] bg-ink/[0.02] px-2 py-1.5">
            <p className="text-[9.5px] text-fg-3">{k.label}</p>
            <p className="text-[13px] font-semibold text-fg">{k.value}</p>
            <p className="text-[9.5px] text-emerald-300">{k.delta}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-1 items-end gap-[5px] border-b border-ink/[0.08] pb-px">
        {bars.map((h, idx) => (
          // Full-height bars scaled on the compositor (no layout work per frame).
          <div
            key={idx}
            className="h-full flex-1 origin-bottom rounded-t-[3px] transition-transform duration-500 ease-out"
            style={{ backgroundColor: idx === bars.length - 1 ? P : tint(P, 45), transform: `scaleY(${h / 100})` }}
          />
        ))}
      </div>
    </Frame>
  )
}

/* -------------------------------------------------------------- 04 Chatbot */
const CHAT = [
  { from: 'user', text: 'I want to return my headphones' },
  { from: 'bot', text: 'Sure — could you share your order number?' },
  { from: 'user', text: 'ORD-10482' },
  { from: 'bot', text: 'Found it. Your return is eligible. Shall I start it now?' },
] as const

function ChatbotPreview() {
  const step = useTicker(6, 1500)
  const visible = Math.min(step + 1, CHAT.length)
  return (
    <Frame label="Preview: AI support agent detecting intent and handling a return request">
      <AppBar
        title="Astra Assist"
        right={
          <span className="text-sol rounded-full px-1.5 py-0.5 font-mono text-[9px]" style={{ backgroundColor: tint(P, 12), boxShadow: `inset 0 0 0 1px ${tint(P, 25)}` }}>
            intent: return_request · 0.93
          </span>
        }
      />
      <div className="flex flex-1 flex-col justify-end gap-1.5">
        {CHAT.slice(0, visible).map((m, idx) => (
          <div
            key={idx}
            className={cn(
              'animate-enter max-w-[82%] rounded-xl px-2.5 py-1.5 text-[10.5px] leading-snug',
              m.from === 'user' ? 'ml-auto rounded-br-sm text-white' : 'flex items-start gap-1.5 rounded-bl-sm bg-ink/[0.07] text-fg-2',
            )}
            style={m.from === 'user' ? { backgroundColor: 'var(--p-strong)' } : undefined}
          >
            {m.from === 'bot' && <Bot className="text-sol-accent mt-px size-3 shrink-0" />}
            {m.text}
          </div>
        ))}
        {visible < CHAT.length && CHAT[visible].from === 'bot' && (
          <div className="flex w-fit gap-1 rounded-xl bg-ink/[0.07] px-2.5 py-2">
            {[0, 1, 2].map((d) => (
              <span key={d} className="motion-decor animate-blink size-1 rounded-full bg-fg-3" style={{ animationDelay: `${d * 0.18}s` }} />
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-ink/[0.06] pt-2.5 text-[9.5px] text-fg-3">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-400" /> Sentiment: neutral
        </span>
        <span className="ml-auto">Escalation: not needed</span>
      </div>
    </Frame>
  )
}

/* ----------------------------------------------------------- 05 Predictive */
const HIST = [30, 34, 33, 38, 41, 39, 44, 47, 45, 31, 50, 53, 51, 56, 59, 58, 62, 66]
const FCST = [66, 68, 71, 70, 74, 77, 76]

function PredictivePreview() {
  const w = 300
  const h = 130
  const all = [...HIST, ...FCST.slice(1)]
  const n = all.length
  const max = 90
  const min = 20
  const x = (i: number) => 8 + (i / (n - 1)) * (w - 16)
  const y = (v: number) => 8 + (1 - (v - min) / (max - min)) * (h - 16)
  const histPath = HIST.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const off = HIST.length - 1
  const fPath = FCST.map((v, i) => `${i ? 'L' : 'M'}${x(off + i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const upper = FCST.map((v, i) => [x(off + i), y(v + i * 2.2)] as const)
  const lower = FCST.map((v, i) => [x(off + i), y(v - i * 2.2)] as const).reverse()
  const band = [...upper, ...lower].map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ') + ' Z'
  return (
    <Frame label="Preview: revenue forecast with a confidence band and a detected anomaly">
      <AppBar
        title="Astra Foresight"
        right={<span className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[9.5px] text-fg-2">Holt-Winters · 6 months</span>}
      />
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full flex-1">
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} x2={w} y1={h * g} y2={h * g} stroke="rgb(148 163 184 / 0.14)" />
        ))}
        <path d={band} style={{ fill: P2 }} fillOpacity={0.16} />
        <line x1={x(off)} x2={x(off)} y1={4} y2={h - 4} stroke="rgb(148 163 184 / 0.35)" />
        <text x={x(off) + 4} y={14} fontSize={8} className="fill-fg-3">
          Today
        </text>
        <path d={histPath} fill="none" style={{ stroke: P }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={fPath} fill="none" style={{ stroke: P2 }} strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
        <circle cx={x(9)} cy={y(31)} r={7} fill="none" stroke="#d03b3b" strokeWidth={1.5} className="motion-decor animate-pulse-ring origin-center [transform-box:fill-box]" />
        <circle cx={x(9)} cy={y(31)} r={3.5} fill="#d03b3b" style={{ stroke: 'var(--color-base)' }} strokeWidth={1.5} />
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-fg-3">
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-3 rounded" style={{ backgroundColor: P }} /> Historical
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 border-t-2 border-dashed" style={{ borderColor: P2 }} /> Forecast
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#d03b3b]" /> Anomaly
        </span>
      </div>
    </Frame>
  )
}

/* -------------------------------------------------------- 06 Collaboration */
const COLUMNS = ['To do', 'In progress', 'Done'] as const

function CollaborationPreview() {
  const tick = useTicker(3, 2000)
  const movingColumn = tick
  const cards: { id: string; title: string; col: number; tag: string; color: string }[] = [
    { id: 'a', title: 'Checkout redesign', col: 0, tag: 'Design', color: 'var(--color-series-7)' },
    { id: 'b', title: 'Payments API', col: movingColumn, tag: 'Backend', color: P },
    { id: 'c', title: 'Load testing', col: 1, tag: 'QA', color: 'var(--color-series-3)' },
    { id: 'd', title: 'Release notes', col: 2, tag: 'Docs', color: 'var(--color-series-1)' },
  ]
  return (
    <Frame label="Preview: Kanban board with a task moving between columns">
      <AppBar title="Astra Workspace · Sprint 14" />
      <div className="grid flex-1 grid-cols-3 gap-2">
          {COLUMNS.map((col, ci) => (
            <div key={col} className="rounded-lg bg-ink/[0.025] p-1.5">
              <p className="mb-1.5 px-1 text-[9.5px] font-medium text-fg-3">{col}</p>
              <div className="space-y-1.5">
                {cards
                  .filter((c) => c.col === ci)
                  .map((c) => (
                    <div
                      key={`${c.id}-${c.col}`}
                      className={cn('rounded-md border border-ink/[0.07] bg-raised p-1.5', c.id === 'b' && 'animate-enter')}
                      style={c.id === 'b' ? { boxShadow: `0 0 0 1px ${tint(P, 45)}` } : undefined}
                    >
                      <p className="text-[9.5px] leading-tight font-medium text-fg">{c.title}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="rounded px-1 text-[8.5px] font-medium text-fg-2" style={{ backgroundColor: tint(c.color, 18) }}>
                          {c.tag}
                        </span>
                        <span className="size-3 rounded-full" style={{ backgroundImage: `linear-gradient(135deg, ${P}, ${P2})` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </Frame>
  )
}

/* -------------------------------------------------------------- 07 FinTech */
function FintechPreview() {
  const tick = useTicker(3, 1800)
  const rows = [
    { merchant: 'AWS India', amount: '₹38,420', category: 'Software', done: true },
    { merchant: 'IndiGo Airlines', amount: '₹12,860', category: 'Travel', done: true },
    { merchant: 'Swiggy · Team lunch', amount: '₹3,240', category: 'Food', done: tick > 0 },
  ]
  return (
    <Frame label="Preview: expense dashboard with AI-assisted categorization and budgets">
      <AppBar title="Astra Ledger" right={<span className="text-[10px] text-fg-3">November</span>} />
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9.5px] text-fg-3">Spend this month</p>
          <p className="text-base font-semibold text-fg">₹4,82,350</p>
        </div>
        <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] text-emerald-300">Within budget</span>
      </div>
      <SegmentedBar
        className="mt-2"
        height={7}
        parts={[
          { label: 'Salaries', value: 52, color: P },
          { label: 'Software', value: 16, color: P2 },
          { label: 'Marketing', value: 14, color: 'var(--color-series-2)' },
          { label: 'Travel', value: 10, color: 'var(--color-series-4)' },
          { label: 'Food', value: 8, color: 'var(--color-series-5)' },
        ]}
      />
      <ul className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <li key={r.merchant} className="flex items-center gap-2 text-[10.5px]">
            <span className="min-w-0 flex-1 truncate text-fg-2">{r.merchant}</span>
            <span className="text-fg tabular-nums">{r.amount}</span>
            {r.done ? (
              <span className="text-sol flex w-[74px] items-center justify-center gap-1 rounded-md py-0.5 text-[9px]" style={{ backgroundColor: tint(P, 12) }}>
                <Sparkles className="size-2.5" /> {r.category}
              </span>
            ) : (
              <span className="flex w-[74px] items-center justify-center gap-1 rounded-md bg-ink/[0.05] py-0.5 text-[9px] text-fg-3">
                <span className="motion-decor animate-blink">categorizing…</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 08 ERP */
const SHIP_STEPS = ['Approved', 'Dispatched', 'In transit', 'Delivered']

function ErpPreview() {
  const step = useTicker(4, 1700)
  return (
    <Frame label="Preview: ERP connecting HR, payroll, procurement and shipment tracking">
      <AppBar title="Astra ERP" />
      <div className="grid grid-cols-4 gap-1.5">
        {['HR', 'Payroll', 'Procurement', 'Logistics'].map((m, i) => (
          <div
            key={m}
            className={cn(
              'rounded-md border px-1 py-1.5 text-center text-[9.5px] font-medium transition-colors',
              i === step ? 'text-fg' : 'border-ink/[0.06] bg-ink/[0.02] text-fg-3',
            )}
            style={i === step ? { borderColor: tint(P, 50), backgroundColor: tint(P, 15) } : undefined}
          >
            {m}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-ink/[0.06] bg-ink/[0.02] p-2.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-medium text-fg">PO-2026-0142 · Steel fasteners</span>
          <span className="text-fg-3">Kestrel Metals</span>
        </div>
        <div className="relative mt-3 mb-1 flex justify-between">
          <div className="absolute top-[7px] right-2 left-2 h-px bg-ink/10">
            <div className="h-px origin-left transition-transform duration-500 ease-out" style={{ backgroundColor: P, transform: `scaleX(${step / 3})` }} />
          </div>
          {SHIP_STEPS.map((s, i) => (
            <div key={s} className="relative flex flex-col items-center gap-1">
              <span
                className={cn(
                  'flex size-4 items-center justify-center rounded-full ring-2 ring-base transition-colors',
                  i > step && 'bg-line',
                )}
                style={i <= step ? { backgroundColor: P } : undefined}
              >
                {i < step ? <Check className="size-2.5 text-white" strokeWidth={3} /> : i === step ? <Truck className="size-2.5 text-white" /> : null}
              </span>
              <span className={cn('text-[8.5px]', i <= step ? 'text-fg-2' : 'text-fg-4')}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between rounded-lg bg-ink/[0.03] px-2.5 py-2 text-[10px]">
        <span className="flex items-center gap-1.5 text-fg-2">
          <Package className="text-sol-accent size-3" /> November payroll · 48 employees
        </span>
        <span className="text-sol">Ready</span>
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 09 OCR */
function OcrPreview() {
  const step = useTicker(4, 1400)
  const fields = [
    { label: 'Merchant', value: 'Brew & Bean Café' },
    { label: 'Date', value: '08 Nov 2026' },
    { label: 'GST', value: '₹54.29' },
    { label: 'Total', value: '₹1,140.00' },
  ]
  return (
    <Frame label="Preview: receipt being scanned with extracted fields">
      <AppBar title="Astra DocIQ" right={<ScanLine className="text-sol-accent size-3.5" />} />
      <div className="grid flex-1 grid-cols-[0.9fr_1.1fr] gap-3">
        <div className="paper relative overflow-hidden rounded-md p-2.5 font-mono text-[7.5px] leading-[1.55] text-[#2a2f3a]">
          <p className={cn('text-center text-[8.5px] font-bold transition-colors', step >= 1 && 'bg-[color-mix(in_oklab,var(--p)_30%,transparent)]')}>BREW & BEAN CAFÉ</p>
          <p className="text-center text-[6.5px] text-[#666]">Indiranagar, Bengaluru</p>
          <div className="my-1 border-t border-dashed border-[#bbb]" />
          <p className="flex justify-between">
            <span>Cappuccino ×2</span>
            <span>480.00</span>
          </p>
          <p className="flex justify-between">
            <span>Avocado toast</span>
            <span>390.00</span>
          </p>
          <p className="flex justify-between">
            <span>Cold brew</span>
            <span>216.00</span>
          </p>
          <div className="my-1 border-t border-dashed border-[#bbb]" />
          <p className={cn('flex justify-between transition-colors', step >= 2 && 'bg-[color-mix(in_oklab,var(--p)_30%,transparent)]')}>
            <span>GST 5%</span>
            <span>54.29</span>
          </p>
          <p className={cn('flex justify-between font-bold transition-colors', step >= 3 && 'bg-[color-mix(in_oklab,var(--p)_30%,transparent)]')}>
            <span>TOTAL</span>
            <span>1,140.00</span>
          </p>
          <div className="motion-decor animate-scan pointer-events-none absolute inset-0" aria-hidden>
            <div className="h-0.5" style={{ backgroundColor: P, boxShadow: `0 0 12px 2px ${tint(P, 70)}` }} />
          </div>
        </div>
        <ul className="space-y-1.5">
          {fields.map((f, i) => (
            <li key={f.label} className="rounded-md border border-ink/[0.06] bg-ink/[0.02] px-2 py-1">
              <p className="text-[9px] text-fg-3">{f.label}</p>
              <p className={cn('flex items-center justify-between text-[10.5px] transition-opacity', i <= step ? 'text-fg opacity-100' : 'opacity-30')}>
                <span className="truncate">{i <= step ? f.value : '—'}</span>
                {i <= step && <Check className="size-3 shrink-0 text-emerald-400" />}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  )
}

const PREVIEWS: Record<DemoId, () => ReactNode> = {
  saas: SaasPreview,
  ecommerce: EcommercePreview,
  analytics: AnalyticsPreview,
  chatbot: ChatbotPreview,
  predictive: PredictivePreview,
  collaboration: CollaborationPreview,
  fintech: FintechPreview,
  erp: ErpPreview,
  ocr: OcrPreview,
}

const SOLUTION_BY_DEMO = Object.fromEntries(SOLUTION_INDEX.map((s) => [s.demoId, s])) as Record<DemoId, SolutionSummary>

export function SolutionPreview({ demoId, className }: { demoId: DemoId; className?: string }) {
  const Preview = PREVIEWS[demoId]
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const pageVisible = usePageVisible()
  const [capable] = useState(canAnimateDecor)
  const solution = SOLUTION_BY_DEMO[demoId]
  const running = inView && pageVisible
  return (
    <div ref={ref} className={cn('h-full w-full', className)} style={previewVars(solution)} data-paused={running ? undefined : ''}>
      <PreviewActiveContext.Provider value={running && capable}>
        <Preview />
      </PreviewActiveContext.Provider>
    </div>
  )
}
