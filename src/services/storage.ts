/**
 * Namespaced, failure-tolerant localStorage access.
 *
 * Demo data is kept strictly separate from anything production-related:
 * every key lives under the "astra:demo:" namespace and can be cleared
 * without affecting other data.
 */
const NAMESPACE = 'astra'

function available(): boolean {
  try {
    const probe = `${NAMESPACE}:probe`
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

let isAvailable: boolean | null = null
function canUseStorage(): boolean {
  if (isAvailable === null) isAvailable = typeof window !== 'undefined' && available()
  return isAvailable
}

export const storage = {
  key(...parts: string[]): string {
    return [NAMESPACE, ...parts].join(':')
  },

  get<T>(key: string): T | null {
    if (!canUseStorage()) return null
    try {
      const raw = window.localStorage.getItem(key)
      return raw === null ? null : (JSON.parse(raw) as T)
    } catch {
      return null
    }
  },

  set(key: string, value: unknown): void {
    if (!canUseStorage()) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Quota exceeded or serialisation failure — the demo keeps working in memory.
    }
  },

  remove(key: string): void {
    if (!canUseStorage()) return
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },

  /** Removes every key that starts with the given prefix. */
  clearPrefix(prefix: string): void {
    if (!canUseStorage()) return
    try {
      const keys: string[] = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i)
        if (k && k.startsWith(prefix)) keys.push(k)
      }
      keys.forEach((k) => window.localStorage.removeItem(k))
    } catch {
      /* ignore */
    }
  },
}
