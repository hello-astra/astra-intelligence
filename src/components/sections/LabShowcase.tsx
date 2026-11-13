import { ArrowRight, Database, FlaskConical, Laptop, RotateCcw } from 'lucide-react'
import { Link } from 'react-router'
import { Container } from '@/components/common/Container'
import { Reveal } from '@/components/common/Reveal'
import { SectionHeading } from '@/components/common/SectionHeading'
import { ButtonLink } from '@/components/ui/Button'
import { SOLUTIONS } from '@/data/constants/solutions'
import { contactPath, paths } from '@/routes/paths'
import { cn } from '@/utils/cn'
import { DemoTile } from './DemoTile'

const LAB_PRINCIPLES = [
  { icon: Database, label: 'Realistic sample data' },
  { icon: Laptop, label: 'Runs entirely in your browser' },
  { icon: RotateCcw, label: 'Reset any demo at any time' },
]

// Bento spans for the 9 tiles on large screens (6-column grid).
const SPANS = [
  'lg:col-span-3',
  'lg:col-span-3',
  'lg:col-span-2',
  'lg:col-span-2',
  'lg:col-span-2',
  'lg:col-span-2',
  'lg:col-span-2',
  'lg:col-span-2',
  'lg:col-span-4',
]

export function LabPrinciples({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {LAB_PRINCIPLES.map(({ icon: Icon, label }) => (
        <li key={label} className="inline-flex items-center gap-2 rounded-full bg-ink/[0.04] px-3 py-1.5 text-xs text-fg-2 ring-1 ring-ink/[0.07]">
          <Icon className="size-3.5 text-astra-cyan" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  )
}

export function LabGrid({ detailed }: { detailed?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {SOLUTIONS.map((s, i) => (
        <Reveal key={s.slug} delay={(i % 3) * 0.05} className={cn('flex', SPANS[i])}>
          <DemoTile solution={s} detailed={detailed} className="w-full" previewHeight={i < 2 || i === 8 ? 250 : 230} />
        </Reveal>
      ))}
      <Reveal delay={0.1} className="flex sm:col-span-2 lg:col-span-2">
        <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-ink/[0.08] bg-gradient-to-br from-brand/20 via-astra-violet/10 to-transparent p-6">
          <div aria-hidden className="bg-grid absolute inset-0 opacity-40" />
          <div className="relative">
            <FlaskConical className="size-6 text-astra-cyan" aria-hidden />
            <h3 className="mt-4 text-lg font-semibold text-fg">Have a workflow in mind?</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-2">
              Every demo is a starting point. Tell us about your process and we’ll show you how a tailored version would work.
            </p>
          </div>
          <Link
            to={contactPath()}
            className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-soft hover:text-fg"
          >
            Discuss your use case <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>
    </div>
  )
}

export function LabShowcase() {
  return (
    <section id="lab" className="relative scroll-mt-20 overflow-x-clip py-20 sm:py-28" aria-label="Interactive Solutions Lab">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink/10 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute top-24 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-astra-cyan)_8%,transparent),transparent)]" />
      <Container>
        <SectionHeading
          eyebrow="Interactive Solutions Lab"
          title={
            <>
              Don’t just read about it. <span className="text-gradient-brand">Use it.</span>
            </>
          }
          description="Nine working product demonstrations with realistic sample data. Add records, change statuses, run simulations and export files — every control does something."
          actions={
            <ButtonLink to={paths.lab} leftIcon={<FlaskConical className="size-4" />}>
              Open the Lab
            </ButtonLink>
          }
        />
        <Reveal className="mt-8">
          <LabPrinciples />
        </Reveal>
        <div className="mt-10">
          <LabGrid />
        </div>
      </Container>
    </section>
  )
}
