import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
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
import type { DemoId } from '@/types/content'
import { cn } from '@/utils/cn'

/** Cycles 0..steps-1 every `ms` (paused for reduced-motion users). */
function useTicker(steps: number, ms: number): number {
  const reduce = useReducedMotion()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setTick((t) => (t + 1) % steps), ms)
    return () => window.clearInterval(id)
  }, [steps, ms, reduce])
  return tick
}

function Frame({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn('relative h-full min-h-[220px] w-full overflow-hidden rounded-xl border border-white/[0.07] bg-[#070c19]', className)}
    >
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <div className="relative flex h-full flex-col p-4" aria-hidden>
        {children}
      </div>
    </div>
  )
}

function AppBar({ title, accent, right }: { title: string; accent: string; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: accent }} />
        <span className="text-[11px] font-semibold text-fg-2">{title}</span>
      </div>
      {right}
    </div>
  )
}

/* ------------------------------------------------------------------ 01 SaaS */
const TENANTS = [
  { name: 'Acme Technologies', plan: 'Growth', color: '#4f86ff', seats: [18, 25], api: 68, mrr: '$199' },
  { name: 'Nova Retail', plan: 'Enterprise', color: '#22d3ee', seats: [64, 100], api: 41, mrr: '$799' },
  { name: 'Vertex Solutions', plan: 'Starter', color: '#8b74ff', seats: [4, 5], api: 92, mrr: '$49' },
]

