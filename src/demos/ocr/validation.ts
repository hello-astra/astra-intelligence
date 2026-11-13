import type { Extraction, FieldKey, ProcessedDoc } from '@/types/ocr'

export interface Check {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail' | 'skip'
  detail: string
}

const GST_RATES = [5, 12, 18, 28]
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export function num(value: string | undefined): number | null {
  if (!value) return null
  const n = Number(value.replace(/[₹,\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

export function fieldValue(x: Extraction, key: FieldKey): string {
  return x.fields.find((f) => f.key === key)?.value ?? ''
}

/** Business-rule validation that runs on every edit. */
export function validate(x: Extraction, history: ProcessedDoc[], threshold: number): Check[] {
  const checks: Check[] = []
  const missing = (['merchant', 'date', 'total'] as FieldKey[]).filter((k) => !fieldValue(x, k).trim())
  checks.push({
    id: 'required',
    label: 'Required fields present',
    status: missing.length ? 'fail' : 'pass',
    detail: missing.length ? `Missing: ${missing.join(', ')}` : 'Merchant, date and total found',
  })

  const date = fieldValue(x, 'date')
  if (!date) checks.push({ id: 'date', label: 'Date format', status: 'skip', detail: 'No date yet' })
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date).getTime()))
    checks.push({ id: 'date', label: 'Date format', status: 'fail', detail: 'Use YYYY-MM-DD' })
  else if (new Date(date).getTime() > Date.now()) checks.push({ id: 'date', label: 'Date format', status: 'warn', detail: 'Date is in the future' })
  else checks.push({ id: 'date', label: 'Date format', status: 'pass', detail: `Normalised to ${date}` })

  const subtotal = num(fieldValue(x, 'subtotal'))
  const tax = num(fieldValue(x, 'tax')) ?? 0
  const total = num(fieldValue(x, 'total'))
  if (x.lineItems.length && subtotal !== null) {
    const sum = x.lineItems.reduce((s, l) => s + l.qty * l.unitPrice, 0)
    const diff = Math.abs(sum - subtotal)
    checks.push({
      id: 'lines',
      label: 'Line items add up to subtotal',
      status: diff <= 1 ? 'pass' : 'fail',
      detail: diff <= 1 ? `₹${sum.toFixed(2)} across ${x.lineItems.length} lines` : `Lines total ₹${sum.toFixed(2)}, subtotal says ₹${subtotal.toFixed(2)}`,
    })
  } else checks.push({ id: 'lines', label: 'Line items add up to subtotal', status: 'skip', detail: 'No line items or subtotal' })

  if (subtotal !== null && total !== null) {
    const diff = total - (subtotal + tax)
    checks.push({
      id: 'total',
      label: 'Subtotal + tax = total',
      status: Math.abs(diff) <= 1 ? 'pass' : 'fail',
      detail: Math.abs(diff) <= 1 ? (Math.abs(diff) > 0.001 ? `Matches (round-off ₹${diff.toFixed(2)})` : 'Matches exactly') : `Off by ₹${diff.toFixed(2)} — check the total`,
    })
  } else checks.push({ id: 'total', label: 'Subtotal + tax = total', status: 'skip', detail: 'Amounts incomplete' })

  if (x.documentType === 'Utility bill' && tax > 0) {
    checks.push({ id: 'rate', label: 'Tax rate plausible', status: 'skip', detail: 'Utility duties are set by each state, so GST slabs do not apply' })
  } else if (subtotal && tax > 0) {
    const rate = (tax / subtotal) * 100
    const standard = GST_RATES.some((r) => Math.abs(rate - r) <= 0.6)
    checks.push({ id: 'rate', label: 'Tax rate plausible', status: standard ? 'pass' : 'warn', detail: standard ? `${rate.toFixed(1)}% — standard GST slab` : `${rate.toFixed(1)}% is not a standard GST slab — verify` })
  } else checks.push({ id: 'rate', label: 'Tax rate plausible', status: 'skip', detail: tax === 0 ? 'No tax on document' : 'No subtotal' })

  const gstin = fieldValue(x, 'gstin')
  if (gstin) checks.push({ id: 'gstin', label: 'GSTIN format', status: GSTIN_RE.test(gstin) ? 'pass' : 'fail', detail: GSTIN_RE.test(gstin) ? 'Valid 15-character GSTIN' : 'Invalid GSTIN format' })

  const number = fieldValue(x, 'invoiceNumber')
  const merchant = fieldValue(x, 'merchant').toLowerCase()
  const dup = number ? history.find((h) => h.invoiceNumber === number && h.merchant.toLowerCase() === merchant) : undefined
  checks.push({
    id: 'duplicate',
    label: 'Duplicate check',
    status: !number ? 'skip' : dup ? 'warn' : 'pass',
    detail: !number ? 'No document number' : dup ? `Already processed on ${new Date(dup.processedAt).toLocaleDateString('en-IN')}` : 'Not seen before',
  })

  const low = x.fields.filter((f) => f.value && !f.edited && f.confidence > 0 && f.confidence < threshold)
  checks.push({
    id: 'confidence',
    label: 'Confidence above review threshold',
    status: low.length ? 'warn' : 'pass',
    detail: low.length ? `${low.length} field${low.length === 1 ? '' : 's'} below ${Math.round(threshold * 100)}%: ${low.map((f) => f.label).join(', ')}` : `All fields ≥ ${Math.round(threshold * 100)}% or reviewed`,
  })
  return checks
}
