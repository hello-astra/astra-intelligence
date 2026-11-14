import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ArrowRight, ArrowUpRight, CalendarCheck, ChevronDown, FlaskConical, Menu, X } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button'
import { BOOKING_URL, NAV_ITEMS } from '@/data/constants/site'
import { SOLUTION_INDEX as SOLUTIONS } from '@/data/constants/solution-index'
import { contactPath, paths } from '@/routes/paths'
import { prefetchPath } from '@/routes/route-modules'
import { accentVars } from '@/theme/accents'
import { cn } from '@/utils/cn'

function isActive(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

/** Props that prefetch a route's code when the user shows intent (hover / focus / touch). */
const intent = (to: string) => ({
  onMouseEnter: () => prefetchPath(to),
  onFocus: () => prefetchPath(to),
  onTouchStart: () => prefetchPath(to),
})

export function ConsultationButton({ size = 'sm', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  if (BOOKING_URL) {
    return (
      <ButtonAnchor href={BOOKING_URL} target="_blank" rel="noopener noreferrer" size={size} className={className} leftIcon={<CalendarCheck className="size-4" />}>
        Book a Consultation
      </ButtonAnchor>
    )
  }
  const to = contactPath({ consultation: true })
  return (
    <ButtonLink to={to} size={size} className={className} leftIcon={<CalendarCheck className="size-4" />} {...intent(to)}>
      Book a Consultation
    </ButtonLink>
  )
}

/** True once the page has scrolled past the top (IntersectionObserver on a sentinel — no scroll listener). */
function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const sentinel = document.getElementById('top-sentinel')
    if (!sentinel || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting))
    io.observe(sentinel)
    return () => io.disconnect()
  }, [])
  return scrolled
}

