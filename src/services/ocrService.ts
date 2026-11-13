/**
 * Document-extraction service abstraction.
 *
 * - With VITE_OCR_API_URL configured, uploads are sent (multipart/form-data)
 *   to your backend, which runs an OCR/IDP engine (Tesseract, AWS Textract,
 *   Google Document AI, Azure Document Intelligence, an LLM vision model…) and
 *   returns an `Extraction` JSON document.
 * - Without it, sample documents use predefined extraction results and
 *   uploads cannot be read — the UI says so plainly and offers manual entry.
 */
import type { Extraction } from '@/types/ocr'

export interface OcrEngine {
  readonly name: string
  readonly simulated: boolean
  extract(file: File): Promise<Extraction>
}

const endpoint = import.meta.env.VITE_OCR_API_URL?.trim()

function httpEngine(url: string): OcrEngine {
  return {
    name: 'Configured OCR API',
    simulated: false,
    async extract(file) {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch(url, { method: 'POST', body, signal: AbortSignal.timeout(60_000) })
      if (!res.ok) throw new Error(`OCR service responded with ${res.status}`)
      const data = (await res.json()) as Extraction
      if (!Array.isArray(data.fields)) throw new Error('OCR service returned an unexpected payload')
      return { ...data, simulated: false }
    },
  }
}

/** The live engine for uploads, or null when none is configured. */
export const uploadEngine: OcrEngine | null = endpoint ? httpEngine(endpoint) : null

export const SIMULATED_ENGINE_NAME = 'Built-in results for sample documents'
