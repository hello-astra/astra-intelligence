import { Link, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, CircleCheck, FlaskConical, MessageSquare, MousePointerClick } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { ButtonLink } from '@/components/ui/Button'
import { SOLUTIONS, getSolution } from '@/data/constants/solutions'
import { DemoHost } from '@/demos/DemoHost'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import NotFoundPage from '@/pages/NotFound/NotFoundPage'
import { contactPath, paths } from '@/routes/paths'

export default function DemoPage() {
  const { slug } = useParams()
  const solution = getSolution(slug)
  useDocumentTitle(solution ? `${solution.demo.productName} demo` : undefined, solution?.demo.summary)

  if (!solution) return <NotFoundPage />

  const index = SOLUTIONS.indexOf(solution)
  const prev = SOLUTIONS[(index - 1 + SOLUTIONS.length) % SOLUTIONS.length]
  const next = SOLUTIONS[(index + 1) % SOLUTIONS.length]

  return (
    <>
      <Container size="wide" className="pt-5 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-fg-3">
              <Link to={paths.lab} className="inline-flex items-center gap-1 hover:text-fg">
                <FlaskConical className="size-3.5 text-astra-cyan" aria-hidden /> Lab
              </Link>
              <ChevronRight className="size-3" aria-hidden />
              <span className="text-fg-2" aria-current="page">
                {solution.demo.productName}
              </span>
            </nav>
            <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-balance text-fg sm:text-2xl lg:truncate">
              {solution.demo.productName} <span className="font-normal text-fg-3">· {solution.name}</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink to={paths.solution(solution.slug)} variant="ghost" size="sm" leftIcon={<BookOpen className="size-3.5" />}>
              Solution overview
            </ButtonLink>
            <ButtonLink to={contactPath({ service: solution.slug })} size="sm" leftIcon={<MessageSquare className="size-3.5" />}>
              Discuss a similar solution
            </ButtonLink>
            <div className="flex items-center gap-1">
              <Link
                to={paths.demo(prev.slug)}
                aria-label={`Previous demo: ${prev.demo.productName}`}
                title={`Previous: ${prev.demo.productName}`}
                className="inline-flex size-8 items-center justify-center rounded-lg text-fg-3 ring-1 ring-white/10 hover:bg-white/[0.06] hover:text-fg"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <Link
                to={paths.demo(next.slug)}
                aria-label={`Next demo: ${next.demo.productName}`}
                title={`Next: ${next.demo.productName}`}
                className="inline-flex size-8 items-center justify-center rounded-lg text-fg-3 ring-1 ring-white/10 hover:bg-white/[0.06] hover:text-fg"
              >
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </Container>

      <Container size="wide">
        {/* key forces a fresh demo instance when navigating between demos */}
        <DemoHost key={solution.demoId} demoId={solution.demoId} variant="full" />
      </Container>

      <Container size="wide" className="pt-10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.07] bg-panel/70 p-5">
            <h2 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Things to try</h2>
            <ul className="mt-3 space-y-2">
              {solution.demo.tryThis.map((t) => (
                <li key={t} className="flex gap-2 text-[13px] text-fg-2">
                  <MousePointerClick className="mt-0.5 size-3.5 shrink-0 text-brand-soft" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-panel/70 p-5">
            <h2 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">What we would deliver</h2>
            <ul className="mt-3 space-y-2">
              {solution.deliverables.slice(0, 4).map((d) => (
                <li key={d} className="flex gap-2 text-[13px] text-fg-2">
                  <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-400" aria-hidden />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-gradient-to-br from-brand/15 to-astra-violet/5 p-5">
            <div>
              <h2 className="text-sm font-semibold text-fg">Like what you see?</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-fg-2">
                We can build a version tailored to your workflows, connected to your systems and data.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink to={contactPath({ service: solution.slug })} size="sm">
                Let’s talk
              </ButtonLink>
              <ButtonLink to={paths.demo(next.slug)} size="sm" variant="ghost" rightIcon={<ArrowRight className="size-3.5" />}>
                Next demo
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </>
  )
}
