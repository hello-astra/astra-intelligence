import type { Tenant } from '@/types/saas'

export function TenantMark({ tenant, size = 28 }: { tenant: Pick<Tenant, 'name' | 'color'>; size?: number }) {
  const letters = tenant.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, ${tenant.color}, ${tenant.color}99)` }}
      aria-hidden
    >
      {letters}
    </span>
  )
}
