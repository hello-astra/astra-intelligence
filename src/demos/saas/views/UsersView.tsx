import { useEffect, useMemo, useDeferredValue, useState, type FormEvent } from 'react'
import { Check, Mail, MoreHorizontal, ShieldCheck, ShieldOff, UserMinus, UserPlus, UserRoundCheck, UserX, Users, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Form'
import { Meter } from '@/components/ui/Meter'
import { Modal } from '@/components/ui/Modal'
import { Panel } from '@/components/ui/Panel'
import { SearchInput } from '@/components/ui/SearchInput'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { useToast } from '@/components/ui/toast-context'
import { PERMISSIONS, ROLES } from '@/data/mock/saas'
import type { Role, TenantUser } from '@/types/saas'
import { formatRelative } from '@/utils/format'
import { uid } from '@/utils/id'
import type { SaasViewProps } from '../context'
import { planOf, seatsUsed, withActivity } from '../logic'

const STATUS_BADGE = {
  active: { tone: 'green', label: 'Active' },
  invited: { tone: 'blue', label: 'Invited' },
  suspended: { tone: 'red', label: 'Suspended' },
} as const

export function UsersView({ tenant, updateTenant, goTo, intent, clearIntent }: SaasViewProps) {
  const toast = useToast()
  const [query, setQuery] = useState('')
  // Typing stays instant; the filtered list re-renders at low priority (interruptible) behind it.
  const deferredQuery = useDeferredValue(query)
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  // Opens straight away when arriving from the overview's "Invite user" quick action.
  const [inviteOpen, setInviteOpen] = useState(() => intent === 'invite')
  const [removeTarget, setRemoveTarget] = useState<TenantUser | null>(null)

  useEffect(() => {
    if (intent === 'invite') clearIntent()
  }, [intent, clearIntent])

  const plan = planOf(tenant)
  const seats = seatsUsed(tenant)
  const seatsFull = seats >= plan.seats

  const users = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return tenant.users.filter(
      (u) => (roleFilter === 'all' || u.role === roleFilter) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    )
  }, [tenant.users, deferredQuery, roleFilter])

  const patchUser = (id: string, patch: Partial<TenantUser>, activity: string, kind: 'user' | 'security' = 'user') => {
    updateTenant((t) => withActivity({ ...t, users: t.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }, activity, kind))
  }

  const changeRole = (user: TenantUser, role: Role) => {
    if (role === user.role) return
    patchUser(user.id, { role }, `changed ${user.name}’s role from ${user.role} to ${role}`, 'security')
    toast({ title: 'Role updated', description: `${user.name} is now ${role === 'Admin' ? 'an' : 'a'} ${role}.` })
  }

  const setStatus = (user: TenantUser, status: TenantUser['status']) => {
    if (status === 'active' && user.status === 'suspended' && seatsFull) {
      toast({ title: 'No seats available', description: `Upgrade from ${plan.name} or free a seat to reactivate ${user.name}.`, tone: 'warning' })
      return
    }
    patchUser(user.id, { status }, `${status === 'suspended' ? 'suspended' : 'reactivated'} ${user.name}`)
    toast({ title: status === 'suspended' ? 'User suspended' : 'User reactivated', description: user.name, tone: status === 'suspended' ? 'warning' : 'success' })
  }

  const removeUser = (user: TenantUser) => {
    updateTenant((t) => withActivity({ ...t, users: t.users.filter((u) => u.id !== user.id) }, `removed ${user.name} from the organization`, 'user'))
    setRemoveTarget(null)
    toast({ title: 'User removed', description: `${user.name} no longer has access.`, tone: 'info' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Users & roles</h2>
          <p className="text-xs text-fg-3">Manage who can access {tenant.name} and what they can do.</p>
        </div>
        <Button size="sm" leftIcon={<UserPlus className="size-3.5" />} onClick={() => setInviteOpen(true)}>
          Invite user
        </Button>
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[200px] flex-1">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-fg-2">Seats used</span>
              <span className="text-fg-3 tabular-nums">
                {seats} of {plan.seats} ({plan.name} plan)
              </span>
            </div>
            <Meter value={seats} max={plan.seats} tone="auto" label="Seats used" />
          </div>
          {seatsFull && (
            <div className="flex items-center gap-2 text-xs text-amber-200">
              <ShieldOff className="size-4" aria-hidden /> All seats are in use.
              <Button size="xs" variant="secondary" onClick={() => goTo('subscription')}>
                Upgrade plan
              </Button>
            </div>
          )}
        </div>
      </Panel>

      <Panel flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name or email" className="w-full sm:w-64" />
          <Select controlSize="sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | 'all')} aria-label="Filter by role" wrapperClassName="w-40">
            <option value="all">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <span className="ml-auto text-xs text-fg-3">
            {users.length} of {tenant.users.length} users
          </span>
        </div>
        {users.length === 0 ? (
          <EmptyState icon={Users} title="No users match your filters" description="Try a different name, email or role." />
        ) : (
          <Table minWidth={760}>
            <THead>
              <tr>
                <TH>User</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH>MFA</TH>
                <TH>Last active</TH>
                <TH align="right">
                  <span className="sr-only">Actions</span>
                </TH>
              </tr>
            </THead>
            <TBody>
              {users.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} size={30} title="" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-fg">{u.name}</p>
                        <p className="truncate text-xs text-fg-3">{u.email}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    {u.role === 'Owner' ? (
                      <Badge tone="violet">Owner</Badge>
                    ) : (
                      <Select
                        controlSize="sm"
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value as Role)}
                        aria-label={`Role for ${u.name}`}
                        wrapperClassName="w-32"
                      >
                        {ROLES.filter((r) => r !== 'Owner').map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </Select>
                    )}
                  </TD>
                  <TD>
                    <Badge tone={STATUS_BADGE[u.status].tone} dot>
                      {STATUS_BADGE[u.status].label}
                    </Badge>
                  </TD>
                  <TD>
                    {u.mfa ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                        <ShieldCheck className="size-3.5" aria-hidden /> On
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-fg-3">
                        <X className="size-3.5" aria-hidden /> Off
                      </span>
                    )}
                  </TD>
                  <TD className="text-xs whitespace-nowrap">{u.lastActiveAt ? formatRelative(u.lastActiveAt) : 'Invitation pending'}</TD>
                  <TD align="right">
                    {u.role !== 'Owner' && (
                      <Dropdown
                        ariaLabel={`Actions for ${u.name}`}
                        align="end"
                        buttonClassName="inline-flex size-8 items-center justify-center rounded-lg text-fg-3 hover:bg-ink/[0.06] hover:text-fg"
                        buttonContent={<MoreHorizontal className="size-4" />}
                        items={[
                          ...(u.status === 'invited'
                            ? [
                                {
                                  id: 'resend',
                                  label: 'Resend invitation',
                                  icon: <Mail className="size-4 text-fg-3" />,
                                  onSelect: () => toast({ title: 'Invitation resent', description: `Sent to ${u.email}.`, tone: 'info' }),
                                },
                              ]
                            : []),
                          u.status === 'suspended'
                            ? { id: 'reactivate', label: 'Reactivate', icon: <UserRoundCheck className="size-4 text-fg-3" />, onSelect: () => setStatus(u, 'active') }
                            : { id: 'suspend', label: 'Suspend access', icon: <UserX className="size-4 text-fg-3" />, onSelect: () => setStatus(u, 'suspended') },
                          { id: 'remove', label: 'Remove from organization', icon: <UserMinus className="size-4" />, danger: true, onSelect: () => setRemoveTarget(u) },
                        ]}
                      />
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>

      <Panel title="Role permissions" description="What each role can do in this organization">
        <Table minWidth={560}>
          <THead>
            <tr>
              <TH>Permission</TH>
              {ROLES.map((r) => (
                <TH key={r} align="center">
                  {r}
                </TH>
              ))}
            </tr>
          </THead>
          <TBody>
            {PERMISSIONS.map((p) => (
              <TR key={p.label}>
                <TD className="text-fg-2">{p.label}</TD>
                {ROLES.map((r) => (
                  <TD key={r} align="center">
                    {p.roles.includes(r) ? (
                      <Check className="mx-auto size-4 text-emerald-400" aria-label="Allowed" />
                    ) : (
                      <span className="text-fg-4" aria-label="Not allowed">
                        —
                      </span>
                    )}
                  </TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
      </Panel>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        seatsFull={seatsFull}
        planName={plan.name}
        seatLimit={plan.seats}
        existingEmails={tenant.users.map((u) => u.email.toLowerCase())}
        domain={tenant.domain}
        onUpgrade={() => {
          setInviteOpen(false)
          goTo('subscription')
        }}
        onInvite={(user) => {
          updateTenant((t) => withActivity({ ...t, users: [...t.users, user] }, `invited ${user.name} as ${user.role}`, 'user'))
          setInviteOpen(false)
          toast({ title: 'Invitation created', description: `${user.name} was added as ${user.role}. No email was sent (demo).` })
        }}
      />

      <Modal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        size="sm"
        title="Remove user?"
        description={removeTarget ? `${removeTarget.name} will immediately lose access to ${tenant.name}.` : undefined}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={() => removeTarget && removeUser(removeTarget)} data-autofocus>
              Remove user
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-2">Their seat will become available for someone else.</p>
      </Modal>
    </div>
  )
}

function InviteModal({
  open,
  onClose,
  onInvite,
  onUpgrade,
  seatsFull,
  planName,
  seatLimit,
  existingEmails,
  domain,
}: {
  open: boolean
  onClose: () => void
  onInvite: (user: TenantUser) => void
  onUpgrade: () => void
  seatsFull: boolean
  planName: string
  seatLimit: number
  existingEmails: string[]
  domain: string
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('Developer')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'Enter the person’s full name.'
    const mail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) next.email = 'Enter a valid email address.'
    else if (existingEmails.includes(mail)) next.email = 'This person is already a member of the organization.'
    setErrors(next)
    if (Object.keys(next).length) return
    onInvite({ id: uid('usr'), name: name.trim(), email: mail, role, status: 'invited', lastActiveAt: null, mfa: false })
    setName('')
    setEmail('')
    setRole('Developer')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite a user"
      description="Invited users occupy a seat until they are removed or suspended."
      footer={
        seatsFull ? (
          <>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" onClick={onUpgrade}>
              Compare plans
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="invite-form" leftIcon={<UserPlus className="size-3.5" />}>
              Send invitation
            </Button>
          </>
        )
      }
    >
      {seatsFull ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-sm text-fg-2">
          <p className="font-medium text-amber-200">Seat limit reached</p>
          <p className="mt-1">
            The {planName} plan includes {seatLimit} seats and all of them are in use. Upgrade the plan, or suspend/remove a user to free a seat.
          </p>
        </div>
      ) : (
        <form id="invite-form" onSubmit={submit} noValidate className="grid gap-4">
          <Field label="Full name" htmlFor="invite-name" error={errors.name} required>
            <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Silva" aria-invalid={Boolean(errors.name)} />
          </Field>
          <Field label="Work email" htmlFor="invite-email" error={errors.email} required>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`jordan@${domain}`}
              aria-invalid={Boolean(errors.email)}
            />
          </Field>
          <Field label="Role" htmlFor="invite-role">
            <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.filter((r) => r !== 'Owner').map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-fg-3">Demo: no invitation email is sent.</p>
        </form>
      )}
    </Modal>
  )
}
