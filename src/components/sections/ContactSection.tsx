import type { ReactNode } from 'react'
import { CalendarCheck, Mail, MessagesSquare, ScrollText, Search } from 'lucide-react'
import { Link } from 'react-router'
import { Container } from '@/components/common/Container'
import { Reveal } from '@/components/common/Reveal'
import { Eyebrow } from '@/components/common/SectionHeading'
import { SocialIcon } from '@/components/common/SocialIcon'
import { BOOKING_URL, SITE } from '@/data/constants/site'
import { contactPath } from '@/routes/paths'
import { ContactForm } from './ContactForm'

const NEXT_STEPS = [
  { icon: Search, title: 'We review your requirements', text: 'A solution engineer reads your enquiry and prepares relevant questions.' },
  { icon: MessagesSquare, title: 'Discovery conversation', text: 'We discuss goals, users, existing systems and constraints.' },
  { icon: ScrollText, title: 'Proposal & roadmap', text: 'You receive a recommended approach, scope and delivery plan.' },
]

interface ContactSectionProps {
  defaultService?: string | null
  consultation?: boolean
  /** Heading rendered above the form (home page uses an h2; the contact page supplies its own hero). */
  showHeading?: boolean
  formKey?: string
  aside?: ReactNode
}

export function ContactSection({ defaultService, consultation, showHeading = true, formKey }: ContactSectionProps) {
  // Keeps the outline valid: h3 under the section's h2, or h2 when the page hero supplies the h1.
  const SubHeading = showHeading ? 'h3' : 'h2'
  return (
    <section id="contact" className="relative scroll-mt-20 py-20 sm:py-28" aria-labelledby={showHeading ? 'contact-heading' : undefined} aria-label={showHeading ? undefined : 'Enquiry form'}>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            {showHeading && (
              <Reveal>
                <Eyebrow>Contact</Eyebrow>
                <h2 id="contact-heading" className="mt-4 text-3xl leading-[1.1] font-semibold tracking-[-0.025em] text-balance text-fg sm:text-4xl lg:text-[44px]">
                  Let’s build something intelligent.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-fg-2 sm:text-lg">
                  Tell us about the problem you want to solve. We’ll come back with questions, ideas and a clear way forward.
                </p>
              </Reveal>
            )}

            <Reveal delay={0.05} className={showHeading ? 'mt-8' : ''}>
              <div className="space-y-3">
                <a
                  href={`mailto:${SITE.email}`}
                  className="group flex items-center gap-4 rounded-xl border border-ink/[0.07] bg-panel/70 p-4 transition-colors hover:border-ink/[0.15]"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand/15 ring-1 ring-brand/25">
                    <Mail className="size-5 text-brand-soft" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-xs text-fg-3">Email us</span>
                    <span className="block text-sm font-medium text-fg group-hover:text-brand-soft">{SITE.email}</span>
                  </span>
                </a>
                {BOOKING_URL ? (
                  <a
                    href={BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 rounded-xl border border-ink/[0.07] bg-panel/70 p-4 transition-colors hover:border-ink/[0.15]"
                  >
                    <ConsultationContent />
                  </a>
                ) : (
                  <Link
                    to={contactPath({ consultation: true })}
                    className="group flex items-center gap-4 rounded-xl border border-ink/[0.07] bg-panel/70 p-4 transition-colors hover:border-ink/[0.15]"
                  >
                    <ConsultationContent />
                  </Link>
                )}
              </div>

              <div className="mt-8">
                <SubHeading className="text-xs font-semibold tracking-wide text-fg-3 uppercase">What happens next</SubHeading>
                <ol className="mt-4 space-y-4">
                  {NEXT_STEPS.map((s, i) => (
                    <li key={s.title} className="flex gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] font-mono text-[11px] text-fg-2 ring-1 ring-ink/10">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-fg">{s.title}</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-fg-3">{s.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-8 flex items-center gap-2">
                <span className="mr-1 text-xs text-fg-3">Follow us</span>
                {SITE.social.map((s) => (
                  <a
                    key={s.id}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Astra Intelligence on ${s.label}`}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-fg-3 ring-1 ring-ink/[0.08] transition-colors hover:bg-ink/[0.05] hover:text-fg"
                  >
                    <SocialIcon id={s.id} />
                  </a>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div id="enquiry" className="scroll-mt-24 rounded-2xl border border-ink/[0.08] bg-panel/80 p-5 shadow-[0_40px_120px_-60px_rgb(79_134_255/0.45)] sm:p-8">
              <ContactForm key={formKey} defaultService={defaultService} consultation={consultation} />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

function ConsultationContent() {
  return (
    <>
      <span className="flex size-10 items-center justify-center rounded-lg bg-astra-violet/15 ring-1 ring-astra-violet/25">
        <CalendarCheck className="size-5 text-astra-violet-soft" aria-hidden />
      </span>
      <span>
        <span className="block text-xs text-fg-3">Prefer to talk?</span>
        <span className="block text-sm font-medium text-fg group-hover:text-astra-violet-soft">Book a free consultation</span>
      </span>
    </>
  )
}
