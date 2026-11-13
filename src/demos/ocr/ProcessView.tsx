import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  CheckCircle2,
  CircleAlert,
  CircleMinus,
  Download,
  FileImage,
  FileJson,
  FileText,
  FlaskConical,
  Info,
  Plus,
  Receipt,
  ScanLine,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Meter } from '@/components/ui/Meter'
import { Panel } from '@/components/ui/Panel'
import { Segmented } from '@/components/ui/Segmented'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast-context'
import { blankExtraction, getSampleDocuments, sampleExtraction } from '@/data/mock/ocr'
import { uploadEngine } from '@/services/ocrService'
import type { DocKind, Extraction, ExtractedField, LineItem, OcrState, ProcessedDoc } from '@/types/ocr'
import { cn } from '@/utils/cn'
import { downloadCSV, downloadJSON } from '@/utils/export'
import { formatBytes, formatINR } from '@/utils/format'
import { uid } from '@/utils/id'
import { DocumentPaper } from './DocumentPaper'
import { fieldValue, num, validate, type Check } from './validation'

type Source = { kind: 'sample'; id: string } | { kind: 'upload'; name: string; size: number; type: string; url: string; file: File }
type Stage = 'idle' | 'preprocess' | 'ocr' | 'layout' | 'extract' | 'validate' | 'done'

const STAGES: { id: Exclude<Stage, 'idle' | 'done'>; label: string }[] = [
  { id: 'preprocess', label: 'Pre-processing' },
  { id: 'ocr', label: 'Text recognition' },
  { id: 'layout', label: 'Layout analysis' },
  { id: 'extract', label: 'Field extraction' },
  { id: 'validate', label: 'Validation' },
]
const KINDS: DocKind[] = ['Receipt', 'Tax invoice', 'Fuel receipt', 'Hotel invoice', 'Utility bill', 'Other']
const MAX_UPLOAD = 10 * 1024 * 1024
const safeName = (s: string) => (s || 'document').replace(/[^\w-]+/g, '_')

interface Box {
  region: string
  x: number
  y: number
  w: number
  h: number
}

interface Props {
  state: OcrState
  onApprove: (doc: ProcessedDoc) => void
}

