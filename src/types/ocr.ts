export type DocKind = 'Receipt' | 'Tax invoice' | 'Fuel receipt' | 'Hotel invoice' | 'Utility bill' | 'Other'

export type FieldKey = 'merchant' | 'invoiceNumber' | 'date' | 'dueDate' | 'customer' | 'gstin' | 'subtotal' | 'tax' | 'total' | 'paymentMethod'

export interface ExtractedField {
  key: FieldKey
  label: string
  value: string
  confidence: number
  /** data-region id on the rendered document, for highlight boxes. */
  region?: string
  /** Raw text as read before normalization (e.g. 08/11/2026 → 2026-11-08). */
  raw?: string
  edited?: boolean
}

export interface LineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
  amount: number
  /** 0 when the line was added by hand. */
  confidence: number
  edited?: boolean
}

export interface OcrLine {
  text: string
  confidence: number
}

export interface Extraction {
  documentType: DocKind
  typeConfidence: number
  currency: 'INR'
  fields: ExtractedField[]
  lineItems: LineItem[]
  rawText: OcrLine[]
  engine: string
  simulated: boolean
}

export interface ProcessedDoc {
  id: string
  name: string
  documentType: DocKind
  merchant: string
  invoiceNumber: string
  date: string
  total: number
  processedAt: string
  status: 'approved' | 'needs_review'
  corrections: number
  extraction: Extraction
}

export interface OcrState {
  history: ProcessedDoc[]
  settings: { reviewThreshold: number; exportFormat: 'csv' | 'json' }
}
