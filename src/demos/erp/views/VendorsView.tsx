import { useState, type FormEvent } from 'react'
import { Building2, PauseCircle, PlayCircle, Plus, Star } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Form'
import { Meter } from '@/components/ui/Meter'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/toast-context'
import type { Vendor } from '@/types/erp'
import { formatINRCompact } from '@/utils/format'
import { uid } from '@/utils/id'
import type { ErpCtx } from '../context'

const CATEGORIES: Vendor['category'][] = ['Raw materials', 'Electronic components', 'Packaging', 'Logistics', 'Office supplies']

export function VendorsView({ state, setState }: ErpCtx) {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const spend = (id: string) => state.purchaseOrders.filter((p) => p.vendorId === id && p.status !== 'cancelled').reduce((s, p) => s + p.total, 0)
  const openCount = (id: string) => state.purchaseOrders.filter((p) => p.vendorId === id && ['draft', 'approved', 'in_transit'].includes(p.status)).length

  const toggle = (v: Vendor) => {
    setState((s) => ({ ...s, vendors: s.vendors.map((x) => (x.id === v.id ? { ...x, status: x.status === 'active' ? 'on_hold' : 'active' } : x)) }))
    toast({ title: `${v.name} ${v.status === 'active' ? 'put on hold' : 'reactivated'}`, tone: v.status === 'active' ? 'warning' : 'success' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Vendors</h2>
          <p className="text-xs text-fg-3">Scorecards combine quality rating, on-time delivery and spend.</p>
        </div>
        <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => setAdding(true)}>
          Add vendor
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {state.vendors.map((v) => (
          <article key={v.id} className="flex flex-col rounded-xl border border-line bg-panel p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink/[0.04] ring-1 ring-ink/[0.07]">
                <Building2 className="size-4 text-fg-3" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-fg">{v.name}</h3>
                <p className="text-xs text-fg-3">
                  {v.category} · {v.city}
                </p>
              </div>
              <Badge tone={v.status === 'active' ? 'green' : 'amber'}>{v.status === 'active' ? 'Active' : 'On hold'}</Badge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-fg-3">Quality rating</dt>
                <dd className="mt-1 flex items-center gap-1 text-fg">
                  <Star className="size-3.5 fill-amber-300 text-amber-300" aria-hidden /> {v.rating.toFixed(1)} / 5
                </dd>
              </div>
              <div>
                <dt className="text-fg-3">Spend (POs)</dt>
                <dd className="mt-1 font-medium text-fg">{formatINRCompact(spend(v.id))}</dd>
              </div>
              <div className="col-span-2">
                <div className="mb-1 flex justify-between">
                  <dt className="text-fg-3">On-time delivery</dt>
                  <dd className="text-fg-2 tabular-nums">{v.onTimeRate}%</dd>
                </div>
                <Meter value={v.onTimeRate} tone={v.onTimeRate < 80 ? 'critical' : v.onTimeRate < 90 ? 'warning' : 'good'} size="xs" label={`${v.name} on-time delivery`} />
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs">
              <span className="text-fg-3">
                {v.contact} · {v.paymentTerms} · {openCount(v.id)} open PO{openCount(v.id) === 1 ? '' : 's'}
              </span>
              <Button size="xs" variant="ghost" leftIcon={v.status === 'active' ? <PauseCircle className="size-3" /> : <PlayCircle className="size-3" />} onClick={() => toggle(v)}>
                {v.status === 'active' ? 'Hold' : 'Reactivate'}
              </Button>
            </div>
          </article>
        ))}
      </div>
      <AddVendorModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreate={(v) => {
          setState((s) => ({ ...s, vendors: [...s.vendors, v] }))
          setAdding(false)
          toast({ title: `${v.name} added`, description: 'Available for new purchase orders.' })
        }}
      />
    </div>
  )
}

function AddVendorModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (v: Vendor) => void }) {
  const [form, setForm] = useState({ name: '', category: CATEGORIES[0] as Vendor['category'], contact: '', email: '', phone: '', city: '', paymentTerms: 'Net 30' as Vendor['paymentTerms'] })
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (form.name.trim().length < 3) return setError('Enter the vendor name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return setError('Enter a valid email address.')
    onCreate({ id: uid('v'), ...form, name: form.name.trim(), email: form.email.trim(), rating: 4, onTimeRate: 90, status: 'active' })
    setForm({ name: '', category: CATEGORIES[0], contact: '', email: '', phone: '', city: '', paymentTerms: 'Net 30' })
    setError(null)
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add vendor"
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="vendor-form">
            Add vendor
          </Button>
        </>
      }
    >
      <form id="vendor-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Vendor name" htmlFor="vn-name" required error={error} className="sm:col-span-2">
          <Input id="vn-name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(error)} />
        </Field>
        <Field label="Category" htmlFor="vn-cat">
          <Select id="vn-cat" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Payment terms" htmlFor="vn-terms">
          <Select id="vn-terms" value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)}>
            <option>Net 15</option>
            <option>Net 30</option>
            <option>Net 45</option>
          </Select>
        </Field>
        <Field label="Contact person" htmlFor="vn-contact">
          <Input id="vn-contact" value={form.contact} onChange={(e) => set('contact', e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="vn-email" required>
          <Input id="vn-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Phone" htmlFor="vn-phone">
          <Input id="vn-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="City" htmlFor="vn-city">
          <Input id="vn-city" value={form.city} onChange={(e) => set('city', e.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}