function SaasPreview() {
  const i = useTicker(3, 2600)
  const t = TENANTS[i]
  return (
    <Frame label="Preview: multi-tenant SaaS admin console switching between organizations">
      <AppBar
        title="Astra Console"
        accent="#4f86ff"
        right={
          <span className="flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-fg-2">
            <AnimatePresence mode="wait">
              <motion.span key={t.name} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                {t.name}
              </motion.span>
            </AnimatePresence>
            <ChevronDown className="size-3" />
          </span>
        }
      />
      <div className="grid flex-1 grid-cols-[1fr_1.15fr] gap-3">
        <LayoutGroup id="saas-preview">
          <ul className="space-y-1">
            {TENANTS.map((tenant, idx) => (
              <li key={tenant.name} className="relative flex items-center gap-2 rounded-lg px-2 py-1.5">
                {idx === i && <motion.span layoutId="tenant-hl" className="absolute inset-0 rounded-lg bg-white/[0.06] ring-1 ring-white/10" />}
                <span className="relative size-5 rounded-md" style={{ backgroundColor: `${tenant.color}40`, boxShadow: `inset 0 0 0 1px ${tenant.color}80` }} />
                <span className="relative min-w-0">
                  <span className="block truncate text-[10.5px] font-medium text-fg">{tenant.name}</span>
                  <span className="block text-[9.5px] text-fg-3">{tenant.plan} plan</span>
                </span>
              </li>
            ))}
          </ul>
        </LayoutGroup>
        <div className="space-y-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
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
      <AppBar title="Astra Commerce · Inventory" accent="#22d3ee" />
      <ul className="space-y-2">
        {products.map((p) => {
          const low = p.stock <= p.reorder
          return (
            <li key={p.name} className="flex items-center gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-[#22d3ee]/10">
                <p.icon className="size-3.5 text-astra-cyan" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[10.5px] font-medium text-fg">{p.name}</span>
                  <span className={cn('flex items-center gap-1 text-[10px] tabular-nums', low ? 'text-amber-300' : 'text-fg-3')}>
                    {low && <AlertTriangle className="size-3" />}
                    {p.stock} in stock
                  </span>
                </div>
                <Meter value={p.stock} max={60} tone={low ? 'warning' : 'cyan'} size="xs" className="mt-1.5" />
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-auto pt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={tick}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 ring-1 ring-emerald-500/20"
          >
            <CheckCircle2 className="size-3.5 text-emerald-300" />
            <span className="text-[10.5px] text-emerald-200">
              Order ORD-{10494 + tick} placed · stock reserved
            </span>
          </motion.div>
        </AnimatePresence>
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
        accent="#8b74ff"
        right={
          <div className="flex gap-1">
            {['Last 12 months', 'All regions'].map((c) => (
              <span key={c} className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] text-fg-2">
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
          <div key={k.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
            <p className="text-[9.5px] text-fg-3">{k.label}</p>
            <p className="text-[13px] font-semibold text-fg">{k.value}</p>
            <p className="text-[9.5px] text-emerald-300">{k.delta}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-1 items-end gap-[5px] border-b border-white/[0.08] pb-px">
        {bars.map((h, idx) => (
          <motion.div
            key={idx}
            className="flex-1 rounded-t-[3px]"
            style={{ backgroundColor: idx === bars.length - 1 ? '#9085e9' : 'rgb(144 133 233 / 0.45)' }}
            animate={{ height: `${h}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
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
        accent="#38bdf8"
        right={
          <span className="rounded-full bg-[#38bdf8]/10 px-1.5 py-0.5 font-mono text-[9px] text-[#7dd3fc] ring-1 ring-[#38bdf8]/20">
            intent: return_request · 0.93
          </span>
        }
      />
      <div className="flex flex-1 flex-col justify-end gap-1.5">
        <AnimatePresence initial={false}>
          {CHAT.slice(0, visible).map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                'max-w-[82%] rounded-xl px-2.5 py-1.5 text-[10.5px] leading-snug',
                m.from === 'user'
                  ? 'ml-auto rounded-br-sm bg-brand-strong/85 text-white'
                  : 'flex items-start gap-1.5 rounded-bl-sm bg-white/[0.07] text-fg-2',
              )}
            >
              {m.from === 'bot' && <Bot className="mt-px size-3 shrink-0 text-[#7dd3fc]" />}
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {visible < CHAT.length && CHAT[visible].from === 'bot' && (
          <div className="flex w-fit gap-1 rounded-xl bg-white/[0.07] px-2.5 py-2">
            {[0, 1, 2].map((d) => (
              <span key={d} className="animate-blink size-1 rounded-full bg-fg-3" style={{ animationDelay: `${d * 0.18}s` }} />
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-2.5 text-[9.5px] text-fg-3">
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
        accent="#a78bfa"
        right={<span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] text-fg-2">Holt-Winters · 6 months</span>}
      />
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full flex-1">
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} x2={w} y1={h * g} y2={h * g} stroke="rgb(148 163 184 / 0.08)" />
        ))}
        <path d={band} fill="#9085e9" fillOpacity={0.14} />
        <line x1={x(off)} x2={x(off)} y1={4} y2={h - 4} stroke="rgb(148 163 184 / 0.35)" />
        <text x={x(off) + 4} y={14} fontSize={8} fill="#8090ad">
          Today
        </text>
        <path d={histPath} fill="none" stroke="#4180f2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={fPath} fill="none" stroke="#9085e9" strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
        <circle cx={x(9)} cy={y(31)} r={7} fill="none" stroke="#d03b3b" strokeWidth={1.5} className="animate-pulse-ring origin-center [transform-box:fill-box]" />
        <circle cx={x(9)} cy={y(31)} r={3.5} fill="#d03b3b" stroke="#070c19" strokeWidth={1.5} />
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-fg-3">
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-3 rounded bg-[#4180f2]" /> Historical
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 border-t-2 border-dashed border-[#9085e9]" /> Forecast
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
    { id: 'a', title: 'Checkout redesign', col: 0, tag: 'Design', color: '#8b74ff' },
    { id: 'b', title: 'Payments API', col: movingColumn, tag: 'Backend', color: '#2dd4bf' },
    { id: 'c', title: 'Load testing', col: 1, tag: 'QA', color: '#fab219' },
    { id: 'd', title: 'Release notes', col: 2, tag: 'Docs', color: '#4f86ff' },
  ]
  return (
    <Frame label="Preview: Kanban board with a task moving between columns">
      <AppBar title="Astra Workspace · Sprint 14" accent="#2dd4bf" />
      <LayoutGroup id="kanban-preview">
        <div className="grid flex-1 grid-cols-3 gap-2">
          {COLUMNS.map((col, ci) => (
            <div key={col} className="rounded-lg bg-white/[0.025] p-1.5">
              <p className="mb-1.5 px-1 text-[9.5px] font-medium text-fg-3">{col}</p>
              <div className="space-y-1.5">
                {cards
                  .filter((c) => c.col === ci)
                  .map((c) => (
                    <motion.div
                      layout
                      layoutId={`kc-${c.id}`}
                      key={c.id}
                      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                      className={cn(
                        'rounded-md border border-white/[0.07] bg-[#0d1426] p-1.5',
                        c.id === 'b' && 'ring-1 ring-[#2dd4bf]/40',
                      )}
                    >
                      <p className="text-[9.5px] leading-tight font-medium text-fg">{c.title}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="rounded px-1 text-[8.5px]" style={{ backgroundColor: `${c.color}22`, color: c.color }}>
                          {c.tag}
                        </span>
                        <span className="size-3 rounded-full bg-gradient-to-br from-[#4f86ff] to-[#8b74ff]" />
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </LayoutGroup>
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
      <AppBar title="Astra Ledger" accent="#60a5fa" right={<span className="text-[10px] text-fg-3">November</span>} />
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
          { label: 'Salaries', value: 52, color: '#4180f2' },
          { label: 'Software', value: 16, color: '#d95926' },
          { label: 'Marketing', value: 14, color: '#199e70' },
          { label: 'Travel', value: 10, color: '#c98500' },
          { label: 'Food', value: 8, color: '#d55181' },
        ]}
      />
      <ul className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <li key={r.merchant} className="flex items-center gap-2 text-[10.5px]">
            <span className="min-w-0 flex-1 truncate text-fg-2">{r.merchant}</span>
            <span className="text-fg tabular-nums">{r.amount}</span>
            {r.done ? (
              <span className="flex w-[74px] items-center justify-center gap-1 rounded-md bg-[#60a5fa]/10 py-0.5 text-[9px] text-[#93c5fd]">
                <Sparkles className="size-2.5" /> {r.category}
              </span>
            ) : (
              <span className="flex w-[74px] items-center justify-center gap-1 rounded-md bg-white/[0.05] py-0.5 text-[9px] text-fg-3">
                <span className="animate-blink">categorizing…</span>
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
      <AppBar title="Astra ERP" accent="#818cf8" />
      <div className="grid grid-cols-4 gap-1.5">
        {['HR', 'Payroll', 'Procurement', 'Logistics'].map((m, i) => (
          <div
            key={m}
            className={cn(
              'rounded-md border px-1 py-1.5 text-center text-[9.5px] font-medium transition-colors',
              i === step ? 'border-[#818cf8]/50 bg-[#818cf8]/15 text-fg' : 'border-white/[0.06] bg-white/[0.02] text-fg-3',
            )}
          >
            {m}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-medium text-fg">PO-2026-0142 · Steel fasteners</span>
          <span className="text-fg-3">Kestrel Metals</span>
        </div>
        <div className="relative mt-3 mb-1 flex justify-between">
          <div className="absolute top-[7px] right-2 left-2 h-px bg-white/10">
            <motion.div
              className="h-px bg-[#818cf8]"
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          {SHIP_STEPS.map((s, i) => (
            <div key={s} className="relative flex flex-col items-center gap-1">
              <span
                className={cn(
                  'flex size-4 items-center justify-center rounded-full ring-2 ring-[#070c19] transition-colors',
                  i <= step ? 'bg-[#818cf8]' : 'bg-[#1a2440]',
                )}
              >
                {i < step ? <Check className="size-2.5 text-white" strokeWidth={3} /> : i === step ? <Truck className="size-2.5 text-white" /> : null}
              </span>
              <span className={cn('text-[8.5px]', i <= step ? 'text-fg-2' : 'text-fg-4')}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-2 text-[10px]">
        <span className="flex items-center gap-1.5 text-fg-2">
          <Package className="size-3 text-[#a5b4fc]" /> November payroll · 48 employees
        </span>
        <span className="text-[#a5b4fc]">Ready</span>
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
      <AppBar title="Astra DocIQ" accent="#67e8f9" right={<ScanLine className="size-3.5 text-astra-cyan-soft" />} />
      <div className="grid flex-1 grid-cols-[0.9fr_1.1fr] gap-3">
        <div className="paper relative overflow-hidden rounded-md p-2.5 font-mono text-[7.5px] leading-[1.55] text-[#2a2f3a]">
          <p className={cn('text-center text-[8.5px] font-bold transition-colors', step >= 1 && 'bg-cyan-300/50')}>BREW & BEAN CAFÉ</p>
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
          <p className={cn('flex justify-between transition-colors', step >= 2 && 'bg-cyan-300/50')}>
            <span>GST 5%</span>
            <span>54.29</span>
          </p>
          <p className={cn('flex justify-between font-bold transition-colors', step >= 3 && 'bg-cyan-300/50')}>
            <span>TOTAL</span>
            <span>1,140.00</span>
          </p>
          <div className="animate-scan absolute inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_12px_2px_rgb(34_211_238/0.7)]" />
        </div>
        <ul className="space-y-1.5">
          {fields.map((f, i) => (
            <li key={f.label} className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1">
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

export function SolutionPreview({ demoId, className }: { demoId: DemoId; className?: string }) {
  const Preview = PREVIEWS[demoId]
  return (
    <div className={cn('h-full w-full', className)}>
      <Preview />
    </div>
  )
}
