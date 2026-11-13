import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { storage } from '@/services/storage'

/** Writes are coalesced: a burst of updates (drags, simulations, rapid edits) costs one write. */
const WRITE_DELAY_MS = 250

/**
 * React state that is persisted to localStorage under the demo namespace.
 *
 * - `init` creates fresh demo data (called on first visit and on reset).
 *   Pass a module-level function so its identity is stable.
 * - `version` invalidates stored data when a demo's data model changes.
 * - Returns `[state, setState, reset]`; `reset` restores the initial dataset.
 *
 * Serialising a large demo state and writing it to (synchronous) localStorage on
 * every change blocks the main thread, so writes are debounced — and flushed
 * immediately when the tab is hidden or the page unloads, so nothing is lost.
 */
export function usePersistentState<T>(
  key: string,
  init: () => T,
  version = 1,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const storageKey = storage.key('demo', key, `v${version}`)

  const [state, setState] = useState<T>(() => {
    const stored = storage.get<T>(storageKey)
    return stored ?? init()
  })

  const pending = useRef<{ key: string; value: T } | null>(null)

  useEffect(() => {
    pending.current = { key: storageKey, value: state }
    const timer = window.setTimeout(() => {
      if (!pending.current) return
      storage.set(pending.current.key, pending.current.value)
      pending.current = null
    }, WRITE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [storageKey, state])

  // Flush on tab hide / unload and when the demo unmounts.
  useEffect(() => {
    const flush = () => {
      if (!pending.current) return
      storage.set(pending.current.key, pending.current.value)
      pending.current = null
    }
    const onVisibility = () => document.visibilityState === 'hidden' && flush()
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      flush()
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const reset = useCallback(() => {
    storage.remove(storageKey)
    setState(init())
  }, [storageKey, init])

  return [state, setState, reset]
}
