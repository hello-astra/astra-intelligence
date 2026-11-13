import { useMemo, useState } from 'react'
import { ClipboardList, Plus, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Panel } from '@/components/ui/Panel'
import { SearchInput } from '@/components/ui/SearchInput'
import { Segmented } from '@/components/ui/Segmented'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { useToast } from '@/components/ui/toast-context'
import type { PoStatus } from '@/types/erp'
import { formatDate, formatINRCompact } from '@/utils/format'
import { StatTile } from '../../shared/StatTile'
import type { ErpCtx } from '../context'
import { onTimeDeliveryRate, poHealth, SHIPMENT_LABEL } from '../logic'
import { CreatePoModal } from '../PoModals'

const TABS: (PoStatus | 'all' | 'open')[] = ['open', 'draft', 'approved', 'in_transit', 'delivered', 'cancelled', 'all']
const TAB_LABEL: Record<string, string> = { open: 'Open', draft: 'Drafts', approved: 'Approved', in_transit: 'In transit', delivered: 'Delivered', cancelled: 'Cancelled', all: 'All' }

export function OrdersView({ state, setState, openPo }: ErpCtx) {
  const toast = useToast()
  const [tab, setTab] = useState<(typeof TABS)[number]>('open')
  const [query, setQuery] = useState('')
  const [create, setCreate] = useState(false)

  const vendorName = (id: string) => state.vendors.find((v) => v.id === id)?.name ?? '—'
  const rows = useMemo(() => {
    const name = (id: string) => state.vendors.find((v) => v.id === id)?.name ?? ''
    const q = query.trim().toLowerCase()
    return state.purchaseOrders
      .filter((p) => (tab === 'all' ? true : tab === 'open' ? ['draft', 'approved', 'in_transit'].includes(p.status) : p.status === tab))
      .filter((p) => !q || p.id.toLowerCase().includes(q) || name(p.vendorId).toLowerCase().includes(q) || p.items.some((i) => i.name.toLowerCase().includes(q)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [state.purchaseOrders, state.vendors, tab, query])

  const open = state.purchaseOrders.filter((p) => ['draft', 'approved', 'in_transit'].includes(p.status))
  const late = state.purchaseOrders.filter((p) => poHealth(p) === 'late')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Purchase orders & shipments</h2>
          <p className="text-xs text-fg-3">Procurement from approval to delivery, with live shipment status.</p>
        </div>
        <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => setCreate(true)}>
          Create PO
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Open POs" icon={ClipboardList} value={open.length} hint={`${formatINRCompact(open.reduce((s, p) => s + p.total, 0))} committed`} />
        <StatTile label="In transit" icon={Truck} value={state.purchaseOrders.filter((p) => p.status === 'in_transit').length} hint="Tracked shipments" />
        <StatTile label="Delayed or late" value={late.length} hint={late.map((p) => p.id).join(', ') || 'None'} />
        <StatTile label="On-time delivery" value={`${onTimeDeliveryRate(state).toFixed(0)}%`} hint="Delivered POs in this demo" />
      </div>
      <Panel flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <Segmented size="sm" ariaLabel="Filter purchase orders" value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t, label: TAB_LABEL[t] }))} />
          <SearchInput value={query} onChange={setQuery} placeholder="PO, vendor or item" className="w-full sm:ml-auto sm:w-56" />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No purchase orders here" />
        ) : (
          <Table minWidth={860}>
            <THead>
              <tr>
                <TH>PO</TH>
                <TH>Vendor</TH>
                <TH>Items</TH>
                <TH align="right">Total</TH>
                <TH>Shipment</TH>
                <TH>Expected</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((p) => {
                const health = poHealth(p)
                return (
                  <TR key={p.id} className="cursor-pointer" onClick={() => openPo(p.id)}>
                    <TD>
                      <button type="button" className="font-mono text-xs text-fg" aria-label={`Open ${p.id}`}>
                        {p.id}
                      </button>
                      <span className="block text-[11px] text-fg-4">{formatDate(p.createdAt)}</span>
                    </TD>
                    <TD>{vendorName(p.vendorId)}</TD>
                    <TD className="max-w-[220px] truncate text-xs">{p.items.map((i) => i.name).join(', ')}</TD>
                    <TD align="right" className="font-medium text-fg">
                      {formatINRCompact(p.total)}
                    </TD>
                    <TD>
                      {p.status === 'draft' ? (
                        <Badge>Awaiting approval</Badge>
                      ) : p.status === 'cancelled' ? (
                        <Badge tone="red">Cancelled</Badge>
                      ) : (
                        <Badge tone={p.shipment.status === 'delayed' ? 'red' : p.shipment.status === 'delivered' ? 'green' : 'blue'}>{SHIPMENT_LABEL[p.shipment.status]}</Badge>
                      )}
                    </TD>
                    <TD className={health === 'late' ? 'text-red-300' : health === 'due' ? 'text-amber-200' : undefined}>{formatDate(p.expectedDate)}</TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
      </Panel>
      <CreatePoModal
        open={create}
        state={state}
        onClose={() => setCreate(false)}
        onCreate={(po) => {
          setState((s) => ({ ...s, purchaseOrders: [po, ...s.purchaseOrders] }))
          setCreate(false)
          setTab('draft')
          toast({ title: `${po.id} created as draft`, description: 'Open it to approve and send to the vendor.' })
        }}
      />
    </div>
  )
}
