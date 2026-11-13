import { useCallback, useState } from 'react'
import { BarChart3, Building2, ChevronsUpDown, CreditCard, LayoutDashboard, Plug, Users } from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import { useToast } from '@/components/ui/toast-context'
import { createInitialSaasState, PLAN_BY_ID } from '@/data/mock/saas'
import { SOLUTION_BY_SLUG } from '@/data/constants/solutions'
import { usePersistentState } from '@/hooks/usePersistentState'
import type { Tenant } from '@/types/saas'
import { DemoShell } from '../shared/DemoShell'
import type { DemoView } from '../shared/demo-context'
import type { SaasView, SaasViewProps } from './context'
import { seatsUsed } from './logic'
import { TenantMark } from './TenantMark'
import { IntegrationsView } from './views/IntegrationsView'
import { OrganizationsView } from './views/OrganizationsView'
import { OverviewView } from './views/OverviewView'
import { SubscriptionView } from './views/SubscriptionView'
import { UsageView } from './views/UsageView'
import { UsersView } from './views/UsersView'

const solution = SOLUTION_BY_SLUG['saas-development']

export default function SaasDemo() {
  const toast = useToast()
  const [state, setState, reset] = usePersistentState('saas', createInitialSaasState, 1)
  const [view, setView] = useState<SaasView>('overview')
  const [intent, setIntent] = useState<string | null>(null)

  const tenant = state.tenants.find((t) => t.id === state.activeTenantId) ?? state.tenants[0]

  const updateTenant = useCallback(
    (fn: (t: Tenant) => Tenant) =>
      setState((s) => ({ ...s, tenants: s.tenants.map((t) => (t.id === s.activeTenantId ? fn(t) : t)) })),
    [setState],
  )

  const switchTenant = (id: string) => {
    const next = state.tenants.find((t) => t.id === id)
    if (!next || id === state.activeTenantId) return
    setState((s) => ({ ...s, activeTenantId: id }))
    toast({ title: `Switched to ${next.name}`, description: `${PLAN_BY_ID[next.plan].name} plan · ${next.region}`, tone: 'info' })
  }

  const addTenant = (t: Tenant) => setState((s) => ({ activeTenantId: t.id, tenants: [...s.tenants, t] }))

  const goTo = (v: SaasView, nextIntent?: string) => {
    setIntent(nextIntent ?? null)
    setView(v)
  }

  const views: DemoView<SaasView>[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'organizations', label: 'Organizations', icon: Building2, badge: state.tenants.length },
    { id: 'users', label: 'Users & roles', icon: Users, badge: seatsUsed(tenant) },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'usage', label: 'Usage', icon: BarChart3 },
    { id: 'integrations', label: 'API & integrations', icon: Plug },
  ]

  const props: SaasViewProps = {
    state,
    tenant,
    updateTenant,
    switchTenant,
    addTenant,
    goTo,
    intent,
    clearIntent: () => setIntent(null),
  }

  return (
    <DemoShell
      solution={solution}
      views={views}
      activeView={view}
      onViewChange={(v) => goTo(v)}
      onReset={() => {
        reset()
        goTo('overview')
      }}
      toolbar={
        <Dropdown
          ariaLabel="Switch organization"
          align="end"
          buttonClassName="flex h-8 w-full items-center gap-2 rounded-lg bg-ink/[0.05] pr-2 pl-1 text-left ring-1 ring-ink/[0.08] transition-colors hover:bg-ink/[0.08] sm:w-auto"
          buttonContent={
            <>
              <TenantMark tenant={tenant} size={24} />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg sm:max-w-[160px]">{tenant.name}</span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-fg-3" aria-hidden />
            </>
          }
          header={<p className="text-[11px] font-medium tracking-wide text-fg-3 uppercase">Organizations</p>}
          items={state.tenants.map((t) => ({
            id: t.id,
            label: t.name,
            description: `${PLAN_BY_ID[t.plan].name} plan · ${seatsUsed(t)} users`,
            icon: <TenantMark tenant={t} size={26} />,
            active: t.id === tenant.id,
            onSelect: () => switchTenant(t.id),
          }))}
          footer={
            <button
              type="button"
              onClick={() => goTo('organizations', 'create')}
              className="w-full rounded-lg px-2.5 py-2 text-left text-[13px] text-brand-soft hover:bg-ink/[0.06]"
            >
              + Create organization
            </button>
          }
        />
      }
    >
      {view === 'overview' && <OverviewView {...props} />}
      {view === 'organizations' && <OrganizationsView {...props} />}
      {view === 'users' && <UsersView {...props} />}
      {view === 'subscription' && <SubscriptionView {...props} />}
      {view === 'usage' && <UsageView {...props} />}
      {view === 'integrations' && <IntegrationsView {...props} />}
    </DemoShell>
  )
}
