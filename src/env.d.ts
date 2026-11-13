/// <reference types="vite/client" />

/**
 * Optional integrations. Every variable is optional — when a value is not
 * configured the website falls back to a clearly labelled demo behavior.
 * See README.md → "Configuring integrations".
 */
interface ImportMetaEnv {
  /** POST endpoint that receives contact-form enquiries as JSON (e.g. your API, an n8n webhook, Formspree). */
  readonly VITE_CONTACT_ENDPOINT?: string
  /** External scheduling page for "Book a Consultation" (e.g. Cal.com / Calendly). */
  readonly VITE_BOOKING_URL?: string
  /** Backend proxy that forwards chat messages to an LLM provider. Never put provider API keys in the frontend. */
  readonly VITE_CHAT_API_URL?: string
  /** Backend endpoint that accepts a document upload and returns structured OCR extraction. */
  readonly VITE_OCR_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
