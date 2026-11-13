import { useState, type FormEvent } from 'react'
import { ArrowRight, Ban, CheckCircle2, MapPin, Plus, Trash2, TriangleAlert, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/toast-context'
import { shipmentEvents } from '@/data/mock/erp'
import type { ErpState, PurchaseOrder, ShipmentStatus } from '@/types/erp'
import { cn } from '@/utils/cn'
import { isoDateFromToday } from '@/utils/dates'
import { formatDate, formatDateTime, formatINR } from '@/utils/format'
import { nextSequentialId } from '@/utils/id'
import { nextShipmentStatus, SHIPMENT_LABEL, SHIPMENT_STEPS } from './logic'

const LOCATIONS: Record<ShipmentStatus, string> = {
  pending: 'Supplier warehouse',
  dispatched: 'Origin hub',
  in_transit: 'In transit — highway',
  out_for_delivery: 'Pune distribution hub',
  delivered: 'Kestrel plant, Chakan — received at stores',
  delayed: 'En route',
}

export function PoDetailModal({ poId, state, onClose, onChange }: { poId: string | null; state: ErpState; onClose: () => void; onChange: (s: ErpState) => void }) {
  const toast = useToast()
  const po = state.purchaseOrders.find((p) => p.id === poId)
  const vendor = po ? state.vendors.find((v) => v.id === po.vendorId) : undefined
  const next = po ? nextShipmentStatus(po) : null

  const update = (fn: (p: PurchaseOrder) => PurchaseOrder, message: string) => {
    if (!po) return
    onChange({ ...state, purchaseOrders: state.purchaseOrders.map((p) => (p.id === po.id ? fn(p) : p)) })
    toast({ title: message })
  }

  const advance = () =>
    next &&
    update(
      (p) => ({
        ...p,
        status: next === 'delivered' ? 'delivered' : 'in_transit',
        shipment: { ...p.shipment, status: next, events: [...p.shipment.events, { status: next, location: LOCATIONS[next], at: new Date().toISOString() }] },
      }),
      `${po?.id}: ${SHIPMENT_LABEL[next]}`,
    )

  const markDelayed = () =>
    update(
      (p) => ({
        ...p,
        expectedDate: isoDateFromToday(2),
        shipment: { ...p.shipment, status: 'delayed', events: [...p.shipment.events, { status: 'delayed', location: 'En route', at: new Date().toISOString(), note: 'Carrier reported delay; ETA moved by 2 days' }] },
      }),
      `${po?.id} marked as delayed`,
    )

  const approve = () =>
    update(
      (p) => ({ ...p, status: 'approved', shipment: { ...p.shipment, events: shipmentEvents('pending', new Date(), vendor?.city ?? 'Supplier') } }),
      `${po?.id} approved and sent to ${vendor?.name}`,
    )

  const cancel = () => update((p) => ({ ...p, status: 'cancelled' }), `${po?.id} cancelled`)

  const currentStep = po ? (po.shipment.status === 'delayed' ? 2 : SHIPMENT_STEPS.indexOf(po.shipment.status)) : -1

  return (
    <Modal
      open={Boolean(po)}
      onClose={onClose}
      size="lg"
      title={po ? `Purchase order ${po.id}` : ''}
      description={po ? `${vendor?.name} · created ${formatDateTime(po.createdAt)}` : undefined}
      footer={
        po && (
          <>
            {(po.status === 'draft' || po.status === 'approved') && (
              <Button size="sm" variant="ghost" className="mr-auto text-red-300 hover:text-red-200" leftIcon={<Ban className="size-3.5" />} onClick={cancel}>
                Cancel PO
              </Button>
            )}
            {po.status === 'draft' && (
              <Button size="sm" leftIcon={<CheckCircle2 className="size-3.5" />} onClick={approve}>
                Approve PO
              </Button>
            )}
            {po.status !== 'draft' && po.status !== 'cancelled' && po.status !== 'delivered' && (
              <>
                {po.shipment.status !== 'delayed' && po.shipment.status !== 'pending' && (
                  <Button size="sm" variant="secondary" leftIcon={<TriangleAlert className="size-3.5" />} onClick={markDelayed}>
                    Mark delayed
                  </Button>
                )}
                {next && (
                  <Button size="sm" rightIcon={<ArrowRight className="size-3.5" />} onClick={advance}>
                    Update: {SHIPMENT_LABEL[next]}
                  </Button>
                )}
              </>
            )}
            {(po.status === 'delivered' || po.status === 'cancelled') && <span className="text-xs text-fg-3">This order is closed.</span>}
          </>
        )
      }
    >
      {po && (
        <div className="space-y-5 text-[13px]">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={po.status === 'delivered' ? 'green' : po.status === 'cancelled' ? 'red' : po.status === 'draft' ? 'neutral' : 'blue'}>{po.status.replace('_', ' ')}</Badge>
            <Badge tone={po.shipment.status === 'delayed' ? 'red' : 'violet'} icon={<Truck className="size-3" aria-hidden />}>
              {SHIPMENT_LABEL[po.shipment.status]}
            </Badge>
            <span className="text-xs text-fg-3">
              {po.shipment.carrier} · {po.shipment.trackingNo} · expected {formatDate(po.expectedDate)}
            </span>
          </div>

          {po.status !== 'draft' && po.status !== 'cancelled' && (
            <div className="flex items-center gap-1" aria-label={`Shipment progress: ${SHIPMENT_LABEL[po.shipment.status]}`}>
              {SHIPMENT_STEPS.map((s, i) => (
                <div key={s} className="flex flex-1 flex-col gap-1.5">
                  <span className={cn('h-1.5 rounded-full', i <= currentStep ? (po.shipment.status === 'delayed' && i === currentStep ? 'bg-red-400' : 'bg-brand') : 'bg-white/10')} />
                  <span className={cn('text-[10px]', i <= currentStep ? 'text-fg-2' : 'text-fg-4')}>{SHIPMENT_LABEL[s]}</span>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left">
              <thead className="bg-white/[0.02] text-[11px] tracking-wide text-fg-3 uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 text-right font-medium">Unit price</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {po.items.map((i) => (
                  <tr key={i.name}>
                    <td className="px-3 py-2 text-fg">{i.name}</td>
                    <td className="px-3 py-2 text-right text-fg-2 tabular-nums">
                      {i.qty.toLocaleString('en-IN')} {i.unit}
                    </td>
                    <td className="px-3 py-2 text-right text-fg-2 tabular-nums">{formatINR(i.unitPrice)}</td>
                    <td className="px-3 py-2 text-right text-fg tabular-nums">{formatINR(i.qty * i.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between border-t border-line bg-white/[0.015] px-3 py-2.5 font-semibold text-fg">
              <span>Total (excl. GST)</span>
              <span className="tabular-nums">{formatINR(po.total)}</span>
            </div>
          </div>

          {po.shipment.events.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Tracking history</h3>
              <ol className="mt-3 space-y-3 border-l border-line-strong pl-4">
                {[...po.shipment.events].reverse().map((e, i) => (
                  <li key={`${e.at}-${i}`} className="relative">
                    <span className={cn('absolute top-1.5 -left-[21px] size-2.5 rounded-full ring-4 ring-[#0b1122]', e.status === 'delayed' ? 'bg-red-400' : 'bg-brand')} aria-hidden />
                    <p className="text-fg">{SHIPMENT_LABEL[e.status]}</p>
                    <p className="flex items-center gap-1 text-xs text-fg-3">
                      <MapPin className="size-3" aria-hidden /> {e.location} · {formatDateTime(e.at)}
                    </p>
                    {e.note && <p className="text-xs text-amber-200">{e.note}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <p className="text-xs text-fg-4">Shipment updates are simulated; in production they arrive from carrier APIs or EDI.</p>
        </div>
      )}
    </Modal>
  )
}

interface Line {
  name: string
  qty: string
  unit: string
  unitPrice: string
}

export function CreatePoModal({ open, state, onClose, onCreate }: { open: boolean; state: ErpState; onClose: () => void; onCreate: (po: PurchaseOrder) => void }) {
  const active = state.vendors.filter((v) => v.status === 'active')
  const [vendorId, setVendorId] = useState(active[0]?.id ?? '')
  const [expected, setExpected] = useState(isoDateFromToday(10))
  const [lines, setLines] = useState<Line[]>([{ name: '', qty: '1', unit: 'pcs', unitPrice: '' }])
  const [error, setError] = useState<string | null>(null)
  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const valid = lines.filter((l) => l.name.trim() && Number(l.qty) > 0 && Number(l.unitPrice) > 0)
    if (!vendorId) return setError('Choose a vendor.')
    if (valid.length === 0) return setError('Add at least one line with a name, quantity and unit price.')
    const id = nextSequentialId(
      state.purchaseOrders.map((p) => p.id),
      'PO-2026-',
      130,
      4,
    )
    onCreate({
      id,
      vendorId,
      items: valid.map((l) => ({ name: l.name.trim(), qty: Number(l.qty), unit: l.unit || 'pcs', unitPrice: Number(l.unitPrice) })),
      total: valid.reduce((s, l) => s + Number(l.qty) * Number(l.unitPrice), 0),
      status: 'draft',
      createdAt: new Date().toISOString(),
      expectedDate: expected,
      shipment: { carrier: 'BlueRiver Logistics', trackingNo: `BR${Date.now().toString().slice(-8)}`, status: 'pending', events: [] },
    })
    setLines([{ name: '', qty: '1', unit: 'pcs', unitPrice: '' }])
    setError(null)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Create purchase order"
      description="New POs start as drafts and need approval before they are sent."
      footer={
        <>
          <span className="mr-auto text-sm text-fg-2">
            Total <span className="font-semibold text-fg tabular-nums">{formatINR(total)}</span>
          </span>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="po-form">
            Create draft PO
          </Button>
        </>
      }
    >
      <form id="po-form" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vendor" htmlFor="po-vendor">
            <Select id="po-vendor" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              {active.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.category}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expected delivery" htmlFor="po-date">
            <Input id="po-date" type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
          </Field>
        </div>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-[13px] font-medium text-fg-2">Line items</legend>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_70px_110px_32px] gap-2">
              <Input controlSize="sm" aria-label={`Item ${i + 1} name`} placeholder="Item description" value={l.name} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <Input controlSize="sm" aria-label={`Item ${i + 1} quantity`} type="number" min={1} value={l.qty} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} />
              <Input controlSize="sm" aria-label={`Item ${i + 1} unit`} value={l.unit} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))} />
              <Input controlSize="sm" aria-label={`Item ${i + 1} unit price`} type="number" min={0} placeholder="₹ / unit" value={l.unitPrice} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, unitPrice: e.target.value } : x)))} />
              <button type="button" aria-label={`Remove item ${i + 1}`} disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="inline-flex items-center justify-center text-fg-4 hover:text-red-300 disabled:opacity-30">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          <Button size="xs" variant="ghost" leftIcon={<Plus className="size-3" />} onClick={() => setLines((ls) => [...ls, { name: '', qty: '1', unit: 'pcs', unitPrice: '' }])}>
            Add line
          </Button>
        </fieldset>
        {error && (
          <p className="text-xs text-red-300" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
