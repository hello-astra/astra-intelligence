import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, CalendarCheck, ChevronDown, FlaskConical, Menu, X } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button'
import { BOOKING_URL, NAV_ITEMS } from '@/data/constants/site'
import { SOLUTIONS } from '@/data/constants/solutions'
import { contactPath, paths } from '@/routes/paths'
import { cn } from '@/utils/cn'

function isActive(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function ConsultationButton({ size = 'sm', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  if (BOOKING_URL) {
    return (
      <ButtonAnchor href={BOOKING_URL} target="_blank" rel="noopener noreferrer" size={size} className={className} leftIcon={<CalendarCheck className="size-4" />}>
        Book a Consultation
      </ButtonAnchor>
    )
  }
  return (
    <ButtonLink to={contactPath({ consultation: true })} size={size} className={className} leftIcon={<CalendarCheck className="size-4" />}>
      Book a Consultation
    </ButtonLink>
  )
}

export function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
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
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  const openMenu = () => {
    window.clearTimeout(closeTimer.current)
    setMenuOpen(true)
  }
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setMenuOpenAt(null), 140)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-300',
        scrolled || mobileOpen || menuOpen ? 'border-white/[0.07]' : 'border-transparent',
      )}
    >
      {/* The blur lives on its own layer: a backdrop-filter on <header> itself would become the
          containing block for the fixed mobile menu below and collapse it to the header's height. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 bg-[#05070e]/80 backdrop-blur-xl backdrop-saturate-150 transition-opacity duration-300',
          scrolled || mobileOpen || menuOpen ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div ref={menuRef} onMouseLeave={scheduleClose}>
        <nav aria-label="Primary" className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link to={paths.home} className="rounded-lg" aria-label="Astra Intelligence — home">
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
                      onMouseEnter={openMenu}
                      onFocus={scheduleClose}
                      className={cn(
                        'rounded-l-lg py-2 pr-1 pl-3 text-sm transition-colors',
                        active || menuOpen ? 'text-fg' : 'text-fg-2 hover:text-fg',
                      )}
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
                    onMouseEnter={scheduleClose}
                    onFocus={scheduleClose}
                    className={cn(
                      'relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors',
                      active ? 'text-fg' : 'text-fg-2 hover:text-fg',
                    )}
                  >
                    {item.to === paths.lab && <FlaskConical className="size-3.5 text-astra-cyan" aria-hidden />}
                    {item.label}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-3 -bottom-[13px] h-px bg-gradient-to-r from-transparent via-brand to-transparent"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <ConsultationButton />
          </div>

          <button
            type="button"
            className="ml-auto inline-flex size-10 items-center justify-center rounded-lg text-fg-2 hover:bg-white/[0.06] hover:text-fg lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {/* Desktop solutions mega menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="solutions-menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              onMouseEnter={openMenu}
              className="absolute inset-x-0 top-16 hidden border-b border-white/[0.07] bg-[#060912]/95 backdrop-blur-xl lg:block"
            >
              <div className="mx-auto grid max-w-7xl grid-cols-[1fr_300px] gap-8 px-8 py-7">
                <ul className="grid grid-cols-3 gap-1">
                  {SOLUTIONS.map((s) => (
                    <li key={s.slug}>
                      <Link
                        to={paths.solution(s.slug)}
                        className="group flex gap-3 rounded-xl p-3 transition-colors hover:bg-white/[0.04]"
                      >
                        <span
                          className="flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-white/10"
                          style={{ background: `linear-gradient(135deg, ${s.accent}2e, ${s.accent}0d)` }}
                        >
                          <s.icon className="size-[18px]" style={{ color: s.accent }} aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[13px] font-medium text-fg">
                            {s.shortName}
                            <ArrowRight className="size-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-fg-3">{s.tagline}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#4f86ff]/15 via-[#8b74ff]/10 to-transparent p-5">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-astra-cyan/10 px-2 py-0.5 text-[11px] font-medium text-astra-cyan-soft ring-1 ring-astra-cyan/20">
                      <FlaskConical className="size-3" /> Interactive Lab
                    </span>
                    <p className="mt-3 text-[15px] font-semibold text-fg">Try nine working product demos</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-fg-3">
                      Real interfaces, realistic sample data and simulated operations — right in your browser.
                    </p>
                  </div>
                  <div className="mt-5 flex flex-col gap-2">
                    <ButtonLink to={paths.lab} size="sm" rightIcon={<ArrowUpRight className="size-3.5" />}>
                      Open the Lab
                    </ButtonLink>
                    <ButtonLink to={paths.solutions} size="sm" variant="ghost">
                      View all solutions
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-[#05070e]/97 backdrop-blur-xl lg:hidden"
          >
            <MobileMenu pathname={location.pathname} />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function MobileMenu({ pathname }: { pathname: string }) {
  const [solutionsOpen, setSolutionsOpen] = useState(pathname.startsWith('/solutions'))
  return (
    <nav aria-label="Mobile" className="mx-auto flex min-h-full max-w-xl flex-col px-4 pt-4 pb-10">
      <ul className="flex flex-col">
        {NAV_ITEMS.map((item, index) => (
          <motion.li
            key={item.to}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * index }}
            className="border-b border-white/[0.06]"
          >
            {item.menu === 'solutions' ? (
              <div>
                <div className="flex items-center">
                  <NavLink to={item.to} className={cn('flex-1 py-4 text-lg font-medium', isActive(pathname, item.to) ? 'text-fg' : 'text-fg-2')}>
                    {item.label}
                  </NavLink>
                  <button
                    type="button"
                    className="inline-flex size-10 items-center justify-center rounded-lg text-fg-3 hover:bg-white/[0.06]"
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
                        <Link to={paths.solution(s.slug)} className="flex items-center gap-3 rounded-lg px-2 py-2 text-[15px] text-fg-2 hover:bg-white/[0.04] hover:text-fg">
                          <s.icon className="size-4" style={{ color: s.accent }} aria-hidden />
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
          </motion.li>
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