export function Navbar() {
  const location = useLocation()
  const scrolled = useScrolled()
  // Menus remember the location they were opened on, so any navigation closes them.
  const [mobileOpenAt, setMobileOpenAt] = useState<string | null>(null)
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null)
  const mobileOpen = mobileOpenAt === location.key
  const menuOpen = menuOpenAt === location.key
  const setMobileOpen = (open: boolean | ((v: boolean) => boolean)) =>
    setMobileOpenAt((current) => {
      const next = typeof open === 'function' ? open(current === location.key) : open
      return next ? location.key : null
    })
  const setMenuOpen = (open: boolean | ((v: boolean) => boolean)) =>
    setMenuOpenAt((current) => {
      const next = typeof open === 'function' ? open(current === location.key) : open
      return next ? location.key : null
    })
  const closeTimer = useRef<number | undefined>(undefined)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpenAt(null)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpenAt(null)
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpenAt(null)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [menuOpen])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  const openMenu = () => {
    window.clearTimeout(closeTimer.current)
    setMenuOpen(true)
  }
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setMenuOpenAt(null), 140)
  }

  const solid = scrolled || mobileOpen || menuOpen

  return (
    <header className={cn('sticky top-0 z-50 border-b transition-colors duration-300', solid ? 'border-ink/[0.07]' : 'border-transparent')}>
      {/* The backdrop lives on its own layer: a backdrop-filter on <header> itself would become the
          containing block for the fixed mobile menu below and collapse it to the header's height.
          Low-power devices get an opaque bar instead of a live blur. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 bg-canvas/95 transition-opacity duration-300 motion-full:bg-canvas/80 motion-full:backdrop-blur-lg motion-full:backdrop-saturate-150',
          solid ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div ref={menuRef} onMouseLeave={scheduleClose}>
        <nav aria-label="Primary" className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          {/* flex, not inline: an inline link baseline-aligns the logo and leaves descender space under it, lifting the wordmark above the nav labels. */}
          <Link to={paths.home} className="flex shrink-0 items-center rounded-lg" aria-label="Astra Intelligence — home">
            <Logo />
          </Link>

          <ul className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(location.pathname, item.to)
              if (item.menu === 'solutions') {
                return (
                  <li key={item.to} className="flex items-center">
                    <NavLink
                      to={item.to}
                      onMouseEnter={() => {
                        openMenu()
                        prefetchPath(item.to)
                      }}
                      onFocus={scheduleClose}
                      className={cn('rounded-l-lg py-2 pr-1 pl-3 text-sm transition-colors', active || menuOpen ? 'text-fg' : 'text-fg-2 hover:text-fg')}
                    >
                      {item.label}
                    </NavLink>
                    <button
                      type="button"
                      aria-label="Show all solutions"
                      aria-expanded={menuOpen}
                      aria-controls="solutions-menu"
                      onMouseEnter={openMenu}
                      onClick={() => setMenuOpen((v) => !v)}
                      className={cn('rounded-r-lg py-2 pr-2 pl-0.5 transition-colors', menuOpen ? 'text-fg' : 'text-fg-3 hover:text-fg')}
                    >
                      <ChevronDown className={cn('size-3.5 transition-transform', menuOpen && 'rotate-180')} />
                    </button>
                  </li>
                )
              }
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onMouseEnter={() => {
                      scheduleClose()
                      prefetchPath(item.to)
                    }}
                    onFocus={() => {
                      scheduleClose()
                      prefetchPath(item.to)
                    }}
                    className={cn('relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors', active ? 'text-fg' : 'text-fg-2 hover:text-fg')}
                  >
                    {item.to === paths.lab && <FlaskConical className="size-3.5 text-astra-cyan" aria-hidden />}
                    {item.label}
                    {active && <span className="absolute inset-x-3 -bottom-[13px] h-px bg-gradient-to-r from-transparent via-brand to-transparent" />}
                  </NavLink>
                </li>
              )
            })}
          </ul>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <ThemeToggle />
            <ConsultationButton />
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-lg text-fg-2 hover:bg-ink/[0.06] hover:text-fg"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        {/* Desktop solutions mega menu */}
        {menuOpen && (
          <div
            id="solutions-menu"
            onMouseEnter={openMenu}
            className="animate-pop absolute inset-x-0 top-16 hidden border-b border-ink/[0.07] bg-canvas shadow-2xl shadow-black/20 motion-full:bg-canvas/95 motion-full:backdrop-blur-lg lg:block"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-[1fr_300px] gap-8 px-8 py-7">
              <ul className="grid grid-cols-3 gap-1">
                {SOLUTIONS.map((s) => (
                  <li key={s.slug}>
                    <Link to={paths.solution(s.slug)} className="group flex gap-3 rounded-xl p-3 transition-colors hover:bg-ink/[0.04]" style={accentVars(s)} {...intent(paths.solution(s.slug))}>
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-ink/10"
                        style={{ background: `linear-gradient(135deg, ${s.accent}2e, ${s.accent}0d)` }}
                      >
                        <s.icon className="text-sol-accent size-[18px]" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[13px] font-medium text-fg">
                          {s.shortName}
                          <ArrowRight className="size-3 -translate-x-1 opacity-0 transition-[opacity,transform] group-hover:translate-x-0 group-hover:opacity-100" />
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-fg-3">{s.tagline}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col justify-between rounded-2xl border border-ink/[0.08] bg-gradient-to-br from-brand/15 via-astra-violet/10 to-transparent p-5">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-astra-cyan/10 px-2 py-0.5 text-[11px] font-medium text-astra-cyan-soft ring-1 ring-astra-cyan/20">
                    <FlaskConical className="size-3" /> Interactive Lab
                  </span>
                  <p className="mt-3 text-[15px] font-semibold text-fg">Try nine working product demos</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-fg-3">Real interfaces and working workflows — right in your browser.</p>
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <ButtonLink to={paths.lab} size="sm" rightIcon={<ArrowUpRight className="size-3.5" />} {...intent(paths.lab)}>
                    Open the Lab
                  </ButtonLink>
                  <ButtonLink to={paths.solutions} size="sm" variant="ghost">
                    View all solutions
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="animate-fade fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-canvas lg:hidden">
          <MobileMenu pathname={location.pathname} />
        </div>
      )}
    </header>
  )
}

function MobileMenu({ pathname }: { pathname: string }) {
  const [solutionsOpen, setSolutionsOpen] = useState(pathname.startsWith('/solutions'))
  return (
    <nav aria-label="Mobile" className="mx-auto flex min-h-full max-w-xl flex-col px-4 pt-4 pb-10">
      <ul className="flex flex-col">
        {NAV_ITEMS.map((item, index) => (
          <li key={item.to} className="animate-enter border-b border-ink/[0.06]" style={{ animationDelay: `${0.03 * index}s` }}>
            {item.menu === 'solutions' ? (
              <div>
                <div className="flex items-center">
                  <NavLink to={item.to} className={cn('flex-1 py-4 text-lg font-medium', isActive(pathname, item.to) ? 'text-fg' : 'text-fg-2')}>
                    {item.label}
                  </NavLink>
                  <button
                    type="button"
                    className="inline-flex size-10 items-center justify-center rounded-lg text-fg-3 hover:bg-ink/[0.06]"
                    aria-expanded={solutionsOpen}
                    aria-label="Toggle solutions list"
                    onClick={() => setSolutionsOpen((v) => !v)}
                  >
                    <ChevronDown className={cn('size-5 transition-transform', solutionsOpen && 'rotate-180')} />
                  </button>
                </div>
                {solutionsOpen && (
                  <ul className="grid gap-1 pb-4">
                    {SOLUTIONS.map((s) => (
                      <li key={s.slug}>
                        <Link
                          to={paths.solution(s.slug)}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 text-[15px] text-fg-2 hover:bg-ink/[0.04] hover:text-fg"
                          style={accentVars(s)}
                        >
                          <s.icon className="text-sol-accent size-4" aria-hidden />
                          {s.shortName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={cn('flex items-center gap-2 py-4 text-lg font-medium', isActive(pathname, item.to) ? 'text-fg' : 'text-fg-2')}
              >
                {item.label}
                {item.to === paths.lab && <FlaskConical className="size-4 text-astra-cyan" aria-hidden />}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-3">
        <ConsultationButton size="lg" className="w-full" />
        <ButtonLink to={paths.lab} size="lg" variant="secondary" className="w-full" leftIcon={<FlaskConical className="size-4" />}>
          Experience Live Demos
        </ButtonLink>
      </div>
    </nav>
  )
}
