import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, BrainCircuit, Check, MessageSquare, ScanText, Workflow } from 'lucide-react'
import logoUrl from '@/assets/astra-logo.png'
import { Sparkline } from '@/components/ui/Sparkline'
import { SUMMARY_BY_SLUG as SOLUTION_BY_SLUG } from '@/data/constants/solution-index'
import { canAnimateDecor, useInView, usePageVisible } from '@/hooks/useInView'
import { paths } from '@/routes/paths'
import { accentVars } from '@/theme/accents'
import type { SolutionSlug } from '@/types/content'
import { cn } from '@/utils/cn'

const W = 640
const H = 560
const CX = 320
const CY = 300
const RX = 200
const RY = 155

const ORDER: { slug: SolutionSlug; label: string }[] = [
  { slug: 'ai-chatbots', label: 'AI Agents' },
  { slug: 'predictive-analytics', label: 'Forecasting' },
  { slug: 'business-dashboards', label: 'Dashboards' },
  { slug: 'ecommerce-inventory', label: 'Commerce' },
  { slug: 'fintech-automation', label: 'FinTech' },
  { slug: 'erp-automation', label: 'ERP' },
  { slug: 'collaborative-workspace', label: 'Workspaces' },
  { slug: 'saas-development', label: 'SaaS' },
  { slug: 'document-intelligence', label: 'Documents' },
]

const NODES = ORDER.map((n, k) => {
  const angle = ((-90 + 40 * k) * Math.PI) / 180
  const x = CX + RX * Math.cos(angle)
  const y = CY + RY * Math.sin(angle)
  // Slightly curved spoke from the core to the node.
  const mx = (CX + x) / 2
  const my = (CY + y) / 2
  const len = Math.hypot(x - CX, y - CY)
  const qx = mx + (-(y - CY) / len) * 16
  const qy = my + ((x - CX) / len) * 16
  return {
    ...n,
    k,
    x,
    y,
    angle,
    spoke: `M${CX},${CY} Q${qx.toFixed(1)},${qy.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`,
    solution: SOLUTION_BY_SLUG[n.slug],
  }
})

// A few cross-links between solutions that commonly integrate.
const LINKS: [number, number][] = [
  [0, 2],
  [3, 5],
  [4, 8],
  [1, 3],
  [6, 7],
]

