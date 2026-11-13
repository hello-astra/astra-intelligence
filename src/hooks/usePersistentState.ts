import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { storage } from '@/services/storage'

/**
 * React state that is persisted to localStorage under the demo namespace.
 *
 * - `init` creates fresh demo data (called on first visit and on reset).
 *   Pass a module-level function so its identity is stable.
 * - `version` invalidates stored data when a demo's data model changes.
 * - Returns `[state, setState, reset]`; `reset` restores the initial dataset.
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

  // Persist on change (cheap for the small datasets used in the demos).
  useEffect(() => {
    storage.set(storageKey, state)
  }, [storageKey, state])

  const reset = useCallback(() => {
    storage.remove(storageKey)
    setState(init())
  }, [storageKey, init])

  return [state, setState, reset]
}
