import type { AttendanceStatus, Employee, ErpState, PayrollLine, PurchaseOrder, ShipmentStatus } from '@/types/erp'
import { daysInMonth, fromMonthKey, isWeekend, toISODate } from '@/utils/dates'

/** Translucent fill of a theme colour (CSS variables, so codes follow the product theme and mode). */
const tintOf = (token: string, pct: number) => `color-mix(in oklab, var(${token}) ${pct}%, transparent)`

export const ATTENDANCE_META: Record<AttendanceStatus, { label: string; short: string; color: string; text: string }> = {
  present: { label: 'Present', short: 'P', color: tintOf('--color-good', 22), text: 'var(--color-emerald-300)' },
  wfh: { label: 'Work from home', short: 'W', color: tintOf('--color-brand', 24), text: 'var(--color-brand-soft)' },
  half_day: { label: 'Half day', short: 'H', color: tintOf('--color-warning', 20), text: 'var(--color-amber-300)' },
  leave: { label: 'Leave', short: 'L', color: tintOf('--color-accent', 24), text: 'var(--color-accent-soft)' },
  absent: { label: 'Absent', short: 'A', color: tintOf('--color-critical', 26), text: 'var(--color-red-300)' },
}

export const ATTENDANCE_ORDER: AttendanceStatus[] = ['present', 'wfh', 'half_day', 'leave', 'absent']

export const SHIPMENT_STEPS: ShipmentStatus[] = ['pending', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered']
export const SHIPMENT_LABEL: Record<ShipmentStatus, string> = {
  pending: 'Awaiting dispatch',
  dispatched: 'Dispatched',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  delayed: 'Delayed',
}

export function workingDays(monthKeyStr: string): string[] {
  const start = fromMonthKey(monthKeyStr)
  return Array.from({ length: daysInMonth(start) }, (_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1))
    .filter((d) => !isWeekend(d))
    .map(toISODate)
}

/** Attendance rate = (present + wfh + ½ half-days) ÷ marked working days. */
export function attendanceRate(state: ErpState, employeeIds: string[], days: string[]): number {
  let marked = 0
  let worked = 0
  for (const day of days) {
    const rec = state.attendance[day]
    if (!rec) continue
    for (const id of employeeIds) {
      const s = rec[id]
      if (!s) continue
      marked += 1
      worked += s === 'present' || s === 'wfh' ? 1 : s === 'half_day' ? 0.5 : 0
    }
  }
  return marked ? (worked / marked) * 100 : 0
}

/** Indicative annual income tax under India's new regime (FY 2025-26 slabs, 87A rebate, 4% cess). */
export function annualTax(ctc: number): number {
  const taxable = Math.max(0, ctc - 75_000)
  if (taxable <= 12_00_000) return 0
  const slabs: [number, number][] = [
    [4_00_000, 0],
    [8_00_000, 0.05],
    [12_00_000, 0.1],
    [16_00_000, 0.15],
    [20_00_000, 0.2],
    [24_00_000, 0.25],
    [Infinity, 0.3],
  ]
  let tax = 0
  let lower = 0
  for (const [upper, rate] of slabs) {
    if (taxable > lower) tax += (Math.min(taxable, upper) - lower) * rate
    lower = upper
  }
  return tax * 1.04
}

export function payrollLine(e: Employee, state: ErpState, month: string): PayrollLine {
  const gross = e.ctc / 12
  const basic = gross * 0.4
  const hra = basic * 0.5
  const special = gross - basic - hra
  const days = workingDays(month)
  let lopDays = 0
  for (const d of days) {
    const s = state.attendance[d]?.[e.id]
    if (s === 'absent') lopDays += 1
    else if (s === 'half_day') lopDays += 0.5
  }
  const lopAmount = (gross / days.length) * lopDays
  const pf = Math.min(basic, 15_000) * 0.12
  const pt = fromMonthKey(month).getMonth() === 1 ? 300 : 200
  const tds = annualTax(e.ctc) / 12
  const net = gross - lopAmount - pf - pt - tds
  const r = (v: number) => Math.round(v)
  return { employeeId: e.id, gross: r(gross), basic: r(basic), hra: r(hra), special: r(special), lopDays, lopAmount: r(lopAmount), pf: r(pf), pt, tds: r(tds), net: r(net) }
}

export function payrollFor(state: ErpState, month: string): PayrollLine[] {
  return state.employees.map((e) => payrollLine(e, state, month))
}

export function nextShipmentStatus(po: PurchaseOrder): ShipmentStatus | null {
  const current = po.shipment.status === 'delayed' ? 'in_transit' : po.shipment.status
  const i = SHIPMENT_STEPS.indexOf(current)
  return i >= 0 && i < SHIPMENT_STEPS.length - 1 ? SHIPMENT_STEPS[i + 1] : null
}

export function poHealth(po: PurchaseOrder): 'late' | 'due' | 'ok' {
  if (po.status === 'delivered' || po.status === 'cancelled') return 'ok'
  const today = toISODate(new Date())
  if (po.shipment.status === 'delayed' || po.expectedDate < today) return 'late'
  if (po.expectedDate === today) return 'due'
  return 'ok'
}

export function onTimeDeliveryRate(state: ErpState): number {
  const delivered = state.purchaseOrders.filter((p) => p.status === 'delivered')
  if (!delivered.length) return 0
  const onTime = delivered.filter((p) => {
    const at = p.shipment.events.find((e) => e.status === 'delivered')?.at
    return at ? at.slice(0, 10) <= p.expectedDate : true
  }).length
  return (onTime / delivered.length) * 100
}
