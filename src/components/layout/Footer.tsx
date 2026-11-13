import { Link } from 'react-router'
import { ArrowUpRight, FlaskConical, Mail } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { SocialIcon } from '@/components/common/SocialIcon'
import { SITE } from '@/data/constants/site'
import { SOLUTION_INDEX as SOLUTIONS } from '@/data/constants/solution-index'
import { contactPath, paths } from '@/routes/paths'

const COMPANY_LINKS = [
  { label: 'About Us', to: paths.about },
  { label: 'Industries', to: paths.industries },
  { label: 'Our Approach', to: `${paths.about}#approach` },
  { label: 'Technology', to: `${paths.home}#technology` },
  { label: 'Contact', to: paths.contact },
]

const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-ink/[0.06] bg-sunken">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Link to={paths.home} className="inline-flex rounded-lg" aria-label="Astra Intelligence — home">
              <Logo />
            </Link>
            <p className="mt-4 text-sm font-medium text-fg">{SITE.tagline}</p>
            <p className="mt-2 text-sm leading-relaxed text-fg-3">
              AI, custom software, business automation and data analytics — engineered for real business problems.
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-6 inline-flex items-center gap-2 text-sm text-fg-2 transition-colors hover:text-fg"
            >
              <Mail className="size-4 text-brand" aria-hidden />
              {SITE.email}
            </a>
            <ul className="mt-5 flex gap-2" aria-label="Social media">
              {SITE.social.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Astra Intelligence on ${s.label}`}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-fg-3 ring-1 ring-ink/[0.08] transition-colors hover:bg-ink/[0.05] hover:text-fg"
                  >
                    <SocialIcon id={s.id} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <h2 className="font-mono text-[11px] tracking-[0.18em] text-fg-3 uppercase">Solutions</h2>
              <ul className="mt-4 space-y-2.5">
                {SOLUTIONS.map((s) => (
                  <li key={s.slug}>
                    <Link to={paths.solution(s.slug)} className="text-sm text-fg-2 transition-colors hover:text-fg">
                      {s.shortName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-mono text-[11px] tracking-[0.18em] text-fg-3 uppercase">Company</h2>
              <ul className="mt-4 space-y-2.5">
                {COMPANY_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-fg-2 transition-colors hover:text-fg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-mono text-[11px] tracking-[0.18em] text-fg-3 uppercase">Interactive Lab</h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link to={paths.lab} className="inline-flex items-center gap-1.5 text-sm text-fg-2 transition-colors hover:text-fg">
                    <FlaskConical className="size-3.5 text-astra-cyan" aria-hidden />
                    All nine demos
                  </Link>
                </li>
                {SOLUTIONS.slice(0, 4).map((s) => (
                  <li key={s.slug}>
                    <Link to={paths.demo(s.slug)} className="text-sm text-fg-2 transition-colors hover:text-fg">
                      {s.demo.productName}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to={contactPath({ consultation: true })}
                className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-brand-soft transition-colors hover:text-fg"
              >
                Book a consultation <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-ink/[0.06] pt-6 text-xs text-fg-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {YEAR} {SITE.name}. All rights reserved.
          </p>
          <p>Product demonstrations use sample data and simulated operations.</p>
        </div>
      </div>
    </footer>
  )
}
