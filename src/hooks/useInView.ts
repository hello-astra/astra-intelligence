import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'

type Listener = (visible: boolean) => void
const listeners = new WeakMap<Element, Listener>()
let observer: IntersectionObserver | null = null

function getObserver(): IntersectionObserver | null {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) listeners.get(entry.target)?.(entry.isIntersecting)
    },
    { rootMargin: '120px 0px' },
  )
  return observer
}

/** True while the element is on (or near) the screen. Uses one shared IntersectionObserver. */
export function useInView(ref: RefObject<Element | null>): boolean {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    const io = getObserver()
    if (!el || !io) return
    listeners.set(el, setVisible)
    io.observe(el)
    return () => {
      io.unobserve(el)
      listeners.delete(el)
    }
  }, [ref])
  return visible
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

/** False while the tab is in the background. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'visible',
    () => true,
  )
}

/**
 * Whether decorative, continuously running motion should play at all on this device:
 * off for reduced-motion users and on low-power devices (html.lite, set before first paint).
 */
export function canAnimateDecor(): boolean {
  if (typeof window === 'undefined') return false
  return !document.documentElement.classList.contains('lite') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
