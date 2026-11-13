import { useSearchParams } from 'react-router'
import { CalendarCheck } from 'lucide-react'
import { PageHero } from '@/components/common/PageHero'
import { ContactSection } from '@/components/sections/ContactSection'
import { getSolution } from '@/data/constants/solutions'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function ContactPage() {
  useDocumentTitle('Contact', 'Talk to Astra Intelligence about AI, custom software, automation and analytics projects.')
  const [params] = useSearchParams()
  const service = params.get('service')
  const consultation = params.get('intent') === 'consultation'
  const solution = getSolution(service ?? undefined)

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Let’s build something <span className="text-gradient-brand">intelligent.</span>
          </>
        }
        description={
          consultation ? (
            <span className="inline-flex items-start gap-2">
              <CalendarCheck className="mt-1 size-5 shrink-0 text-astra-violet-soft" aria-hidden />
              Book a free consultation: share a few details below and we’ll arrange a call to discuss your requirements.
            </span>
          ) : solution ? (
            `Interested in ${solution.name}? Tell us about your requirements and we’ll show you how a tailored version would work.`
          ) : (
            'Tell us about the problem you want to solve. We’ll come back with questions, ideas and a clear way forward.'
          )
        }
        className="pb-0 sm:pb-0"
      />
      <ContactSection showHeading={false} defaultService={service} consultation={consultation} formKey={`${service ?? ''}-${consultation}`} />
    </>
  )
}
