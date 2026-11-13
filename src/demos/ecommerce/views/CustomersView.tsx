import { useMemo, useState } from 'react'
import { Mail, MapPin, Phone, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { Panel } from '@/components/ui/Panel'
import { SearchInput } from '@/components/ui/SearchInput'
import { SortableTH, Table, TBody, TD, TH, THead, TR, type SortDirection } from '@/components/ui/Table'
import { formatDate, formatINR, formatRelative } from '@/utils/format'
import type { CommerceViewProps } from '../context'
import { customerStats, type Segment } from '../logic'
import { OrderStatusBadge } from '../parts'

const SEGMENT_TONE = { VIP: 'violet', Returning: 'blue', New: 'neutral' } as const

export function CustomersView({ state, openOrder }: CommerceViewProps) {
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<Segment | 'all'>('all')
  const [sort, setSort] = useState<{ key: 'spent' | 'orders' | 'name'; dir: SortDirection }>({ key: 'spent', dir: 'desc' })
  const [selected, setSelected] = useState<string | null>(null)
  const stats = useMemo(() => customerStats(state), [state])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.customers
      .filter((c) => (segment === 'all' || stats.get(c.id)?.segment === segment) && (!q || c.name.toLowerCase().includes(q) || c.email.includes(q) || c.city.toLowerCase().includes(q)))
      .sort((a, b) => {
        const sa = stats.get(a.id)
        const sb = stats.get(b.id)
        const cmp = sort.key === 'name' ? a.name.localeCompare(b.name) : (sa?.[sort.key] ?? 0) - (sb?.[sort.key] ?? 0)
        return sort.dir === 'asc' ? cmp : -cmp
      })
  }, [state.customers, stats, query, segment, sort])

  const toggleSort = (key: 'spent' | 'orders' | 'name') => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))
  const customer = state.customers.find((c) => c.id === selected)
  const customerOrders = customer ? state.orders.filter((o) => o.customerId === customer.id) : []
  const counts = { VIP: 0, Returning: 0, New: 0 }
  for (const s of stats.values()) counts[s.segment] += 1

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Customers</h2>
        <p className="text-xs text-fg-3">
          {state.customers.length} customers · {counts.VIP} VIP · {counts.Returning} returning · {counts.New} new
        </p>
      </div>
      <Panel flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Name, email or city" className="w-full sm:w-60" />
          <Select controlSize="sm" value={segment} onChange={(e) => setSegment(e.target.value as Segment | 'all')} aria-label="Filter by segment" wrapperClassName="w-40">
            <option value="all">All segments</option>
            <option value="VIP">VIP</option>
            <option value="Returning">Returning</option>
            <option value="New">New</option>
          </Select>
          <span className="ml-auto text-xs text-fg-3">VIP = ₹40,000+ spent or 6+ orders</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No customers match" />
        ) : (
          <Table minWidth={720}>
            <THead>
              <tr>
                <SortableTH label="Customer" active={sort.key === 'name'} direction={sort.dir} onSort={() => toggleSort('name')} />
                <TH>Location</TH>
                <SortableTH label="Orders" align="right" active={sort.key === 'orders'} direction={sort.dir} onSort={() => toggleSort('orders')} />
                <SortableTH label="Total spent" align="right" active={sort.key === 'spent'} direction={sort.dir} onSort={() => toggleSort('spent')} />
                <TH>Last order</TH>
                <TH>Segment</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((c) => {
                const s = stats.get(c.id)
                return (
                  <TR key={c.id} className="cursor-pointer" onClick={() => setSelected(c.id)}>
                    <TD>
                      <button type="button" className="flex items-center gap-2.5 text-left" aria-label={`View ${c.name}`}>
                        <Avatar name={c.name} size={28} title="" />
                        <span>
                          <span className="block font-medium text-fg">{c.name}</span>
                          <span className="block text-[11px] text-fg-3">{c.email}</span>
                        </span>
                      </button>
                    </TD>
                    <TD>
                      {c.city}, {c.state}
                    </TD>
                    <TD align="right">{s?.orders ?? 0}</TD>
                    <TD align="right" className="font-medium text-fg">
                      {formatINR(s?.spent ?? 0)}
                    </TD>
                    <TD className="text-xs">{s?.lastOrderAt ? formatRelative(s.lastOrderAt) : '—'}</TD>
                    <TD>
                      <Badge tone={SEGMENT_TONE[s?.segment ?? 'New']}>{s?.segment ?? 'New'}</Badge>
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
      </Panel>

      <Modal open={Boolean(customer)} onClose={() => setSelected(null)} variant="drawer" title={customer?.name ?? ''} description={customer ? `Customer since ${formatDate(customer.joinedAt)}` : undefined}>
        {customer && (
          <div className="space-y-5">
            <ul className="space-y-2 text-sm text-fg-2">
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-fg-3" aria-hidden /> {customer.email}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-fg-3" aria-hidden /> {customer.phone}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-fg-3" aria-hidden /> {customer.city}, {customer.state}
              </li>
            </ul>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Orders', String(stats.get(customer.id)?.orders ?? 0)],
                ['Total spent', formatINR(stats.get(customer.id)?.spent ?? 0)],
                ['Segment', stats.get(customer.id)?.segment ?? 'New'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-line p-3">
                  <p className="text-[11px] text-fg-3">{k}</p>
                  <p className="mt-1 text-sm font-semibold text-fg">{v}</p>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Order history</h3>
              <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                {customerOrders.length === 0 && <li className="p-3 text-sm text-fg-3">No orders yet.</li>}
                {customerOrders.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(null)
                        openOrder(o.id)
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.03]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-xs text-fg">{o.id}</span>
                        <span className="block text-[11px] text-fg-3">
                          {formatDate(o.createdAt)} · {o.items.length} item{o.items.length === 1 ? '' : 's'}
                        </span>
                      </span>
                      <span className="text-[13px] text-fg tabular-nums">{formatINR(o.total)}</span>
                      <OrderStatusBadge status={o.status} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
