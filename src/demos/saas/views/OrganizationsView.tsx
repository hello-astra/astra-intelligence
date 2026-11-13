import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRightLeft, Building2, CheckCircle2, Plus } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Form'
import { Meter } from '@/components/ui/Meter'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/toast-context'
import { INDUSTRIES, PLAN_BY_ID, PLANS, REGIONS, TENANT_COLORS } from '@/data/mock/saas'
import type { PlanId, Tenant } from '@/types/saas'
import { cn } from '@/utils/cn'
import { formatCompact, formatDate, formatUSD } from '@/utils/format'
import { ChartFrame } from '../../shared/Chart'
import { BAR_SIZE } from '../../shared/chartTheme'
import { useChartTheme } from '../../shared/demo-theme'
import { StatTile } from '../../shared/StatTile'
import { tooltipRenderer } from '../../shared/tooltip'
import type { SaasViewProps } from '../context'
import { mrrOf, periodCalls, seatsUsed } from '../logic'
import { TenantMark } from '../TenantMark'

export function OrganizationsView({ state, tenant: active, switchTenant, addTenant, intent, clearIntent }: SaasViewProps) {
  const { axisProps, barCursor, gridProps, SERIES, animate } = useChartTheme()
  const toast = useToast()
  // Opens straight away when arriving from the overview's "New organization" quick action.
  const [createOpen, setCreateOpen] = useState(() => intent === 'create')

  useEffect(() => {
    if (intent === 'create') clearIntent()
  }, [intent, clearIntent])

  const totalMrr = state.tenants.reduce((s, t) => s + mrrOf(t), 0)
  const totalSeats = state.tenants.reduce((s, t) => s + seatsUsed(t), 0)
  const totalCalls = state.tenants.reduce((s, t) => s + periodCalls(t), 0)
  const mrrRows = [...state.tenants].sort((a, b) => mrrOf(b) - mrrOf(a)).map((t) => ({ name: t.name, mrr: Number(mrrOf(t).toFixed(2)) }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Organizations</h2>
          <p className="text-xs text-fg-3">Platform view — every tenant runs in an isolated workspace on shared infrastructure.</p>
        </div>
        <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => setCreateOpen(true)}>
          Create organization
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Organizations" value={state.tenants.length} icon={Building2} hint={`${state.tenants.filter((t) => t.status === 'trial').length} on trial`} />
        <StatTile label="Platform MRR" value={formatUSD(totalMrr, 2)} hint="Sum across all tenants" />
        <StatTile label="Seats in use" value={totalSeats} hint="Active + invited users" />
        <StatTile label="API calls · 30 days" value={formatCompact(totalCalls)} hint="All tenants combined" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {state.tenants.map((t) => (
          <TenantCard key={t.id} tenant={t} current={t.id === active.id} onSwitch={() => switchTenant(t.id)} />
        ))}
      </div>

      <ChartFrame
        title="MRR by organization"
        description="Monthly recurring revenue, USD (annual plans normalized per month)"
        height={Math.max(150, mrrRows.length * 44 + 30)}
        table={{
          columns: [
            { key: 'name', label: 'Organization' },
            { key: 'mrr', label: 'MRR', align: 'right', format: (v) => formatUSD(Number(v), 2) },
          ],
          rows: mrrRows,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mrrRows} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
            <CartesianGrid {...gridProps} horizontal={false} vertical />
            <XAxis type="number" {...axisProps} tickFormatter={(v: number) => formatUSD(v)} />
            <YAxis type="category" dataKey="name" {...axisProps} axisLine={false} width={130} />
            <Tooltip content={tooltipRenderer((v) => formatUSD(v, 2))} cursor={barCursor} />
            <Bar isAnimationActive={animate} dataKey="mrr" name="MRR" fill={SERIES[0]} radius={[0, 4, 4, 0]} maxBarSize={BAR_SIZE} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <CreateOrganizationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        existingNames={state.tenants.map((t) => t.name.toLowerCase())}
        colorIndex={state.tenants.length}
        onCreate={(t) => {
          addTenant(t)
          setCreateOpen(false)
          toast({ title: `${t.name} created`, description: 'Workspace provisioned (simulated) and set as the active organization.' })
        }}
      />
    </div>
  )
}

function TenantCard({ tenant, current, onSwitch }: { tenant: Tenant; current: boolean; onSwitch: () => void }) {
  const plan = PLAN_BY_ID[tenant.plan]
  const calls = periodCalls(tenant)
  const seats = seatsUsed(tenant)
  return (
    <article className={cn('flex flex-col rounded-xl border bg-panel p-4', current ? 'border-brand/50 ring-1 ring-brand/20' : 'border-line')}>
      <div className="flex items-start gap-3">
        <TenantMark tenant={tenant} size={36} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-fg">{tenant.name}</h3>
          <p className="truncate text-xs text-fg-3">
            {tenant.industry} · {tenant.domain}
          </p>
        </div>
        <Badge tone={tenant.plan === 'enterprise' ? 'violet' : tenant.plan === 'growth' ? 'blue' : 'neutral'}>{plan.name}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        <div>
          <dt className="text-fg-3">Seats</dt>
          <dd className="mt-1">
            <Meter value={seats} max={plan.seats} tone="auto" size="xs" label="Seats used" />
            <span className="mt-1 block text-fg-2 tabular-nums">
              {seats} / {plan.seats}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-fg-3">API quota</dt>
          <dd className="mt-1">
            <Meter value={calls} max={plan.apiCalls} tone="auto" size="xs" label="API quota used" />
            <span className="mt-1 block text-fg-2 tabular-nums">{Math.round((calls / plan.apiCalls) * 100)}%</span>
          </dd>
        </div>
        <div>
          <dt className="text-fg-3">MRR</dt>
          <dd className="mt-0.5 font-medium text-fg">{formatUSD(mrrOf(tenant), 2)}</dd>
        </div>
        <div>
          <dt className="text-fg-3">Region</dt>
          <dd className="mt-0.5 truncate text-fg-2">{tenant.region}</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="text-[11px] text-fg-4">Since {formatDate(tenant.createdAt)}</span>
        {current ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="size-3.5" aria-hidden /> Current workspace
          </span>
        ) : (
          <Button size="xs" variant="secondary" leftIcon={<ArrowRightLeft className="size-3" />} onClick={onSwitch}>
            Switch to workspace
          </Button>
        )}
      </div>
    </article>
  )
}

