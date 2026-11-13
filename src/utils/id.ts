/** Short random id for client-side records, e.g. "usr_k3x9q2". */
export function uid(prefix = 'id'): string {
  const random = Math.random().toString(36).slice(2, 8)
  const time = Date.now().toString(36).slice(-3)
  return `${prefix}_${time}${random}`
}

/**
 * Next human-readable sequential identifier, e.g. nextSequentialId(['ORD-10421'], 'ORD-', 5) → 'ORD-10422'.
 * Falls back to `start` when no existing ids match the prefix.
 */
export function nextSequentialId(existing: readonly string[], prefix: string, start: number, pad = 0): string {
  let max = start - 1
  for (const id of existing) {
    if (!id.startsWith(prefix)) continue
    const n = Number(id.slice(prefix.length))
    if (Number.isFinite(n) && n > max) max = n
  }
  const next = String(max + 1)
  return prefix + (pad > 0 ? next.padStart(pad, '0') : next)
}
