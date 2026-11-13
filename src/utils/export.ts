/**
 * Client-side export helpers (CSV / JSON). Files are generated in the browser;
 * nothing is uploaded.
 */
import { toISODate } from './dates'

export interface CsvColumn<T> {
  key: string
  label: string
  value: (row: T) => string | number | boolean | null | undefined
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function toCSV<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsv(c.label)).join(',')
  const body = rows.map((row) => columns.map((c) => escapeCsv(c.value(row))).join(','))
  return [header, ...body].join('\r\n')
}

/** Converts an array of flat records into CSV using the keys of the first record. */
export function recordsToCSV(rows: readonly Record<string, string | number | boolean | null | undefined>[]): string {
  if (rows.length === 0) return ''
  const keys = Object.keys(rows[0])
  return toCSV(
    rows,
    keys.map((key) => ({ key, label: key, value: (row) => row[key] })),
  )
}

export function downloadFile(content: string, filename: string, mime: string): void {
  // BOM keeps UTF-8 symbols such as ₹ intact when CSV files are opened in Excel.
  const payload = mime.startsWith('text/csv') ? '﻿' + content : content
  const blob = new Blob([payload], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCSV<T>(filename: string, rows: readonly T[], columns: readonly CsvColumn<T>[]): void {
  downloadFile(toCSV(rows, columns), ensureExt(filename, 'csv'), 'text/csv;charset=utf-8')
}

export function downloadJSON(filename: string, data: unknown): void {
  downloadFile(JSON.stringify(data, null, 2), ensureExt(filename, 'json'), 'application/json')
}

function ensureExt(filename: string, ext: string): string {
  return filename.toLowerCase().endsWith(`.${ext}`) ? filename : `${filename}.${ext}`
}

/** Local calendar date (YYYY-MM-DD) for file names — not UTC, which can be a day behind in IST. */
export function dateStamp(date = new Date()): string {
  return toISODate(date)
}
