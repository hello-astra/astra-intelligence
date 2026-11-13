/**
 * Sample documents for the OCR demo. Each document is defined once as
 * structured data; the viewer renders it as "paper" and the simulated engine
 * derives its extraction from the same definition — including a few
 * deliberate misreads so the review-and-correct step can be demonstrated.
 */
import type { DocKind, Extraction, ExtractedField, FieldKey, LineItem, OcrLine } from '@/types/ocr'
import { addDays, startOfDay, toISODate } from '@/utils/dates'
import { SIMULATED_ENGINE_NAME } from '@/services/ocrService'

export interface SampleDocument {
  id: string
  title: string
  kind: DocKind
  template: 'receipt' | 'invoice'
  merchant: { name: string; lines: string[]; gstin?: string }
  billTo?: { name: string; lines: string[]; gstin?: string }
  docLabel: string
  docNumber: string
  date: Date
  dueDate?: Date
  items: { description: string; qty: number; unitPrice: number }[]
  taxes: { label: string; amount: number }[]
  roundOff?: number
  payment?: string
  footer?: string
  misreads?: Partial<Record<FieldKey, { value: string; confidence: number }>>
  lowConfidence?: Partial<Record<FieldKey, number>>
}

export const ddmmyyyy = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
/** Title-cases ALL-CAPS names from receipts, keeping tokens with digits (e.g. NH48) intact. */
export const normalizeName = (s: string) =>
  s === s.toUpperCase() ? s.split(' ').map((w) => (/\d/.test(w) || w.length <= 1 ? w : w[0] + w.slice(1).toLowerCase())).join(' ') : s

export const money = (v: number) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function docTotals(doc: SampleDocument) {
  const subtotal = doc.items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const tax = doc.taxes.reduce((s, t) => s + t.amount, 0)
  return { subtotal, tax, total: Math.round((subtotal + tax + (doc.roundOff ?? 0)) * 100) / 100 }
}

