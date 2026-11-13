import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { Reveal } from '@/components/common/Reveal'
import { SectionHeading } from '@/components/common/SectionHeading'
import { ButtonLink } from '@/components/ui/Button'
import { paths } from '@/routes/paths'
import { IndustryExplorer } from './IndustryExplorer'

export function IndustriesSection() {
  return (
    <section id="industries" className="relative scroll-mt-20 overflow-x-clip py-20 sm:py-28" aria-labelledby="industries-heading">
      <div aria-hidden className="pointer-events-none absolute top-1/3 right-0 h-[520px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgb(124_92_255/0.09),transparent)]" />
      <Container>
        <SectionHeading
          eyebrow="Industries we serve"
          title={<span id="industries-heading">Built around how your industry actually works.</span>}
          description="Select an industry to see the challenges we most often solve and the Astra services that address them."
          actions={
            <ButtonLink to={paths.industries} variant="secondary" rightIcon={<ArrowRight className="size-4" />}>
              Industries overview
            </ButtonLink>
          }
        />
        <Reveal className="mt-12">
          <IndustryExplorer />
        </Reveal>
      </Container>
    </section>
  )
}
