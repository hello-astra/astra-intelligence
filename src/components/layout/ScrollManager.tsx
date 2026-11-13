import { useEffect } from 'react'
import { useLocation } from 'react-router'

/**
 * Scrolls to the top on navigation, or to the element referenced by the URL hash.
 * Hash targets on lazy-loaded pages may not exist immediately, so we retry briefly.
 */
export function ScrollManager() {
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
      return
    }
    const id = decodeURIComponent(hash.slice(1))
    let attempts = 0
    let frame = 0
    const tryScroll = () => {
      const el = document.getElementById(id)
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 84
        window.scrollTo({ top, behavior: 'smooth' })
        return
      }
      if (attempts++ < 60) frame = window.requestAnimationFrame(tryScroll)
    }
    frame = window.requestAnimationFrame(tryScroll)
    return () => window.cancelAnimationFrame(frame)
  }, [pathname, hash, key])

  return null
}