function CreateOrganizationModal({
  open,
  onClose,
  onCreate,
  existingNames,
  colorIndex,
}: {
  open: boolean
  onClose: () => void
  onCreate: (tenant: Tenant) => void
  existingNames: string[]
  colorIndex: number
}) {
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState(INDUSTRIES[0])
  const [region, setRegion] = useState(REGIONS[0])
  const [plan, setPlan] = useState<PlanId>('starter')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) return setError('Enter an organization name (at least 2 characters).')
    if (existingNames.includes(trimmed.toLowerCase())) return setError('An organization with this name already exists.')
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const now = new Date().toISOString()
    const tenant: Tenant = {
      id: `tnt_${slug.slice(0, 18)}_${Date.now().toString(36).slice(-4)}`,
      name: trimmed,
      domain: `${slug}.example`,
      industry,
      region,
      color: TENANT_COLORS[colorIndex % TENANT_COLORS.length],
      createdAt: now,
      status: 'trial',
      plan,
      billingCycle: 'monthly',
      periodDay: 0,
      users: [{ id: `usr_${Date.now()}`, name: 'You (demo admin)', email: `admin@${slug}.example`, role: 'Owner', status: 'active', lastActiveAt: now, mfa: true }],
      dailyCalls: [...Array(28).fill(0), 120, 340],
      storageGb: 0.2,
      endpoints: [
        { method: 'GET', path: '/v1/orders', share: 0.5, p95Ms: 110, errorRate: 0 },
        { method: 'POST', path: '/v1/events', share: 0.5, p95Ms: 150, errorRate: 0 },
      ],
      integrations: [],
      apiKeys: [],
      invoices: [{ id: `INV-${slug.slice(0, 2).toUpperCase()}-0001`, date: now, description: `${PLAN_BY_ID[plan].name} plan — 14-day trial`, amount: 0, status: 'paid' }],
      activity: [{ id: `act_${Date.now()}`, at: now, actor: 'You (demo admin)', text: `created the organization on the ${PLAN_BY_ID[plan].name} plan`, kind: 'workspace' }],
    }
    onCreate(tenant)
    setName('')
    setError(null)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create organization"
      description="Provision a new isolated tenant workspace (simulated)."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="create-org-form">
            Create organization
          </Button>
        </>
      }
    >
      <form id="create-org-form" onSubmit={submit} className="grid gap-4" noValidate>
        <Field label="Organization name" htmlFor="org-name" error={error} required>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            placeholder="e.g. Orbit Health"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'org-name-error' : undefined}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Industry" htmlFor="org-industry">
            <Select id="org-industry" value={industry} onChange={(e) => setIndustry(e.target.value)}>
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </Select>
          </Field>
          <Field label="Data region" htmlFor="org-region">
            <Select id="org-region" value={region} onChange={(e) => setRegion(e.target.value)}>
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Plan" htmlFor="org-plan" hint="New organizations start with a 14-day trial.">
          <Select id="org-plan" value={plan} onChange={(e) => setPlan(e.target.value as PlanId)} aria-describedby="org-plan-hint">
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatUSD(p.priceMonthly)}/month · {p.seats} seats
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  )
}
