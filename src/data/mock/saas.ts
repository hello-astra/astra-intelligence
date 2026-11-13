import type { EndpointUsage, Integration, Plan, PlanId, Role, SaasState, Tenant, TenantUser, UserStatus } from '@/types/saas'
import { addDays, daysAgoISO, hoursAgo, minutesAgo, startOfDay } from '@/utils/dates'
import { createRng, gaussian } from '@/utils/random'

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 49,
    seats: 5,
    apiCalls: 100_000,
    storageGb: 10,
    integrations: 2,
    support: 'Email support',
    features: ['Core product features', 'Basic usage analytics', 'Community knowledge base'],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceMonthly: 199,
    seats: 25,
    apiCalls: 1_000_000,
    storageGb: 100,
    integrations: 10,
    support: 'Priority email support',
    features: ['Everything in Starter', 'SSO (SAML / OIDC)', 'Audit log — 30 days', 'Advanced analytics'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 799,
    seats: 100,
    apiCalls: 10_000_000,
    storageGb: 1000,
    integrations: 'Unlimited',
    support: 'Dedicated success manager',
    features: ['Everything in Growth', 'Dedicated tenant database', '99.9% uptime SLA', 'Audit log — 1 year'],
  },
]

export const PLAN_BY_ID: Record<PlanId, Plan> = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>

export const ROLES: Role[] = ['Owner', 'Admin', 'Developer', 'Analyst', 'Viewer']

export const PERMISSIONS: { label: string; roles: Role[] }[] = [
  { label: 'Manage billing & plan', roles: ['Owner'] },
  { label: 'Invite & manage users', roles: ['Owner', 'Admin'] },
  { label: 'Configure integrations', roles: ['Owner', 'Admin'] },
  { label: 'Create API keys', roles: ['Owner', 'Admin', 'Developer'] },
  { label: 'Edit workspace data', roles: ['Owner', 'Admin', 'Developer'] },
  { label: 'View analytics & reports', roles: ['Owner', 'Admin', 'Developer', 'Analyst'] },
  { label: 'Read-only access', roles: ['Owner', 'Admin', 'Developer', 'Analyst', 'Viewer'] },
]

type UserSeed = [name: string, role: Role, status?: UserStatus]

function makeUsers(seed: number, domain: string, list: UserSeed[]): TenantUser[] {
  const rng = createRng(seed)
  return list.map(([name, role, status = 'active'], i) => {
    const [first, ...rest] = name.toLowerCase().replace(/[^a-z ]/g, '').split(' ')
    const email = `${first}.${rest[rest.length - 1] ?? 'user'}@${domain}`
    const minutes = status === 'active' ? Math.round(5 + rng() * 60 * 24 * (i < 4 ? 1 : 6)) : 0
    return {
      id: `usr_${seed}_${i}`,
      name,
      email,
      role,
      status,
      lastActiveAt: status === 'invited' ? null : minutesAgo(status === 'suspended' ? 60 * 24 * 19 : minutes),
      mfa: role === 'Owner' || role === 'Admin' || rng() > 0.45,
    }
  })
}

function makeDailyCalls(seed: number, base: number, growth: number, noise = 0.08): number[] {
  const rng = createRng(seed)
  const today = startOfDay()
  return Array.from({ length: 30 }, (_, i) => {
    const date = addDays(today, i - 29)
    const day = date.getDay()
    const weekly = day === 0 ? 0.62 : day === 6 ? 0.74 : 1 + (day === 2 || day === 3 ? 0.06 : 0)
    const trend = 1 + growth * (i / 29)
    return Math.max(0, Math.round(base * weekly * trend * (1 + gaussian(rng) * noise)))
  })
}

const ENDPOINTS: Omit<EndpointUsage, 'p95Ms' | 'errorRate'>[] = [
  { method: 'GET', path: '/v1/orders', share: 0.31 },
  { method: 'POST', path: '/v1/orders', share: 0.17 },
  { method: 'GET', path: '/v1/customers', share: 0.16 },
  { method: 'GET', path: '/v1/products', share: 0.15 },
  { method: 'POST', path: '/v1/events', share: 0.13 },
  { method: 'GET', path: '/v1/reports/usage', share: 0.08 },
]

