export type PlanId = 'starter' | 'growth' | 'enterprise'
export type Role = 'Owner' | 'Admin' | 'Developer' | 'Analyst' | 'Viewer'
export type UserStatus = 'active' | 'invited' | 'suspended'
export type BillingCycle = 'monthly' | 'annual'
export type IntegrationStatus = 'operational' | 'degraded' | 'down' | 'disconnected'

export interface Plan {
  id: PlanId
  name: string
  /** USD per month on monthly billing. */
  priceMonthly: number
  seats: number
  /** API calls per 30-day billing period. */
  apiCalls: number
  storageGb: number
  integrations: number | 'Unlimited'
  support: string
  features: string[]
}

export interface TenantUser {
  id: string
  name: string
  email: string
  role: Role
  status: UserStatus
  lastActiveAt: string | null
  mfa: boolean
}

export interface Integration {
  id: string
  name: string
  category: 'Payments' | 'Messaging' | 'CRM' | 'Storage' | 'Automation' | 'Analytics'
  description: string
  status: IntegrationStatus
  latencyMs: number
  lastCheckedAt: string
  events24h: number
}

export interface ApiKey {
  id: string
  label: string
  prefix: string
  last4: string
  scopes: string[]
  createdAt: string
  lastUsedAt: string | null
  revoked: boolean
}

export interface Invoice {
  id: string
  date: string
  description: string
  amount: number
  status: 'paid' | 'due' | 'credit'
}

export interface ActivityEvent {
  id: string
  at: string
  actor: string
  text: string
  kind: 'user' | 'billing' | 'integration' | 'security' | 'workspace'
}

export interface EndpointUsage {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  share: number
  p95Ms: number
  errorRate: number
}

export interface Tenant {
  id: string
  name: string
  domain: string
  industry: string
  region: string
  color: string
  createdAt: string
  status: 'active' | 'trial'
  plan: PlanId
  billingCycle: BillingCycle
  /** Day index (0-29) within the 30-day billing period. */
  periodDay: number
  users: TenantUser[]
  /** API calls per day for the last 30 days (oldest first). */
  dailyCalls: number[]
  storageGb: number
  endpoints: EndpointUsage[]
  integrations: Integration[]
  apiKeys: ApiKey[]
  invoices: Invoice[]
  activity: ActivityEvent[]
}

export interface SaasState {
  activeTenantId: string
  tenants: Tenant[]
}
