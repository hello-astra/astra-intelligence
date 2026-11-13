import { useEffect, useState } from 'react'

/**
 * Keeps an element mounted for `exitMs` after `open` turns false so a CSS exit
 * animation can play (a tiny replacement for an animation library's presence API).
 */
export function usePresence(open: boolean, exitMs = 160): { mounted: boolean; closing: boolean } {
  const [mounted, setMounted] = useState(open)
  const [prevOpen, setPrevOpen] = useState(open)

  // Sync with `open` during render (no extra commit, no flash of the old state).
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setMounted(true)
  }

  const closing = mounted && !open

  useEffect(() => {
    if (!closing) return
    const instant = document.documentElement.classList.contains('lite') || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => setMounted(false), instant ? 0 : exitMs)
    return () => window.clearTimeout(timer)
  }, [closing, exitMs])

  return { mounted, closing }
}
