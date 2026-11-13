/**
 * Number, currency and date formatting.
 * INR uses Indian digit grouping (₹1,25,000) and lakh/crore compaction.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const inrFormatter2 = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const usdFormatter2 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberIN = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const numberUS = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatINR(value: number, decimals: 0 | 2 = 0): string {
  return (decimals === 2 ? inrFormatter2 : inrFormatter).format(value)
}

/** ₹12.5K · ₹3.4L · ₹1.2Cr */
export function formatINRCompact(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs >= 1e7) return `${sign}₹${trim(abs / 1e7)}Cr`
  if (abs >= 1e5) return `${sign}₹${trim(abs / 1e5)}L`
  if (abs >= 1e3) return `${sign}₹${trim(abs / 1e3)}K`
  return `${sign}₹${Math.round(abs)}`
}

export function formatUSD(value: number, decimals: 0 | 2 = 0): string {
  return (decimals === 2 ? usdFormatter2 : usdFormatter).format(value)
}

/** $12.9K · $4.2M */
export function formatUSDCompact(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${sign}$${trim(abs / 1e9)}B`
  if (abs >= 1e6) return `${sign}$${trim(abs / 1e6)}M`
  if (abs >= 1e3) return `${sign}$${trim(abs / 1e3)}K`
  return `${sign}$${Math.round(abs)}`
}

export function formatNumber(value: number, locale: 'IN' | 'US' = 'IN'): string {
  return (locale === 'IN' ? numberIN : numberUS).format(value)
}

/** 1,284 · 12.9K · 4.2M (international compaction for counts) */
export function formatCompact(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${sign}${trim(abs / 1e9)}B`
  if (abs >= 1e6) return `${sign}${trim(abs / 1e6)}M`
  if (abs >= 1e4) return `${sign}${trim(abs / 1e3)}K`
  return `${sign}${numberUS.format(Math.round(abs))}`
}

/** Axis ticks: one compact style per axis — 0 · 500 · 2.5K · 10K · 1.2M. */
export function formatTick(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1e9) return `${sign}${trim(abs / 1e9)}B`
  if (abs >= 1e6) return `${sign}${trim(abs / 1e6)}M`
  if (abs >= 1e3) return `${sign}${trim(abs / 1e3)}K`
  return `${sign}${trim(abs)}`
}

/** INR axis ticks with lakh/crore compaction: ₹0 · ₹50K · ₹2L · ₹1.5Cr. */
export function formatINRTick(value: number): string {
  return value === 0 ? '₹0' : formatINRCompact(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/** +12.4% / −3.1% with a real minus sign */
export function formatSignedPercent(value: number, decimals = 1): string {
  const fixed = Math.abs(value).toFixed(decimals)
  if (Number(fixed) === 0) return `0${decimals > 0 ? '.' + '0'.repeat(decimals) : ''}%`
  return `${value > 0 ? '+' : '−'}${fixed}%`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function trim(n: number): string {
  const fixed = n >= 100 ? n.toFixed(0) : n.toFixed(1)
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed
}

/* ------------------------------------------------------------------ Dates */

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const dateShortFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' })
const monthFmt = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' })
const monthShortFmt = new Intl.DateTimeFormat('en-IN', { month: 'short' })
const monthLongFmt = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })
const weekdayFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short' })

type DateInput = Date | string | number

function toDate(value: DateInput): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

/** 12 Nov 2026 */
export const formatDate = (value: DateInput) => dateFmt.format(toDate(value))
/** 12 Nov */
export const formatDateShort = (value: DateInput) => dateShortFmt.format(toDate(value))
/** 12 Nov, 4:05 pm */
export const formatDateTime = (value: DateInput) => dateTimeFmt.format(toDate(value))
/** 4:05 pm */
export const formatTime = (value: DateInput) => timeFmt.format(toDate(value))
/** Nov 2026 */
export const formatMonth = (value: DateInput) => monthFmt.format(toDate(value))
/** Nov */
export const formatMonthShort = (value: DateInput) => monthShortFmt.format(toDate(value))
/** November 2026 */
export const formatMonthLong = (value: DateInput) => monthLongFmt.format(toDate(value))
/** Thu */
export const formatWeekday = (value: DateInput) => weekdayFmt.format(toDate(value))

/** "just now", "5 min ago", "3 h ago", "2 d ago", or a date */
export function formatRelative(value: DateInput, now: number = Date.now()): string {
  const diff = now - toDate(value).getTime()
  const future = diff < 0
  const abs = Math.abs(diff)
  const min = Math.round(abs / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return future ? `in ${min} min` : `${min} min ago`
  const h = Math.round(min / 60)
  if (h < 24) return future ? `in ${h} h` : `${h} h ago`
  const d = Math.round(h / 24)
  if (d < 7) return future ? `in ${d} d` : `${d} d ago`
  return formatDate(value)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
