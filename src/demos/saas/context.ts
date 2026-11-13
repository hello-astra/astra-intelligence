import type { SaasState, Tenant } from '@/types/saas'

export type SaasView = 'overview' | 'organizations' | 'users' | 'subscription' | 'usage' | 'integrations'

export interface SaasViewProps {
  state: SaasState
  tenant: Tenant
  updateTenant: (fn: (tenant: Tenant) => Tenant) => void
  switchTenant: (id: string) => void
  addTenant: (tenant: Tenant) => void
  goTo: (view: SaasView, intent?: string) => void
  intent: string | null
  clearIntent: () => void
}
