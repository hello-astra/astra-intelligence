import { useMemo, useRef, useState } from 'react'
import { useToday } from '@/hooks/useToday'
import { Check, Download, FileText, Lock, Play } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Panel } from '@/components/ui/Panel'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { useToast } from '@/components/ui/toast-context'
import type { PayrollLine } from '@/types/erp'
import { cn } from '@/utils/cn'
import { fromMonthKey, monthKey } from '@/utils/dates'
import { downloadCSV } from '@/utils/export'
import { formatDateTime, formatINR, formatINRCompact, formatMonthLong } from '@/utils/format'
import { StatTile } from '../../shared/StatTile'
import type { ErpCtx } from '../context'
import { payrollFor, workingDays } from '../logic'

const STEPS = ['Validate attendance & leave', 'Calculate earnings', 'Apply statutory deductions (PF, PT, TDS)', 'Generate payslips', 'Lock payroll & prepare bank file']

export function PayrollView({ state, setState }: ErpCtx) {
  const toast = useToast()
  const month = monthKey(useToday())
  const lines = useMemo(() => payrollFor(state, month), [state, month])
  const run = state.payrollRuns.find((r) => r.month === month)
  const processed = run?.status === 'processed'
  const [step, setStep] = useState(-1)
  const [slip, setSlip] = useState<PayrollLine | null>(null)
  const timers = useRef<number[]>([])

  const totals = lines.reduce(
    (t, l) => ({ gross: t.gross + l.gross, lop: t.lop + l.lopAmount, pf: t.pf + l.pf, pt: t.pt + l.pt, tds: t.tds + l.tds, net: t.net + l.net }),
    { gross: 0, lop: 0, pf: 0, pt: 0, tds: 0, net: 0 },
  )
  const emp = (id: string) => state.employees.find((e) => e.id === id)

  const start = () => {
    if (step >= 0 || processed) return
    STEPS.forEach((_, i) => timers.current.push(window.setTimeout(() => setStep(i), i * 650)))
    timers.current.push(
      window.setTimeout(() => {
        setState((s) => ({
          ...s,
          payrollRuns: [
            ...s.payrollRuns.filter((r) => r.month !== month),
            { month, status: 'processed', processedAt: new Date().toISOString(), employeeCount: lines.length, gross: Math.round(totals.gross), deductions: Math.round(totals.gross - totals.net), net: Math.round(totals.net) },
          ],
        }))
        setStep(STEPS.length)
        toast({ title: `${formatMonthLong(fromMonthKey(month))} payroll processed`, description: `${lines.length} payslips generated · net ${formatINRCompact(totals.net)}` })
      }, STEPS.length * 650 + 300),
    )
  }

  const exportRegister = () =>
    downloadCSV(`payroll-register-${month}`, lines, [
      { key: 'id', label: 'Employee ID', value: (l) => l.employeeId },
      { key: 'name', label: 'Name', value: (l) => emp(l.employeeId)?.name ?? '' },
      { key: 'gross', label: 'Gross', value: (l) => l.gross },
      { key: 'lop', label: 'LOP days', value: (l) => l.lopDays },
      { key: 'lopAmt', label: 'LOP amount', value: (l) => l.lopAmount },
      { key: 'pf', label: 'PF', value: (l) => l.pf },
      { key: 'pt', label: 'Professional tax', value: (l) => l.pt },
      { key: 'tds', label: 'TDS (indicative)', value: (l) => l.tds },
      { key: 'net', label: 'Net pay', value: (l) => l.net },
    ])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Payroll · {formatMonthLong(fromMonthKey(month))}</h2>
          <p className="text-xs text-fg-3">
            {workingDays(month).length} working days · loss of pay from absences and half-days · TDS is an indicative estimate (new regime)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" leftIcon={<Download className="size-3.5" />} onClick={exportRegister}>
            Register CSV
          </Button>
          <Button size="sm" onClick={start} disabled={processed || step >= 0} leftIcon={processed ? <Lock className="size-3.5" /> : step >= 0 ? <Spinner /> : <Play className="size-3.5" />}>
            {processed ? 'Processed' : step >= 0 ? 'Processing…' : 'Run payroll'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Gross earnings" value={formatINRCompact(totals.gross)} hint={`${lines.length} employees`} />
        <StatTile label="Loss of pay" value={formatINRCompact(totals.lop)} hint={`${lines.reduce((s, l) => s + l.lopDays, 0)} LOP days so far`} />
        <StatTile label="Statutory deductions" value={formatINRCompact(totals.pf + totals.pt + totals.tds)} hint="PF + PT + TDS" />
        <StatTile label="Net payable" value={formatINRCompact(totals.net)} hint={processed ? `Locked ${formatDateTime(run?.processedAt ?? '')}` : 'Draft — not yet processed'} />
      </div>

      {(step >= 0 || processed) && (
        <Panel title={processed ? 'Payroll run complete' : 'Running payroll'}>
          <ol className="grid gap-2 sm:grid-cols-5">
            {STEPS.map((label, i) => {
              const done = processed || i < step || step === STEPS.length
              const activeStep = !processed && i === step
              return (
                <li key={label} className={cn('flex items-start gap-2 rounded-lg border p-2.5 text-xs', done ? 'border-emerald-500/25 bg-emerald-500/[0.06]' : activeStep ? 'border-brand/40 bg-brand/[0.06]' : 'border-line')}>
                  <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full', done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-ink/[0.06] text-fg-3')}>
                    {done ? <Check className="size-3" /> : activeStep ? <Spinner className="size-3" /> : i + 1}
                  </span>
                  <span className={done || activeStep ? 'text-fg-2' : 'text-fg-4'}>{label}</span>
                </li>
              )
            })}
          </ol>
          {processed && <p className="mt-3 text-xs text-fg-3">Bank transfer file prepared for review.</p>}
        </Panel>
      )}

      <Panel title="Payroll register" flush>
        <Table minWidth={920}>
          <THead>
            <tr>
              <TH>Employee</TH>
              <TH align="right">Gross</TH>
              <TH align="right">LOP</TH>
              <TH align="right">PF</TH>
              <TH align="right">PT</TH>
              <TH align="right">TDS</TH>
              <TH align="right">Net pay</TH>
              <TH align="right">
                <span className="sr-only">Payslip</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {lines.map((l) => {
              const e = emp(l.employeeId)
              return (
                <TR key={l.employeeId}>
                  <TD>
                    <span className="block font-medium text-fg">{e?.name}</span>
                    <span className="block text-[11px] text-fg-4">
                      {l.employeeId} · {e?.designation}
                    </span>
                  </TD>
                  <TD align="right">{formatINR(l.gross)}</TD>
                  <TD align="right" className={l.lopDays ? 'text-amber-300' : undefined}>
                    {l.lopDays ? `${l.lopDays} d · ${formatINR(l.lopAmount)}` : '—'}
                  </TD>
                  <TD align="right">{formatINR(l.pf)}</TD>
                  <TD align="right">{formatINR(l.pt)}</TD>
                  <TD align="right">{formatINR(l.tds)}</TD>
                  <TD align="right" className="font-medium text-fg">
                    {formatINR(l.net)}
                  </TD>
                  <TD align="right">
                    <Button size="xs" variant="ghost" leftIcon={<FileText className="size-3" />} onClick={() => setSlip(l)}>
                      Payslip
                    </Button>
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      </Panel>

      <Panel title="Payroll history">
        <ul className="divide-y divide-line">
          {[...state.payrollRuns]
            .sort((a, b) => b.month.localeCompare(a.month))
            .map((r) => (
              <li key={r.month} className="flex flex-wrap items-center gap-3 py-2 text-[13px]">
                <span className="w-36 text-fg">{formatMonthLong(fromMonthKey(r.month))}</span>
                <Badge tone={r.status === 'processed' ? 'green' : 'neutral'}>{r.status === 'processed' ? 'Processed' : 'Draft'}</Badge>
                <span className="text-fg-3">{r.employeeCount} employees</span>
                <span className="ml-auto text-fg-2 tabular-nums">Net {formatINRCompact(r.net)}</span>
              </li>
            ))}
        </ul>
      </Panel>

      <Modal open={slip !== null} onClose={() => setSlip(null)} title={`Payslip · ${formatMonthLong(fromMonthKey(month))}`} description={slip ? `${emp(slip.employeeId)?.name} · ${slip.employeeId}` : undefined}>
        {slip && (
          <div className="space-y-4 text-[13px]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-fg-3 uppercase">Earnings</h3>
                {[
                  ['Basic', slip.basic],
                  ['HRA', slip.hra],
                  ['Special allowance', slip.special],
                ].map(([k, v]) => (
                  <p key={k} className="flex justify-between py-0.5 text-fg-2">
                    <span>{k}</span>
                    <span className="tabular-nums">{formatINR(Number(v))}</span>
                  </p>
                ))}
                <p className="mt-1 flex justify-between border-t border-line pt-1.5 font-medium text-fg">
                  <span>Gross</span>
                  <span className="tabular-nums">{formatINR(slip.gross)}</span>
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-fg-3 uppercase">Deductions</h3>
                {[
                  [`Loss of pay (${slip.lopDays} d)`, slip.lopAmount],
                  ['Provident fund', slip.pf],
                  ['Professional tax', slip.pt],
                  ['TDS (indicative)', slip.tds],
                ].map(([k, v]) => (
                  <p key={k} className="flex justify-between py-0.5 text-fg-2">
                    <span>{k}</span>
                    <span className="tabular-nums">{formatINR(Number(v))}</span>
                  </p>
                ))}
                <p className="mt-1 flex justify-between border-t border-line pt-1.5 font-medium text-fg">
                  <span>Total</span>
                  <span className="tabular-nums">{formatINR(slip.gross - slip.net)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-500/25">
              <span className="font-medium text-emerald-200">Net pay</span>
              <span className="text-lg font-semibold text-fg tabular-nums">{formatINR(slip.net)}</span>
            </div>
            <p className="text-[11px] text-fg-4">Sample payslip generated by the Astra ERP demo. Tax figures are indicative and not tax advice.</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
