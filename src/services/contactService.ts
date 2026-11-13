import { SITE } from '@/data/constants/site'

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

export interface SubmitResult {
  status: 'sent'
  reference: string
}

/** The site's own mail function (api/contact.ts) unless another endpoint is configured. */
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT?.trim() || '/api/contact'

function makeReference(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6)
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `ENQ-${stamp}${rand}`
}

/**
 * Sends an enquiry to the business inbox.
 *
 * POSTs JSON to /api/contact (or VITE_CONTACT_ENDPOINT) and throws on any failure, so the
 * form can keep the visitor's details and offer the pre-filled email instead — an enquiry
 * is never reported as sent unless the server confirmed it.
 */
export async function submitEnquiry(enquiry: Enquiry, honeypot = ''): Promise<SubmitResult> {
  const reference = makeReference()
  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...enquiry, reference, website: honeypot }),
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    throw new Error('We could not reach the enquiry service. Please check your connection.')
  }
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(detail?.error ?? 'The enquiry service is not available right now.')
  }
  return { status: 'sent', reference }
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
