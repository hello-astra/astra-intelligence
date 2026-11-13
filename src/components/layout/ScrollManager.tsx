import { useEffect } from 'react'
import { useLocation } from 'react-router'

const HEADER_OFFSET = 84

/**
 * Scrolls to the top on navigation, or to the element referenced by the URL hash.
 *
 * Hash targets may live in code-split sections that have not arrived yet, and
 * sections above them use `content-visibility: auto` (their height is estimated
 * until rendered). So after the first scroll it keeps correcting until the target's
 * position is stable — and stops immediately if the user scrolls themselves.
 */
export function ScrollManager() {
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
      return
    }
    const id = decodeURIComponent(hash.slice(1))
    let frame = 0
    let timer = 0
    let attempts = 0
    let stableFrames = 0
    let lastTop = Number.NaN
    let cancelled = false

    const cancel = () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
    const targetTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET

    // Phase 2: instant corrections until the target stops moving (max ~3s).
    const settle = () => {
      if (cancelled) return
      const el = document.getElementById(id)
      if (el) {
        const top = targetTop(el)
        if (Math.abs(top - lastTop) < 2 && Math.abs(window.scrollY - top) < 2) stableFrames++
        else {
          stableFrames = 0
          window.scrollTo({ top, behavior: 'instant' as ScrollBehavior })
        }
        lastTop = top
        if (stableFrames >= 4) return
      }
      if (attempts++ < 180) frame = requestAnimationFrame(settle)
    }

    // Phase 1: smooth scroll if the target is already on the page, otherwise wait for it.
    const start = () => {
      const el = document.getElementById(id)
      if (!el) {
        if (attempts++ < 180) frame = requestAnimationFrame(start)
        return
      }
      window.scrollTo({ top: targetTop(el), behavior: 'smooth' })
      timer = window.setTimeout(() => {
        attempts = 0
        settle()
      }, 650)
    }
    frame = requestAnimationFrame(start)

    const onUserScroll = () => cancel()
    window.addEventListener('wheel', onUserScroll, { passive: true, once: true })
    window.addEventListener('touchstart', onUserScroll, { passive: true, once: true })
    window.addEventListener('keydown', onUserScroll, { once: true })
    return () => {
      cancel()
      window.removeEventListener('wheel', onUserScroll)
      window.removeEventListener('touchstart', onUserScroll)
      window.removeEventListener('keydown', onUserScroll)
    }
  }, [pathname, hash, key])

  return null
}