export function getSampleDocuments(): SampleDocument[] {
  const today = startOfDay()
  const d = (n: number) => addDays(today, -n)
  return [
    {
      id: 'cafe',
      title: 'Café receipt',
      kind: 'Receipt',
      template: 'receipt',
      merchant: { name: 'BREW & BEAN CAFÉ', lines: ['12th Main, Indiranagar', 'Bengaluru 560038'], gstin: '29AABCB1234F1Z5' },
      docLabel: 'Bill No',
      docNumber: 'BB-20481',
      date: d(4),
      items: [
        { description: 'Cappuccino', qty: 2, unitPrice: 240 },
        { description: 'Avocado toast', qty: 1, unitPrice: 390 },
        { description: 'Cold brew', qty: 1, unitPrice: 216 },
      ],
      taxes: [
        { label: 'CGST 2.5%', amount: 27.15 },
        { label: 'SGST 2.5%', amount: 27.15 },
      ],
      roundOff: -0.3,
      payment: 'UPI',
      footer: 'Thank you! Visit again.',
    },
    {
      id: 'hosting',
      title: 'Cloud hosting tax invoice',
      kind: 'Tax invoice',
      template: 'invoice',
      merchant: { name: 'Cloudnine Hosting Pvt. Ltd.', lines: ['4th Floor, Tech Park, Whitefield', 'Bengaluru, Karnataka 560066'], gstin: '29AAECC4821K1Z2' },
      billTo: { name: 'Orbit Labs Pvt. Ltd.', lines: ['201, Business Bay, Baner', 'Pune, Maharashtra 411045'], gstin: '27AABCO7765R1ZM' },
      docLabel: 'Invoice No',
      docNumber: 'CNH/26-27/0842',
      date: d(6),
      dueDate: addDays(d(6), 15),
      items: [
        { description: 'Managed Kubernetes cluster — monthly', qty: 1, unitPrice: 24000 },
        { description: 'Object storage (2 TB)', qty: 1, unitPrice: 3800 },
        { description: 'Premium support plan', qty: 1, unitPrice: 6500 },
      ],
      taxes: [{ label: 'IGST 18%', amount: 6174 }],
      payment: 'Bank transfer · Net 15',
      footer: 'This is a computer-generated invoice.',
      lowConfidence: { dueDate: 0.78 },
    },
    {
      id: 'hotel',
      title: 'Hotel invoice',
      kind: 'Hotel invoice',
      template: 'invoice',
      merchant: { name: 'Seaview Residency', lines: ['Miramar Beach Road', 'Panaji, Goa 403001'], gstin: '30AAFFS9012M1Z8' },
      billTo: { name: 'Mr. Arjun Iyer (Orbit Labs)', lines: ['Room 304 · 2 nights'] },
      docLabel: 'Invoice No',
      docNumber: 'HTL-7731',
      date: d(9),
      items: [
        { description: 'Deluxe room — sea view (per night)', qty: 2, unitPrice: 4800 },
        { description: 'Breakfast buffet', qty: 2, unitPrice: 450 },
      ],
      taxes: [{ label: 'GST 12%', amount: 1260 }],
      payment: 'Corporate card ••9911',
      footer: 'Check-out time 11:00 AM. We hope to see you again.',
      misreads: { invoiceNumber: { value: 'HTL-773I', confidence: 0.62 } },
    },
    {
      id: 'fuel',
      title: 'Fuel receipt',
      kind: 'Fuel receipt',
      template: 'receipt',
      merchant: { name: 'NH48 HIGHWAY FUELS', lines: ['Talegaon Toll Plaza', 'Pune–Mumbai Expressway'] },
      docLabel: 'Txn No',
      docNumber: 'FX-552190',
      date: d(2),
      items: [{ description: 'Petrol (litres)', qty: 32.5, unitPrice: 102.86 }],
      taxes: [],
      roundOff: 0.05,
      payment: 'Card ••4417',
      footer: 'Prices inclusive of applicable taxes.',
      lowConfidence: { merchant: 0.71 },
    },
    {
      id: 'power',
      title: 'Electricity bill',
      kind: 'Utility bill',
      template: 'invoice',
      merchant: { name: 'Metro Electricity Board', lines: ['Consumer services division', 'Pune Urban Circle'] },
      billTo: { name: 'Orbit Labs Pvt. Ltd. · A/C 4100 2283 1190', lines: ['201, Business Bay, Baner, Pune', 'Billing period: 1 Oct – 31 Oct · 1,284 kWh'] },
      docLabel: 'Bill No',
      docNumber: 'MEB-10-883214',
      date: d(11),
      dueDate: addDays(d(11), 14),
      items: [
        { description: 'Energy charges (1,284 kWh)', qty: 1, unitPrice: 9630 },
        { description: 'Fixed charges', qty: 1, unitPrice: 1200 },
      ],
      taxes: [{ label: 'Electricity duty 9%', amount: 974.7 }],
      payment: 'Due by date shown',
      footer: 'Pay online to avoid late payment surcharge.',
      misreads: { total: { value: '11604.70', confidence: 0.71 } },
    },
  ]
}

