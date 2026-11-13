import { useState } from 'react'
import { Download, FileJson, History, ScanText, Settings2, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Panel } from '@/components/ui/Panel'
import { Segmented } from '@/components/ui/Segmented'
import { Slider } from '@/components/ui/Slider'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { useToast } from '@/components/ui/toast-context'
import { SOLUTION_BY_SLUG } from '@/data/constants/solutions'
import { usePersistentState } from '@/hooks/usePersistentState'
import { SIMULATED_ENGINE_NAME, uploadEngine } from '@/services/ocrService'
import type { OcrState, ProcessedDoc } from '@/types/ocr'
import { dateStamp, downloadCSV, downloadJSON } from '@/utils/export'
import { formatDate, formatDateTime, formatINR } from '@/utils/format'
import { DemoShell } from '../shared/DemoShell'
import type { DemoView } from '../shared/demo-context'
import { ProcessView } from './ProcessView'

type View = 'process' | 'history' | 'settings'
const solution = SOLUTION_BY_SLUG['document-intelligence']
const initState = (): OcrState => ({ history: [], settings: { reviewThreshold: 0.8, exportFormat: 'json' } })

export default function OcrDemo() {
  const toast = useToast()
  const [state, setState, reset] = usePersistentState('ocr', initState, 1)
  const [view, setView] = useState<View>('process')
  const [inspect, setInspect] = useState<ProcessedDoc | null>(null)

  const views: DemoView<View>[] = [
    { id: 'process', label: 'Process documents', icon: ScanText },
    { id: 'history', label: 'Processed', icon: History, badge: state.history.length || undefined },
    { id: 'settings', label: 'Pipeline settings', icon: Settings2 },
  ]

  return (
    <DemoShell
      solution={solution}
      views={views}
      activeView={view}
      onViewChange={setView}
      onReset={() => {
        reset()
        setView('process')
      }}
    >
      {view === 'process' && <ProcessView state={state} onApprove={(doc) => setState((s) => ({ ...s, history: [doc, ...s.history] }))} />}

      {view === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-fg">Processed documents</h2>
              <p className="text-xs text-fg-3">Reviewed extractions ready for accounting or ERP export. Stored in this browser only.</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Download className="size-3.5" />}
              disabled={state.history.length === 0}
              onClick={() => {
                const name = `processed-documents-${dateStamp()}`
                if (state.settings.exportFormat === 'json') downloadJSON(name, state.history)
                else
                  downloadCSV(name, state.history, [
                    { key: 'name', label: 'Document', value: (d) => d.name },
                    { key: 'type', label: 'Type', value: (d) => d.documentType },
                    { key: 'merchant', label: 'Merchant', value: (d) => d.merchant },
                    { key: 'number', label: 'Number', value: (d) => d.invoiceNumber },
                    { key: 'date', label: 'Date', value: (d) => d.date },
                    { key: 'total', label: 'Total (INR)', value: (d) => d.total },
                    { key: 'status', label: 'Status', value: (d) => d.status },
                    { key: 'corrections', label: 'Corrections', value: (d) => d.corrections },
                    { key: 'engine', label: 'Extraction engine', value: (d) => d.extraction.engine },
                  ])
                toast({ title: 'Export ready', description: 'Generated in your browser — nothing was uploaded.' })
              }}
            >
              Export all ({state.settings.exportFormat.toUpperCase()})
            </Button>
          </div>
          <Panel flush>
            {state.history.length === 0 ? (
              <EmptyState icon={History} title="Nothing processed yet" description="Process a sample document and select Approve & save." action={<Button size="sm" onClick={() => setView('process')}>Process a document</Button>} />
            ) : (
              <Table minWidth={820}>
                <THead>
                  <tr>
                    <TH>Document</TH>
                    <TH>Merchant</TH>
                    <TH>Number</TH>
                    <TH>Date</TH>
                    <TH align="right">Total</TH>
                    <TH>Status</TH>
                    <TH align="right">
                      <span className="sr-only">Actions</span>
                    </TH>
                  </tr>
                </THead>
                <TBody>
                  {state.history.map((d) => (
                    <TR key={d.id}>
                      <TD>
                        <span className="block font-medium text-fg">{d.name}</span>
                        <span className="block text-[11px] text-fg-4">
                          {d.documentType} · {formatDateTime(d.processedAt)}
                          {d.extraction.simulated && ' · simulated extraction'}
                        </span>
                      </TD>
                      <TD>{d.merchant}</TD>
                      <TD className="font-mono text-xs">{d.invoiceNumber || '—'}</TD>
                      <TD className="text-xs">{d.date ? formatDate(d.date) : '—'}</TD>
                      <TD align="right" className="text-fg">
                        {formatINR(d.total, 2)}
                      </TD>
                      <TD>
                        <Badge tone={d.status === 'approved' ? 'green' : 'amber'}>{d.status === 'approved' ? 'Approved' : 'Needs review'}</Badge>
                        {d.corrections > 0 && <span className="ml-1.5 text-[11px] text-fg-4">{d.corrections} corrected</span>}
                      </TD>
                      <TD align="right">
                        <div className="flex justify-end gap-1">
                          <Button size="xs" variant="ghost" leftIcon={<FileJson className="size-3" />} onClick={() => setInspect(d)}>
                            View
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            aria-label={`Delete ${d.name}`}
                            onClick={() => {
                              setState((s) => ({ ...s, history: s.history.filter((h) => h.id !== d.id) }))
                              toast({ title: 'Record deleted', tone: 'info' })
                            }}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Panel>
        </div>
      )}

      {view === 'settings' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Review rules">
            <Slider
              id="review-threshold"
              label="Confidence needed to skip review"
              value={Math.round(state.settings.reviewThreshold * 100)}
              min={60}
              max={95}
              step={5}
              onChange={(v) => setState((s) => ({ ...s, settings: { ...s.settings, reviewThreshold: v / 100 } }))}
              format={(v) => `${v}%`}
              hint="Fields below this confidence are highlighted for a human to confirm before export."
            />
            <div className="mt-5">
              <p className="mb-2 text-[13px] font-medium text-fg-2">Preferred export format</p>
              <Segmented
                ariaLabel="Export format"
                value={state.settings.exportFormat}
                onChange={(exportFormat) => setState((s) => ({ ...s, settings: { ...s.settings, exportFormat } }))}
                options={[
                  { value: 'json', label: 'JSON (APIs)' },
                  { value: 'csv', label: 'CSV (spreadsheets)' },
                ]}
              />
            </div>
          </Panel>
          <Panel title="OCR engine">
            <dl className="space-y-3 text-[13px]">
              <div>
                <dt className="text-xs text-fg-3">Sample documents</dt>
                <dd className="text-fg">{SIMULATED_ENGINE_NAME}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-3">Uploads</dt>
                <dd className="text-fg">{uploadEngine ? uploadEngine.name : 'Not configured — manual entry only'}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-fg-3">
              To process real documents, set <code className="rounded bg-white/[0.06] px-1 font-mono text-fg-2">VITE_OCR_API_URL</code> to a backend endpoint that runs an OCR / document-AI engine and returns the extraction JSON. See README → “OCR & document intelligence”.
            </p>
          </Panel>
        </div>
      )}

      <Modal open={inspect !== null} onClose={() => setInspect(null)} size="lg" title={inspect?.name ?? ''} description="Stored extraction (JSON)">
        {inspect && <pre className="max-h-[60vh] overflow-auto rounded-lg bg-[#060a14] p-3 font-mono text-[11px] text-fg-2">{JSON.stringify(inspect.extraction, null, 2)}</pre>}
      </Modal>
    </DemoShell>
  )
}
