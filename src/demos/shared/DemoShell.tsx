import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FlaskConical, Info, MousePointerClick, RotateCcw, ShieldCheck } from 'lucide-react'
import { TechChip } from '@/components/common/TechChip'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Tooltip } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/toast-context'
import type { Solution } from '@/types/content'
import { cn } from '@/utils/cn'
import { useDemoFrame, type DemoView } from './demo-context'

interface DemoShellProps<V extends string> {
  solution: Solution
  views: readonly DemoView<V>[]
  activeView: V
  onViewChange: (view: V) => void
  onReset: () => void
  /** Extra controls in the top bar (e.g. tenant switcher). */
  toolbar?: ReactNode
  children: ReactNode
  /** Remove content padding (for full-bleed layouts such as chat). */
  flush?: boolean
}

export function DemoEnvironmentBadge({ compact, onClick }: { compact?: boolean; onClick?: () => void }) {
  const className =
    'inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-amber-200 ring-1 ring-amber-400/30 ring-inset'
  const content = (
    <>
      <FlaskConical className="size-3" aria-hidden />
      {compact ? 'Demo' : 'Demo Environment'}
    </>
  )
  return (
    <Tooltip
      side="bottom"
      content="Demo Environment: sample data and simulated operations. Your changes are saved only in this browser. Select for details."
    >
      {onClick ? (
        <button type="button" onClick={onClick} className={cn(className, 'transition-colors hover:bg-amber-400/15')}>
          {content}
        </button>
      ) : (
        <span className={className}>{content}</span>
      )}
    </Tooltip>
  )
}

export function DemoShell<V extends string>({
  solution,
  views,
  activeView,
  onViewChange,
  onReset,
  toolbar,
  children,
  flush,
}: DemoShellProps<V>) {
  const { variant } = useDemoFrame()
  const toast = useToast()
  const [infoOpen, setInfoOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [activeView])

  const changeView = (view: V) => {
    onViewChange(view)
    // On small screens the shell is not internally scrolled — bring the content into view.
    if (window.innerWidth < 1024 && rootRef.current) {
      const top = rootRef.current.getBoundingClientRect().top + window.scrollY - 72
      if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const doReset = () => {
    onReset()
    setConfirmReset(false)
    toast({ title: 'Demo reset', description: `${solution.demo.productName} sample data has been restored.`, tone: 'info' })
  }

  const Icon = solution.icon

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-base text-left shadow-[0_40px_120px_-50px_rgb(0_0_0/0.9)]',
        variant === 'full' ? 'lg:h-[calc(100dvh-148px)] lg:min-h-[640px]' : 'lg:h-[780px]',
      )}
      data-demo={solution.demoId}
    >
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-[#080d1a] px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-white/10"
            style={{ background: `linear-gradient(135deg, ${solution.accent}40, ${solution.accent}12)` }}
          >
            <Icon className="size-4" style={{ color: solution.accent }} aria-hidden />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-fg">{solution.demo.productName}</p>
            <p className="truncate text-[11px] text-fg-3">{solution.demo.category}</p>
          </div>
        </div>
        <div className="order-3 flex w-full min-w-0 items-center gap-2 sm:order-none sm:w-auto sm:flex-1 sm:justify-end">{toolbar}</div>
        <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
          <DemoEnvironmentBadge onClick={() => setInfoOpen(true)} />
          <Button variant="ghost" size="sm" onClick={() => setInfoOpen(true)} aria-label="About this demo" className="px-2">
            <Info className="size-4" />
            <span className="hidden xl:inline">About</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)} leftIcon={<RotateCcw className="size-3.5" />}>
            <span className="hidden sm:inline">Reset Demo</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Navigation */}
        <nav
          aria-label={`${solution.demo.productName} sections`}
          className="flex shrink-0 flex-col border-b border-line bg-[#080d1a]/60 lg:w-52 lg:border-r lg:border-b-0"
        >
          <ul className="scrollbar-none flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible lg:p-3">
            {views.map((view) => {
              const active = view.id === activeView
              const ViewIcon = view.icon
              return (
                <li key={view.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => changeView(view.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors',
                      active ? 'bg-white/[0.07] text-fg' : 'text-fg-3 hover:bg-white/[0.04] hover:text-fg-2',
                    )}
                  >
                    <ViewIcon className={cn('size-4 shrink-0', active && 'text-brand-soft')} aria-hidden />
                    {view.label}
                    {view.badge !== undefined && view.badge !== 0 && (
                      <span className="ml-auto rounded-full bg-white/[0.08] px-1.5 py-px text-[10px] text-fg-2 tabular-nums">{view.badge}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-auto hidden border-t border-line p-3 lg:block">
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-fg-4">
              <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden />
              Sample data. Changes stay in this browser.
            </p>
          </div>
        </nav>

        {/* Content */}
        <div ref={contentRef} className="min-h-0 min-w-0 flex-1 lg:overflow-y-auto">
          <div className={cn(flush ? 'h-full' : 'p-3 sm:p-5')}>{children}</div>
        </div>
      </div>

      <Modal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        variant="drawer"
        title={`About ${solution.demo.productName}`}
        description={solution.name}
      >
        <div className="space-y-6 text-sm">
          <p className="leading-relaxed text-fg-2">{solution.demo.summary}</p>
          <section>
            <h3 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Things to try</h3>
            <ul className="mt-3 space-y-2">
              {solution.demo.tryThis.map((t) => (
                <li key={t} className="flex gap-2 text-fg-2">
                  <MousePointerClick className="mt-0.5 size-4 shrink-0 text-brand-soft" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-amber-200 uppercase">
              <FlaskConical className="size-3.5" aria-hidden /> What is simulated
            </h3>
            <ul className="mt-2.5 list-disc space-y-1.5 pl-5 text-[13px] text-fg-2 marker:text-amber-300/60">
              {solution.demo.simulated.map((s) => (
                <li key={s}>{s}</li>
              ))}
              <li>All data is sample data, stored only in this browser (localStorage).</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">In a production build</h3>
            <p className="mt-2 leading-relaxed text-fg-2">
              We connect the same interface to your real systems — databases, payment gateways, identity providers and
              third-party APIs — with authentication, audit logging and monitoring.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {solution.technologies.map((t) => (
                <TechChip key={t} id={t} />
              ))}
            </div>
          </section>
        </div>
      </Modal>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        size="sm"
        title="Reset this demo?"
        description="All changes you made will be discarded and the original sample data restored."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={doReset} leftIcon={<RotateCcw className="size-3.5" />} data-autofocus>
              Reset Demo
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-2">
          This only affects <span className="text-fg">{solution.demo.productName}</span>. Other demos keep their data.
        </p>
      </Modal>
    </div>
  )
}
