import { Link } from 'react-router'
import { Check } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { PageHero } from '@/components/common/PageHero'
import { Reveal } from '@/components/common/Reveal'
import { Eyebrow } from '@/components/common/SectionHeading'
import { CTASection } from '@/components/sections/CTASection'
import { IndustryExplorer } from '@/components/sections/IndustryExplorer'
import { INDUSTRIES } from '@/data/constants/industries'
import { SOLUTIONS } from '@/data/constants/solutions'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export default function IndustriesPage() {
  useDocumentTitle('Industries', 'How Astra Intelligence applies AI, software and automation across banking, healthcare, retail, education, manufacturing, logistics, real estate, professional services and startups.')
  return (
    <>
      <PageHero
        eyebrow="Industries we serve"
        title={
          <>
            Different industries. <span className="text-gradient-brand">The same engineering discipline.</span>
          </>
        }
        description="We start from the realities of your sector — its regulations, workflows and customers — and apply the solutions that fit."
      />

      <section aria-label="Industry explorer" className="pb-16">
        <Container>
          <IndustryExplorer />
        </Container>
      </section>

      <section className="py-16" aria-labelledby="matrix-heading">
        <Container>
          <Reveal>
            <Eyebrow>Solution map</Eyebrow>
            <h2 id="matrix-heading" className="mt-4 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              Which solutions apply where
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] text-fg-2">
              A quick reference of the services most often relevant to each industry. Every engagement starts with your specific requirements.
            </p>
          </Reveal>
          <Reveal className="mt-8">
            <div className="relative overflow-x-auto rounded-2xl border border-white/[0.08] bg-panel/70">
              <table className="w-full min-w-[880px] border-collapse text-left text-[13px]">
                <caption className="sr-only">Astra Intelligence solutions by industry</caption>
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    <th scope="col" className="sticky left-0 z-10 bg-[#0a0f1d] px-4 py-3 text-xs font-medium text-fg-3">
                      Solution
                    </th>
                    {INDUSTRIES.map((ind) => (
                      <th key={ind.id} scope="col" className="px-2 py-3 text-center align-bottom text-[11px] font-medium text-fg-3">
                        <ind.icon className="mx-auto mb-1.5 size-4 text-fg-3" aria-hidden />
                        <span aria-hidden>{ind.shortName}</span>
                        <span className="sr-only">{ind.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SOLUTIONS.map((s) => (
                    <tr key={s.slug} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                      <th scope="row" className="sticky left-0 z-10 bg-[#0a0f1d] px-4 py-2.5 font-medium">
                        <Link to={paths.solution(s.slug)} className="flex items-center gap-2 text-fg-2 hover:text-fg">
                          <s.icon className="size-4 shrink-0" style={{ color: s.accent }} aria-hidden />
                          {s.shortName}
                        </Link>
                      </th>
                      {INDUSTRIES.map((ind) => {
                        const applies = ind.services.includes(s.slug)
                        return (
                          <td key={ind.id} className="px-2 py-2.5 text-center">
                            {applies ? (
                              <span className="inline-flex size-6 items-center justify-center rounded-full bg-brand/15 ring-1 ring-brand/30">
                                <Check className="size-3.5 text-brand-soft" aria-label="Relevant" />
                              </span>
                            ) : (
                              <span className="text-fg-4" aria-label="Not typical">
                                ·
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </Container>
      </section>

      <CTASection title="Don’t see your industry?" description="The same building blocks apply across sectors. Tell us about your operations and we’ll map the right approach." />
    </>
  )
}
