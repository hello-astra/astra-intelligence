import { useParams } from 'react-router'
import { ArrowRight, CircleCheck, MousePointerClick } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { ButtonLink } from '@/components/ui/Button'
import { SOLUTIONS, getSolution } from '@/data/constants/solutions'
import { DemoHost } from '@/demos/DemoHost'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { contactPath, paths } from '@/routes/paths'

/**
 * Body of a full-screen demo page (the demo and the cards below it). The header is
 * rendered by the eager DemoRoute (src/routes/DemoRoute.tsx) so the page title is
 * mounted once and never replaced while this chunk and the demo load.
 */
export default function DemoPage() {
  const { slug } = useParams()
  const solution = getSolution(slug)
  useDocumentTitle(solution ? `${solution.demo.productName} demo` : undefined, solution?.demo.summary)

  if (!solution) return null

  const index = SOLUTIONS.indexOf(solution)
  const next = SOLUTIONS[(index + 1) % SOLUTIONS.length]

  return (
    <>
      <Container size="wide">
        {/* key forces a fresh demo instance when navigating between demos */}
        <DemoHost key={solution.demoId} demoId={solution.demoId} variant="full" />
      </Container>

      <Container size="wide" className="pt-10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-ink/[0.07] bg-panel/70 p-5">
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
          <div className="rounded-2xl border border-ink/[0.07] bg-panel/70 p-5">
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
          <div className="flex flex-col justify-between rounded-2xl border border-ink/[0.07] bg-gradient-to-br from-brand/15 to-astra-violet/5 p-5">
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
