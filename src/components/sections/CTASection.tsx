import { ArrowRight, FlaskConical } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { Reveal } from '@/components/common/Reveal'
import { ButtonLink } from '@/components/ui/Button'
import { contactPath, paths } from '@/routes/paths'
import type { SolutionSlug } from '@/types/content'

interface CTASectionProps {
  title?: string
  description?: string
  service?: SolutionSlug
  showLabLink?: boolean
}

export function CTASection({
  title = 'Have a process to automate or a product to build?',
  description = 'Tell us what you are trying to achieve. We will help you shape the right solution — and show you how it would work.',
  service,
  showLabLink = true,
}: CTASectionProps) {
  return (
    <section className="relative py-16 sm:py-20" aria-label="Get in touch">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] px-6 py-12 text-center sm:px-12 sm:py-16">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,rgb(47_102_232/0.35),rgb(124_92_255/0.14)_45%,transparent_75%)]" />
            <div aria-hidden className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl leading-tight font-semibold tracking-[-0.025em] text-balance text-fg sm:text-4xl">{title}</h2>
              <p className="mt-4 text-base leading-relaxed text-fg-2 sm:text-lg">{description}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink to={contactPath({ service })} size="lg" rightIcon={<ArrowRight className="size-4" />}>
                  Let’s Build Something Intelligent
                </ButtonLink>
                {showLabLink && (
                  <ButtonLink to={paths.lab} size="lg" variant="glass" leftIcon={<FlaskConical className="size-4 text-astra-cyan" />}>
                    Explore the Lab
                  </ButtonLink>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