export function sampleExtraction(doc: SampleDocument): Extraction {
  const { subtotal, tax, total } = docTotals(doc)
  const conf = (k: FieldKey, base: number) => doc.lowConfidence?.[k] ?? base
  const field = (key: FieldKey, label: string, value: string, base: number, region: string, raw?: string): ExtractedField => {
    const mis = doc.misreads?.[key]
    return { key, label, value: mis?.value ?? value, confidence: mis?.confidence ?? conf(key, base), region, raw: raw ?? (mis?.value ?? value) }
  }
  const fields: ExtractedField[] = [
    field('merchant', 'Merchant / vendor', normalizeName(doc.merchant.name), 0.97, 'merchant', doc.merchant.name),
    field('invoiceNumber', doc.kind === 'Utility bill' ? 'Bill number' : doc.template === 'receipt' ? 'Receipt / bill number' : 'Invoice number', doc.docNumber, 0.95, 'docNumber'),
    field('date', 'Document date', toISODate(doc.date), 0.96, 'date', ddmmyyyy(doc.date)),
    ...(doc.dueDate ? [field('dueDate', 'Due date', toISODate(doc.dueDate), 0.93, 'dueDate', ddmmyyyy(doc.dueDate))] : []),
    ...(doc.billTo ? [field('customer', 'Billed to', doc.billTo.name, 0.92, 'billTo')] : []),
    ...(doc.merchant.gstin ? [field('gstin', 'Supplier GSTIN', doc.merchant.gstin, 0.94, 'gstin')] : []),
    field('subtotal', 'Subtotal', subtotal.toFixed(2), 0.95, 'subtotal'),
    field('tax', 'Tax', tax.toFixed(2), doc.taxes.length ? 0.93 : 0.9, 'tax'),
    field('total', 'Total amount', total.toFixed(2), 0.98, 'total'),
    ...(doc.payment ? [field('paymentMethod', 'Payment method', doc.payment, 0.88, 'payment')] : []),
  ]
  const lineItems: LineItem[] = doc.items.map((i, n) => ({
    id: `${doc.id}_li_${n}`,
    description: i.description,
    qty: i.qty,
    unitPrice: i.unitPrice,
    amount: Math.round(i.qty * i.unitPrice * 100) / 100,
    confidence: 0.9 + ((n * 7) % 8) / 100,
  }))
  const rawText: OcrLine[] = [
    { text: doc.merchant.name, confidence: conf('merchant', 0.97) },
    ...doc.merchant.lines.map((t) => ({ text: t, confidence: 0.94 })),
    ...(doc.merchant.gstin ? [{ text: `GSTIN: ${doc.merchant.gstin}`, confidence: 0.94 }] : []),
    { text: `${doc.docLabel}: ${doc.misreads?.invoiceNumber?.value ?? doc.docNumber}`, confidence: doc.misreads?.invoiceNumber?.confidence ?? 0.95 },
    { text: `Date: ${ddmmyyyy(doc.date)}`, confidence: 0.96 },
    ...doc.items.map((i) => ({ text: `${i.description}  ${i.qty} x ${money(i.unitPrice)}  ${money(i.qty * i.unitPrice)}`, confidence: 0.91 })),
    { text: `Subtotal ${money(subtotal)}`, confidence: 0.95 },
    ...doc.taxes.map((t) => ({ text: `${t.label} ${money(t.amount)}`, confidence: 0.93 })),
    ...(doc.roundOff ? [{ text: `Round off ${money(doc.roundOff)}`, confidence: 0.9 }] : []),
    { text: `TOTAL ${doc.misreads?.total?.value ?? money(total)}`, confidence: doc.misreads?.total?.confidence ?? 0.98 },
    ...(doc.payment ? [{ text: `Paid via ${doc.payment}`, confidence: 0.88 }] : []),
  ]
  return { documentType: doc.kind, typeConfidence: doc.kind === 'Receipt' ? 0.94 : 0.97, currency: 'INR', fields, lineItems, rawText, engine: SIMULATED_ENGINE_NAME, simulated: true }
}

export function blankExtraction(kind: DocKind = 'Other'): Extraction {
  const f = (key: FieldKey, label: string): ExtractedField => ({ key, label, value: '', confidence: 0 })
  return {
    documentType: kind,
    typeConfidence: 0,
    currency: 'INR',
    fields: [
      f('merchant', 'Merchant / vendor'),
      f('invoiceNumber', 'Invoice / receipt number'),
      f('date', 'Document date'),
      f('subtotal', 'Subtotal'),
      f('tax', 'Tax'),
      f('total', 'Total amount'),
      f('paymentMethod', 'Payment method'),
    ],
    lineItems: [],
    rawText: [],
    engine: 'Manual entry (no OCR engine configured)',
    simulated: true,
  }
}