function linkPath(a: (typeof NODES)[number], b: (typeof NODES)[number]): string {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const qx = mx + (CX - mx) * 0.35
  const qy = my + (CY - my) * 0.35
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`
}

const FORECAST = [42, 45, 44, 49, 53, 51, 56, 60, 58, 63, 67, 66, 70, 74, 73, 78, 82]

/** Parallax offset driven by the --px / --py variables on the root (composited transform). */
const parallax = (fx: number, fy: number): CSSProperties => ({
  transform: `translate3d(calc(var(--px, 0) * ${fx}px), calc(var(--py, 0) * ${fy}px), 0)`,
})

const predictive = SOLUTION_BY_SLUG['predictive-analytics']
const chatbot = SOLUTION_BY_SLUG['ai-chatbots']
const ocr = SOLUTION_BY_SLUG['document-intelligence']
const erp = SOLUTION_BY_SLUG['erp-automation']

/**
 * Interactive solution map in the hero.
 *
 * Performance notes: no animation library; parallax writes two CSS variables at most
 * once per frame and every moving layer uses transforms. Continuous decoration
 * (data packets, rings, floating cards) runs only on capable devices, and pauses
 * while the hero is off-screen or the tab is hidden.
 */
export function HeroVisual() {
  const navigate = useNavigate()
  const [active, setActive] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const frame = useRef(0)
  const inView = useInView(rootRef)
  const pageVisible = usePageVisible()
  const [capable] = useState(canAnimateDecor)
  const running = inView && pageVisible

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !capable) return
    if (running) svg.unpauseAnimations()
    else svg.pauseAnimations()
  }, [running, capable])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const setPointer = (x: number, y: number) => {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      rootRef.current?.style.setProperty('--px', x.toFixed(3))
      rootRef.current?.style.setProperty('--py', y.toFixed(3))
    })
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!capable || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    setPointer(((event.clientX - rect.left) / rect.width) * 2 - 1, ((event.clientY - rect.top) / rect.height) * 2 - 1)
  }

  const open = (slug: SolutionSlug) => navigate(paths.solution(slug))
  const onNodeKey = (event: KeyboardEvent<SVGGElement>, slug: SolutionSlug) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      open(slug)
    }
  }

  const activeNode = active !== null ? NODES[active] : null
  const layer = 'transition-transform duration-700 ease-out will-change-transform'

  return (
    <div
      ref={rootRef}
      className="relative mx-auto aspect-[640/560] w-full max-w-[620px] select-none"
      onPointerMove={onPointerMove}
      onPointerLeave={() => capable && setPointer(0, 0)}
      data-paused={running ? undefined : ''}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={cn('absolute inset-0 h-full w-full overflow-visible', layer)}
        style={parallax(-5, -4)}
        role="group"
        aria-label="Astra Intelligence solution map — nine connected solution areas"
      >
        <defs>
          <radialGradient id="hv-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4f86ff" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#7c5cff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hv-core-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3f7bff" />
            <stop offset="100%" stopColor="#7c5cff" />
          </linearGradient>
          <linearGradient id="hv-spoke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4f86ff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#8b74ff" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id="hv-field" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: 'var(--color-raised)' }} stopOpacity="0.9" />
            <stop offset="100%" style={{ stopColor: 'var(--color-canvas)' }} stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx={CX} cy={CY} rx={RX + 95} ry={RY + 80} fill="url(#hv-field)" />
        <ellipse cx={CX} cy={CY} rx={RX + 70} ry={RY + 58} fill="none" stroke="rgb(148 163 184 / 0.1)" strokeDasharray="2 7" />
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="rgb(148 163 184 / 0.18)" />
        <ellipse cx={CX} cy={CY} rx={RX * 0.55} ry={RY * 0.55} fill="none" stroke="rgb(148 163 184 / 0.1)" />

        {/* Cross-links */}
        {LINKS.map(([a, b]) => {
          const highlighted = active === a || active === b
          return (
            <path
              key={`${a}-${b}`}
              d={linkPath(NODES[a], NODES[b])}
              fill="none"
              stroke={highlighted ? '#8b74ff' : 'rgb(139 116 255 / 0.25)'}
              strokeWidth={highlighted ? 1.4 : 1}
              strokeDasharray="3 6"
            />
          )
        })}

        {/* Spokes */}
        {NODES.map((n) => {
          const highlighted = active === n.k
          return (
            <g key={`spoke-${n.slug}`}>
              <path
                id={`hv-spoke-${n.k}`}
                d={n.spoke}
                fill="none"
                stroke={highlighted ? n.solution.accent : 'url(#hv-spoke)'}
                strokeOpacity={active === null || highlighted ? 1 : 0.35}
                strokeWidth={highlighted ? 1.8 : 1.1}
              />
              <path d={n.spoke} fill="none" stroke={n.solution.accent} strokeOpacity={highlighted ? 0.9 : 0.3} strokeWidth={1.4} strokeDasharray="2 12" />
            </g>
          )
        })}

        {/* Data packets travelling along the spokes (capable devices only; paused off-screen) */}
        {capable &&
          NODES.map((n) => (
            <circle key={`pkt-${n.slug}`} r={2.4} fill={n.solution.accent} opacity={0.9}>
              <animateMotion
                dur={`${3.4 + (n.k % 4) * 0.45}s`}
                begin={`-${(n.k * 0.37).toFixed(2)}s`}
                repeatCount="indefinite"
                keyPoints={n.k % 3 === 0 ? '1;0' : '0;1'}
                keyTimes="0;1"
                calcMode="linear"
              >
                <mpath href={`#hv-spoke-${n.k}`} />
              </animateMotion>
            </circle>
          ))}

        {/* Core */}
        <g>
          <circle cx={CX} cy={CY} r={92} fill="url(#hv-core-glow)" />
          <circle
            cx={CX}
            cy={CY}
            r={60}
            fill="none"
            stroke="#8fb2ff"
            strokeOpacity={0.35}
            strokeDasharray="1.5 6"
            className="motion-decor animate-spin-slow origin-center [transform-box:fill-box]"
          />
          {capable && (
            <circle cx={CX} cy={CY} r={42} fill="none" stroke="#4f86ff" strokeWidth={1.5} className="motion-decor animate-pulse-ring origin-center [transform-box:fill-box]" />
          )}
          <circle cx={CX} cy={CY} r={42} fill="url(#hv-core-fill)" />
          <circle cx={CX} cy={CY} r={41.5} fill="none" stroke="#fff" strokeOpacity={0.25} />
          <image href={logoUrl} x={CX - 32} y={CY - 20} width={64} height={40} preserveAspectRatio="xMidYMid meet" aria-hidden />
        </g>

        {/* Solution nodes */}
        {NODES.map((n) => {
          const highlighted = active === n.k
          const Icon = n.solution.icon
          const cos = Math.cos(n.angle)
          const sin = Math.sin(n.angle)
          const anchor = cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle'
          const lx = n.x + cos * 38
          const ly = n.y + sin * 38 + (anchor === 'middle' ? (sin > 0 ? 6 : -2) : 4)
          return (
            <g
              key={n.slug}
              transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`}
              role="link"
              tabIndex={0}
              aria-label={`${n.label} — ${n.solution.name}: ${n.solution.tagline}`}
              className="cursor-pointer outline-none"
              onPointerEnter={() => setActive(n.k)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(n.k)}
              onBlur={() => setActive(null)}
              onClick={() => open(n.slug)}
              onKeyDown={(e) => onNodeKey(e, n.slug)}
            >
              <circle r={32} fill="transparent" />
              {highlighted && <circle r={31} fill={n.solution.accent} fillOpacity={0.14} />}
              <circle r={24} style={{ fill: 'var(--color-popover)' }} stroke={n.solution.accent} strokeOpacity={highlighted ? 0.95 : 0.45} strokeWidth={highlighted ? 1.6 : 1.1} />
              <circle r={24} fill={n.solution.accent} fillOpacity={highlighted ? 0.2 : 0.08} />
              <Icon x={-10} y={-10} size={20} color={n.solution.accent} strokeWidth={1.75} aria-hidden />
              <text
                x={lx - n.x}
                y={ly - n.y}
                textAnchor={anchor}
                className={cn('font-sans', highlighted ? 'fill-fg' : 'fill-fg-3')}
                fontSize={12}
                fontWeight={500}
              >
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Node tooltip */}
      {activeNode && (
        <div
          className="pointer-events-none absolute z-20 hidden w-60 -translate-x-1/2 -translate-y-full sm:block"
          style={{ left: `${(activeNode.x / W) * 100}%`, top: `${((activeNode.y - 36) / H) * 100}%` }}
        >
          <div className="glass-strong rounded-xl p-3 shadow-2xl shadow-black/30">
            <p className="text-[13px] font-semibold text-fg">{activeNode.solution.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-fg-3">{activeNode.solution.tagline}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-soft">
              View solution <ArrowRight className="size-3" />
            </p>
          </div>
        </div>
      )}

      {/* Floating product snippets (illustrative UI from the Lab demos), each in its product's colours */}
      <div className={cn('absolute top-[1%] left-[-2%] w-[31%] min-w-[150px]', layer)} style={{ ...parallax(12, 10), ...accentVars(predictive) }}>
        <div className="card-float motion-decor animate-float rounded-xl p-3 will-change-transform">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-fg-2">
            <BrainCircuit className="text-sol-accent size-3.5" aria-hidden /> Demand forecast
          </div>
          <Sparkline data={FORECAST} dashedFrom={11} width={170} height={40} color="var(--p)" className="mt-2 h-auto w-full" />
          <div className="mt-1.5 flex items-center gap-3 text-[10px] text-fg-3">
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-3 rounded bg-(--p)" /> History
            </span>
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-3 rounded border-t border-dashed border-(--p)" /> Forecast
            </span>
          </div>
        </div>
      </div>

      <div className={cn('absolute top-[1%] right-[-3%] w-[33%] min-w-[170px]', layer)} style={{ ...parallax(-9, -8), ...accentVars(chatbot) }}>
        <div className="card-float motion-decor animate-float-delayed rounded-xl p-3 will-change-transform">
          <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-fg-2">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="text-sol-accent size-3.5" aria-hidden /> Astra Assist
            </span>
            <span className="text-sol rounded-full bg-(--p)/10 px-1.5 py-px font-mono text-[9px] ring-1 ring-(--p)/25">order_status</span>
          </div>
          <p className="mt-2 ml-auto w-fit max-w-[90%] rounded-lg rounded-br-sm bg-(--sol-ink) px-2 py-1 text-[10.5px] leading-snug text-white">
            Where is my order ORD-10482?
          </p>
          <p className="mt-1.5 w-fit max-w-[92%] rounded-lg rounded-bl-sm bg-ink/[0.07] px-2 py-1 text-[10.5px] leading-snug text-fg-2">
            Out for delivery — arriving today.
          </p>
        </div>
      </div>

      <div className={cn('absolute bottom-[0%] left-[-1%] hidden w-[33%] min-w-[170px] sm:block', layer)} style={{ ...parallax(-9, 10), ...accentVars(ocr) }}>
        <div className="card-float motion-decor animate-float-delayed rounded-xl p-3 will-change-transform">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-fg-2">
            <ScanText className="text-sol-accent size-3.5" aria-hidden /> Invoice INV-2041
          </div>
          <ul className="mt-2 space-y-1 text-[10.5px]">
            {['Merchant', 'GSTIN', 'Line items', 'Total'].map((f) => (
              <li key={f} className="flex items-center justify-between text-fg-3">
                {f}
                <Check className="size-3 text-emerald-400" aria-label="extracted" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={cn('absolute right-[-2%] bottom-[2%] hidden w-[31%] min-w-[160px] sm:block', layer)} style={{ ...parallax(12, -8), ...accentVars(erp) }}>
        <div className="card-float motion-decor animate-float rounded-xl p-3 will-change-transform">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-fg-2">
            <Workflow className="text-sol-accent size-3.5" aria-hidden /> Automation
          </div>
          <ol className="mt-2 space-y-1 text-[10.5px] text-fg-3">
            {['PO approved', 'Vendor notified', 'Shipment created'].map((step, i) => (
              <li key={step} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'flex size-3.5 items-center justify-center rounded-full text-[8px]',
                    i < 2 ? 'bg-emerald-500/20 text-emerald-300' : 'text-sol bg-(--p)/20',
                  )}
                >
                  {i < 2 ? '✓' : '•'}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
