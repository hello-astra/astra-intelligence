/**
 * POST /api/contact — delivers a website enquiry to the business inbox.
 *
 * Runs as a Vercel serverless function in production and through the dev middleware in
 * vite.config.ts locally. Mail is sent over Gmail SMTP with an app password, so the
 * credentials live only in server-side environment variables (never in the bundle):
 *
 *   GMAIL_USER          the Gmail address that sends the mail
 *   GMAIL_APP_PASSWORD  a Google "app password" for that account (not the login password)
 *   CONTACT_TO          optional — inbox that receives enquiries (defaults to GMAIL_USER)
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import nodemailer from 'nodemailer'

type Body = Record<string, unknown>
type Req = IncomingMessage & { body?: unknown }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_BODY_BYTES = 32 * 1024

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.replace(/\r/g, '').trim().slice(0, max) : ''
/** Single-line variant for anything that ends up in a mail header. */
const line = (value: unknown, max: number): string => text(value, max).replace(/\s+/g, ' ')
const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

function send(res: ServerResponse, status: number, payload: Record<string, unknown>) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

async function readBody(req: Req): Promise<Body | null> {
  // Vercel parses JSON bodies already; the dev middleware and other hosts hand us the raw stream.
  let raw: unknown = req.body
  if (raw === undefined) {
    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of req) {
      size += (chunk as Buffer).length
      if (size > MAX_BODY_BYTES) return null
      chunks.push(chunk as Buffer)
    }
    raw = Buffer.concat(chunks).toString('utf8')
  }
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      return null
    }
  }
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Body) : null
}

export default async function handler(req: Req, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return send(res, 405, { ok: false, error: 'Method not allowed.' })
  }

  const body = await readBody(req)
  if (!body) return send(res, 400, { ok: false, error: 'Invalid request.' })

  // Honeypot: real visitors never fill this hidden field. Pretend success so bots move on.
  if (text(body.website, 200)) return send(res, 200, { ok: true })

  const enquiry = {
    fullName: line(body.fullName, 120),
    company: line(body.company, 160),
    email: line(body.email, 200),
    phone: line(body.phone, 40),
    serviceLabel: line(body.serviceLabel, 120) || line(body.service, 120),
    budget: line(body.budget, 60),
    description: text(body.description, 5000),
    consultation: body.consultation === true,
    reference: line(body.reference, 40),
    sourcePage: line(body.sourcePage, 200),
  }
  if (!enquiry.fullName || !enquiry.description || !EMAIL_RE.test(enquiry.email)) {
    return send(res, 400, { ok: false, error: 'Please provide your name, a valid email address and a short description.' })
  }

  const user = process.env.GMAIL_USER?.trim()
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '')
  if (!user || !pass) {
    console.error('[contact] GMAIL_USER / GMAIL_APP_PASSWORD are not set — enquiry not delivered.')
    return send(res, 503, { ok: false, error: 'The enquiry service is not available right now.' })
  }
  const to = process.env.CONTACT_TO?.trim() || user

  const rows: [string, string][] = [
    ['Name', enquiry.fullName],
    ['Company', enquiry.company],
    ['Email', enquiry.email],
    ['Phone', enquiry.phone],
    ['Service', enquiry.serviceLabel],
    ['Budget', enquiry.budget],
    ['Request', enquiry.consultation ? 'Book a consultation' : ''],
    ['Reference', enquiry.reference],
    ['Sent from', enquiry.sourcePage],
  ]
  const filled = rows.filter(([, value]) => value)
  const subject = `New enquiry${enquiry.serviceLabel ? ` — ${enquiry.serviceLabel}` : ''}${enquiry.company ? ` (${enquiry.company})` : ''}`

  try {
    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
    await transport.sendMail({
      from: { name: 'Astra Intelligence website', address: user },
      to,
      // Replying in Gmail answers the visitor directly.
      replyTo: { name: enquiry.fullName, address: enquiry.email },
      subject,
      text: `${filled.map(([label, value]) => `${label}: ${value}`).join('\n')}\n\n${enquiry.description}\n`,
      html:
        `<table cellpadding="6" style="border-collapse:collapse;font:14px/1.5 system-ui,sans-serif">` +
        filled
          .map(([label, value]) => `<tr><td style="color:#667;vertical-align:top">${label}</td><td><b>${escapeHtml(value)}</b></td></tr>`)
          .join('') +
        `</table><p style="font:14px/1.6 system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(enquiry.description)}</p>`,
    })
  } catch (error) {
    console.error('[contact] sending failed:', error)
    return send(res, 502, { ok: false, error: 'We could not deliver your enquiry right now.' })
  }

  return send(res, 200, { ok: true, reference: enquiry.reference })
}