export function ProcessView({ state, onApprove }: Props) {
  const toast = useToast()
  const samples = useMemo(() => getSampleDocuments(), [])
  const [source, setSource] = useState<Source | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [skipped, setSkipped] = useState(false)
  const [extraction, setExtraction] = useState<Extraction | null>(null)
  const [revealed, setRevealed] = useState(0)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [tab, setTab] = useState<'fields' | 'items' | 'raw' | 'json'>('fields')
  const [notice, setNotice] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const timers = useRef<number[]>([])
  const runId = useRef(0)
  const viewerRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const sample = source?.kind === 'sample' ? samples.find((s) => s.id === source.id) : undefined
  const threshold = state.settings.reviewThreshold
  const preferJson = state.settings.exportFormat === 'json'
  const processed = new Set(state.history.map((h) => h.name))

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(
    () => () => {
      runId.current++
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const measure = useCallback(() => {
    const viewer = viewerRef.current
    const paper = paperRef.current
    if (!viewer || !paper) return setBoxes([])
    const base = viewer.getBoundingClientRect()
    setBoxes(
      Array.from(paper.querySelectorAll<HTMLElement>('[data-region]')).map((el) => {
        const r = el.getBoundingClientRect()
        return { region: el.dataset.region as string, x: r.left - base.left - 3, y: r.top - base.top - 2, w: r.width + 6, h: r.height + 4 }
      }),
    )
  }, [])

  const showBoxes = Boolean(sample) && (stage === 'layout' || stage === 'extract' || stage === 'validate' || stage === 'done')
  useLayoutEffect(() => {
    if (!showBoxes) return
    measure()
    const viewer = viewerRef.current
    if (!viewer) return
    const ro = new ResizeObserver(measure)
    ro.observe(viewer)
    return () => ro.disconnect()
  }, [showBoxes, measure, source])

  /**
   * Runs the extraction pipeline. Sample documents use predefined results;
   * uploads go to the configured OCR service, or straight to manual entry when
   * no service is configured (no pretend recognition of the user's file).
   */
  const run = async (src: Source) => {
    const id = ++runId.current
    clearTimers()
    const wait = (ms: number) => new Promise<void>((resolve) => timers.current.push(window.setTimeout(resolve, ms)))
    const alive = () => runId.current === id
    setSource(src)
    setExtraction(null)
    setRevealed(0)
    setBoxes([])
    setNotice(null)
    setSavedId(null)
    setTab('fields')

    if (src.kind === 'upload' && !uploadEngine) {
      setSkipped(true)
      setNotice('No OCR engine is configured in this demo environment, so the contents of uploaded files are not read. Enter the fields manually to try validation and export, or process one of the sample documents to see a simulated extraction.')
      setExtraction(blankExtraction())
      setRevealed(Number.POSITIVE_INFINITY)
      setStage('done')
      return
    }

    setSkipped(false)
    setStage('preprocess')
    await wait(600)
    setStage('ocr')
    let result: Extraction
    if (src.kind === 'sample') {
      await wait(1300)
      const doc = samples.find((s) => s.id === src.id)
      if (!doc) return
      result = sampleExtraction(doc)
    } else {
      try {
        ;[result] = await Promise.all([(uploadEngine as NonNullable<typeof uploadEngine>).extract(src.file), wait(900)])
      } catch (err) {
        if (!alive()) return
        setNotice(`The OCR service could not process this file (${err instanceof Error ? err.message : 'unknown error'}). Enter the fields manually or try again later.`)
        result = { ...blankExtraction(), engine: 'Manual entry (OCR service error)' }
      }
    }
    if (!alive()) return
    setStage('layout')
    await wait(700)
    setExtraction(result)
    setStage('extract')
    const count = result.fields.length
    for (let i = 1; i <= count; i++) {
      await wait(900 / count)
      setRevealed(i)
    }
    setStage('validate')
    await wait(450)
    setStage('done')
  }

  const onFile = (file: File | undefined) => {
    if (!file) return
    if (!/^image\/|application\/pdf/.test(file.type)) return toast({ title: 'Unsupported file', description: 'Upload a JPG, PNG, WebP or PDF.', tone: 'error' })
    if (file.size > MAX_UPLOAD) return toast({ title: 'File too large', description: 'The limit is 10 MB.', tone: 'error' })
    if (source?.kind === 'upload') URL.revokeObjectURL(source.url)
    void run({ kind: 'upload', name: file.name, size: file.size, type: file.type, url: URL.createObjectURL(file), file })
  }

  const edit = (fn: (x: Extraction) => Extraction) => {
    setSavedId(null)
    setExtraction((x) => (x ? fn(x) : x))
  }
  // Edits keep the original confidence so "corrected" (OCR value changed) and "entered" (typed from scratch) stay distinguishable.
  const updateField = (key: ExtractedField['key'], value: string) => edit((x) => ({ ...x, fields: x.fields.map((f) => (f.key === key ? { ...f, value, edited: true } : f)) }))
  const updateLine = (lineId: string, patch: Partial<LineItem>) =>
    edit((x) => ({
      ...x,
      lineItems: x.lineItems.map((l) => {
        if (l.id !== lineId) return l
        const next = { ...l, ...patch, edited: true }
        return { ...next, amount: Math.round(next.qty * next.unitPrice * 100) / 100 }
      }),
    }))

  const done = stage === 'done'
  // The record just saved from this screen is excluded so it is not reported as its own duplicate.
  const checks: Check[] = extraction && done ? validate(extraction, savedId ? state.history.filter((h) => h.id !== savedId) : state.history, threshold) : []
  const failing = checks.filter((c) => c.status === 'fail').length
  const warnings = checks.filter((c) => c.status === 'warn').length
  const docName = sample ? sample.title : source?.kind === 'upload' ? source.name : ''

  const structured = extraction
    ? {
        documentType: extraction.documentType,
        currency: extraction.currency,
        merchant: fieldValue(extraction, 'merchant'),
        invoiceNumber: fieldValue(extraction, 'invoiceNumber'),
        date: fieldValue(extraction, 'date'),
        dueDate: fieldValue(extraction, 'dueDate') || undefined,
        billedTo: fieldValue(extraction, 'customer') || undefined,
        gstin: fieldValue(extraction, 'gstin') || undefined,
        subtotal: num(fieldValue(extraction, 'subtotal')),
        tax: num(fieldValue(extraction, 'tax')),
        total: num(fieldValue(extraction, 'total')),
        paymentMethod: fieldValue(extraction, 'paymentMethod') || undefined,
        lineItems: extraction.lineItems.map(({ description, qty, unitPrice, amount }) => ({ description, qty, unitPrice, amount })),
        engine: extraction.engine,
        simulated: extraction.simulated,
      }
    : null

  const exportCsv = () => {
    if (!structured) return
    // One row per line item with header fields repeated — the usual shape for accounting imports.
    const rows: { l: (typeof structured.lineItems)[number] | null; n: number }[] = structured.lineItems.length ? structured.lineItems.map((l, i) => ({ l, n: i + 1 })) : [{ l: null, n: 0 }]
    downloadCSV(`${safeName(structured.invoiceNumber)}-extraction`, rows, [
      { key: 'merchant', label: 'Merchant', value: () => structured.merchant },
      { key: 'number', label: 'Document number', value: () => structured.invoiceNumber },
      { key: 'date', label: 'Date', value: () => structured.date },
      { key: 'due', label: 'Due date', value: () => structured.dueDate },
      { key: 'gstin', label: 'Supplier GSTIN', value: () => structured.gstin },
      { key: 'line', label: 'Line', value: (r) => (r.l ? r.n : '') },
      { key: 'description', label: 'Description', value: (r) => r.l?.description },
      { key: 'qty', label: 'Qty', value: (r) => r.l?.qty },
      { key: 'unit', label: 'Unit price', value: (r) => r.l?.unitPrice },
      { key: 'amount', label: 'Amount', value: (r) => r.l?.amount },
      { key: 'subtotal', label: 'Subtotal', value: () => structured.subtotal },
      { key: 'tax', label: 'Tax', value: () => structured.tax },
      { key: 'total', label: 'Total', value: () => structured.total },
      { key: 'currency', label: 'Currency', value: () => structured.currency },
      { key: 'simulated', label: 'Simulated extraction', value: () => (structured.simulated ? 'yes' : 'no') },
    ])
    toast({ title: 'CSV exported', description: 'Generated in your browser — nothing was uploaded.' })
  }
  const exportJson = () => {
    if (!structured) return
    downloadJSON(`${safeName(structured.invoiceNumber)}-extraction`, structured)
    toast({ title: 'JSON exported', description: 'Generated in your browser — nothing was uploaded.' })
  }

  const approve = () => {
    if (!extraction || !source) return
    const doc: ProcessedDoc = {
      id: uid('doc'),
      name: docName,
      documentType: extraction.documentType,
      merchant: fieldValue(extraction, 'merchant') || '—',
      invoiceNumber: fieldValue(extraction, 'invoiceNumber'),
      date: fieldValue(extraction, 'date'),
      total: num(fieldValue(extraction, 'total')) ?? 0,
      processedAt: new Date().toISOString(),
      status: failing || warnings ? 'needs_review' : 'approved',
      corrections: extraction.fields.filter((f) => f.edited && f.confidence > 0).length + extraction.lineItems.filter((l) => l.edited && l.confidence > 0).length,
      extraction,
    }
    onApprove(doc)
    setSavedId(doc.id)
    toast({
      title: doc.status === 'approved' ? 'Document approved and saved' : 'Saved with open review items',
      description: `${doc.name} · ${formatINR(doc.total, 2)} — stored in this browser only.`,
      tone: doc.status === 'approved' ? 'success' : 'warning',
    })
  }

  const running = stage !== 'idle' && stage !== 'done'
  const stageIndex = STAGES.findIndex((s) => s.id === stage)
  const exportButtons = [
    <Button key="csv" size="sm" variant={preferJson ? 'ghost' : 'secondary'} leftIcon={<Download className="size-3.5" />} onClick={exportCsv} disabled={!done}>
      CSV
    </Button>,
    <Button key="json" size="sm" variant={preferJson ? 'secondary' : 'ghost'} leftIcon={<FileJson className="size-3.5" />} onClick={exportJson} disabled={!done}>
      JSON
    </Button>,
  ]

  return (
    <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,400px)]">
      {/* Sample gallery + upload */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold tracking-wide text-fg-3 uppercase">Sample documents</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-1">
          {samples.map((s) => {
            const selected = source?.kind === 'sample' && source.id === s.id
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => void run({ kind: 'sample', id: s.id })}
                  disabled={running}
                  aria-pressed={selected}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors disabled:opacity-60',
                    selected ? 'border-brand/50 bg-brand/[0.08]' : 'border-line bg-panel hover:border-line-strong',
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#fbfaf7]/90 text-brand-strong">
                    {s.template === 'receipt' ? <Receipt className="size-4" aria-hidden /> : <FileText className="size-4" aria-hidden />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-fg">{s.title}</span>
                    <span className="block text-[11px] text-fg-3">{processed.has(s.title) ? 'Processed ✓' : s.kind}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div
          onDragOver={(e: DragEvent) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e: DragEvent) => {
            e.preventDefault()
            setDragOver(false)
            if (!running) onFile(e.dataTransfer.files[0])
          }}
          className={cn('rounded-xl border border-dashed p-4 text-center transition-colors', dragOver ? 'border-brand bg-brand/[0.08]' : 'border-line-strong')}
        >
          <Upload className="mx-auto size-5 text-fg-3" aria-hidden />
          <p className="mt-2 text-xs text-fg-2">Drop a receipt or invoice</p>
          <p className="text-[10px] text-fg-4">JPG, PNG, WebP or PDF · max 10 MB</p>
          <Button size="xs" variant="secondary" className="mt-3" onClick={() => fileRef.current?.click()} disabled={running}>
            Choose file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            tabIndex={-1}
            aria-label="Upload a document"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              onFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <p className="mt-3 text-[10px] leading-relaxed text-fg-4">
            {uploadEngine ? `Uploads are sent to the configured OCR service (${uploadEngine.name}).` : 'Files stay in your browser. No OCR engine is configured, so uploads are not read automatically.'}
          </p>
        </div>
      </div>

      {/* Document viewer */}
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="min-w-0 truncate text-sm font-semibold text-fg">{docName || 'Choose a document to process'}</h2>
          {source && (
            <Badge tone="amber" icon={<FlaskConical className="size-3" />}>
              {sample ? 'Simulated OCR · predefined results' : skipped ? 'No OCR engine · manual entry' : 'Configured OCR service'}
            </Badge>
          )}
        </div>
        {skipped ? (
          <p className="rounded-lg border border-line bg-ink/[0.02] px-3 py-2 text-[11px] text-fg-3">Recognition pipeline skipped — no OCR engine is configured for uploads.</p>
        ) : (
          <ol className="grid grid-cols-5 gap-1" aria-label="Processing pipeline">
            {STAGES.map((s, i) => {
              const complete = done || (stageIndex > i && stageIndex >= 0)
              const current = s.id === stage
              return (
                <li key={s.id} className="min-w-0" aria-current={current ? 'step' : undefined}>
                  <span className={cn('block h-1 rounded-full transition-colors', complete ? 'bg-emerald-400' : current ? 'animate-pulse bg-brand' : 'bg-ink/10')} />
                  <span className={cn('mt-1.5 flex items-center gap-1 truncate text-[10px]', complete ? 'text-fg-2' : current ? 'text-brand-soft' : 'text-fg-4')}>
                    {current && <Spinner className="size-2.5 shrink-0" />}
                    <span className="truncate">{s.label}</span>
                  </span>
                </li>
              )
            })}
          </ol>
        )}
        <div ref={viewerRef} className="bg-dots relative flex min-h-[480px] items-start justify-center overflow-hidden rounded-2xl border border-line bg-sunken p-5 sm:p-8">
          {!source && (
            <div className="m-auto max-w-xs text-center">
              <ScanLine className="mx-auto size-8 text-fg-4" aria-hidden />
              <p className="mt-3 text-sm text-fg-2">Select a sample document or upload your own to start the extraction pipeline.</p>
            </div>
          )}
          {sample && (
            <div className={cn('relative w-full transition-[filter] duration-500', stage === 'preprocess' && 'contrast-125 grayscale')}>
              <DocumentPaper doc={sample} paperRef={paperRef} />
            </div>
          )}
          {source?.kind === 'upload' &&
            (source.type.startsWith('image/') ? (
              <img src={source.url} alt={`Uploaded document ${source.name}`} className="paper max-h-[560px] w-auto max-w-full rounded-sm object-contain" />
            ) : (
              <div className="paper flex w-64 flex-col items-center rounded-sm p-8 text-center">
                <FileImage className="size-10 text-[#2b5fd9]" aria-hidden />
                <p className="mt-3 text-sm font-semibold break-all">{source.name}</p>
                <p className="text-xs text-[#555]">{formatBytes(source.size)} · PDF</p>
              </div>
            ))}
          {stage === 'ocr' && (
            <div className="pointer-events-none absolute inset-x-6 top-0 bottom-0" aria-hidden>
              <div className="motion-decor animate-scan pointer-events-none absolute inset-0" aria-hidden>
                <div className="h-0.5 bg-brand shadow-[0_0_18px_4px_color-mix(in_oklab,var(--color-brand)_60%,transparent)]" />
              </div>
            </div>
          )}
          {showBoxes &&
            boxes.map((b) => (
              <div
                key={b.region}
                aria-hidden
                className={cn('pointer-events-none absolute rounded-[3px] border transition-colors duration-200', active === b.region ? 'border-cyan-400 bg-cyan-400/25' : 'border-cyan-500/60 bg-cyan-400/[0.06]')}
                style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
              >
                {active === b.region && <span className="absolute -top-4 left-0 rounded bg-brand-strong px-1 text-[9px] font-medium text-on-brand">{b.region}</span>}
              </div>
            ))}
        </div>
        {sample && <p className="text-[11px] text-fg-4">Sample documents are rendered in the browser. Their extraction results are predefined — including a few deliberate misreads — to demonstrate review and correction.</p>}
      </div>

      {/* Results */}
      <Panel
        title="Extraction results"
        description={extraction ? extraction.engine : running ? 'Processing…' : 'Results appear here'}
        className="min-w-0 self-start"
        actions={
          extraction && done ? (
            <Badge tone={failing ? 'red' : warnings ? 'amber' : 'green'} icon={failing ? <XCircle className="size-3" /> : warnings ? <CircleAlert className="size-3" /> : <CheckCircle2 className="size-3" />}>
              {failing ? `${failing} failed` : warnings ? `${warnings} to review` : 'All checks passed'}
            </Badge>
          ) : undefined
        }
      >
        {notice && (
          <div className="mb-3 flex gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] p-3 text-xs leading-relaxed text-amber-100" role="status">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden />
            <p>{notice}</p>
          </div>
        )}
        {!extraction ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-fg-3" aria-live="polite">
            {running ? <Spinner className="size-6 text-brand" /> : <ScanLine className="size-6 text-fg-4" aria-hidden />}
            {running ? `${STAGES.find((s) => s.id === stage)?.label ?? 'Processing'}…` : 'No document processed yet.'}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label htmlFor="doc-type" className="shrink-0 text-xs text-fg-3">
                Document type
              </label>
              <select
                id="doc-type"
                value={extraction.documentType}
                onChange={(e) => edit((x) => ({ ...x, documentType: e.target.value as DocKind, typeConfidence: 0 }))}
                className="h-7 min-w-0 flex-1 rounded-md border border-line bg-raised px-1.5 text-xs text-fg"
              >
                {KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              {extraction.typeConfidence > 0 && <span className="text-[11px] text-fg-3 tabular-nums">{Math.round(extraction.typeConfidence * 100)}%</span>}
            </div>
            <Segmented
              fullWidth
              size="xs"
              ariaLabel="Result view"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'fields', label: 'Fields' },
                { value: 'items', label: `Lines (${extraction.lineItems.length})` },
                { value: 'raw', label: 'Raw text' },
                { value: 'json', label: 'JSON' },
              ]}
            />
            {tab === 'fields' && (
              <ul className="space-y-2.5">
                {extraction.fields.map((f, i) => {
                  const visible = i < revealed || done
                  const low = !f.edited && f.confidence > 0 && f.confidence < threshold
                  return (
                    <li key={f.key}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <label htmlFor={`fld-${f.key}`} className="text-[11px] font-medium text-fg-3">
                          {f.label}
                        </label>
                        {visible &&
                          (f.edited ? (
                            <Badge tone="blue" size="xs">
                              {f.confidence > 0 ? 'Corrected' : 'Entered'}
                            </Badge>
                          ) : f.confidence > 0 ? (
                            <Badge tone={low ? 'amber' : 'green'} size="xs">
                              {low ? 'Review · ' : ''}
                              {Math.round(f.confidence * 100)}%
                            </Badge>
                          ) : (
                            <Badge size="xs">Manual</Badge>
                          ))}
                      </div>
                      {visible ? (
                        <input
                          id={`fld-${f.key}`}
                          value={f.value}
                          onChange={(e) => updateField(f.key, e.target.value)}
                          onFocus={() => setActive(f.region ?? null)}
                          onBlur={() => setActive(null)}
                          onMouseEnter={() => setActive(f.region ?? null)}
                          onMouseLeave={(e) => {
                            if (document.activeElement !== e.currentTarget) setActive(null)
                          }}
                          placeholder={f.key === 'date' || f.key === 'dueDate' ? 'YYYY-MM-DD' : 'Enter value'}
                          className={cn(
                            'h-8 w-full rounded-md border bg-raised px-2.5 text-[13px] text-fg outline-none focus:border-brand/70 focus:ring-2 focus:ring-brand/20',
                            low ? 'border-amber-400/50' : 'border-line',
                          )}
                        />
                      ) : (
                        <div className="skeleton h-8 rounded-md" />
                      )}
                      {visible && f.raw && f.raw !== f.value && !f.edited && <p className="mt-0.5 text-[10px] text-fg-4">Read as “{f.raw}”</p>}
                      {visible && low && <Meter className="mt-1" value={f.confidence * 100} tone="warning" size="xs" label={`${f.label} confidence`} />}
                    </li>
                  )
                })}
              </ul>
            )}
            {tab === 'items' && (
              <div className="space-y-2" onMouseEnter={() => setActive('items')} onMouseLeave={() => setActive(null)}>
                {extraction.lineItems.length === 0 && <p className="text-xs text-fg-3">No line items. Add them manually if needed.</p>}
                {extraction.lineItems.map((l, i) => (
                  <div key={l.id} className="rounded-lg border border-line p-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        aria-label={`Line ${i + 1} description`}
                        value={l.description}
                        onChange={(e) => updateLine(l.id, { description: e.target.value })}
                        className="h-7 min-w-0 flex-1 rounded border border-line bg-raised px-2 text-xs text-fg"
                      />
                      <button
                        type="button"
                        aria-label={`Remove line ${i + 1}`}
                        onClick={() => edit((x) => ({ ...x, lineItems: x.lineItems.filter((y) => y.id !== l.id) }))}
                        className="rounded p-1 text-fg-4 hover:text-red-300"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-[11px] text-fg-3">
                      <label className="flex flex-col gap-0.5">
                        Qty
                        <input type="number" step="0.01" value={l.qty} onChange={(e) => updateLine(l.id, { qty: Number(e.target.value) })} className="h-7 rounded border border-line bg-raised px-1.5 text-xs text-fg" />
                      </label>
                      <label className="flex flex-col gap-0.5">
                        Unit price
                        <input type="number" step="0.01" value={l.unitPrice} onChange={(e) => updateLine(l.id, { unitPrice: Number(e.target.value) })} className="h-7 rounded border border-line bg-raised px-1.5 text-xs text-fg" />
                      </label>
                      <span className="flex flex-col gap-0.5">
                        Amount
                        <span className="flex h-7 items-center justify-end rounded bg-ink/[0.03] px-1.5 text-xs text-fg tabular-nums">{formatINR(l.amount, 2)}</span>
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  size="xs"
                  variant="ghost"
                  leftIcon={<Plus className="size-3" />}
                  onClick={() => edit((x) => ({ ...x, lineItems: [...x.lineItems, { id: uid('li'), description: 'New item', qty: 1, unitPrice: 0, amount: 0, confidence: 0, edited: true }] }))}
                >
                  Add line
                </Button>
              </div>
            )}
            {tab === 'raw' && (
              <ul className="max-h-[360px] space-y-1 overflow-auto rounded-lg bg-sunken p-3 font-mono text-[11px]">
                {extraction.rawText.length === 0 && <li className="text-fg-4">No recognized text.</li>}
                {extraction.rawText.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={cn('w-9 shrink-0 text-right tabular-nums', l.confidence < threshold ? 'text-amber-300' : 'text-fg-4')}>{Math.round(l.confidence * 100)}%</span>
                    <span className="text-fg-2">{l.text}</span>
                  </li>
                ))}
              </ul>
            )}
            {tab === 'json' && structured && <pre className="max-h-[360px] overflow-auto rounded-lg bg-sunken p-3 font-mono text-[11px] text-fg-2">{JSON.stringify(structured, null, 2)}</pre>}

            {done && (
              <div className="border-t border-line pt-3">
                <h3 className="text-[11px] font-semibold tracking-wide text-fg-3 uppercase">Validation</h3>
                <ul className="mt-2 space-y-1.5" aria-label="Validation checks">
                  {checks.map((c) => {
                    const Icon = c.status === 'pass' ? CheckCircle2 : c.status === 'warn' ? CircleAlert : c.status === 'fail' ? XCircle : CircleMinus
                    return (
                      <li key={c.id} className="flex gap-2 text-xs" data-check={c.id} data-status={c.status}>
                        <Icon className={cn('mt-px size-3.5 shrink-0', c.status === 'pass' ? 'text-emerald-400' : c.status === 'warn' ? 'text-amber-300' : c.status === 'fail' ? 'text-red-400' : 'text-fg-4')} aria-hidden />
                        <span>
                          <span className="text-fg-2">{c.label}</span>
                          <span className="sr-only"> — {c.status}</span>
                          <span className="block text-[11px] text-fg-4">{c.detail}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
              {preferJson ? [exportButtons[1], exportButtons[0]] : exportButtons}
              <Button size="sm" className="ml-auto" leftIcon={<CheckCircle2 className="size-3.5" />} onClick={approve} disabled={!done || savedId !== null}>
                {savedId ? 'Saved' : 'Approve & save'}
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  )
}
