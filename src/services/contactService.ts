import { SITE } from '@/data/constants/site'
import { storage } from './storage'

export interface Enquiry {
  fullName: string
  company: string
  email: string
  phone: string
  service: string
  serviceLabel: string
  budget: string
  description: string
  consultation: boolean
  submittedAt: string
  sourcePage: string
}

export type SubmitResult =
  /** Delivered to the configured endpoint. */
  | { status: 'sent'; reference: string }
  /** No endpoint configured: saved in this browser only (demo mode). */
  | { status: 'stored'; reference: string }

const OUTBOX_KEY = storage.key('enquiries', 'outbox')
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT?.trim() || ''

export const contactMode: 'live' | 'demo' = ENDPOINT ? 'live' : 'demo'

function makeReference(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6)
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `ENQ-${stamp}${rand}`
}

/**
 * Submits an enquiry.
 *
 * - With VITE_CONTACT_ENDPOINT set, POSTs JSON to that URL (your API, an n8n
 *   webhook, a form service, …) and throws on any non-2xx response.
 * - Without it, the enquiry is kept in a local outbox (never silently dropped)
 *   and the UI explains that nothing was sent and offers an email fallback.
 */
export async function submitEnquiry(enquiry: Enquiry): Promise<SubmitResult> {
  const reference = makeReference()

  if (ENDPOINT) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...enquiry, reference }),
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) {
      throw new Error(`The enquiry service responded with status ${response.status}.`)
    }
    return { status: 'sent', reference }
  }

  // Demo mode — simulate network latency, then persist locally.
  await new Promise((resolve) => window.setTimeout(resolve, 900))
  const outbox = storage.get<(Enquiry & { reference: string })[]>(OUTBOX_KEY) ?? []
  storage.set(OUTBOX_KEY, [...outbox, { ...enquiry, reference }].slice(-25))
  return { status: 'stored', reference }
}

/** Pre-filled mailto: link so a visitor can send the same enquiry by email. */
export function buildEnquiryMailto(enquiry: Enquiry, reference?: string): string {
  const subject = `Project enquiry${enquiry.serviceLabel ? ` — ${enquiry.serviceLabel}` : ''}${enquiry.company ? ` (${enquiry.company})` : ''}`
  const lines = [
    `Name: ${enquiry.fullName}`,
    `Company: ${enquiry.company}`,
    `Email: ${enquiry.email}`,
    enquiry.phone ? `Phone: ${enquiry.phone}` : '',
    `Service: ${enquiry.serviceLabel}`,
    enquiry.budget ? `Budget: ${enquiry.budget}` : '',
    enquiry.consultation ? 'Request: Book a consultation' : '',
    reference ? `Reference: ${reference}` : '',
    '',
    enquiry.description,
  ].filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''))
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
}
