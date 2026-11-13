import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, FlaskConical, MessageSquare } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { ButtonLink } from '@/components/ui/Button'
import { SOLUTION_INDEX } from '@/data/constants/solution-index'
import { contactPath, paths } from '@/routes/paths'
import type { SolutionSummary } from '@/types/content'

/**
 * Header of a full-screen demo page (breadcrumb, title, actions).
 *
 * It lives in the main bundle and needs only the lightweight solution index, so the
 * very same header is part of the first paint (pre-rendered shell), the loading
 * skeleton and the loaded page — the title is the page's largest text and never moves.
 */
export function DemoPageHeader({ solution }: { solution: SolutionSummary }) {
  const index = SOLUTION_INDEX.findIndex((s) => s.slug === solution.slug)
  const prev = SOLUTION_INDEX[(index - 1 + SOLUTION_INDEX.length) % SOLUTION_INDEX.length]
  const next = SOLUTION_INDEX[(index + 1) % SOLUTION_INDEX.length]
  return (
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
              className="inline-flex size-8 items-center justify-center rounded-lg text-fg-3 ring-1 ring-ink/10 hover:bg-ink/[0.06] hover:text-fg"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <Link
              to={paths.demo(next.slug)}
              aria-label={`Next demo: ${next.demo.productName}`}
              title={`Next: ${next.demo.productName}`}
              className="inline-flex size-8 items-center justify-center rounded-lg text-fg-3 ring-1 ring-ink/10 hover:bg-ink/[0.06] hover:text-fg"
            >
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </Container>
  )
}
