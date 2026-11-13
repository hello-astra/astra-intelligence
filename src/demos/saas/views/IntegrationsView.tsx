import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react'
import {
  BarChart3,
  Bot,
  Check,
  Copy,
  CreditCard,
  Database,
  HeartPulse,
  KeyRound,
  MessageSquare,
  Plus,
  Plug,
  PlugZap,
  RefreshCw,
  Workflow,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { Panel } from '@/components/ui/Panel'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { useToast } from '@/components/ui/toast-context'
import type { ApiKey, Integration } from '@/types/saas'
import { cn } from '@/utils/cn'
import { formatDate, formatRelative } from '@/utils/format'
import { uid } from '@/utils/id'
import type { SaasViewProps } from '../context'
import { IntegrationStatusBadge } from '../IntegrationStatus'
import { generateApiKey, periodCalls, planOf, seatsUsed, withActivity } from '../logic'

const CATEGORY_ICON = { Payments: CreditCard, Messaging: MessageSquare, CRM: Bot, Storage: Database, Automation: Workflow, Analytics: BarChart3 }

interface CheckLog {
  id: string
  name: string
  ok: boolean
  message: string
}

/** Simulated probe: operational services jitter, degraded ones may recover, "down" stays down. */
function probe(i: Integration): Integration {
  const now = new Date().toISOString()
  if (i.status === 'down') return { ...i, lastCheckedAt: now }
  const jitter = 0.8 + Math.random() * 0.4
  if (i.status === 'degraded') {
    const recovered = Math.random() > 0.4
    return { ...i, status: recovered ? 'operational' : 'degraded', latencyMs: Math.round(recovered ? 260 * jitter : 900 * jitter), lastCheckedAt: now }
  }
  const base = i.latencyMs > 0 ? i.latencyMs : 160
  return { ...i, latencyMs: Math.round(base * jitter), lastCheckedAt: now }
}

export function IntegrationsView({ tenant, updateTenant, intent, clearIntent }: SaasViewProps) {
  const toast = useToast()
  const [checking, setChecking] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<CheckLog[]>([])
  const [keyModal, setKeyModal] = useState(false)
  const cancelled = useRef(false)

  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms))

  const checkOne = async (integration: Integration, fromRun = false): Promise<CheckLog | null> => {
    if (integration.status === 'disconnected') return null
    setChecking(integration.id)
    await wait(550 + Math.random() * 500)
    if (cancelled.current) return null
    const result = probe(integration)
    updateTenant((t) => ({ ...t, integrations: t.integrations.map((x) => (x.id === integration.id ? result : x)) }))
    setChecking(null)
    const entry: CheckLog = {
      id: uid('log'),
      name: integration.name,
      ok: result.status === 'operational',
      message:
        result.status === 'down'
          ? 'Connection refused'
          : result.status === 'degraded'
            ? `Slow response — ${result.latencyMs} ms`
            : integration.status === 'degraded'
              ? `Recovered — ${result.latencyMs} ms`
              : `Healthy — ${result.latencyMs} ms`,
    }
    if (!fromRun) {
      setLog((l) => [entry, ...l].slice(0, 12))
      toast({ title: `${integration.name}: ${result.status}`, description: entry.message, tone: entry.ok ? 'success' : 'warning' })
    }
    return entry
  }

  const runAll = async () => {
    setRunning(true)
    setLog([])
    const entries: CheckLog[] = []
    for (const i of tenant.integrations) {
      const entry = await checkOne(i, true)
      if (cancelled.current) return
      if (entry) {
        entries.push(entry)
        setLog([...entries].reverse())
      }
    }
    setRunning(false)
    const failing = entries.filter((e) => !e.ok).length
    updateTenant((t) => withActivity(t, `ran an integration health check (${entries.length - failing}/${entries.length} healthy)`, 'integration'))
    toast({
      title: 'Health check complete',
      description: failing === 0 ? 'All connected services are operational.' : `${failing} service${failing === 1 ? '' : 's'} need attention.`,
      tone: failing === 0 ? 'success' : 'warning',
    })
  }

  // "Health check" quick action from the overview.
  const autoRun = useRef(false)
  const startHealthCheck = useEffectEvent(() => {
    void runAll()
  })
  useEffect(() => {
    if (intent === 'health' && !autoRun.current) {
      autoRun.current = true
      clearIntent()
      startHealthCheck()
    }
  }, [intent, clearIntent])

  const toggleConnection = (i: Integration) => {
    const connecting = i.status === 'disconnected'
    updateTenant((t) =>
      withActivity(
        {
          ...t,
          integrations: t.integrations.map((x) =>
            x.id === i.id
              ? { ...x, status: connecting ? 'operational' : 'disconnected', latencyMs: connecting ? 180 : 0, lastCheckedAt: new Date().toISOString() }
              : x,
          ),
        },
        `${connecting ? 'connected' : 'disconnected'} ${i.name}`,
        'integration',
      ),
    )
    toast({ title: `${i.name} ${connecting ? 'connected' : 'disconnected'}`, tone: 'info' })
  }

  const revokeKey = (key: ApiKey) => {
    updateTenant((t) => withActivity({ ...t, apiKeys: t.apiKeys.map((k) => (k.id === key.id ? { ...k, revoked: true } : k)) }, `revoked API key “${key.label}”`, 'security'))
    toast({ title: 'API key revoked', description: `“${key.label}” can no longer authenticate requests.`, tone: 'warning' })
  }

  const plan = planOf(tenant)
  const sampleResponse = {
    tenant_id: tenant.id,
    plan: tenant.plan,
    period: { day: tenant.periodDay + 1, length_days: 30 },
    usage: {
      api_calls: periodCalls(tenant),
      api_quota: plan.apiCalls,
      seats_used: seatsUsed(tenant),
      seats_included: plan.seats,
      storage_gb: tenant.storageGb,
    },
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">API & integrations</h2>
          <p className="text-xs text-fg-3">Connected services, health checks and API credentials.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={runAll} loading={running} leftIcon={<HeartPulse className="size-3.5" />}>
            {running ? 'Checking…' : 'Run health check'}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {tenant.integrations.length === 0 && (
          <Panel className="md:col-span-2">
            <p className="text-sm text-fg-3">No integrations connected yet. New organizations start without integrations.</p>
          </Panel>
        )}
        {tenant.integrations.map((i) => {
          const Icon = CATEGORY_ICON[i.category]
          const isChecking = checking === i.id
          return (
            <article key={i.id} className={cn('flex flex-col rounded-xl border bg-panel p-4', i.status === 'down' ? 'border-red-500/30' : 'border-line')}>
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink/[0.04] ring-1 ring-ink/[0.07]">
                  <Icon className="size-4 text-fg-2" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-fg">{i.name}</h3>
                  <p className="truncate text-xs text-fg-3">{i.description}</p>
                </div>
                {isChecking ? (
                  <Badge tone="blue" icon={<Spinner className="size-3" />}>
                    Checking
                  </Badge>
                ) : (
                  <IntegrationStatusBadge status={i.status} />
                )}
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-fg-3">Latency</dt>
                  <dd className={cn('mt-0.5 tabular-nums', i.latencyMs > 600 ? 'text-amber-300' : 'text-fg-2')}>
                    {i.status === 'disconnected' || i.status === 'down' ? '—' : `${i.latencyMs} ms`}
                  </dd>
                </div>
                <div>
                  <dt className="text-fg-3">Events 24h</dt>
                  <dd className="mt-0.5 text-fg-2 tabular-nums">{i.events24h.toLocaleString('en-US')}</dd>
                </div>
                <div>
                  <dt className="text-fg-3">Checked</dt>
                  <dd className="mt-0.5 text-fg-2">{formatRelative(i.lastCheckedAt)}</dd>
                </div>
              </dl>
              <div className="mt-4 flex gap-2 border-t border-line pt-3">
                <Button size="xs" variant="secondary" leftIcon={<RefreshCw className="size-3" />} disabled={i.status === 'disconnected' || running || isChecking} onClick={() => void checkOne(i)}>
                  Test connection
                </Button>
                <Button size="xs" variant="ghost" leftIcon={i.status === 'disconnected' ? <Plug className="size-3" /> : <PlugZap className="size-3" />} onClick={() => toggleConnection(i)} disabled={running}>
                  {i.status === 'disconnected' ? 'Connect' : 'Disconnect'}
                </Button>
              </div>
            </article>
          )
        })}
      </div>

      {log.length > 0 && (
        <Panel title="Health check log" description="Most recent results first">
          <ul className="space-y-1.5 font-mono text-xs">
            {log.map((l) => (
              <li key={l.id} className="flex gap-2">
                <span className={l.ok ? 'text-emerald-300' : 'text-amber-300'}>{l.ok ? '✓' : '!'}</span>
                <span className="text-fg">{l.name}</span>
                <span className="text-fg-3">— {l.message}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel
        title="API keys"
        description="Keys authenticate server-to-server requests for this organization"
        actions={
          <Button size="xs" variant="secondary" leftIcon={<Plus className="size-3" />} onClick={() => setKeyModal(true)}>
            Create key
          </Button>
        }
        flush
      >
        <Table minWidth={640}>
          <THead>
            <tr>
              <TH>Label</TH>
              <TH>Key</TH>
              <TH>Scopes</TH>
              <TH>Created</TH>
              <TH>Last used</TH>
              <TH align="right">
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {tenant.apiKeys.length === 0 && (
              <TR>
                <TD colSpan={6} className="text-center text-fg-3">
                  No API keys yet.
                </TD>
              </TR>
            )}
            {tenant.apiKeys.map((k) => (
              <TR key={k.id} className={k.revoked ? 'opacity-55' : undefined}>
                <TD className="font-medium text-fg">{k.label}</TD>
                <TD>
                  <code className="font-mono text-xs text-fg-2">
                    {k.prefix}••••••••{k.last4}
                  </code>
                </TD>
                <TD>
                  <span className="flex gap-1">
                    {k.scopes.map((s) => (
                      <Badge key={s} size="xs">
                        {s}
                      </Badge>
                    ))}
                  </span>
                </TD>
                <TD className="text-xs whitespace-nowrap">{formatDate(k.createdAt)}</TD>
                <TD className="text-xs whitespace-nowrap">{k.lastUsedAt ? formatRelative(k.lastUsedAt) : 'Never'}</TD>
                <TD align="right">
                  {k.revoked ? (
                    <Badge tone="red">Revoked</Badge>
                  ) : (
                    <Button size="xs" variant="ghost" className="text-red-300 hover:text-red-200" onClick={() => revokeKey(k)}>
                      Revoke
                    </Button>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Panel>

      <Panel title="Example request" description="Usage endpoint for this tenant — response reflects the current demo data">
        <div className="grid gap-3 xl:grid-cols-2">
          <pre className="overflow-x-auto rounded-lg border border-line bg-sunken p-3 font-mono text-[11.5px] leading-relaxed text-fg-2">
            <span className="text-astra-cyan-soft">curl</span> https://api.astra-console.example/v1/tenants/{tenant.id}/usage \{'\n'}
            {'  '}-H <span className="text-emerald-300">"Authorization: Bearer sk_live_••••"</span>
          </pre>
          <pre className="overflow-x-auto rounded-lg border border-line bg-sunken p-3 font-mono text-[11.5px] leading-relaxed text-fg-2">
            {JSON.stringify(sampleResponse, null, 2)}
          </pre>
        </div>
      </Panel>

      <CreateKeyModal
        open={keyModal}
        onClose={() => setKeyModal(false)}
        onCreate={(key) => {
          updateTenant((t) => withActivity({ ...t, apiKeys: [key, ...t.apiKeys] }, `created API key “${key.label}”`, 'security'))
        }}
      />
      <span className="sr-only" aria-live="polite">
        {running ? 'Health check running' : ''}
      </span>
    </div>
  )
}

function CreateKeyModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (key: ApiKey) => void }) {
  const [label, setLabel] = useState('')
  const [scopes, setScopes] = useState<string[]>(['read'])
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const close = () => {
    setLabel('')
    setScopes(['read'])
    setError(null)
    setCreated(null)
    setCopied(false)
    onClose()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (label.trim().length < 3) return setError('Give the key a descriptive label (3+ characters).')
    if (scopes.length === 0) return setError('Select at least one scope.')
    const secret = generateApiKey()
    onCreate({
      id: uid('key'),
      label: label.trim(),
      prefix: secret.slice(0, 12),
      last4: secret.slice(-4),
      scopes,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      revoked: false,
    })
    setCreated(secret)
  }

  const toggleScope = (scope: string) => setScopes((s) => (s.includes(scope) ? s.filter((x) => x !== scope) : [...s, scope]))

  return (
    <Modal
      open={open}
      onClose={close}
      title={created ? 'API key created' : 'Create API key'}
      description={created ? 'Copy it now — for security it will not be shown again.' : 'Keys are generated in your browser for this demo.'}
      footer={
        created ? (
          <Button size="sm" onClick={close}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="create-key-form" leftIcon={<KeyRound className="size-3.5" />}>
              Create key
            </Button>
          </>
        )
      }
    >
      {created ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-sunken p-3">
            <code className="min-w-0 flex-1 font-mono text-xs break-all text-fg">{created}</code>
            <Button
              size="xs"
              variant="secondary"
              leftIcon={copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              onClick={() => {
                void navigator.clipboard?.writeText(created).then(() => setCopied(true), () => setCopied(false))
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-fg-3">Demo key — it does not grant access to any real system.</p>
        </div>
      ) : (
        <form id="create-key-form" onSubmit={submit} noValidate className="grid gap-4">
          <Field label="Label" htmlFor="key-label" error={error} required>
            <Input id="key-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Reporting service" aria-invalid={Boolean(error)} />
          </Field>
          <fieldset>
            <legend className="text-[13px] font-medium text-fg-2">Scopes</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {['read', 'write', 'admin'].map((s) => (
                <Checkbox key={s} id={`scope-${s}`} label={s} checked={scopes.includes(s)} onChange={() => toggleScope(s)} />
              ))}
            </div>
          </fieldset>
        </form>
      )}
    </Modal>
  )
}
