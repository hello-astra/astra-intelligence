import { PLAN_BY_ID } from '@/data/mock/saas'
import type { ActivityEvent, BillingCycle, Plan, PlanId, Tenant } from '@/types/saas'
import { uid } from '@/utils/id'

export const PERIOD_DAYS = 30

export function planOf(tenant: Tenant): Plan {
  return PLAN_BY_ID[tenant.plan]
}

/** Effective monthly price (annual billing = 2 months free). */
export function monthlyPrice(plan: Plan, cycle: BillingCycle): number {
  return cycle === 'annual' ? (plan.priceMonthly * 10) / 12 : plan.priceMonthly
}

export function mrrOf(tenant: Tenant): number {
  return monthlyPrice(planOf(tenant), tenant.billingCycle)
}

/** Users occupying a seat (active + invited; suspended users free their seat). */
export function seatsUsed(tenant: Tenant): number {
  return tenant.users.filter((u) => u.status !== 'suspended').length
}

export function periodCalls(tenant: Tenant): number {
  return tenant.dailyCalls.reduce((s, v) => s + v, 0)
}

export function activeUsers(tenant: Tenant): number {
  return tenant.users.filter((u) => u.status === 'active').length
}

export function withActivity(tenant: Tenant, text: string, kind: ActivityEvent['kind'], actor = 'You (demo admin)'): Tenant {
  const event: ActivityEvent = { id: uid('act'), at: new Date().toISOString(), actor, text, kind }
  return { ...tenant, activity: [event, ...tenant.activity].slice(0, 40) }
}

export interface PlanChangeCheck {
  allowed: boolean
  blockers: string[]
  warnings: string[]
  /** Prorated amount for the rest of the current period (positive = charge, negative = credit). */
  proration: number
  daysRemaining: number
}

export function checkPlanChange(tenant: Tenant, target: PlanId, cycle: BillingCycle): PlanChangeCheck {
  const current = planOf(tenant)
  const next = PLAN_BY_ID[target]
  const blockers: string[] = []
  const warnings: string[] = []
  const seats = seatsUsed(tenant)
  if (seats > next.seats) {
    blockers.push(`${seats} seats are in use but ${next.name} includes ${next.seats}. Remove or suspend ${seats - next.seats} user${seats - next.seats === 1 ? '' : 's'} first.`)
  }
  const calls = periodCalls(tenant)
  if (calls > next.apiCalls) {
    warnings.push(`Current usage (${calls.toLocaleString('en-US')} calls) exceeds the ${next.name} quota of ${next.apiCalls.toLocaleString('en-US')} — overage would apply.`)
  }
  if (tenant.storageGb > next.storageGb) {
    warnings.push(`Stored data (${tenant.storageGb} GB) exceeds the ${next.storageGb} GB included in ${next.name}.`)
  }
  const connected = tenant.integrations.filter((i) => i.status !== 'disconnected').length
  if (typeof next.integrations === 'number' && connected > next.integrations) {
    warnings.push(`${connected} integrations are connected; ${next.name} includes ${next.integrations}.`)
  }
  const daysRemaining = Math.max(0, PERIOD_DAYS - tenant.periodDay)
  const fraction = daysRemaining / PERIOD_DAYS
  const proration = (monthlyPrice(next, cycle) - monthlyPrice(current, tenant.billingCycle)) * fraction
  return { allowed: blockers.length === 0, blockers, warnings, proration, daysRemaining }
}

const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

export function generateApiKey(): string {
  let out = 'sk_live_'
  const bytes = new Uint8Array(28)
  crypto.getRandomValues(bytes)
  for (const b of bytes) out += KEY_CHARS[b % KEY_CHARS.length]
  return out
}
