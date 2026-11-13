import { useState } from 'react'
import { ArrowRight, Check, CreditCard, Download, FlaskConical, TriangleAlert, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Panel } from '@/components/ui/Panel'
import { Segmented } from '@/components/ui/Segmented'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { useToast } from '@/components/ui/toast-context'
import { PLAN_BY_ID, PLANS } from '@/data/mock/saas'
import type { BillingCycle, Plan, PlanId } from '@/types/saas'
import { cn } from '@/utils/cn'
import { addDays, startOfDay } from '@/utils/dates'
import { downloadJSON } from '@/utils/export'
import { formatCompact, formatDate, formatNumber, formatUSD } from '@/utils/format'
import type { SaasViewProps } from '../context'
import { checkPlanChange, monthlyPrice, mrrOf, PERIOD_DAYS, planOf, withActivity } from '../logic'

export function SubscriptionView({ tenant, updateTenant }: SaasViewProps) {
  const toast = useToast()
  const current = planOf(tenant)
  const [target, setTarget] = useState<PlanId | null>(null)
  const renewal = addDays(startOfDay(), PERIOD_DAYS - tenant.periodDay)

  const changeCycle = (cycle: BillingCycle) => {
    if (cycle === tenant.billingCycle) return
    updateTenant((t) => withActivity({ ...t, billingCycle: cycle }, `switched billing to ${cycle}`, 'billing'))
    toast({
      title: `Billing cycle: ${cycle}`,
      description: `MRR is now ${formatUSD(monthlyPrice(current, cycle), 2)} (simulated — no charge made).`,
    })
  }

  const confirmChange = (planId: PlanId) => {
    const check = checkPlanChange(tenant, planId, tenant.billingCycle)
    if (!check.allowed) return
    const next = PLAN_BY_ID[planId]
    const upgrade = next.priceMonthly > current.priceMonthly
    updateTenant((t) => {
      const invoice = {
        id: `INV-${t.id.slice(4, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        date: new Date().toISOString(),
        description: `Plan change: ${current.name} → ${next.name} (prorated ${check.daysRemaining} days)`,
        amount: Number(Math.abs(check.proration).toFixed(2)),
        status: check.proration >= 0 ? ('due' as const) : ('credit' as const),
      }
      return withActivity(
        { ...t, plan: planId, status: 'active', invoices: [invoice, ...t.invoices] },
        `${upgrade ? 'upgraded' : 'downgraded'} the plan from ${current.name} to ${next.name}`,
        'billing',
      )
    })
    setTarget(null)
    toast({
      title: `${upgrade ? 'Upgraded' : 'Downgraded'} to ${next.name}`,
      description: `Seats ${next.seats}, API quota ${formatCompact(next.apiCalls)}/period. Simulated billing — no charge was made.`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Subscription</h2>
          <p className="text-xs text-fg-3">Plans, billing cycle and invoices for {tenant.name}.</p>
        </div>
        <Badge tone="amber" icon={<FlaskConical className="size-3" />}>
          Simulated billing — no charges are made
        </Badge>
      </div>

      <Panel>
        <div className="grid gap-5 md:grid-cols-[1.2fr_1fr_1fr] md:items-center">
          <div>
            <p className="text-xs text-fg-3">Current plan</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-fg">
              {current.name}
              {tenant.status === 'trial' && <Badge tone="amber">Trial</Badge>}
            </p>
            <p className="mt-0.5 text-sm text-fg-2">
              {formatUSD(mrrOf(tenant), 2)} / month
              {tenant.billingCycle === 'annual' && <span className="text-fg-3"> · billed {formatUSD(current.priceMonthly * 10)} yearly</span>}
            </p>
          </div>
          <div>
            <p className="mb-1.5 text-xs text-fg-3">Billing cycle</p>
            <Segmented
              ariaLabel="Billing cycle"
              size="sm"
              value={tenant.billingCycle}
              onChange={changeCycle}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'annual', label: 'Annual · save 17%' },
              ]}
            />
          </div>
          <dl className="grid grid-cols-2 gap-3 text-xs md:grid-cols-1">
            <div>
              <dt className="text-fg-3">Next renewal</dt>
              <dd className="mt-0.5 text-fg-2">{formatDate(renewal)}</dd>
            </div>
            <div>
              <dt className="text-fg-3">Payment method</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-fg-2">
                <CreditCard className="size-3.5" aria-hidden /> Visa •••• 4242 <span className="text-fg-4">(test card)</span>
              </dd>
            </div>
          </dl>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} cycle={tenant.billingCycle} current={plan.id === tenant.plan} currentPrice={current.priceMonthly} onSelect={() => setTarget(plan.id)} />
        ))}
      </div>

      <Panel title="Invoices" description="Generated by the billing integration (simulated)" flush>
        <Table minWidth={620}>
          <THead>
            <tr>
              <TH>Invoice</TH>
              <TH>Date</TH>
              <TH>Description</TH>
              <TH align="right">Amount</TH>
              <TH>Status</TH>
              <TH align="right">
                <span className="sr-only">Download</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {tenant.invoices.map((inv) => (
              <TR key={inv.id}>
                <TD className="font-mono text-xs text-fg">{inv.id}</TD>
                <TD className="text-xs whitespace-nowrap">{formatDate(inv.date)}</TD>
                <TD>{inv.description}</TD>
                <TD align="right" className="text-fg">
                  {inv.status === 'credit' ? '−' : ''}
                  {formatUSD(inv.amount, 2)}
                </TD>
                <TD>
                  <Badge tone={inv.status === 'paid' ? 'green' : inv.status === 'due' ? 'amber' : 'blue'}>
                    {inv.status === 'paid' ? 'Paid' : inv.status === 'due' ? 'Due next invoice' : 'Credit'}
                  </Badge>
                </TD>
                <TD align="right">
                  <Button
                    size="xs"
                    variant="ghost"
                    leftIcon={<Download className="size-3" />}
                    onClick={() => downloadJSON(inv.id, { ...inv, organization: tenant.name, currency: 'USD', note: 'Sample invoice generated by the Astra Console demo.' })}
                  >
                    JSON
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Panel>

      <PlanChangeModal
        planId={target}
        onClose={() => setTarget(null)}
        onConfirm={confirmChange}
        check={target ? checkPlanChange(tenant, target, tenant.billingCycle) : null}
        fromPlan={current}
        cycle={tenant.billingCycle}
      />
    </div>
  )
}

function PlanCard({ plan, cycle, current, currentPrice, onSelect }: { plan: Plan; cycle: BillingCycle; current: boolean; currentPrice: number; onSelect: () => void }) {
  const upgrade = plan.priceMonthly > currentPrice
  return (
    <article className={cn('relative flex flex-col rounded-xl border bg-panel p-4', current ? 'border-brand/60 ring-1 ring-brand/25' : 'border-line')}>
      {plan.id === 'growth' && !current && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-brand-strong px-2 py-0.5 text-[10px] font-semibold text-on-brand">Most popular</span>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">{plan.name}</h3>
        {current && <Badge tone="blue">Current plan</Badge>}
      </div>
      <p className="mt-2">
        <span className="text-2xl font-semibold text-fg">{formatUSD(monthlyPrice(plan, cycle), 0)}</span>
        <span className="text-xs text-fg-3"> / month{cycle === 'annual' ? ', billed yearly' : ''}</span>
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {[
          ['Seats', plan.seats.toString()],
          ['API calls', `${formatCompact(plan.apiCalls)} / period`],
          ['Storage', `${formatNumber(plan.storageGb)} GB`],
          ['Integrations', String(plan.integrations)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-ink/[0.03] px-2.5 py-2">
            <dt className="text-fg-3">{k}</dt>
            <dd className="mt-0.5 font-medium text-fg">{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-4 flex-1 space-y-1.5">
        {[...plan.features, plan.support].map((f) => (
          <li key={f} className="flex gap-2 text-xs text-fg-2">
            <Check className="mt-px size-3.5 shrink-0 text-emerald-400" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <Button className="mt-5 w-full" size="sm" variant={current ? 'secondary' : upgrade ? 'primary' : 'outline'} disabled={current} onClick={onSelect}>
        {current ? 'Current plan' : upgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
      </Button>
    </article>
  )
}

function PlanChangeModal({
  planId,
  onClose,
  onConfirm,
  check,
  fromPlan,
  cycle,
}: {
  planId: PlanId | null
  onClose: () => void
  onConfirm: (planId: PlanId) => void
  check: ReturnType<typeof checkPlanChange> | null
  fromPlan: Plan
  cycle: BillingCycle
}) {
  const next = planId ? PLAN_BY_ID[planId] : null
  return (
    <Modal
      open={planId !== null}
      onClose={onClose}
      title={next ? `Change plan to ${next.name}` : 'Change plan'}
      description="Review the impact before confirming. This is a simulation — no payment is taken."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!check?.allowed} onClick={() => planId && onConfirm(planId)} rightIcon={<ArrowRight className="size-3.5" />}>
            Confirm change
          </Button>
        </>
      }
    >
      {next && check && (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-ink/[0.03] p-3">
            <div>
              <p className="text-xs text-fg-3">From</p>
              <p className="font-medium text-fg">{fromPlan.name}</p>
              <p className="text-xs text-fg-3">{formatUSD(monthlyPrice(fromPlan, cycle), 2)}/mo</p>
            </div>
            <ArrowRight className="size-4 text-fg-3" aria-hidden />
            <div>
              <p className="text-xs text-fg-3">To</p>
              <p className="font-medium text-fg">{next.name}</p>
              <p className="text-xs text-fg-3">{formatUSD(monthlyPrice(next, cycle), 2)}/mo</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <span className="text-fg-2">Prorated for the remaining {check.daysRemaining} days</span>
            <span className={cn('font-semibold tabular-nums', check.proration >= 0 ? 'text-fg' : 'text-emerald-300')}>
              {check.proration >= 0 ? formatUSD(check.proration, 2) : `−${formatUSD(Math.abs(check.proration), 2)} credit`}
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-2 text-xs text-fg-2">
            <li>Seats: {fromPlan.seats} → <span className="text-fg">{next.seats}</span></li>
            <li>API calls: {formatCompact(fromPlan.apiCalls)} → <span className="text-fg">{formatCompact(next.apiCalls)}</span></li>
            <li>Storage: {formatNumber(fromPlan.storageGb)} GB → <span className="text-fg">{formatNumber(next.storageGb)} GB</span></li>
            <li>Integrations: {String(fromPlan.integrations)} → <span className="text-fg">{String(next.integrations)}</span></li>
          </ul>
          {check.blockers.map((b) => (
            <p key={b} className="flex gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-200">
              <XCircle className="size-4 shrink-0" aria-hidden /> {b}
            </p>
          ))}
          {check.warnings.map((w) => (
            <p key={w} className="flex gap-2 rounded-lg bg-amber-400/10 p-3 text-xs text-amber-100">
              <TriangleAlert className="size-4 shrink-0" aria-hidden /> {w}
            </p>
          ))}
        </div>
      )}
    </Modal>
  )
}
