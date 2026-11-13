import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Seconds to wait after the element enters the viewport. */
  delay?: number
  /** Rise distance in px. */
  y?: number
}

// One observer for every <Reveal/> on the page (cheaper than one per element).
let observer: IntersectionObserver | null | undefined
function sharedObserver(): IntersectionObserver | null {
  if (observer !== undefined) return observer
  observer =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue
              entry.target.setAttribute('data-revealed', '')
              observer?.unobserve(entry.target)
            }
          },
          { rootMargin: '0px 0px -60px 0px' },
        )
  return observer
}

/**
 * Subtle fade-and-rise when the element first scrolls into view (CSS transition +
 * IntersectionObserver; no animation library). Content is only hidden once the app
 * has marked the document `js-ready`, and never on low-power devices, for
 * reduced-motion users or in print.
 */
export function Reveal({ children, className, delay = 0, y = 16 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Layout effect: content already on screen when the page mounts is shown before the
  // first paint (no fade, no delayed LCP); only content scrolled into view animates.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const io = sharedObserver()
    // (Sections wrapped in .cv-auto are below the fold by design; measuring them would force
    // the layout that content-visibility skips, so they are left to the observer.)
    if (!io || (!el.closest('.cv-auto') && el.getBoundingClientRect().top < window.innerHeight - 60)) {
      el.setAttribute('data-revealed', '')
      return
    }
    io.observe(el)
    return () => io.unobserve(el)
  }, [])

  const style = delay || y !== 16 ? ({ '--reveal-delay': `${delay}s`, '--reveal-y': `${y}px` } as CSSProperties) : undefined

  return (
    <div ref={ref} data-reveal="" className={className} style={style}>
      {children}
    </div>
  )
}