function makeEndpoints(seed: number, latencyBase: number): EndpointUsage[] {
  const rng = createRng(seed)
  return ENDPOINTS.map((e, i) => ({
    ...e,
    p95Ms: Math.round(latencyBase * (0.7 + rng() * 0.9) + (e.method === 'POST' ? 60 : 0) + (i === 5 ? 240 : 0)),
    errorRate: Number((rng() * (i === 1 ? 1.6 : 0.6)).toFixed(2)),
  }))
}

function integration(id: string, name: string, category: Integration['category'], description: string, status: Integration['status'], latencyMs: number, events24h: number): Integration {
  return { id, name, category, description, status, latencyMs, events24h, lastCheckedAt: minutesAgo(3 + (latencyMs % 40)) }
}

export function createInitialSaasState(): SaasState {
  const acme: Tenant = {
    id: 'tnt_acme',
    name: 'Acme Technologies',
    domain: 'acme.tech',
    industry: 'Software & IT services',
    region: 'ap-south-1 · Mumbai',
    color: '#4f86ff',
    createdAt: daysAgoISO(412),
    status: 'active',
    plan: 'growth',
    billingCycle: 'monthly',
    periodDay: 18,
    users: makeUsers(11, 'acme.tech', [
      ['Aarav Mehta', 'Owner'],
      ['Sara Thomas', 'Admin'],
      ['Rohan Gupta', 'Developer'],
      ['Emily Chen', 'Developer'],
      ['Karthik Iyer', 'Developer'],
      ['Neha Kapoor', 'Analyst'],
      ['Daniel Brooks', 'Analyst'],
      ['Fatima Khan', 'Viewer'],
      ['Vikram Rao', 'Developer'],
      ['Ananya Desai', 'Admin'],
      ["Liam O'Connor", 'Developer'],
      ['Priya Nair', 'Analyst'],
      ['Arjun Malhotra', 'Viewer'],
      ['Meera Joshi', 'Developer'],
      ['Rahul Verma', 'Developer'],
      ['Zoe Williams', 'Viewer'],
      ['Ishaan Sethi', 'Developer', 'invited'],
      ['Kavya Reddy', 'Analyst', 'suspended'],
    ]),
    dailyCalls: makeDailyCalls(21, 21_500, 0.22),
    storageGb: 46.2,
    endpoints: makeEndpoints(31, 120),
    integrations: [
      integration('int_stripe', 'Stripe Billing', 'Payments', 'Subscription charges and invoices', 'operational', 182, 1_284),
      integration('int_slack', 'Slack Notifications', 'Messaging', 'Alerts to #ops and #sales channels', 'operational', 96, 412),
      integration('int_hubspot', 'HubSpot CRM', 'CRM', 'Contact and deal sync every 15 minutes', 'degraded', 842, 3_920),
      integration('int_s3', 'Amazon S3 Storage', 'Storage', 'Document and export storage', 'operational', 64, 7_118),
      integration('int_n8n', 'n8n Workflows', 'Automation', 'Onboarding and renewal workflows', 'operational', 211, 268),
    ],
    apiKeys: [
      { id: 'key_1', label: 'Production backend', prefix: 'sk_live_7Hq2', last4: 'f9A1', scopes: ['read', 'write'], createdAt: daysAgoISO(160), lastUsedAt: minutesAgo(2), revoked: false },
      { id: 'key_2', label: 'Analytics export job', prefix: 'sk_live_Lm81', last4: '0cZe', scopes: ['read'], createdAt: daysAgoISO(64), lastUsedAt: hoursAgo(6), revoked: false },
      { id: 'key_3', label: 'Legacy integration', prefix: 'sk_live_Qw0p', last4: 'kk27', scopes: ['read', 'write'], createdAt: daysAgoISO(390), lastUsedAt: daysAgoISO(48), revoked: true },
    ],
    invoices: [
      { id: 'INV-AC-2611', date: daysAgoISO(18), description: 'Growth plan — monthly', amount: 199, status: 'paid' },
      { id: 'INV-AC-2610', date: daysAgoISO(48), description: 'Growth plan — monthly', amount: 199, status: 'paid' },
      { id: 'INV-AC-2609', date: daysAgoISO(78), description: 'Growth plan — monthly', amount: 199, status: 'paid' },
    ],
    activity: [
      { id: 'act_1', at: minutesAgo(14), actor: 'Sara Thomas', text: 'invited Ishaan Sethi as Developer', kind: 'user' },
      { id: 'act_2', at: hoursAgo(3), actor: 'System', text: 'HubSpot CRM sync latency above 800 ms', kind: 'integration' },
      { id: 'act_3', at: hoursAgo(9), actor: 'Rohan Gupta', text: 'updated scopes on API key “Analytics export job”', kind: 'security' },
      { id: 'act_4', at: daysAgoISO(2), actor: 'Aarav Mehta', text: 'suspended Kavya Reddy', kind: 'user' },
      { id: 'act_5', at: daysAgoISO(18), actor: 'System', text: 'Invoice INV-AC-2611 paid ($199.00)', kind: 'billing' },
    ],
  }

  const nova: Tenant = {
    id: 'tnt_nova',
    name: 'Nova Retail',
    domain: 'novaretail.com',
    industry: 'Retail & e-commerce',
    region: 'ap-southeast-1 · Singapore',
    color: '#22d3ee',
    createdAt: daysAgoISO(690),
    status: 'active',
    plan: 'enterprise',
    billingCycle: 'annual',
    periodDay: 9,
    users: makeUsers(12, 'novaretail.com', [
      ['Divya Menon', 'Owner'],
      ['Marcus Lee', 'Admin'],
      ['Sneha Pillai', 'Admin'],
      ['Aditya Kulkarni', 'Developer'],
      ['Hannah Schmidt', 'Analyst'],
      ['Farhan Ali', 'Developer'],
      ['Pooja Shah', 'Analyst'],
      ['Nikhil Bansal', 'Developer'],
      ['Grace Kim', 'Viewer'],
      ['Siddharth Jain', 'Analyst'],
      ['Tanvi Mishra', 'Viewer'],
      ['Omar Hassan', 'Developer'],
      ['Riya Chatterjee', 'Analyst', 'invited'],
      ['Kunal Shetty', 'Viewer'],
    ]),
    dailyCalls: makeDailyCalls(22, 128_000, 0.12),
    storageGb: 382.5,
    endpoints: makeEndpoints(32, 95),
    integrations: [
      integration('int_razorpay', 'Razorpay Payments', 'Payments', 'Checkout payments and refunds', 'operational', 158, 18_422),
      integration('int_whatsapp', 'WhatsApp Business', 'Messaging', 'Order and delivery notifications', 'operational', 233, 9_806),
      integration('int_salesforce', 'Salesforce CRM', 'CRM', 'B2B accounts and opportunities', 'operational', 305, 2_114),
      integration('int_s3n', 'Amazon S3 Storage', 'Storage', 'Product media and exports', 'operational', 58, 24_390),
      integration('int_bq', 'Google BigQuery', 'Analytics', 'Nightly warehouse export', 'down', 0, 0),
    ],
    apiKeys: [
      { id: 'key_4', label: 'Storefront API', prefix: 'sk_live_Nv44', last4: '9xQa', scopes: ['read', 'write'], createdAt: daysAgoISO(300), lastUsedAt: minutesAgo(1), revoked: false },
      { id: 'key_5', label: 'Warehouse sync', prefix: 'sk_live_Wh09', last4: 'Pz3m', scopes: ['read', 'write'], createdAt: daysAgoISO(120), lastUsedAt: minutesAgo(26), revoked: false },
    ],
    invoices: [
      { id: 'INV-NR-2601', date: daysAgoISO(9), description: 'Enterprise plan — annual', amount: 7990, status: 'paid' },
      { id: 'INV-NR-2501', date: daysAgoISO(374), description: 'Enterprise plan — annual', amount: 7990, status: 'paid' },
    ],
    activity: [
      { id: 'act_6', at: minutesAgo(40), actor: 'System', text: 'Google BigQuery export failed — connection refused', kind: 'integration' },
      { id: 'act_7', at: hoursAgo(5), actor: 'Marcus Lee', text: 'invited Riya Chatterjee as Analyst', kind: 'user' },
      { id: 'act_8', at: daysAgoISO(1), actor: 'Divya Menon', text: 'enabled SSO enforcement for all users', kind: 'security' },
      { id: 'act_9', at: daysAgoISO(9), actor: 'System', text: 'Invoice INV-NR-2601 paid ($7,990.00)', kind: 'billing' },
    ],
  }

  const vertex: Tenant = {
    id: 'tnt_vertex',
    name: 'Vertex Solutions',
    domain: 'vertexsolutions.co',
    industry: 'Professional services',
    region: 'eu-west-2 · London',
    color: '#8b74ff',
    createdAt: daysAgoISO(96),
    status: 'active',
    plan: 'starter',
    billingCycle: 'monthly',
    periodDay: 24,
    users: makeUsers(13, 'vertexsolutions.co', [
      ['James Carter', 'Owner'],
      ['Lakshmi Raman', 'Admin'],
      ['Tom Fischer', 'Analyst'],
      ['Ayesha Siddiqui', 'Viewer'],
      ['Varun Bhatt', 'Developer', 'invited'],
    ]),
    dailyCalls: makeDailyCalls(23, 2_900, 0.35, 0.1),
    storageGb: 7.8,
    endpoints: makeEndpoints(33, 140),
    integrations: [
      integration('int_stripe_v', 'Stripe Billing', 'Payments', 'Client retainer invoices', 'operational', 204, 64),
      integration('int_slack_v', 'Slack Notifications', 'Messaging', 'Project alerts', 'operational', 118, 51),
      integration('int_gdrive', 'Google Drive', 'Storage', 'Client document sync', 'disconnected', 0, 0),
    ],
    apiKeys: [
      { id: 'key_6', label: 'Client portal', prefix: 'sk_live_Vx12', last4: 'aa90', scopes: ['read'], createdAt: daysAgoISO(80), lastUsedAt: hoursAgo(2), revoked: false },
    ],
    invoices: [
      { id: 'INV-VS-2603', date: daysAgoISO(24), description: 'Starter plan — monthly', amount: 49, status: 'paid' },
      { id: 'INV-VS-2602', date: daysAgoISO(54), description: 'Starter plan — monthly', amount: 49, status: 'paid' },
    ],
    activity: [
      { id: 'act_10', at: hoursAgo(1), actor: 'System', text: 'API usage reached 90% of the Starter plan quota', kind: 'billing' },
      { id: 'act_11', at: daysAgoISO(3), actor: 'Lakshmi Raman', text: 'invited Varun Bhatt as Developer', kind: 'user' },
      { id: 'act_12', at: daysAgoISO(12), actor: 'James Carter', text: 'disconnected Google Drive', kind: 'integration' },
    ],
  }

  return { activeTenantId: acme.id, tenants: [acme, nova, vertex] }
}

export const TENANT_COLORS = ['#4f86ff', '#22d3ee', '#8b74ff', '#2dd4bf', '#f59e0b', '#f472b6']
export const REGIONS = ['ap-south-1 · Mumbai', 'ap-southeast-1 · Singapore', 'eu-west-2 · London', 'us-east-1 · N. Virginia', 'me-central-1 · UAE']
export const INDUSTRIES = ['Software & IT services', 'Retail & e-commerce', 'Professional services', 'Healthcare', 'Education', 'Manufacturing', 'Financial services']
